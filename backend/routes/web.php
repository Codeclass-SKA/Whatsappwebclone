<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

Route::get('/', function () {
    return view('welcome');
});

// Broadcasting routes with authentication
Broadcast::routes(['middleware' => ['auth:sanctum']]);
