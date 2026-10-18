<?php

namespace App\Services\Ai;

class AnswerValidator
{
    private const NOTE_MAX_LENGTH = 200;

    /**
     * @param  array<string>  $allowedKeys
     * @return array{result: string, answer: ?string, source_keys: array<string>, note: ?string}
     */
    public function validate(?array $output, array $allowedKeys): array
    {
        $refuse = fn (string $result, ?string $note = null) => [
            'result' => $result, 'answer' => null, 'source_keys' => [], 'note' => $note,
        ];

        if (! is_array($output) || ! array_key_exists('found', $output) || ! is_bool($output['found'])) {
            return $refuse('invalid_response');
        }

        if ($output['found'] === false) {
            return $refuse('not_found', $this->cleanNote($output['note'] ?? null));
        }

        $answer = is_string($output['answer'] ?? null) ? trim($output['answer']) : '';
        $keys = $output['source_keys'] ?? null;

        if ($answer === ''
            || ! is_array($keys)
            || $keys === []
            || count(array_filter($keys, 'is_string')) !== count($keys)
            || array_diff($keys, $allowedKeys) !== []) {
            return $refuse('invalid_response');
        }

        return [
            'result' => 'answered',
            'answer' => $answer,
            'source_keys' => array_values(array_unique($keys)),
            'note' => null,
        ];
    }

    /** Одно короткое предложение без ссылок, тегов и переносов; иначе null (фронт покажет только стандартный текст). */
    private function cleanNote(mixed $note): ?string
    {
        if (! is_string($note)) {
            return null;
        }

        $note = trim((string) preg_replace('/\s+/u', ' ', strip_tags($note)));

        if ($note === ''
            || mb_strlen($note) > self::NOTE_MAX_LENGTH
            || preg_match('~https?://|www\.|@~iu', $note)) {
            return null;
        }

        return preg_match('/[.!?…]$/u', $note) ? $note : $note . '.';
    }
}