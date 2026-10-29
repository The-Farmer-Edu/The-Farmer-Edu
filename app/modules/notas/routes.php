<?php

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

// Aluno: ver suas notas
Router::get('/notas/aluno', [NotasController::class, 'verNotasAluno']);

// Instrutor: painel de turmas
Router::get('/notas/instrutor', [NotasController::class, 'painelInstrutor']);

// Instrutor: submissoes de uma turma especifica
Router::get('/notas/turma', [NotasController::class, 'verTurma']);

// Instrutor: salvar/atualizar nota (AJAX ou POST normal)
Router::post('/notas/salvar', [NotasController::class, 'salvarNota']);
