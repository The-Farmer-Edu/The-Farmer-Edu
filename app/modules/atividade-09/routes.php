
<?php

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

// Registra as rotas usando os métodos estáticos do Router
Router::get('/buscarUsuario', [UsuarioController::class, 'showBuscarUsuario']);
Router::get('/novoUsuario', [UsuarioController::class, 'showNovoUsuario']);


// No arquivo routes.php
Router::get('/Felipe/The-Farmer-Edu-Tarde', [UsuarioController::class, 'showNovoUsuario']);
// Exemplo de como tratar a URI antes de procurar a rota no Router
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$baseFolder = '/Felipe/The-Farmer-Edu-Tarde';

// Remove a pasta base da URL
if (strpos($uri, $baseFolder) === 0) {
    $uri = substr($uri, strlen($baseFolder));
}

// Se a URI ficar vazia, define como '/'
$uri = $uri === '' ? '/' : $uri;