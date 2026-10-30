<?php

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

Router::get('/atividades/instrutor', [AtividadesController::class, 'showInstrutor']);
Router::get('/atividades/instrutor/dados', [AtividadesController::class, 'dadosInstrutor']);
Router::get('/atividades/criterios', [AtividadesController::class, 'showCriterios']);
Router::post('/atividades/instrutor/salvar', [AtividadesController::class, 'salvar']);
Router::post('/atividades/instrutor/remover', [AtividadesController::class, 'remover']);

Router::get('/atividades/aluno', [AtividadesController::class, 'showAluno']);
Router::get('/atividades/aluno/cursos', [AtividadesController::class, 'cursosAluno']);
Router::get('/atividades/aluno/lista', [AtividadesController::class, 'listaAluno']);

Router::get('/atividades/file', [AtividadesController::class, 'sendFile']);

?>