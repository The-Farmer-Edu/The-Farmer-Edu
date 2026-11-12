<?php

/**
 * Modelo de dados da área de submissões.
 *
 * Centraliza as consultas relacionadas a atividades, matrícula e criação de tentativas.
 * A ideia é manter o fluxo de avaliação em um ponto único, com regras de integridade
 * e garantia de que cada envio gere uma tentativa consistente.
 */
require_once __DIR__ . '/../../core/database.php';

class SubmissoesModel
{
    /**
     * Conexão PDO compartilhada pela aplicação.
     * Se nenhuma conexão for passada, usa a função global de inicialização do projeto.
     */
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? iniciarPDO();
    }

    /**
     * Busca a atividade pelo identificador.
     * Em outras palavras: antes de gerar a página de submissão, o sistema precisa saber
     * qual atividade foi escolhida e quais campos do banco devem ser exibidos ao aluno.
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
     * Valida se o aluno está realmente matriculado na turma da atividade.
     *
     * Regra de segurança: não basta só receber o id da atividade; o aluno precisa pertencer
     * ao contexto daquela turma para poder submeter resposta.
     */
    public function alunoMatriculado(int $idAluno, int $idTurma): bool
    {
        $st = $this->pdo->prepare('SELECT 1 FROM matriculas WHERE id_aluno = ? AND id_turma = ? LIMIT 1');
        $st->execute([$idAluno, $idTurma]);
        return (bool) $st->fetchColumn();
    }

    /**
     * Cria uma nova submissão e calcula a tentativa numérica correta.
     *
     * A lógica usa MAX(tentativa_num) + 1 para garantir que cada nova tentativa seja sequencial,
     * e o FOR UPDATE impede concorrência em situações em que dois envios acontecem ao mesmo tempo.
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
     * Atualiza o resultado final da submissão depois do processamento.
     * Isso permite manter um histórico de status e execução da resposta enviada.
     */
    public function atualizarResultado(int $idSubmissao, string $status, ?string $resultadoExecucao): void
    {
        $st = $this->pdo->prepare('UPDATE submissoes SET status = ?, resultado_execucao = ? WHERE id_submissao = ?');
        $st->execute([$status, $resultadoExecucao, $idSubmissao]);
    }
}
