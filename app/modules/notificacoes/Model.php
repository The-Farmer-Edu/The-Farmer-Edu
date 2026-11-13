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
       public static function marcarComoLida($pdo, $idNotificacao, $idUsuario, $lida)
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
public static function criar($pdo, $idUsuario, $tipo, $mensagem)
{
    $sql = "INSERT INTO notificacoes (id_usuario, tipo, mensagem)
            VALUES (:usuario, :tipo, :mensagem)";

    $stmt = $pdo->prepare($sql);

    return $stmt->execute([
        'usuario' => $idUsuario,
        'tipo' => $tipo,
        'mensagem' => $mensagem
    ]);
}
public static function notificarTurma($pdo, $idTurma, $titulo)
{
    $sql = "SELECT DISTINCT id_aluno
            FROM matriculas
            WHERE id_turma = :turma";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['turma' => $idTurma]);

    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $idAluno) {
        self::criar(
            $pdo,
            $idAluno,
            'atividade_pendente',
            'Nova atividade disponível: ' . $titulo
        );
    }
}
public static function notificarInstrutor($pdo, $idInstrutor, $titulo)
{
    return self::criar(
        $pdo,
        $idInstrutor,
        'atividade_entregue',
        'Um aluno entregou a atividade: ' . $titulo
    );
}
public static function notificarNota($pdo, $idAluno, $titulo)
{
    return self::criar(
        $pdo,
        $idAluno,
        'nota_atribuida',
        'Sua atividade recebeu uma nota: ' . $titulo
    );
}
public static function notificarFeedbackIA($pdo, $idAluno)
{
    return self::criar(
        $pdo,
        $idAluno,
        'feedback_ia',
        'O feedback da IA para sua atividade está disponível.'
    );
}
public static function notificarAtaque($pdo, $idAluno)
{
    return self::criar(
        $pdo,
        $idAluno,
        'fazenda_atacada',
        'Sua fazenda foi atacada por mobs!'
    );
}
public static function notificarAtividadeAtrasada($pdo, $idAluno, $titulo)
{
    return self::criar(
        $pdo,
        $idAluno,
        'atividade_atrasada',
        'Sua atividade está pendente há mais de 5 dias: ' . $titulo
    );
}
public static function notificarAtividadePublicada($pdo, $idInstrutor, $titulo)
{
    return self::criar(
        $pdo,
        $idInstrutor,
        'atividade_publicada',
        'Atividade publicada com sucesso: ' . $titulo
    );
}
}