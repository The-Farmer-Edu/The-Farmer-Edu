<?php
/**
 * Rotas do módulo atividade_09_tarde12
 */

if (file_exists(__DIR__ . '/../../core/router.php')) {
    require_once __DIR__ . '/../../core/router.php';
}

require_once __DIR__ . '/Controller.php';

// Registra as rotas caso o Router do sistema esteja disponível
if (class_exists('Router')) {
    Router::get('/views/buscarUsuario', [UsuarioController::class, 'showBuscarUsuario']);
    Router::get('/views/novoUsuario', [UsuarioController::class, 'showNovoUsuario']);
}