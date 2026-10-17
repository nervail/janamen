<?php

namespace App\Services\Ai;

class AnswerValidator
{
    /**
     * @param  array<string>  $allowedKeys
     * @return array{result: string, answer: ?string, source_keys: array<string>}
     */
    public function validate(?array $output, array $allowedKeys): array
    {
        $refuse = fn (string $result) => ['result' => $result, 'answer' => null, 'source_keys' => []];

        if (! is_array($output) || ! array_key_exists('found', $output) || ! is_bool($output['found'])) {
            return $refuse('invalid_response');
        }

        if ($output['found'] === false) {
            return $refuse('not_found');
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

        return ['result' => 'answered', 'answer' => $answer, 'source_keys' => array_values(array_unique($keys))];
    }
}