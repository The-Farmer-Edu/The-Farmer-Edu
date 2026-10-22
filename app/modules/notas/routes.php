<?php

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

// Registra as rotas usando os métodos estáticos do Router
Router::get('/notas/index.php', [notasController::class, 'showTestarApi']);

Router::post('/notas/sendAvaliacao', [notasController::class, 'sendAvaliacao']);