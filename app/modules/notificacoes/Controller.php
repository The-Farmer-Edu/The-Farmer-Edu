<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';

class NotificacoesController
{
    public function listar(): void
    {
        $pdo = iniciarPDO();

        // Usuário de teste cadastrado no banco
        $stmt = $pdo->prepare(
            "SELECT id_usuario FROM usuarios WHERE email = ?"
        );
        $stmt->execute(['teste.notificacoes@exemplo.com']);

        $idUsuario = $stmt->fetchColumn();

        $notificacoes = $idUsuario
            ? NotificacoesModel::listar($pdo, (int) $idUsuario)
            : [];

        require __DIR__ . '/views/notificacoes.php';
    }

    public function testarApi(): void
    {
        require __DIR__ . '/views/testarApi.php';
    }
}
