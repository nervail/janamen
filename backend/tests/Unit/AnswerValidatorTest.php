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

    public function test_not_found_keeps_a_clean_note(): void
    {
        $r = $this->check(['found' => false, 'answer' => null, 'source_keys' => [], 'note' => "  Информации об ипотеке в базе знаний нет  "]);

        $this->assertSame('not_found', $r['result']);
        $this->assertSame('Информации об ипотеке в базе знаний нет.', $r['note']);
    }

    public function test_note_with_link_or_too_long_is_dropped(): void
    {
        $link = $this->check(['found' => false, 'answer' => null, 'source_keys' => [], 'note' => 'Смотрите https://evil.example']);
        $long = $this->check(['found' => false, 'answer' => null, 'source_keys' => [], 'note' => str_repeat('а', 300)]);

        $this->assertNull($link['note']);
        $this->assertNull($long['note']);
    }

    public function test_note_is_ignored_when_answer_is_found_or_response_is_invalid(): void
    {
        $found = $this->check(['found' => true, 'answer' => 'Ответ', 'source_keys' => ['vacation-policy.duration'], 'note' => 'Лишнее']);
        $bad = $this->check(['found' => true, 'answer' => 'Ответ', 'source_keys' => ['made-up.section'], 'note' => 'Лишнее']);

        $this->assertNull($found['note']);
        $this->assertNull($bad['note']);
    }
}