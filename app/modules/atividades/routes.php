<?php

require_once __DIR__ . '/Controller.php';

Router::get('/atividades/instrutor', [AtividadesController::class, 'showInstrutor']);
Router::get('/atividades/instrutor/dados', [AtividadesController::class, 'dadosInstrutor']);
Router::get('/atividades/criterios', [AtividadesController::class, 'showCriterios']);
Router::post('/atividades/instrutor/salvar', [AtividadesController::class, 'salvar']);
Router::post('/atividades/instrutor/remover', [AtividadesController::class, 'remover']);
Router::get('/atividades/gabarito', [AtividadesController::class, 'baixarGabarito']);

Router::get('/atividades/aluno', [AtividadesController::class, 'showAluno']);
Router::get('/atividades/aluno/turmas', [AtividadesController::class, 'turmasAluno']);
Router::get('/atividades/aluno/lista', [AtividadesController::class, 'listaAluno']);

Router::get('/atividades/aluno/anexo', [AtividadesController::class, 'showAnexoAluno']);
Router::get('/atividades/aluno/anexo/dados', [AtividadesController::class, 'dadosAnexoAluno']);
Router::post('/atividades/aluno/anexo/enviar', [AtividadesController::class, 'enviarAnexo']);
Router::get('/atividades/anexo/baixar', [AtividadesController::class, 'baixarAnexo']);

Router::get('/atividades/file', [AtividadesController::class, 'sendFile']);