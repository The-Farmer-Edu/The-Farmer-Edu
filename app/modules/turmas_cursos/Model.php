<?php

require_once __DIR__ . '/../../core/database.php';

class CursoModel
{
    // Cursos de teste, usados só enquanto a tabela `cursos` estiver vazia.
    // Para remover: apague este array e a chamada garantirCursosDeTeste() no Controller.
    private const CURSOS_DE_TESTE = [
        ['PHP',    'Fundamentos de PHP: sintaxe, orientação a objetos e desenvolvimento web.'],
        ['MySQL',  'Modelagem de dados, SQL e administração de bancos MySQL.'],
        ['Python', 'Lógica de programação e desenvolvimento com Python.'],
    ];

    // Se não existir nenhum curso no banco, cadastra PHP, MySQL e Python para visualização
    public static function garantirCursosDeTeste(): void
    {
        $pdo = iniciarPDO();
        if ((int) $pdo->query('SELECT COUNT(*) FROM cursos')->fetchColumn() > 0) {
            return;
        }
        $stmt = $pdo->prepare('INSERT INTO cursos (nome_curso, descricao) VALUES (?, ?)');
        foreach (self::CURSOS_DE_TESTE as [$nome, $descricao]) {
            $stmt->execute([$nome, $descricao]);
        }
    }

    // Instrutor: todos os cursos, com a quantidade de turmas de cada um
    public static function listar(): array
    {
        return iniciarPDO()->query(
            'SELECT c.*, COUNT(t.id_turma) AS total_turmas
             FROM cursos c
             LEFT JOIN turmas t ON t.id_curso = c.id_curso
             GROUP BY c.id_curso
             ORDER BY c.nome_curso'
        )->fetchAll();
    }

    // Aluno: só cursos de turmas em que está matriculado
    public static function listarDoAluno(int $idAluno): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT DISTINCT c.* FROM cursos c
             JOIN turmas t ON t.id_curso = c.id_curso
             JOIN matriculas m ON m.id_turma = t.id_turma
             WHERE m.id_aluno = ? ORDER BY c.nome_curso'
        );
        $stmt->execute([$idAluno]);
        return $stmt->fetchAll();
    }

    public static function buscar(int $id): ?array
    {
        $stmt = iniciarPDO()->prepare('SELECT * FROM cursos WHERE id_curso = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
}

class TurmaModel
{
    public const TURNOS = ['manha' => 'Manhã', 'tarde' => 'Tarde', 'noite' => 'Noite'];

    // Turmas de um curso criadas pelo instrutor
    public static function listarDoCurso(int $idCurso, int $idInstrutor): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT t.*, COUNT(m.id_matricula) AS total_alunos
             FROM turmas t
             LEFT JOIN matriculas m ON m.id_turma = t.id_turma
             WHERE t.id_curso = ? AND t.id_instrutor = ?
             GROUP BY t.id_turma
             ORDER BY t.nome_turma'
        );
        $stmt->execute([$idCurso, $idInstrutor]);
        return $stmt->fetchAll();
    }

    // Turma + dados do curso, só se pertencer ao instrutor informado (null caso contrário)
    public static function buscarDoInstrutor(int $idTurma, int $idInstrutor): ?array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT t.*, c.nome_curso
             FROM turmas t
             JOIN cursos c ON c.id_curso = t.id_curso
             WHERE t.id_turma = ? AND t.id_instrutor = ?'
        );
        $stmt->execute([$idTurma, $idInstrutor]);
        return $stmt->fetch() ?: null;
    }

    public static function criar(string $nome, string $turno, int $idCurso, int $idInstrutor): void
    {
        iniciarPDO()->prepare(
            'INSERT INTO turmas (nome_turma, turno, id_curso, id_instrutor) VALUES (?, ?, ?, ?)'
        )->execute([$nome, $turno, $idCurso, $idInstrutor]);
    }

    // Atualiza nome e turno (o curso e o instrutor não mudam)
    public static function atualizar(int $idTurma, int $idInstrutor, string $nome, string $turno): void
    {
        iniciarPDO()->prepare(
            'UPDATE turmas SET nome_turma = ?, turno = ? WHERE id_turma = ? AND id_instrutor = ?'
        )->execute([$nome, $turno, $idTurma, $idInstrutor]);
    }

    // As matrículas da turma somem junto (ON DELETE CASCADE).
    // Se a turma já tiver atividades, o banco recusa (RESTRICT) e a PDOException sobe para o Controller.
    public static function excluir(int $idTurma, int $idInstrutor): bool
    {
        $stmt = iniciarPDO()->prepare('DELETE FROM turmas WHERE id_turma = ? AND id_instrutor = ?');
        $stmt->execute([$idTurma, $idInstrutor]);
        return $stmt->rowCount() > 0;
    }

    // Alunos matriculados em uma turma
    public static function alunosDaTurma(int $idTurma): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT u.id_usuario, u.nome, u.email, a.matricula, m.data_matricula
             FROM matriculas m
             JOIN alunos a ON a.id_usuario = m.id_aluno
             JOIN usuarios u ON u.id_usuario = a.id_usuario
             WHERE m.id_turma = ?
             ORDER BY u.nome'
        );
        $stmt->execute([$idTurma]);
        return $stmt->fetchAll();
    }

    // Aluno: turmas em que está matriculado, com curso e instrutor
    public static function listarDoAluno(int $idAluno): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT t.id_turma, t.nome_turma, t.turno, t.id_curso, c.nome_curso,
                    u.nome AS nome_instrutor, m.data_matricula
             FROM matriculas m
             JOIN turmas t ON t.id_turma = m.id_turma
             JOIN cursos c ON c.id_curso = t.id_curso
             JOIN usuarios u ON u.id_usuario = t.id_instrutor
             WHERE m.id_aluno = ?
             ORDER BY c.nome_curso, t.nome_turma'
        );
        $stmt->execute([$idAluno]);
        return $stmt->fetchAll();
    }
}

class MatriculaModel
{
    // Matricula o aluno na turma. Devolve false se ele já estava matriculado.
    public static function matricular(int $idTurma, int $idAluno): bool
    {
        $pdo = iniciarPDO();
        $stmt = $pdo->prepare('SELECT 1 FROM matriculas WHERE id_turma = ? AND id_aluno = ?');
        $stmt->execute([$idTurma, $idAluno]);
        if ($stmt->fetchColumn()) {
            return false;
        }
        $pdo->prepare('INSERT INTO matriculas (id_turma, id_aluno) VALUES (?, ?)')
            ->execute([$idTurma, $idAluno]);
        return true;
    }

    public static function desmatricular(int $idTurma, int $idAluno): void
    {
        iniciarPDO()->prepare('DELETE FROM matriculas WHERE id_turma = ? AND id_aluno = ?')
            ->execute([$idTurma, $idAluno]);
    }
}

class AlunoModel
{
    // Todos os alunos cadastrados, com as turmas em que estão matriculados (se houver)
    public static function listar(): array
    {
        return iniciarPDO()->query(
            "SELECT u.id_usuario, u.nome, u.email, a.matricula, a.xp_total,
                    GROUP_CONCAT(CONCAT(c.nome_curso, ' - ', t.nome_turma)
                                 ORDER BY c.nome_curso, t.nome_turma SEPARATOR ', ') AS turmas
             FROM alunos a
             JOIN usuarios u ON u.id_usuario = a.id_usuario
             LEFT JOIN matriculas m ON m.id_aluno = a.id_usuario
             LEFT JOIN turmas t ON t.id_turma = m.id_turma
             LEFT JOIN cursos c ON c.id_curso = t.id_curso
             GROUP BY u.id_usuario, u.nome, u.email, a.matricula, a.xp_total
             ORDER BY u.nome"
        )->fetchAll();
    }

    // Alunos que ainda NÃO estão na turma (candidatos à matrícula)
    public static function disponiveisParaTurma(int $idTurma): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT u.id_usuario, u.nome, u.email, a.matricula
             FROM alunos a
             JOIN usuarios u ON u.id_usuario = a.id_usuario
             WHERE a.id_usuario NOT IN (SELECT id_aluno FROM matriculas WHERE id_turma = ?)
             ORDER BY u.nome'
        );
        $stmt->execute([$idTurma]);
        return $stmt->fetchAll();
    }

    public static function existe(int $idAluno): bool
    {
        $stmt = iniciarPDO()->prepare('SELECT 1 FROM alunos WHERE id_usuario = ?');
        $stmt->execute([$idAluno]);
        return (bool) $stmt->fetchColumn();
    }
}
