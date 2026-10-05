<?php

    require_once __DIR__ . '/../../core/router.php';
    require_once __DIR__ . '/Controller.php';

    // Registra as rotas usando os métodos estáticos do Router
    Router::get('/atividade-09/buscarUsuario', [UsuarioController::class, 'showBuscarUsuario']);
    Router::get('/atividade-09/novoUsuario', [UsuarioController::class, 'showNovoUsuario']);
?>