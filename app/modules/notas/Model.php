<?php
/**
 * ============================================================================
 * MÓDULO NOTAS - MODEL (Model.php)
 * ============================================================================
 * Camada de modelo e acesso a dados (Data Access / Model).
 * Concentra todas as operações de banco de dados (PDO / Prepared Statements)
 * relacionadas a turmas, submissões de atividades, cálculo de médias e lançamento
 * de notas para alunos e instrutores.
 * ============================================================================
 */

// Importa a função de conexão PDO com o banco de dados
require_once __DIR__ . '/../../core/database.php';

// =====================================================================
// NotasModel — responsável por toda consulta ao banco relacionada a notas
// =====================================================================

class NotasModel
{
    /**
     * Conexão ativa com o banco de dados através de PDO.
     * @var PDO
     */
    private PDO $pdo;

    /**
     * Construtor da classe: inicializa o PDO chamando a função iniciarPDO().
     */
    public function __construct()
    {
        $this->pdo = iniciarPDO();
    }

    // -----------------------------------------------------------------
    // VISÃO DO ALUNO
    // -----------------------------------------------------------------

    /**
     * Retorna todas as atividades de um aluno com status e nota (se houver).
     *
     * Realiza junções entre as tabelas:
     * - atividades: dados da tarefa (título, prazo, tipo de atividade).
     * - turmas / cursos: identificação da disciplina e da turma matriculada.
     * - matriculas: assegura que apenas turmas em que o aluno está matriculado sejam retornadas.
     * - submissoes: localiza a última tentativa do aluno para cada atividade.
     * - notas: dados da nota atribuída (valor, origem como instrutor ou IA, data).
     *
     * @param int $idAluno Identificador do aluno
     * @return array Lista de atividades com submissões e notas correspondentes
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
     *
     * Retorna indicadores numéricos agregados:
     * - total_atividades: contagem geral de atividades de todas as turmas do aluno.
     * - total_avaliadas: quantas atividades já possuem nota atribuída.
     * - media_geral: média aritmética simples de todas as notas do aluno.
     * - pendentes: atividades que ainda não foram submetidas pelo aluno.
     *
     * @param int $idAluno Identificador do aluno
     * @return array Array associativo com as métricas consolidadas
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
     *
     * Consulta turmas vinculadas ao ID do instrutor, incluindo o nome do curso
     * associado e o turno (manhã, tarde, noite).
     *
     * @param int $idInstrutor Identificador do instrutor
     * @return array Lista de turmas ativas do instrutor
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
     *
     * Cruza atividades da turma com alunos matriculados, trazendo a submissão
     * mais recente e os dados da respectiva nota (se já corrigida).
     *
     * @param int $idTurma Identificador da turma
     * @return array Lista de submissões dos alunos da turma
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
     *
     * Processamento:
     * 1. Limita a nota rigorosamente no intervalo de 0 a 10 (max e min).
     * 2. Verifica se a submissão já possui nota salva.
     * 3. Caso exista, efetua UPDATE atualizando valor, revisor e timestamp.
     * 4. Caso não exista, efetua INSERT de um novo registro com origem 'instrutor'.
     * 5. Atualiza o status da submissão na tabela 'submissoes' para 'corrigida'.
     *
     * @param int $idSubmissao ID da submissão a ser avaliada
     * @param float $valor Nota atribuída
     * @param int $idInstrutor ID do instrutor avaliador
     * @return bool True em caso de sucesso
     */
    public function salvarNota(int $idSubmissao, float $valor, int $idInstrutor): bool
    {
        // Garante que o valor da nota esteja entre 0 e 10
        $valor = max(0, min(10, $valor));

        // Verifica existência prévia de nota para esta submissão
        $check = $this->pdo->prepare("SELECT id_nota FROM notas WHERE id_submissao = ?");
        $check->execute([$idSubmissao]);
        $nota = $check->fetch();

        if ($nota) {
            // Nota já existente: atualiza valor e data de atribuição
            $stmt = $this->pdo->prepare("
                UPDATE notas
                SET valor = ?, origem = 'instrutor', id_instrutor_revisor = ?, data_atribuicao = NOW()
                WHERE id_submissao = ?
            ");
            $stmt->execute([$valor, $idInstrutor, $idSubmissao]);
        } else {
            // Nova nota: insere registro com origem 'instrutor'
            $stmt = $this->pdo->prepare("
                INSERT INTO notas (id_submissao, valor, origem, id_instrutor_revisor)
                VALUES (?, ?, 'instrutor', ?)
            ");
            $stmt->execute([$idSubmissao, $valor, $idInstrutor]);
        }

        // Marca a submissão como corrigida
        $upd = $this->pdo->prepare("UPDATE submissoes SET status = 'corrigida' WHERE id_submissao = ?");
        $upd->execute([$idSubmissao]);

        return true;
    }

    /**
     * Retorna detalhes de uma turma especifica (para breadcrumb).
     *
     * @param int $idTurma Identificador da turma
     * @return array|null Dados cadastrais da turma ou null caso não exista
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