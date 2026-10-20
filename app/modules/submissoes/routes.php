<?php
require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

Router::get('/aluno', [atividadesSub::class, 'showaluno']);
Router::get('/atividade-09/testarApi', [atividadesSub::class, 'showtestarApi']);
Router::post('/atividade-09/enviarSubmissao', [atividadesSub::class, 'enviarSubmissao']);
Router::get('/iniciarAtv', [atividadesSub::class, 'showiniciarAtv']);
Router::get('/atividade-09/file', [atividadesSub::class, 'sendFile']);

?>