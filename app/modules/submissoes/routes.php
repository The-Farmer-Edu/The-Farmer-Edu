<?php
require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

Router::get('/aluno', [testarApiController::class, 'showaluno']);
Router::get('/atividade-09/testarApi', [testarApiController::class, 'showtestarApi']);
Router::post('/atividade-09/enviarSubmissao', [testarApiController::class, 'enviarSubmissao']);
Router::get('/alunoCSS', [testarApiController::class, 'alunoCSS']);
Router::get('/alunoJS', [testarApiController::class, 'alunoJS']);
Router::get('/iniciarAtv', [testarApiController::class, 'showiniciarAtv']);
?>