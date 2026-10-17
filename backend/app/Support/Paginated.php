<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class Paginated
{
    public static function make(LengthAwarePaginator $page, callable $map): JsonResponse
    {
        return response()->json([
            'data' => $page->getCollection()->map($map)->values(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
                'last_page' => $page->lastPage(),
            ],
        ]);
    }

    public static function perPage(Request $request): int
    {
        return min(max((int) $request->query('per_page', 20), 1), 100);
    }
}