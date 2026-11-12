<?php

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

Router::get('/turmas_cursos', [CursosController::class, 'inicio']);
Router::get('/turmas_cursos/instrutor', [CursosController::class, 'instrutor']);
Router::get('/turmas_cursos/aluno', [CursosController::class, 'aluno']);
Router::get('/turmas_cursos/alunos', [CursosController::class, 'alunos']);
Router::get('/turmas_cursos/cursoNovo', [CursosController::class, 'cursoNovo']);
Router::post('/turmas_cursos/cursoSalvar', [CursosController::class, 'cursoSalvar']);
Router::get('/turmas_cursos/cursoEditar', [CursosController::class, 'cursoEditar']);
Router::post('/turmas_cursos/cursoAtualizar', [CursosController::class, 'cursoAtualizar']);
Router::post('/turmas_cursos/cursoExcluir', [CursosController::class, 'cursoExcluir']);
Router::get('/turmas_cursos/turmaForm', [CursosController::class, 'form']);
Router::post('/turmas_cursos/turmaSalvar', [CursosController::class, 'salvar']);
Router::get('/turmas_cursos/turmaEditar', [CursosController::class, 'editar']);
Router::post('/turmas_cursos/turmaAtualizar', [CursosController::class, 'atualizar']);
Router::post('/turmas_cursos/turmaArquivar', [CursosController::class, 'arquivar']);
Router::post('/turmas_cursos/turmaRestaurar', [CursosController::class, 'restaurar']);
Router::get('/turmas_cursos/turma', [CursosController::class, 'turma']);
Router::post('/turmas_cursos/matricular', [CursosController::class, 'matricular']);
Router::post('/turmas_cursos/desmatricular', [CursosController::class, 'desmatricular']);
Router::post('/turmas_cursos/alunoDesativar', [CursosController::class, 'desativarAluno']);
Router::post('/turmas_cursos/alunoReativar', [CursosController::class, 'reativarAluno']);
Router::get('/turmas_cursos/minhaConta', [CursosController::class, 'conta']);
Router::post('/turmas_cursos/contaDesativar', [CursosController::class, 'desativarConta']);
Router::post('/turmas_cursos/contaAtualizar', [CursosController::class,  'contaAtualizar']);
