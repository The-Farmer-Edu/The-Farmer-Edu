<?php
    require_once __DIR__ . '/../../core/router.php';
    require_once __DIR__ . '/Controller.php';

    Router::get('/feedback_ia/testarApi', [testarAPIController::class, 'showAvaliar']);
    Router::post('/feedback_ia/sendAvaliacao', [testarAPIController::class, 'sendAvaliacao']);
?>