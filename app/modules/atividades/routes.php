<?php

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/controller.php';

router::get('/atividades/instrutor', [AtividadesController::class, 'showInstrutor']);
router::get('/atividades/instrutor/dados', [AtividadesController::class, 'dadosInstrutor']);
router::post('/atividades/instrutor/salvar', [AtividadesController::class, 'salvar']);
router::post('/atividades/instrutor/remover', [AtividadesController::class, 'remover']);

router::get('/atividades/aluno', [AtividadesController::class, 'showAluno']);
router::get('/atividades/aluno/cursos', [AtividadesController::class, 'cursosAluno']);
router::get('/atividades/aluno/lista', [AtividadesController::class, 'listaAluno']);

router::get('/atividades/file', [AtividadesController::class, 'sendFile']);

?>