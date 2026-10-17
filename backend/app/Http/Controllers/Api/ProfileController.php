<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileResource;
use App\Http\Resources\RequestDetailResource;
use App\Services\RequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): ProfileResource
    {
        return new ProfileResource($request->user());
    }

    public function corrections(Request $request, RequestService $service): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $created = $service->createHrQuestion($request->user(), 'profile_correction', $data['message']);

        return (new RequestDetailResource($created->load(['author.employee', 'history.actor.employee'])))
            ->response()->setStatusCode(201);
    }
}