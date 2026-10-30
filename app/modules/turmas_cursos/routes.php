<?php

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

Router::get('/turmas_cursos', [CursosController::class, 'inicio']);
Router::get('/turmas_cursos/instrutor', [CursosController::class, 'instrutor']);
Router::get('/turmas_cursos/aluno', [CursosController::class, 'aluno']);
Router::get('/turmas_cursos/alunos', [CursosController::class, 'alunos']);
Router::get('/turmas_cursos/turmaForm', [CursosController::class, 'form']);
Router::post('/turmas_cursos/turmaSalvar', [CursosController::class, 'salvar']);
Router::get('/turmas_cursos/turmaEditar', [CursosController::class, 'editar']);
Router::post('/turmas_cursos/turmaAtualizar', [CursosController::class, 'atualizar']);
Router::post('/turmas_cursos/turmaExcluir', [CursosController::class, 'excluir']);
Router::get('/turmas_cursos/turma', [CursosController::class, 'turma']);
Router::post('/turmas_cursos/matricular', [CursosController::class, 'matricular']);
Router::post('/turmas_cursos/desmatricular', [CursosController::class, 'desmatricular']);
