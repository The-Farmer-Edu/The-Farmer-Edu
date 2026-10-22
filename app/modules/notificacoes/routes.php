
<?php

require_once __DIR__ . '/Controller.php';

Router::get('/notificacoes', [NotificacoesController::class, 'listar']);
