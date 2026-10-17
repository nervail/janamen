<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RequestController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\DashboardController;

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
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('me', [MeController::class, 'show']);
        Route::patch('me', [MeController::class, 'update']);

        Route::get('profile', [ProfileController::class, 'show']);

        Route::get('requests', [RequestController::class, 'index']);
        Route::post('requests', [RequestController::class, 'store']);
        Route::get('requests/{id}', [RequestController::class, 'show'])->whereNumber('id');
        Route::post('requests/{id}/actions', [RequestController::class, 'action'])->whereNumber('id');

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('notifications/read-all', [NotificationController::class, 'readAll']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'read']);

        Route::get('dashboard', [DashboardController::class, 'show']);
        Route::post('profile/corrections', [ProfileController::class, 'corrections']);
    });
});