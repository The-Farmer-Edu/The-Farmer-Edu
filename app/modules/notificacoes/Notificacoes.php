<?php

/**
 * API DE NOTIFICAÇÕES — para uso dos outros módulos (squads).
 *
 * Como usar (em qualquer controller/model do projeto):
 *
 *   require_once __DIR__ . '/../notificacoes/Notificacoes.php';   // ajuste o caminho
 *
 *   // 1 usuário
 *   Notificacoes::enviar($idAluno, Notificacoes::TIPO_NOTA_ATRIBUIDA, 'Sua atividade recebeu nota: Loops');
 *
 *   // atalho global equivalente
 *   notificar($idAluno, 'feedback_ia', 'O feedback da IA está disponível.');
 *
 *   // vários usuários de uma vez
 *   Notificacoes::enviarParaVarios([3, 7, 9], Notificacoes::TIPO_ATIVIDADE_PENDENTE, 'Nova atividade: Arrays');
 *
 *   // todos os alunos de uma turma
 *   Notificacoes::enviarParaTurma($idTurma, Notificacoes::TIPO_ATIVIDADE_PENDENTE, 'Nova atividade: Arrays');
 *
 * O que acontece ao enviar:
 *   1. a notificação é gravada no banco (aparece na tela do usuário em tempo real);
 *   2. um push é enviado para o celular e o PC do usuário (se ele ativou os alertas).
 *
 * Regras:
 *  - NUNCA lança exceção: se algo falhar, grava no error_log e devolve false/0,
 *    para uma falha de notificação não derrubar o fluxo principal do seu módulo.
 *  - Não depende de sessão: pode ser chamada por qualquer usuário/processo (ex.: cron).
 *  - Opções (último parâmetro, array):
 *      'pdo'              => $pdo   usa a sua conexão (ex.: dentro de uma transação)
 *      'evitar_duplicada' => true   não cria se já existir NÃO LIDA igual (mesmo usuário, tipo e mensagem)
 *      'push'             => false  grava na tela, mas não envia push
 *  - Tipo novo? Acrescente uma linha em tipos.php (título e status).
 */

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/NotificacoesPush.php';

if (!function_exists('iniciarPDO')) {
    require_once __DIR__ . '/../../core/database.php';
}

class Notificacoes
{
    const TIPO_ATIVIDADE_PENDENTE  = 'atividade_pendente';
    const TIPO_ATIVIDADE_ATRASADA  = 'atividade_atrasada';
    const TIPO_ATIVIDADE_ENTREGUE  = 'atividade_entregue';
    const TIPO_ATIVIDADE_PUBLICADA = 'atividade_publicada';
    const TIPO_NOTA_ATRIBUIDA      = 'nota_atribuida';
    const TIPO_FEEDBACK_IA         = 'feedback_ia';
    const TIPO_FAZENDA_ATACADA     = 'fazenda_atacada';

    // Se a coluna "mensagem" for TEXT, pode aumentar este limite.
    const MAX_MENSAGEM = 255;

    const FALHOU    = 0;
    const GRAVADA   = 1;
    const DUPLICADA = 2;

    /**
     * Envia uma notificação para um usuário.
     *
     * @return bool true se criou (ou se já existia e evitar_duplicada=true)
     */
    public static function enviar($idUsuario, $tipo, $mensagem, $opcoes = [])
    {
        try {
            $dados = self::validar($idUsuario, $tipo, $mensagem);

            if ($dados === null) {
                return false;
            }

            list($idUsuario, $tipo, $mensagem) = $dados;

            $pdo       = self::obterPdo($opcoes);
            $resultado = self::gravar($pdo, $idUsuario, $tipo, $mensagem, $opcoes);

            if ($resultado === self::GRAVADA && self::deveEnviarPush($opcoes)) {
                NotificacoesPush::enviarParaUsuarios($pdo, [$idUsuario], $tipo, $mensagem);
            }

            return $resultado !== self::FALHOU;

        } catch (Throwable $e) {
            error_log('[notificacoes] enviar falhou: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envia a mesma notificação para vários usuários.
     *
     * @return int quantidade de usuários notificados com sucesso
     */
    public static function enviarParaVarios($idsUsuarios, $tipo, $mensagem, $opcoes = [])
    {
        try {
            if (!is_array($idsUsuarios)) {
                return 0;
            }

            $pdo      = self::obterPdo($opcoes);
            $gravadas = [];
            $total    = 0;
            $tipoFinal = $tipo;
            $mensagemFinal = $mensagem;

            foreach (array_unique(array_map('intval', $idsUsuarios)) as $id) {
                $dados = self::validar($id, $tipo, $mensagem);

                if ($dados === null) {
                    continue;
                }

                list($idUsuario, $tipoFinal, $mensagemFinal) = $dados;

                $resultado = self::gravar($pdo, $idUsuario, $tipoFinal, $mensagemFinal, $opcoes);

                if ($resultado === self::GRAVADA) {
                    $gravadas[] = $idUsuario;
                }

                if ($resultado !== self::FALHOU) {
                    $total++;
                }
            }

            // Um único envio de push para todos (mais rápido que um por usuário).
            if (!empty($gravadas) && self::deveEnviarPush($opcoes)) {
                NotificacoesPush::enviarParaUsuarios($pdo, $gravadas, $tipoFinal, $mensagemFinal);
            }

            return $total;

        } catch (Throwable $e) {
            error_log('[notificacoes] enviarParaVarios falhou: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Envia a mesma notificação para todos os alunos matriculados na turma.
     *
     * @return int quantidade de alunos notificados
     */
    public static function enviarParaTurma($idTurma, $tipo, $mensagem, $opcoes = [])
    {
        try {
            $pdo           = self::obterPdo($opcoes);
            $opcoes['pdo'] = $pdo;

            $ids = NotificacoesModel::idsAlunosDaTurma($pdo, (int) $idTurma);

            return self::enviarParaVarios($ids, $tipo, $mensagem, $opcoes);

        } catch (Throwable $e) {
            error_log('[notificacoes] enviarParaTurma falhou: ' . $e->getMessage());
            return 0;
        }
    }

    // ------------------------------------------------------------------

    private static function validar($idUsuario, $tipo, $mensagem)
    {
        $idUsuario = (int) $idUsuario;
        $tipo      = strtolower(trim((string) $tipo));
        $mensagem  = trim((string) $mensagem);

        if ($idUsuario <= 0 || $mensagem === '' || !preg_match('/^[a-z0-9_]{1,50}$/', $tipo)) {
            error_log('[notificacoes] dados inválidos: usuario=' . $idUsuario . ' tipo=' . $tipo);
            return null;
        }

        return [$idUsuario, $tipo, self::limitar($mensagem)];
    }

    private static function gravar($pdo, $idUsuario, $tipo, $mensagem, $opcoes)
    {
        if (!empty($opcoes['evitar_duplicada'])
            && NotificacoesModel::existeNaoLida($pdo, $idUsuario, $tipo, $mensagem)) {
            return self::DUPLICADA;
        }

        return NotificacoesModel::criar($pdo, $idUsuario, $tipo, $mensagem)
            ? self::GRAVADA
            : self::FALHOU;
    }

    private static function deveEnviarPush($opcoes)
    {
        return !(is_array($opcoes) && array_key_exists('push', $opcoes) && $opcoes['push'] === false);
    }

    private static function obterPdo($opcoes)
    {
        if (is_array($opcoes) && isset($opcoes['pdo']) && $opcoes['pdo'] instanceof PDO) {
            return $opcoes['pdo'];
        }

        return iniciarPDO();
    }

    private static function limitar($texto)
    {
        $max = self::MAX_MENSAGEM;

        if (function_exists('mb_strlen')) {
            if (mb_strlen($texto, 'UTF-8') > $max) {
                $texto = mb_substr($texto, 0, $max - 1, 'UTF-8') . '…';
            }
        } elseif (strlen($texto) > $max) {
            $texto = substr($texto, 0, $max - 1);
        }

        return $texto;
    }
}

if (!function_exists('notificar')) {
    /** Atalho global: notificar($idUsuario, $tipo, $mensagem [, $opcoes]) */
    function notificar($idUsuario, $tipo, $mensagem, $opcoes = [])
    {
        return Notificacoes::enviar($idUsuario, $tipo, $mensagem, $opcoes);
    }
}
