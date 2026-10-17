<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Integrations\Onec\EmployeeDataSource;
use App\Integrations\Onec\HttpEmployeeDataSource;
use App\Integrations\Onec\MockEmployeeDataSource;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use App\Integrations\Documentolog\DocumentSigningService;
use App\Integrations\Documentolog\MockDocumentSigningService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(DocumentSigningService::class, MockDocumentSigningService::class);
        $this->app->bind(EmployeeDataSource::class, fn () => config('hr.source') === 'http'
            ? new HttpEmployeeDataSource((string) config('hr.onec.url'), (string) config('hr.onec.token'))
            : new MockEmployeeDataSource());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('login', fn (Request $request) =>
            Limit::perMinute((int) config('hr.login_rate_limit'))->by($request->ip()));
    }
}
