<?php

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

Router::get('/auth/buscarUsuario', [UsuarioController::class, 'showBuscarUsuario']);
Router::get('/auth/novoUsuario', [UsuarioController::class, 'showNovoUsuario']);
