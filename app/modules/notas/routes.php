<?php

require_once __DIR__ . '/Controller.php';

Router::get('/notas/aluno', [NotasController::class, 'verNotasAluno']);
Router::get('/notas/instrutor', [NotasController::class, 'painelInstrutor']);
Router::get('/notas/turma', [NotasController::class, 'verTurma']);
Router::post('/notas/salvar', [NotasController::class, 'salvarNota']);
?>