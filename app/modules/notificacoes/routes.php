<?php

require_once __DIR__ . '/Controller.php';

Router::get('/notificacoes', [NotificacoesController::class, 'listar']);

Router::get('/notificacoes/testarApi', [NotificacoesController::class, 'testarApi']);
Router::post('/notificacoes/marcar-lida', [NotificacoesController::class, 'marcarComoLida']);

?>