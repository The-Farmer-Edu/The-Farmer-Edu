<?php

require_once __DIR__ . '/../../core/database.php';

class CursoModel
{
    // Instrutor: todos os cursos, com a quantidade de turmas de cada um
    public static function listar(): array
    {
        return iniciarPDO()->query(
            'SELECT c.*, COUNT(t.id_turma) AS total_turmas
             FROM cursos c
             LEFT JOIN turmas t ON t.id_curso = c.id_curso AND t.ativo = 1
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
             WHERE m.id_aluno = ? AND t.ativo = 1 ORDER BY c.nome_curso'
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

    // Já existe um curso com esse nome? ($ignorarId evita comparar o curso consigo mesmo ao editar)
    public static function nomeExiste(string $nome, int $ignorarId = 0): bool
    {
        $stmt = iniciarPDO()->prepare('SELECT 1 FROM cursos WHERE nome_curso = ? AND id_curso <> ?');
        $stmt->execute([$nome, $ignorarId]);
        return (bool) $stmt->fetchColumn();
    }

    public static function criar(string $nome, ?string $descricao): void
    {
        iniciarPDO()->prepare('INSERT INTO cursos (nome_curso, descricao) VALUES (?, ?)')
            ->execute([$nome, $descricao]);
    }

    public static function atualizar(int $id, string $nome, ?string $descricao): void
    {
        iniciarPDO()->prepare('UPDATE cursos SET nome_curso = ?, descricao = ? WHERE id_curso = ?')
            ->execute([$nome, $descricao, $id]);
    }

    // Quantas turmas (ativas ou arquivadas, de qualquer instrutor) o curso tem
    public static function totalTurmas(int $id): int
    {
        $stmt = iniciarPDO()->prepare('SELECT COUNT(*) FROM turmas WHERE id_curso = ?');
        $stmt->execute([$id]);
        return (int) $stmt->fetchColumn();
    }

    // Só exclui curso sem nenhuma turma (o banco também impede, via ON DELETE RESTRICT).
    // Devolve false se o curso tem turmas ou não existe.
    public static function excluir(int $id): bool
    {
        if (self::totalTurmas($id) > 0) {
            return false;
        }
        $stmt = iniciarPDO()->prepare('DELETE FROM cursos WHERE id_curso = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}

class TurmaModel
{
    public const TURNOS = ['manha' => 'Manhã', 'tarde' => 'Tarde', 'noite' => 'Noite'];

    // Turmas de um curso criadas pelo instrutor ($ativo = 1: ativas | 0: arquivadas)
    public static function listarDoCurso(int $idCurso, int $idInstrutor, int $ativo = 1): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT t.*, COUNT(m.id_matricula) AS total_alunos
             FROM turmas t
             LEFT JOIN matriculas m ON m.id_turma = t.id_turma
             WHERE t.id_curso = ? AND t.id_instrutor = ? AND t.ativo = ?
             GROUP BY t.id_turma
             ORDER BY t.nome_turma'
        );
        $stmt->execute([$idCurso, $idInstrutor, $ativo]);
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

    // Arquivar (ativo = 0) ou restaurar (ativo = 1) uma turma. Nada é apagado:
    // matrículas, atividades e histórico continuam no banco.
    public static function definirAtivo(int $idTurma, int $idInstrutor, int $ativo): void
    {
        iniciarPDO()->prepare('UPDATE turmas SET ativo = ? WHERE id_turma = ? AND id_instrutor = ?')
            ->execute([$ativo, $idTurma, $idInstrutor]);
    }

    // Alunos matriculados em uma turma
    public static function alunosDaTurma(int $idTurma): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT u.id_usuario, u.nome, u.email, u.ativo, a.matricula, m.data_matricula
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
            'SELECT t.id_turma, t.nome_turma, t.turno, t.ativo, t.id_curso, c.nome_curso,
                    u.nome AS nome_instrutor, m.data_matricula
             FROM matriculas m
             JOIN turmas t ON t.id_turma = m.id_turma
             JOIN cursos c ON c.id_curso = t.id_curso
             JOIN usuarios u ON u.id_usuario = t.id_instrutor
             WHERE m.id_aluno = ?
             ORDER BY t.ativo DESC, c.nome_curso, t.nome_turma'
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
    // Todos os alunos (ativos e desativados), com as turmas ativas em que estão matriculados
    public static function listar(): array
    {
        return iniciarPDO()->query(
            "SELECT u.id_usuario, u.nome, u.email, u.ativo, a.matricula, a.xp_total,
                    GROUP_CONCAT(CONCAT(c.nome_curso, ' - ', t.nome_turma)
                                 ORDER BY c.nome_curso, t.nome_turma SEPARATOR ', ') AS turmas
             FROM alunos a
             JOIN usuarios u ON u.id_usuario = a.id_usuario
             LEFT JOIN matriculas m ON m.id_aluno = a.id_usuario
             LEFT JOIN turmas t ON t.id_turma = m.id_turma AND t.ativo = 1
             LEFT JOIN cursos c ON c.id_curso = t.id_curso
             GROUP BY u.id_usuario, u.nome, u.email, u.ativo, a.matricula, a.xp_total
             ORDER BY u.nome"
        )->fetchAll();
    }

    // Alunos ativos que ainda NÃO estão na turma (candidatos à matrícula)
    public static function disponiveisParaTurma(int $idTurma): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT u.id_usuario, u.nome, u.email, a.matricula
             FROM alunos a
             JOIN usuarios u ON u.id_usuario = a.id_usuario
             WHERE u.ativo = 1
               AND a.id_usuario NOT IN (SELECT id_aluno FROM matriculas WHERE id_turma = ?)
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

class ContaModel
{
    public static function estaAtiva(int $idUsuario): bool
    {
        $stmt = iniciarPDO()->prepare('SELECT ativo FROM usuarios WHERE id_usuario = ?');
        $stmt->execute([$idUsuario]);
        return (int) $stmt->fetchColumn() === 1;
    }

    // Desativar (0) ou reativar (1) uma conta. A conta NUNCA é apagada.
    public static function definirAtivo(int $idUsuario, int $ativo): void
    {
        iniciarPDO()->prepare('UPDATE usuarios SET ativo = ? WHERE id_usuario = ?')
            ->execute([$ativo, $idUsuario]);
    }

    // Só altera alunos: o instrutor não consegue desativar outros instrutores por aqui
    public static function definirAtivoAluno(int $idAluno, int $ativo): bool
    {
        $stmt = iniciarPDO()->prepare(
            "UPDATE usuarios SET ativo = ? WHERE id_usuario = ? AND tipo_usuario = 'aluno'"
        );
        $stmt->execute([$ativo, $idAluno]);
        return $stmt->rowCount() > 0;
    }

    public static function senhaConfere(int $idUsuario, string $senha): bool
    {
        $stmt = iniciarPDO()->prepare('SELECT senha_hash FROM usuarios WHERE id_usuario = ?');
        $stmt->execute([$idUsuario]);
        $hash = $stmt->fetchColumn();
        return is_string($hash) && password_verify($senha, $hash);
    }
}
