<?php

/**
 * routes.php — Atividade 10
 * Define as rotas disponíveis e direciona para o Controller.
 */

require_once __DIR__ . '/control.php';

// Identifica a ação solicitada via GET ou POST
$acao = $_GET['acao'] ?? $_POST['acao'] ?? 'index';

$controller = new Atividade10Controller();

switch ($acao) {
    case 'processar':
        $controller->processar();
        break;

    default:
        $controller->index();
        break;
}
