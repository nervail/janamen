<?php

namespace Database\Seeders;

use App\Models\KbDocument;
use Illuminate\Database\Seeder;
use RuntimeException;

class KbSeeder extends Seeder
{
    public function run(): void
    {
        $text = str_replace("\r\n", "\n", file_get_contents(database_path('seeders/data/kb_ru.md')));

        foreach (preg_split('/^# /m', $text, -1, PREG_SPLIT_NO_EMPTY) as $i => $block) {
            [$header, $body] = array_pad(explode("\n", $block, 2), 2, '');
            [$slug, $title, $access] = array_map('trim', explode('|', $header));

            $document = KbDocument::create([
                'slug' => $slug,
                'language' => 'ru',
                'title' => $title,
                'access_level' => $access,
                'position' => $i + 1,
            ]);

            // ltrim: иначе первым куском остаётся пустая строка перед первым «## »
            foreach (preg_split('/^## /m', ltrim($body), -1, PREG_SPLIT_NO_EMPTY) as $j => $section) {
                [$heading, $content] = array_pad(explode("\n", $section, 2), 2, '');

                if (! preg_match('/^(.*?)\s*\{#([a-z0-9-]+)\}\s*$/u', trim($heading), $m)) {
                    throw new RuntimeException("KB: у раздела «{$heading}» (документ {$slug}) нет якоря вида {#anchor}");
                }

                $document->sections()->create([
                    'key' => "{$slug}.{$m[2]}",
                    'anchor' => $m[2],
                    'title' => $m[1],
                    'body' => trim($content),
                    'position' => $j + 1,
                ]);
            }
        }
    }
}