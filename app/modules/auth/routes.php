<?php
    require_once __DIR__ . '/../../core/router.php';
    require_once __DIR__ . '/Controller.php';

    Router::get('/auth/testarApi', [testarApiController::class, 'showTestarApi']);
    Router::post('/auth/sendAvaliacao', [testarApiController::class, 'sendAvaliacao']);
?>