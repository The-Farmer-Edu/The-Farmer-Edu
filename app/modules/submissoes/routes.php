<?php

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

// Página do aluno: lista atividades e status de entrega
Router::get('/aluno', [atividadesSub::class, 'showaluno']);

// IDE: o aluno escreve e executa o código
Router::get('/iniciarAtv', [atividadesSub::class, 'showiniciarAtv']);

// Endpoint de submissão (POST): repassa para o AvaliadorController
Router::post('/enviarSubmissao', [atividadesSub::class, 'processarSubmissao']);

// Arquivos estáticos da view (CSS, JS, imagens)
Router::get('/submissoes/file', [atividadesSub::class, 'sendFile']);
