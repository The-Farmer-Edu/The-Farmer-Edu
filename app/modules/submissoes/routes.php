<?php
    require_once __DIR__ . '/../../core/router.php';
    require_once __DIR__ . '/Controller.php';

    Router::get('/aluno', [testarApiController::class, 'showaluno']);
    Router::get('/atividade-09/testarApi', [testarApiController::class, 'showtestarApi']);
    Router::post('/atividade-09/enviarSubmissao', [testarApiController::class, 'enviarSubmissao']);
    Router::get('/feedback_ia/testarAPI', [testarAPIController::class, 'showAvaliar']);
    Router::post('/feedback_ia/sendAvaliacao', [testarAPIController::class, 'sendAvaliacao']);
    Router::get('/feedback_ia/file', [testarAPIController::class, 'sendFile']);
?>