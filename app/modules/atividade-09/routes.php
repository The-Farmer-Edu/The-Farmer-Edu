<?php
    require_once __DIR__ . '/../../core/router.php';
    require_once __DIR__ . '/Controller.php';

    // Registra as rotas usando os métodos estáticos do Router
    Router::get('/buscarUsuario', [UsuarioController::class, 'showBuscarUsuario']);
    Router::get('/novoUsuario', [UsuarioController::class, 'showNovoUsuario']);

    Router::get('/The-Farmer-Edu-Tarde', [UsuarioController::class, 'showNovoUsuario']);

    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $baseFolder = '/Ther-Farmer-Edu-Tarde'; 

    if (strpos($uri, $baseFolder) === 0) {
        $uri = substr($uri, strlen($baseFolder));
    }

    $uri = $uri === '' ? '/' : $uri;