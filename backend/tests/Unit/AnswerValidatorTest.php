<?php

namespace Tests\Unit;

use App\Services\Ai\AnswerValidator;
use PHPUnit\Framework\TestCase;

class AnswerValidatorTest extends TestCase
{
    private const ALLOWED = ['vacation-policy.duration', 'how-to-janamen.profile'];

    private function check(?array $output): array
    {
        return (new AnswerValidator())->validate($output, self::ALLOWED);
    }

    public function test_valid_answer_is_accepted(): void
    {
        $r = $this->check(['found' => true, 'answer' => '24 дня', 'source_keys' => ['vacation-policy.duration']]);

        $this->assertSame('answered', $r['result']);
        $this->assertSame(['vacation-policy.duration'], $r['source_keys']);
    }

    public function test_not_found_is_a_refusal(): void
    {
        $r = $this->check(['found' => false, 'answer' => null, 'source_keys' => []]);

        $this->assertSame('not_found', $r['result']);
        $this->assertNull($r['answer']);
    }

    public function test_found_without_sources_is_rejected(): void
    {
        $r = $this->check(['found' => true, 'answer' => 'Текст', 'source_keys' => []]);

        $this->assertSame('invalid_response', $r['result']);
        $this->assertNull($r['answer']);
    }

    public function test_unknown_source_key_is_rejected(): void
    {
        $r = $this->check(['found' => true, 'answer' => 'Текст', 'source_keys' => ['made-up.section']]);

        $this->assertSame('invalid_response', $r['result']);
    }

    public function test_source_from_a_document_the_role_cannot_see_is_rejected(): void
    {
        // hr-internal.queue нет в списке разрешённых ключей работника
        $r = $this->check(['found' => true, 'answer' => 'Текст', 'source_keys' => ['hr-internal.queue']]);

        $this->assertSame('invalid_response', $r['result']);
    }

    public function test_empty_answer_and_garbage_are_rejected(): void
    {
        $this->assertSame('invalid_response', $this->check(['found' => true, 'answer' => '  ', 'source_keys' => ['vacation-policy.duration']])['result']);
        $this->assertSame('invalid_response', $this->check(null)['result']);
        $this->assertSame('invalid_response', $this->check(['found' => 'yes'])['result']);
    }
}