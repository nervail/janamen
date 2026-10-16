<?php

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class ApiExceptionRenderer
{
    private const MESSAGES = [
        'unauthenticated' => 'Требуется вход в систему',
        'forbidden' => 'Недостаточно прав',
        'not_found' => 'Не найдено',
        'csrf_token_mismatch' => 'Сессия устарела, повторите запрос',
        'validation_failed' => 'Проверьте заполнение полей',
        'invalid_credentials' => 'Неверный логин или пароль',
        'too_many_requests' => 'Слишком много запросов',
        'server_error' => 'Непредвиденная ошибка',
        'self_approval_forbidden' => 'Нельзя согласовать собственную заявку',
        'already_participated' => 'Вы уже участвовали в согласовании этой заявки',
        'invalid_transition' => 'Действие недопустимо в текущем статусе',
        'comment_required' => 'Укажите комментарий',
        'no_available_approver' => 'Нет доступного согласующего, обратитесь к администратору',
        'already_escalated' => 'Вопрос уже передан в HR',
    ];

    // Правила валидации Laravel -> коды ошибок полей из api.md
    private const RULE_CODES = [
        'required' => 'required',
        'email' => 'invalid_format',
        'date' => 'invalid_format',
        'dateformat' => 'invalid_format',
        'string' => 'invalid_format',
        'integer' => 'invalid_format',
        'numeric' => 'invalid_format',
        'max' => 'too_long',
        'in' => 'invalid_value',
        'exists' => 'invalid_value',
    ];

    public static function render(Throwable $e, Request $request): ?JsonResponse
    {
        if (! $request->is('api/*')) {
            return null;
        }

        return match (true) {
            $e instanceof ApiException => self::make($e->errorCode, $e->status, $e->fields),
            $e instanceof ValidationException => self::make('validation_failed', 422, self::fields($e)),
            $e instanceof AuthenticationException => self::make('unauthenticated', 401),
            $e instanceof AuthorizationException => self::make('forbidden', 403),
            $e instanceof TokenMismatchException => self::make('csrf_token_mismatch', 419),
            $e instanceof ThrottleRequestsException => self::make('too_many_requests', 429),
            $e instanceof ModelNotFoundException, $e instanceof NotFoundHttpException => self::make('not_found', 404),
            $e instanceof HttpExceptionInterface => self::fromHttp($e),
            default => self::make('server_error', 500, [], config('app.debug') ? $e->getMessage() : null),
        };
    }

    private static function fromHttp(HttpExceptionInterface $e): JsonResponse
    {
        return match ($e->getStatusCode()) {
            403 => self::make('forbidden', 403),
            404 => self::make('not_found', 404),
            419 => self::make('csrf_token_mismatch', 419),
            429 => self::make('too_many_requests', 429),
            default => self::make('server_error', $e->getStatusCode()),
        };
    }

    private static function fields(ValidationException $e): array
    {
        $failed = $e->validator->failed();
        $result = [];

        foreach ($e->errors() as $field => $messages) {
            if (! empty($failed[$field])) {
                $result[$field] = array_values(array_unique(array_map(
                    fn ($rule) => self::RULE_CODES[strtolower($rule)] ?? 'invalid_value',
                    array_keys($failed[$field])
                )));
            } else {
                // ValidationException::withMessages(['field' => 'date_in_past']) — сообщение и есть код
                $result[$field] = $messages;
            }
        }

        return $result;
    }

    private static function make(string $code, int $status, array $fields = [], ?string $message = null): JsonResponse
    {
        $error = ['code' => $code, 'message' => $message ?? (self::MESSAGES[$code] ?? $code)];
        if ($fields) {
            $error['fields'] = $fields;
        }

        return response()->json(['error' => $error], $status);
    }
}