<?php
    require_once __DIR__ . '/../../core/router.php';
    require_once __DIR__ . '/Controller.php';

    // Registra as rotas usando os métodos estáticos do Router
    Router::get('/views/buscarUsuario', [UsuarioController::class, 'showBuscarUsuario']);
    Router::get('/views/novoUsuario', [UsuarioController::class, 'showNovoUsuario']);
?>