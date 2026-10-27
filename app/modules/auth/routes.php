<?php
 
require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';
 
Router::get('/auth/novoUsuario', [UsuarioController::class, 'showNovoUsuario']);
Router::post('/auth/novoUsuario', [UsuarioController::class, 'novoUsuario']);

Router::get('/auth/loginInstrutor', [UsuarioController::class, 'showLoginInstrutor']);
Router::post('/auth/loginInstrutor', [UsuarioController::class, 'entrarInstrutor']);

Router::get('/auth/logout', [UsuarioController::class, 'sair']);

Router::get('/auth/loginAluno', [UsuarioController::class, 'showLoginAluno']);
Router::post('/auth/loginAluno', [UsuarioController::class, 'entrarAluno']);

Router::get('/auth/file', [UsuarioController::class, 'sendFile']);