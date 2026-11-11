<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';
require_once __DIR__ . '/../../core/session.php';

class NotificacoesController
{
    public function listar(): void
    {
        $pdo = iniciarPDO();

        // Buscar usuário logado
        $usuario = usuarioLogado();

        if (!$usuario) {
            solicitarLogin();
            // http_response_code(401);
            // echo 'Você precisa estar logado.';
            return;
        }

        $idUsuario = (int) $usuario['idUsuario'];
        $perfilAcesso = $usuario['perfilAcesso'];

        // Buscar notificações do usuário
        $notificacoes = $idUsuario
            ? NotificacoesModel::listar($pdo, (int) $idUsuario)
            : [];

        require __DIR__ . '/views/notificacoes.php';
    }

    public function testarApi(): void
    {
        require __DIR__ . '/views/testarApi.php';
    }

    public function marcarComoLida(): void
    {
        header('Content-Type: application/json');

        // Permitir apenas requisições POST
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['sucesso' => false]);
            return;
        }

        $pdo = iniciarPDO();

        // Identificar usuário logado
$usuario = usuarioLogado();

if (!$usuario) {
    http_response_code(401);
    echo json_encode([
        'sucesso' => false,
        'erro' => 'Usuário não autenticado'
    ]);
    return;
}

$idUsuario = (int) $usuario['idUsuario'];

        // Receber dados da notificação
        $idNotificacao = filter_input(
            INPUT_POST,
            'id_notificacao',
            FILTER_VALIDATE_INT
        );

        $lida = filter_input(
            INPUT_POST,
            'lida',
            FILTER_VALIDATE_INT
        );

        // Validar dados
        if (
            !$idUsuario ||
            !$idNotificacao ||
            !in_array($lida, [0, 1], true)
        ) {
            http_response_code(400);
            echo json_encode(['sucesso' => false]);
            return;
        }

        // Atualizar notificação no banco
        $sucesso = NotificacoesModel::marcarComoLida(
            $pdo,
            (int) $idNotificacao,
            (int) $idUsuario,
            (bool) $lida
        );

        echo json_encode([
            'sucesso' => $sucesso
        ]);
    }
}
