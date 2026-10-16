<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MeController;

Route::get('/health', function () {
    try {
        DB::select('select 1');
        $db = 'ok';
    } catch (\Throwable) {
        $db = 'error';
    }

    return response()->json([
        'status'    => $db === 'ok' ? 'ok' : 'degraded',
        'db'        => $db,
        'ai'        => config('services.openai.key') ? 'configured' : 'not_configured',
        'hr_source' => env('HR_SOURCE', 'mock'),
    ]);
});

Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('me', [MeController::class, 'show']);
        Route::patch('me', [MeController::class, 'update']);
    });
});