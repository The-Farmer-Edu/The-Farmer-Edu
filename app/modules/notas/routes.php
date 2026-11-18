<?php
/**
 * ============================================================================
 * MÓDULO NOTAS - DEFINIÇÃO DE ROTAS (routes.php)
 * ============================================================================
 * Este arquivo centraliza todas as rotas de acesso HTTP do módulo de Notas.
 * Faz o mapeamento entre a URI requisitada, o método HTTP (GET/POST) e a respectiva
 * action dentro do NotasController.
 * ============================================================================
 */

// Importa o componente central de roteamento da aplicação
require_once __DIR__ . '/../../core/router.php';

// Importa o controlador de notas que processará as requisições
require_once __DIR__ . '/Controller.php';

// ----------------------------------------------------------------------------
// ROTAS DO ALUNO
// ----------------------------------------------------------------------------
// Visualização do boletim e notas das atividades do aluno logado
Router::get('/notas/aluno', [NotasController::class, 'verNotasAluno']);

// ----------------------------------------------------------------------------
// ROTAS DO INSTRUTOR
// ----------------------------------------------------------------------------
// Painel principal do instrutor listando todas as suas turmas ativas
Router::get('/notas/instrutor', [NotasController::class, 'painelInstrutor']);

// Painel detalhado de uma turma específica para lançamento e acompanhamento de notas
Router::get('/notas/turma', [NotasController::class, 'verTurma']);

// Endpoint POST para processamento e persistência das notas atribuídas (suporta AJAX)
Router::post('/notas/salvar', [NotasController::class, 'salvarNota']);

// ----------------------------------------------------------------------------
// ROTA DE AUTENTICAÇÃO / SESSÃO
// ----------------------------------------------------------------------------
// Logout pelo modulo de notas (redireciona para o login do aluno)
Router::get('/notas/logout', [NotasController::class, 'logout']);
?>
