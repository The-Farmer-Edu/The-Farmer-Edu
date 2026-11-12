<?php
/**
 * Modelo do módulo de submissões.
 *
 * Este arquivo encapsula todas as operações de persistência relacionadas a
 * atividades e entregas. Ele trabalha com a tabela de atividades, matrículas,
 * submissoes, feedback_ia e notas.
 *
 * O objetivo principal é garantir que cada entrega do aluno tenha seu próprio
 * histórico de tentativas e que a avaliação da IA e a nota final possam ser
 * registradas corretamente no banco.
 */

require_once __DIR__ . '/../../core/database.php';

class SubmissoesModel
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? iniciarPDO();
    }

    /**
     * Busca uma atividade pelo identificador.
     *
     * Retorna todos os dados principais da tarefa para que a view tenha acesso
     * ao título, descrição, linguagem, critérios e prazo de entrega.
     */
    public function buscarAtividade(int $idAtividade): ?array
    {
        $st = $this->pdo->prepare(
            'SELECT id_atividade, id_turma, titulo, descricao, tipo_atividade, linguagem,
                    resposta_referencia, criterios_correcao, data_entrega
               FROM atividades WHERE id_atividade = ?'
        );
        $st->execute([$idAtividade]);
        return $st->fetch() ?: null;
    }

    /**
     * Verifica se o aluno está realmente matriculado na turma da atividade.
     *
     * Essa validação garante que o aluno só possa entregar trabalhos vinculados
     * à turma em que está cadastrado.
     */
    public function alunoMatriculado(int $idAluno, int $idTurma): bool
    {
        $st = $this->pdo->prepare('SELECT 1 FROM matriculas WHERE id_aluno = ? AND id_turma = ? LIMIT 1');
        $st->execute([$idAluno, $idTurma]);
        return (bool) $st->fetchColumn();
    }

    /**
     * Cria uma nova tentativa de entrega.
     *
     * O sistema calcula a próxima tentativa com base no maior número já usado
     * para a mesma atividade e aluno. Isso permite manter o histórico de
     * entregas e não sobrescrever a submissão anterior.
     */
    public function criarSubmissao(int $idAtividade, int $idAluno, string $conteudo): array
    {
        $this->pdo->beginTransaction();
        try {
            $st = $this->pdo->prepare(
                'SELECT COALESCE(MAX(tentativa_num), 0) + 1 FROM submissoes
                  WHERE id_atividade = ? AND id_aluno = ? FOR UPDATE'
            );
            $st->execute([$idAtividade, $idAluno]);
            $tentativa = (int) $st->fetchColumn();

            $st = $this->pdo->prepare(
                "INSERT INTO submissoes (id_atividade, id_aluno, conteudo_resposta, tentativa_num, status)
                 VALUES (?, ?, ?, ?, 'processando')"
            );
            $st->execute([$idAtividade, $idAluno, $conteudo, $tentativa]);
            $id = (int) $this->pdo->lastInsertId();

            $this->pdo->commit();
            return ['id_submissao' => $id, 'tentativa' => $tentativa];
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Atualiza o status final da entrega e o resultado da execução.
     *
     * Essa etapa é usada quando uma submissão sai da fila de processamento e
     * recebe a resposta do avaliador: aprovado, reprovado, erro de compilação,
     * etc.
     */
    public function atualizarResultado(int $idSubmissao, string $status, ?string $resultadoExecucao): void
    {
        $st = $this->pdo->prepare('UPDATE submissoes SET status = ?, resultado_execucao = ? WHERE id_submissao = ?');
        $st->execute([$status, $resultadoExecucao, $idSubmissao]);
    }

    /**
     * Salva o feedback gerado pela IA sobre a entrega.
     *
     * A tabela feedback_ia armazena os pontos positivos, pontos negativos e a
     * sugestão geral. Em caso de repetição da mesma submissão, o comando usa
     * ON DUPLICATE KEY UPDATE para manter um único registro por entrega.
     */
    public function salvarFeedback(int $idSubmissao, string $positivos, string $negativos, string $geral): void
    {
        $st = $this->pdo->prepare(
            'INSERT INTO feedback_ia (id_submissao, pontos_positivos, pontos_negativos, sugestao_resposta)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE pontos_positivos = VALUES(pontos_positivos),
                                     pontos_negativos = VALUES(pontos_negativos),
                                     sugestao_resposta = VALUES(sugestao_resposta)'
        );
        $st->execute([$idSubmissao, $positivos, $negativos, $geral]);
    }

    /**
     * Salva a nota sugerida pela IA para a submissão.
     *
     * A nota é limitada entre 0 e 10 para manter consistência do sistema.
     * Posteriormente, o instrutor pode sobrescrever esse valor com uma nota
     * manual caso seja necessário.
     */
    public function salvarNotaIA(int $idSubmissao, float $valor): void
    {
        $valor = max(0.0, min(10.0, $valor));
        $st = $this->pdo->prepare(
            "INSERT INTO notas (id_submissao, valor, origem) VALUES (?, ?, 'ia')
             ON DUPLICATE KEY UPDATE valor = VALUES(valor)"
        );
        $st->execute([$idSubmissao, $valor]);
    }
}
