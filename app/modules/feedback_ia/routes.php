<?php
    require_once __DIR__ . '/../../core/router.php';
    require_once __DIR__ . '/Controller.php';

    Router::get('/feedback_ia/testarAPI', [testarAPIController::class, 'showAvaliar']);
    Router::post('/feedback_ia/sendAvaliacao', [testarAPIController::class, 'sendAvaliacao']);
    Router::get('/feedback_ia/file', [testarAPIController::class, 'sendFile']);
    Router::get('/feedback_ia/respostaReferencia', [testarAPIController::class, 'sendRespostaReferencia']);