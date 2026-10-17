<?php

namespace App\Services\Ai;

use App\Models\KbDocument;
use App\Models\User;
use Illuminate\Support\Collection;

class KnowledgeBase
{
    /** Если документов на нужном языке нет, отдаём русскую версию. */
    public function language(?string $requested): string
    {
        return $requested && KbDocument::where('language', $requested)->exists() ? $requested : 'ru';
    }

    public function documentsFor(User $user, ?string $language = null): Collection
    {
        return KbDocument::where('language', $this->language($language))
            ->whereIn('access_level', $user->kbAccessLevels())
            ->orderBy('position')
            ->get();
    }

    /** Все разделы, доступные роли пользователя. Недоступные в промпт не попадают вообще. */
    public function sectionsFor(User $user): Collection
    {
        return $this->documentsFor($user, 'ru')
            ->load('sections')
            ->flatMap(fn (KbDocument $doc) => $doc->sections->map(fn ($s) => $s->setRelation('document', $doc)));
    }
}