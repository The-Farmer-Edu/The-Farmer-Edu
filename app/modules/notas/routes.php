<?php
require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

Router::get('/notas/aluno', [NotasController::class, 'verNotasAluno']);
Router::get('/notas/instrutor', [NotasController::class, 'painelInstrutor']);
Router::get('/notas/turma', [NotasController::class, 'verTurma']);
Router::post('/notas/salvar', [NotasController::class, 'salvarNota']);

// Logout pelo modulo de notas (redireciona para o login do aluno)
Router::get('/notas/logout', [NotasController::class, 'logout']);
?>
