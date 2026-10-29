<?php

require_once __DIR__ . '/../../core/database.php';

class SubmissoesModel
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? iniciarPDO();
    }

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

    // #22 — só aluno matriculado na turma da atividade
    public function alunoMatriculado(int $idAluno, int $idTurma): bool
    {
        $st = $this->pdo->prepare('SELECT 1 FROM matriculas WHERE id_aluno = ? AND id_turma = ? LIMIT 1');
        $st->execute([$idAluno, $idTurma]);
        return (bool) $st->fetchColumn();
    }

    // #20 / #24 — cada envio vira uma nova tentativa (histórico)
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

    public function atualizarResultado(int $idSubmissao, string $status, ?string $resultadoExecucao): void
    {
        $st = $this->pdo->prepare('UPDATE submissoes SET status = ?, resultado_execucao = ? WHERE id_submissao = ?');
        $st->execute([$status, $resultadoExecucao, $idSubmissao]);
    }

    // #25 — a coluna sugestao_resposta guarda o feedback_geral da IA
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

    // nota sugerida pela IA (origem 'ia'); o instrutor sobrescreve depois
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
