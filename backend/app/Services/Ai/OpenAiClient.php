<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;

class OpenAiClient
{
    public function configured(): bool
    {
        return filled(config('services.openai.key'));
    }

    public function model(): string
    {
        return (string) config('services.openai.model');
    }

    /** Вызывает модель со structured outputs. Возвращает разобранный JSON или null, если он невалиден. */
    public function complete(string $system, string $question): ?array
    {
        $payload = [
            'model' => $this->model(),
            'max_completion_tokens' => (int) config('services.openai.max_output_tokens'),
            'messages' => [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user', 'content' => "<question>\n{$question}\n</question>"],
            ],
            'response_format' => [
                    'type' => 'json_schema',
                    'json_schema' => [
                        'name' => 'kb_answer',
                        'strict' => true,
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'found' => ['type' => 'boolean'],
                                'answer' => ['type' => ['string', 'null']],
                                'source_keys' => ['type' => 'array', 'items' => ['type' => 'string']],
                            ],
                            'required' => ['found', 'answer', 'source_keys'],
                            'additionalProperties' => false,
                        ],
                    ],
                ],
        ];

        if (filled(config('services.openai.temperature'))) {
            $payload['temperature'] = (float) config('services.openai.temperature');
        }

        $response = Http::withToken(config('services.openai.key'))
            ->timeout(30)
            ->post(rtrim(config('services.openai.base_url'), '/') . '/chat/completions', $payload)
            ->throw();

        $decoded = json_decode((string) $response->json('choices.0.message.content'), true);

        return is_array($decoded) ? $decoded : null;
    }
}