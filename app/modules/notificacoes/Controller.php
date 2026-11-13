

<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';

class NotificacoesController
{
    public function listar(): void
    {
        $pdo = iniciarPDO();

        // Buscar usuário de teste
        $stmt = $pdo->prepare(
            "SELECT id_usuario FROM usuarios WHERE email = ?"
        );

        $stmt->execute(['teste.notificacoes@exemplo.com']);

        $idUsuario = $stmt->fetchColumn();

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

        // Buscar usuário
        $stmt = $pdo->prepare(
            "SELECT id_usuario FROM usuarios WHERE email = ?"
        );

        $stmt->execute(['teste.notificacoes@exemplo.com']);

        $idUsuario = $stmt->fetchColumn();

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
