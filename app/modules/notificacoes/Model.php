<?php

class NotificacoesModel
{
    public static function listar($pdo, $idUsuario)
    {
        $sql = "SELECT * FROM notificacoes
                WHERE id_usuario = :id
                ORDER BY criado_em DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $idUsuario]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
