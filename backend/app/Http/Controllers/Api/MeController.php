<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MeResource;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MeController extends Controller
{
    public function show(Request $request): MeResource
    {
        return new MeResource($request->user());
    }

    public function update(Request $request): MeResource
    {
        $data = $request->validate([
            'locale' => ['required', Rule::in(['ru', 'kz', 'en'])],
        ]);

        $request->user()->update($data);

        return new MeResource($request->user()->fresh());
    }
}