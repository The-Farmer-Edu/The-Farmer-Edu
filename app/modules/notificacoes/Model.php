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
       public static function marcarComoLida($pdo, $idNotificacao, $idUsuario, $lida){
{
    $sql = "UPDATE notificacoes
            SET lida = :lida
            WHERE id_notificacao = :id
            AND id_usuario = :usuario";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
    'lida' => $lida ? 1 : 0,
    'id' => $idNotificacao,
    'usuario' => $idUsuario
]);

return $stmt->rowCount() > 0;

}

}
}