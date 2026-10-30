<?php

require_once __DIR__ . '/../../core/database.php';

// =====================================================================
// NotasModel — responsável por toda consulta ao banco relacionada a notas
// =====================================================================

class NotasModel
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = iniciarPDO();
    }

    // -----------------------------------------------------------------
    // VISÃO DO ALUNO
    // -----------------------------------------------------------------

    /**
     * Retorna todas as atividades de um aluno com status e nota (se houver).
     */
    public function buscarNotasDoAluno(int $idAluno): array
    {
        $sql = "
            SELECT
                a.id_atividade,
                a.titulo,
                a.data_entrega,
                a.tipo_atividade,
                t.nome_turma,
                c.nome_curso,
                s.id_submissao,
                s.status          AS status_submissao,
                s.tentativa_num,
                n.valor           AS nota_valor,
                n.origem          AS origem_nota,
                n.data_atribuicao AS data_nota
            FROM atividades a
            INNER JOIN turmas t        ON t.id_turma = a.id_turma
            INNER JOIN cursos c        ON c.id_curso  = t.id_curso
            INNER JOIN matriculas m    ON m.id_turma  = t.id_turma
                                      AND m.id_aluno  = :idAluno
            LEFT JOIN submissoes s     ON s.id_atividade = a.id_atividade
                                      AND s.id_aluno     = :idAluno2
                                      AND s.tentativa_num = (
                                          SELECT MAX(s2.tentativa_num)
                                          FROM submissoes s2
                                          WHERE s2.id_atividade = a.id_atividade
                                            AND s2.id_aluno     = :idAluno3
                                      )
            LEFT JOIN notas n          ON n.id_submissao = s.id_submissao
            ORDER BY a.data_entrega ASC
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':idAluno' => $idAluno, ':idAluno2' => $idAluno, ':idAluno3' => $idAluno, ]);
        return $stmt->fetchAll();
    }

    /**
     * Calcula o resumo geral do aluno: media, total avaliado, pendentes.
     */
    public function calcularResumoAluno(int $idAluno): array
    {
        $sql = "
            SELECT
                COUNT(a.id_atividade)                          AS total_atividades,
                COUNT(n.id_nota)                               AS total_avaliadas,
                COALESCE(AVG(n.valor), 0)                      AS media_geral,
                SUM(CASE WHEN s.id_submissao IS NULL THEN 1 ELSE 0 END) AS pendentes
            FROM atividades a
            INNER JOIN turmas t     ON t.id_turma = a.id_turma
            INNER JOIN matriculas m ON m.id_turma = t.id_turma AND m.id_aluno = :idAluno
            LEFT  JOIN submissoes s ON s.id_atividade = a.id_atividade AND s.id_aluno = :idAluno2
                                   AND s.tentativa_num = (
                                       SELECT MAX(s2.tentativa_num)
                                       FROM submissoes s2
                                       WHERE s2.id_atividade = a.id_atividade
                                         AND s2.id_aluno = :idAluno3
                                   )
            LEFT  JOIN notas n      ON n.id_submissao = s.id_submissao
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':idAluno' => $idAluno, ':idAluno2' => $idAluno, ':idAluno3' => $idAluno, ]);
        return $stmt->fetch() ?: [];
    }

    // -----------------------------------------------------------------
    // VISÃO DO INSTRUTOR
    // -----------------------------------------------------------------

    /**
     * Retorna todas as turmas do instrutor.
     */
    public function buscarTurmasDoInstrutor(int $idInstrutor): array
    {
        $sql = "
            SELECT t.id_turma, t.nome_turma, t.turno, c.nome_curso
            FROM turmas t
            INNER JOIN cursos c ON c.id_curso = t.id_curso
            WHERE t.id_instrutor = :idInstrutor
            ORDER BY t.nome_turma ASC
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':idInstrutor' => $idInstrutor]);
        return $stmt->fetchAll();
    }

    /**
     * Retorna todas as submissoes de uma turma com nota (se houver).
     */
    public function buscarSubmissoesDaTurma(int $idTurma): array
    {
        $sql = "
            SELECT
                u.id_usuario      AS id_aluno,
                u.nome            AS nome_aluno,
                a.id_atividade,
                a.titulo          AS titulo_atividade,
                a.data_entrega,
                a.tipo_atividade,
                s.id_submissao,
                s.status          AS status_submissao,
                s.tentativa_num,
                s.data_envio,
                n.id_nota,
                n.valor           AS nota_valor,
                n.origem          AS origem_nota
            FROM atividades a
            INNER JOIN turmas t     ON t.id_turma  = a.id_turma
            INNER JOIN matriculas m ON m.id_turma  = t.id_turma
            INNER JOIN usuarios u   ON u.id_usuario = m.id_aluno
            LEFT JOIN submissoes s  ON s.id_atividade = a.id_atividade
                                   AND s.id_aluno     = m.id_aluno
                                   AND s.tentativa_num = (
                                       SELECT MAX(s2.tentativa_num)
                                       FROM submissoes s2
                                       WHERE s2.id_atividade = a.id_atividade
                                         AND s2.id_aluno     = m.id_aluno
                                   )
            LEFT JOIN notas n       ON n.id_submissao = s.id_submissao
            WHERE a.id_turma = :idTurma
            ORDER BY u.nome ASC, a.data_entrega ASC
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([':idTurma' => $idTurma]);
        return $stmt->fetchAll();
    }

    /**
     * Lanca ou atualiza uma nota para uma submissao.
     */
    public function salvarNota(int $idSubmissao, float $valor, int $idInstrutor): bool
    {
        $valor = max(0, min(10, $valor));

        $check = $this->pdo->prepare("SELECT id_nota FROM notas WHERE id_submissao = ?");
        $check->execute([$idSubmissao]);
        $nota = $check->fetch();

        if ($nota) {
            $stmt = $this->pdo->prepare("
                UPDATE notas
                SET valor = ?, origem = 'instrutor', id_instrutor_revisor = ?, data_atribuicao = NOW()
                WHERE id_submissao = ?
            ");
            $stmt->execute([$valor, $idInstrutor, $idSubmissao]);
        } else {
            $stmt = $this->pdo->prepare("
                INSERT INTO notas (id_submissao, valor, origem, id_instrutor_revisor)
                VALUES (?, ?, 'instrutor', ?)
            ");
            $stmt->execute([$idSubmissao, $valor, $idInstrutor]);
        }

        $upd = $this->pdo->prepare("UPDATE submissoes SET status = 'corrigida' WHERE id_submissao = ?");
        $upd->execute([$idSubmissao]);

        return true;
    }

    /**
     * Retorna detalhes de uma turma especifica (para breadcrumb).
     */
    public function buscarTurma(int $idTurma): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT t.id_turma, t.nome_turma, t.turno, c.nome_curso
            FROM turmas t INNER JOIN cursos c ON c.id_curso = t.id_curso
            WHERE t.id_turma = ?
        ");
        $stmt->execute([$idTurma]);
        return $stmt->fetch() ?: null;
    }
}
