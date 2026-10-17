<?php

namespace App\Support;

use Illuminate\Http\Request;

class Locale
{
    /** Язык из заголовка Accept-Language, иначе язык профиля. */
    public static function resolve(Request $request): string
    {
        $header = strtolower(substr((string) $request->header('Accept-Language', ''), 0, 2));

        return in_array($header, ['ru', 'kz', 'en'], true) ? $header : ($request->user()?->locale ?? 'ru');
    }
}