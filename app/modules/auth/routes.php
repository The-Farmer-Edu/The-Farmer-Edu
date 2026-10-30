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

Router::get('/auth/editarConta', [UsuarioController::class, 'showEditarConta']);
Router::post('/auth/editarConta', [UsuarioController::class, 'editarConta']);

Router::get('/auth/desativarConta', [UsuarioController::class, 'showDesativarConta']);
Router::post('/auth/desativarConta', [UsuarioController::class, 'desativarConta']);