<?php
require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

Router::get('/aluno', [atividadesSub::class, 'showaluno']);
Router::get('/iniciarAtv', [atividadesSub::class, 'showiniciarAtv']);
Router::get('/respostas', [atividadesSub::class, 'showrespostas']);
Router::post('/enviarSubmissao', [atividadesSub::class, 'processarSubmisssao']);
Router::get('/submissoes/file', [atividadesSub::class, 'sendFile']);

?>