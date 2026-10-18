<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Http\Resources\RequestDetailResource;
use App\Models\AiMessage;
use App\Models\KbSection;
use App\Services\Ai\AiJanaService;
use App\Services\RequestService;
use App\Support\Locale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function ask(Request $request, AiJanaService $ai): JsonResponse
    {
        $data = $request->validate(['question' => ['required', 'string', 'max:1000']]);

        $message = $ai->ask($request->user(), $data['question'], Locale::resolve($request));

        return response()->json(['data' => [
            'message_id' => $message->id,
            'result' => $message->result,
            'answer' => $message->answer,
            'note' => $message->note,
            'sources' => $this->sources($message),
            'can_escalate' => $message->escalated_request_id === null,
        ]]);
    }

    /** Передать вопрос в HR: создаётся обращение hr_question с темой ai_escalation. */
    public function escalate(Request $request, int $id, RequestService $requests): JsonResponse
    {
        $data = $request->validate(['comment' => ['nullable', 'string', 'max:1000']]);

        $message = AiMessage::findOrFail($id);
        abort_unless($message->user_id === $request->user()->id, 403);

        if ($message->escalated_request_id !== null) {
            throw new ApiException('already_escalated', 409);
        }

        $text = $message->question . (filled($data['comment'] ?? null) ? "\n\nКомментарий: {$data['comment']}" : '');
        $created = $requests->createHrQuestion($request->user(), 'ai_escalation', $text, $message->id);
        $message->update(['escalated_request_id' => $created->id]);

        return (new RequestDetailResource($created->load(['author.employee', 'history.actor.employee'])))
            ->response()->setStatusCode(201);
    }

    private function sources(AiMessage $message): array
    {
        if (empty($message->source_keys)) {
            return [];
        }

        $sections = KbSection::with('document')->whereIn('key', $message->source_keys)->get()->keyBy('key');

        return collect($message->source_keys)
            ->map(fn ($key) => $sections->get($key))
            ->filter()
            ->map(fn ($s) => [
                'key' => $s->key,
                'document_slug' => $s->document->slug,
                'document_title' => $s->document->title,
                'section_title' => $s->title,
                'anchor' => $s->anchor,
            ])->values()->all();
    }
}