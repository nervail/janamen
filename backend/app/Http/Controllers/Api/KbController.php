<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KbDocument;
use App\Services\Ai\KnowledgeBase;
use App\Support\Locale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KbController extends Controller
{
    public function index(Request $request, KnowledgeBase $kb): JsonResponse
    {
        $language = $request->query('language', Locale::resolve($request));

        return response()->json(['data' => $kb->documentsFor($request->user(), $language)
            ->map(fn (KbDocument $d) => [
                'slug' => $d->slug,
                'language' => $d->language,
                'title' => $d->title,
                'access_level' => $d->access_level,
            ])->values()]);
    }

    public function show(Request $request, KnowledgeBase $kb, string $slug): JsonResponse
    {
        $language = $kb->language($request->query('language', Locale::resolve($request)));
        $document = KbDocument::with('sections')->where('slug', $slug)->where('language', $language)->firstOrFail();

        abort_unless(in_array($document->access_level, $request->user()->kbAccessLevels(), true), 403);

        return response()->json(['data' => [
            'slug' => $document->slug,
            'language' => $document->language,
            'title' => $document->title,
            'access_level' => $document->access_level,
            'sections' => $document->sections->map(fn ($s) => [
                'key' => $s->key,
                'anchor' => $s->anchor,
                'title' => $s->title,
                'body' => $s->body,
            ])->values(),
        ]]);
    }
}