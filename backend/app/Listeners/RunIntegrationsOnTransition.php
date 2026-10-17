<?php

namespace App\Listeners;

use App\Enums\RequestStatus as S;
use App\Events\RequestStatusChanged;
use App\Integrations\Documentolog\DocumentSigningService;
use App\Integrations\Onec\EmployeeDataSource;
use App\Models\HrRequest;
use App\Models\IntegrationLog;
use App\Services\EmployeeSyncService;
use Throwable;

class RunIntegrationsOnTransition
{
    public function __construct(
        private DocumentSigningService $documents,
        private EmployeeDataSource $onec,
        private EmployeeSyncService $sync,
    ) {}

    public function handle(RequestStatusChanged $e): void
    {
        try {
            $request = $e->request->loadMissing('author.employee');

            if ($request->type !== 'vacation') {
                return;
            }

            match ($request->status) {
                S::AWAITING_SIGNATURE => $this->sendForSigning($request),
                S::APPROVED => $this->sendOrderTo1c($request),
                default => null,
            };
        } catch (Throwable $t) {
            report($t);
        }
    }

    private function sendForSigning(HrRequest $request): void
    {
        try {
            $ref = $this->documents->createVacationOrder($request);
            $request->update(['payload' => ['document_ref' => $ref] + $request->payload]);
            $this->log($request, 'documentolog', 'create_signing_document', 'success',
                "Документ «Приказ об отпуске» отправлен на подпись (заявка #{$request->id}, {$ref})",
                ['document_ref' => $ref]);
        } catch (Throwable $t) {
            $this->log($request, 'documentolog', 'create_signing_document', 'error',
                "Не удалось создать документ на подпись: {$t->getMessage()}");
        }
    }

    private function sendOrderTo1c(HrRequest $request): void
    {
        $employee = $request->author->employee;
        $payload = $request->payload;

        try {
            $result = $this->onec->sendVacationOrder([
                'employee_external_id' => $employee->external_id,
                'request_id' => $request->id,
                'vacation_type' => $payload['vacation_type'],
                'start_date' => $payload['start_date'],
                'end_date' => $payload['end_date'],
                'days' => $payload['days'],
            ]);
            $this->log($request, 'onec_zup', 'send_vacation_order', 'success',
                "Приказ об отпуске передан в 1С (заявка #{$request->id}, {$result['order_id']})",
                ['order_id' => $result['order_id']]);

            $this->sync->syncOne($employee->external_id);
        } catch (Throwable $t) {
            $this->log($request, 'onec_zup', 'send_vacation_order', 'error',
                "Не удалось передать приказ в 1С: {$t->getMessage()}");
        }
    }

    private function log(HrRequest $request, string $system, string $operation, string $status, string $message, ?array $payload = null): void
    {
        IntegrationLog::create([
            'system' => $system, 'direction' => 'outbound', 'operation' => $operation,
            'entity_type' => 'request', 'entity_id' => $request->id,
            'status' => $status, 'message' => mb_substr($message, 0, 500), 'payload' => $payload,
        ]);
    }
}