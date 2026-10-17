<?php

return [
    // mock — читаем «сторону 1С» из БД, http — реальное API (заглушка)
    'source' => env('HR_SOURCE', 'mock'),
    'onec' => [
        'url' => env('ONEC_URL'),
        'token' => env('INTEGRATION_TOKEN'),
    ],
    'timezone' => 'Asia/Almaty',
    'login_rate_limit' => env('LOGIN_RATE_LIMIT', 5),
    'ai_rate_limit' => env('AI_RATE_LIMIT', 10),
    'ai_daily_limit' => (int) env('AI_DAILY_LIMIT', 300),
];