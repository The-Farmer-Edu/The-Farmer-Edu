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
Router::get('/submissoes/aluno', [atividadesSub::class, 'showaluno']);

// Página do editor/IDE, onde o aluno programa e entrega a resposta.
Router::get('/submissoes/iniciarAtv', [atividadesSub::class, 'showiniciarAtv']);

// Endpoint de submissão (usado principalmente pelo fluxo de avaliação de atividade).
Router::post('/submissoes/enviarSubmissao', [atividadesSub::class, 'processarSubmisssao']);

// Servidor de assets: CSS, JS e imagens internos do módulo.
Router::get('/submissoes/file', [atividadesSub::class, 'sendFile']);

Router::post('/submissoes/enviarAnexo', [atividadesSub::class, 'enviarAnexo']);

<<<<<<< HEAD
Router::post('/submissoes/salvarResolucao', [atividadesSub::class, 'salvarResolucao']);

// Cancela a última entrega ativa do aluno diretamente no banco de dados.
Router::post('/submissoes/cancelarEntrega', [atividadesSub::class, 'cancelarEntrega']);

// Consulta o estado atual da atividade/submissão direto do banco de dados.
Router::get('/submissoes/status', [atividadesSub::class, 'statusAtividade']);
=======
Router::post('/submissoes/salvarResolucao', [atividadesSub::class, 'salvarResolucao']);
>>>>>>> f98a36432a3347ccf3a3c9508cf0b4fc0e25cf75
