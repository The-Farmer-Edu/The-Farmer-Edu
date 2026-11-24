<?php

require_once __DIR__ . '/Controller.php';

// Tela e API da tela
Router::get('/notificacoes', [NotificacoesController::class, 'listar']);
Router::post('/notificacoes/marcar-lida', [NotificacoesController::class, 'marcarComoLida']);
Router::post('/notificacoes/marcar-todas', [NotificacoesController::class, 'marcarTodas']);
Router::get('/notificacoes/verificar-novas', [NotificacoesController::class, 'verificarNovas']);

// Alertas no celular/PC (Web Push)
Router::get('/notificacoes/sw.js', [NotificacoesController::class, 'serviceWorker']);
Router::get('/notificacoes/manifest.json', [NotificacoesController::class, 'manifest']);
Router::get('/notificacoes/push-chave', [NotificacoesController::class, 'pushChave']);
Router::post('/notificacoes/push-inscrever', [NotificacoesController::class, 'pushInscrever']);
Router::post('/notificacoes/push-cancelar', [NotificacoesController::class, 'pushCancelar']);

// Teste das APIs
Router::get('/notificacoes/testarApi', [NotificacoesController::class, 'testarApi']);
