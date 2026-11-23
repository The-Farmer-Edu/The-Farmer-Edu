<?php
require_once __DIR__ . '/Model.php';

/** Interface compartilhada: chamar no backend do squad quando o evento acontecer. */
class Notificador
{
    public static function enviar(PDO $pdo, int $idUsuario, string $tipo, string $mensagem): bool
    {
        if ($idUsuario <= 0 || trim($tipo) === '' || trim($mensagem) === '') {
            throw new InvalidArgumentException('Destinatário, tipo e mensagem são obrigatórios.');
        }
        return NotificacoesModel::criar($pdo, $idUsuario, $tipo, $mensagem);
    }

    public static function turma(PDO $pdo, int $idTurma, string $titulo): void
    {
        NotificacoesModel::notificarTurma($pdo, $idTurma, $titulo);
    }
}
