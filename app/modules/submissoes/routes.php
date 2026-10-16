<?php
require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

Router::get('/atividade-09/testarApi', [subApiController::class, 'showtestarApi']);
Router::post('/atividade-09/enviarSubmissao', [subApiController::class, 'enviarSubmissao']);
?>