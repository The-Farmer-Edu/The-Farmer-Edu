<?php
/**
 * Rotas do módulo de submissões.
 *
 * A aplicação usa um roteador central e mapeia URL -> método do controller.
 * Estruturalmente, a URL pública é delegada para as ações do módulo, sem lógica de negócio
 * dentro da própria rota.
 */
// require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

// Página principal do aluno com listagem das atividades.
Router::get('/aluno', [atividadesSub::class, 'showaluno']);

// Página do editor/IDE, onde o aluno programa e entrega a resposta.
Router::get('/iniciarAtv', [atividadesSub::class, 'showiniciarAtv']);

// Endpoint de submissão (usado principalmente pelo fluxo de avaliação de atividade).
Router::post('/enviarSubmissao', [atividadesSub::class, 'processarSubmisssao']);

// Servidor de assets: CSS, JS e imagens internos do módulo.
Router::get('/submissoes/file', [atividadesSub::class, 'sendFile']);
