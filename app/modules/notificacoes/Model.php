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

    /** Notificações do usuário com id maior que $depoisDoId (usado pelo polling da tela). */
    public static function listarNovas($pdo, $idUsuario, $depoisDoId)
    {
        $sql = "SELECT * FROM notificacoes
                WHERE id_usuario = :id
                AND id_notificacao > :depois
                ORDER BY id_notificacao ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'id'     => $idUsuario,
            'depois' => (int) $depoisDoId
        ]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function marcarComoLida($pdo, $idNotificacao, $idUsuario, $lida)
    {
        $sql = "UPDATE notificacoes
                SET lida = :lida
                WHERE id_notificacao = :id
                AND id_usuario = :usuario";

        $stmt = $pdo->prepare($sql);

        $ok = $stmt->execute([
            'lida'    => $lida ? 1 : 0,
            'id'      => $idNotificacao,
            'usuario' => $idUsuario
        ]);

        if (!$ok) {
            return false;
        }

        // No MySQL, rowCount() conta apenas linhas ALTERADAS. Se a notificação
        // já estava com esse valor, retorna 0 mesmo sem haver erro.
        if ($stmt->rowCount() > 0) {
            return true;
        }

        // 0 linhas alteradas: confirma se a notificação existe e é do usuário.
        $check = $pdo->prepare(
            "SELECT 1 FROM notificacoes
             WHERE id_notificacao = :id
             AND id_usuario = :usuario"
        );
        $check->execute([
            'id'      => $idNotificacao,
            'usuario' => $idUsuario
        ]);

        return (bool) $check->fetchColumn();
    }

    /** Marca todas as notificações do usuário como lidas. Devolve quantas foram alteradas. */
    public static function marcarTodasComoLidas($pdo, $idUsuario)
    {
        $stmt = $pdo->prepare(
            "UPDATE notificacoes
             SET lida = 1
             WHERE id_usuario = :usuario
             AND (lida = 0 OR lida IS NULL)"
        );
        $stmt->execute(['usuario' => $idUsuario]);

        return $stmt->rowCount();
    }

    public static function criar($pdo, $idUsuario, $tipo, $mensagem)
    {
        // lida e criado_em são gravados explicitamente: não dependem dos valores padrão da tabela.
        $sql = "INSERT INTO notificacoes (id_usuario, tipo, mensagem, lida, criado_em)
                VALUES (:usuario, :tipo, :mensagem, 0, NOW())";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'usuario'  => $idUsuario,
            'tipo'     => $tipo,
            'mensagem' => $mensagem
        ]);
    }

    public static function existeNaoLida($pdo, $idUsuario, $tipo, $mensagem)
    {
        $sql = "SELECT 1 FROM notificacoes
                WHERE id_usuario = :usuario
                AND tipo = :tipo
                AND mensagem = :mensagem
                AND lida = 0
                LIMIT 1";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'usuario'  => $idUsuario,
            'tipo'     => $tipo,
            'mensagem' => $mensagem
        ]);

        return (bool) $stmt->fetchColumn();
    }

    public static function idsAlunosDaTurma($pdo, $idTurma)
    {
        $sql = "SELECT DISTINCT id_aluno
                FROM matriculas
                WHERE id_turma = :turma";

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['turma' => $idTurma]);

        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    // ----- Dispositivos para push (celular/PC) -----

    public static function salvarAssinatura($pdo, $idUsuario, $endpoint, $chaveP256dh, $chaveAuth, $userAgent)
    {
        // Se o dispositivo já existe, apenas passa para o usuário logado agora.
        $sql = "INSERT INTO notificacoes_push
                    (id_usuario, endpoint, endpoint_hash, chave_p256dh, chave_auth, user_agent, criado_em)
                VALUES
                    (:usuario, :endpoint, :hash, :p256dh, :auth, :agente, NOW())
                ON DUPLICATE KEY UPDATE
                    id_usuario   = VALUES(id_usuario),
                    chave_p256dh = VALUES(chave_p256dh),
                    chave_auth   = VALUES(chave_auth),
                    user_agent   = VALUES(user_agent)";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'usuario'  => $idUsuario,
            'endpoint' => $endpoint,
            'hash'     => hash('sha256', $endpoint),
            'p256dh'   => $chaveP256dh,
            'auth'     => $chaveAuth,
            'agente'   => $userAgent
        ]);
    }

    public static function listarAssinaturas($pdo, $idsUsuarios)
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', (array) $idsUsuarios))));

        if (empty($ids)) {
            return [];
        }

        $marcadores = implode(',', array_fill(0, count($ids), '?'));

        $stmt = $pdo->prepare(
            "SELECT id_usuario, endpoint, chave_p256dh, chave_auth
             FROM notificacoes_push
             WHERE id_usuario IN ($marcadores)"
        );
        $stmt->execute($ids);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function removerAssinatura($pdo, $idUsuario, $endpoint)
    {
        $stmt = $pdo->prepare(
            "DELETE FROM notificacoes_push
             WHERE endpoint_hash = :hash
             AND id_usuario = :usuario"
        );

        return $stmt->execute([
            'hash'    => hash('sha256', $endpoint),
            'usuario' => $idUsuario
        ]);
    }

    public static function removerAssinaturaPorEndpoint($pdo, $endpoint)
    {
        $stmt = $pdo->prepare("DELETE FROM notificacoes_push WHERE endpoint_hash = :hash");

        return $stmt->execute(['hash' => hash('sha256', $endpoint)]);
    }

    // ----- Atalhos antigos (mantidos por compatibilidade) -----

    public static function notificarTurma($pdo, $idTurma, $titulo)
    {
        foreach (self::idsAlunosDaTurma($pdo, $idTurma) as $idAluno) {
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
