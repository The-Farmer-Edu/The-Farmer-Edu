<?php
 
// require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';
 
Router::get('/auth/novoUsuario', [UsuarioController::class, 'showNovoUsuario']);
Router::post('/auth/novoUsuario', [UsuarioController::class, 'novoUsuario']);

Router::get('/auth/loginInstrutor', [UsuarioController::class, 'showLoginInstrutor']);
Router::post('/auth/loginInstrutor', [UsuarioController::class, 'entrarInstrutor']);

Router::get('/auth/logout', [UsuarioController::class, 'sair']);
Router::get('/auth/file', [UsuarioController::class, 'sendFile']);

Router::get('/auth/loginAluno', [UsuarioController::class, 'showLoginAluno']);
Router::post('/auth/loginAluno', [UsuarioController::class, 'entrarAluno']);

Router::get('/auth/editarConta', [UsuarioController::class, 'showEditarConta']);
Router::post('/auth/editarConta', [UsuarioController::class, 'editarConta']);

Router::get('/auth/desativarConta', [UsuarioController::class, 'showDesativarConta']);
Router::post('/auth/desativarConta', [UsuarioController::class, 'desativarConta']);

// DESATIVADA (auditoria de segurança): a página de teste enviava um e-mail REAL, pela API paga do Mailtrap, a um endereço de
// aluno fixo no código a cada visita — sem login (qualquer visitante ou robô de busca disparava e-mails). Para testar o envio,
// use o fluxo "Esqueci minha senha" ou reative a rota só no ambiente local, nunca em produção.
// Router::get('/auth/testeEmail', [UsuarioController::class, 'showTesteEmail']);

Router::get('/auth/esqueciSenha', [UsuarioController::class, 'showEsqueciSenha']);
Router::post('/auth/esqueciSenha', [UsuarioController::class, 'solicitarCodigo']);

Router::get('/auth/verificarCodigo', [UsuarioController::class, 'showVerificarCodigo']);
Router::post('/auth/verificarCodigo', [UsuarioController::class, 'verificarCodigo']);

Router::get('/auth/redefinirSenha', [UsuarioController::class, 'showRedefinirSenha']);
Router::post('/auth/redefinirSenha', [UsuarioController::class, 'redefinirSenha']);

