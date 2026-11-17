<?php

require_once __DIR__ . '/../../core/database.php';

class CursoModel
{
    public static function listar(int $ativo = 1): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT c.*,
                    (SELECT COUNT(*) FROM turmas t
                     WHERE t.id_curso = c.id_curso AND t.ativo = 1) AS total_turmas,
                    (SELECT COUNT(*) FROM turmas t
                     WHERE t.id_curso = c.id_curso) AS total_turmas_vinculadas
             FROM cursos c
             WHERE c.ativo = ?
             ORDER BY c.nome_curso'
        );
        $stmt->execute([$ativo]);
        return $stmt->fetchAll();
    }

    public static function listarDoAluno(int $idAluno): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT c.*,
                    (SELECT COUNT(*) FROM turmas t
                     WHERE t.id_curso = c.id_curso AND t.ativo = 1
                       AND EXISTS (SELECT 1 FROM matriculas m
                                   WHERE m.id_turma = t.id_turma AND m.id_aluno = ?)) AS total_turmas
             FROM cursos c
             WHERE EXISTS (
                 SELECT 1 FROM turmas t
                 JOIN matriculas m ON m.id_turma = t.id_turma
                 WHERE t.id_curso = c.id_curso AND t.ativo = 1 AND m.id_aluno = ?
             )
             ORDER BY c.nome_curso'
        );
        $stmt->execute([$idAluno, $idAluno]);
        return $stmt->fetchAll();
    }

    public static function buscar(int $id): ?array
    {
        $stmt = iniciarPDO()->prepare('SELECT * FROM cursos WHERE id_curso = ?');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }

    public static function buscarDoAluno(int $idCurso, int $idAluno): ?array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT DISTINCT c.*
             FROM cursos c
             JOIN turmas t ON t.id_curso = c.id_curso AND t.ativo = 1
             JOIN matriculas m ON m.id_turma = t.id_turma
             WHERE c.id_curso = ? AND m.id_aluno = ?'
        );
        $stmt->execute([$idCurso, $idAluno]);
        return $stmt->fetch() ?: null;
    }

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

    public static function totalTurmas(int $id): int
    {
        $stmt = iniciarPDO()->prepare('SELECT COUNT(*) FROM turmas WHERE id_curso = ?');
        $stmt->execute([$id]);
        return (int) $stmt->fetchColumn();
    }

    public static function definirAtivo(int $id, int $ativo): bool
    {
        $stmt = iniciarPDO()->prepare('UPDATE cursos SET ativo = ? WHERE id_curso = ?');
        $stmt->execute([$ativo, $id]);
        return $stmt->rowCount() > 0;
    }

    public static function excluir(int $id): bool
    {
        // A chave estrangeira de turmas -> cursos usa RESTRICT. Mantemos
        // também esta validação explícita para preservar o histórico.
        if (self::totalTurmas($id) > 0) return false;
        $stmt = iniciarPDO()->prepare('DELETE FROM cursos WHERE id_curso = ?');
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}

class TurmaModel
{
    public const TURNOS = ['manha' => 'Manhã', 'tarde' => 'Tarde', 'noite' => 'Noite'];

    public static function listarDoCurso(int $idCurso, int $idInstrutor, int $ativo = 1): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT t.*,
                    (SELECT COUNT(*) FROM matriculas m WHERE m.id_turma = t.id_turma) AS total_alunos
             FROM turmas t
             WHERE t.id_curso = ? AND t.id_instrutor = ? AND t.ativo = ?
             ORDER BY t.nome_turma'
        );
        $stmt->execute([$idCurso, $idInstrutor, $ativo]);
        return $stmt->fetchAll();
    }

    public static function listarDoInstrutor(int $idInstrutor, int $ativo = 1): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT t.*, c.nome_curso,
                    (SELECT COUNT(*) FROM matriculas m WHERE m.id_turma = t.id_turma) AS total_alunos
             FROM turmas t
             JOIN cursos c ON c.id_curso = t.id_curso
             WHERE t.id_instrutor = ? AND t.ativo = ?
             ORDER BY c.nome_curso, t.nome_turma'
        );
        $stmt->execute([$idInstrutor, $ativo]);
        return $stmt->fetchAll();
    }

    public static function buscarDoInstrutor(int $idTurma, int $idInstrutor): ?array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT t.*, c.nome_curso, u.nome AS nome_instrutor
             FROM turmas t
             JOIN cursos c ON c.id_curso = t.id_curso
             JOIN usuarios u ON u.id_usuario = t.id_instrutor
             WHERE t.id_turma = ? AND t.id_instrutor = ?'
        );
        $stmt->execute([$idTurma, $idInstrutor]);
        return $stmt->fetch() ?: null;
    }

    public static function buscarDoAluno(int $idTurma, int $idAluno): ?array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT t.*, c.nome_curso, u.nome AS nome_instrutor
             FROM turmas t
             JOIN cursos c ON c.id_curso = t.id_curso
             JOIN usuarios u ON u.id_usuario = t.id_instrutor
             JOIN matriculas m ON m.id_turma = t.id_turma
             WHERE t.id_turma = ? AND m.id_aluno = ?'
        );
        $stmt->execute([$idTurma, $idAluno]);
        return $stmt->fetch() ?: null;
    }

    public static function listarDoAluno(int $idAluno): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT t.id_turma, t.nome_turma, t.turno, t.ativo, t.id_curso, t.image_turma,
                    c.nome_curso, u.nome AS nome_instrutor, m.data_matricula
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

    public static function listarDoAlunoPorCurso(int $idAluno, int $idCurso): array
    {
        $stmt = iniciarPDO()->prepare(
            'SELECT t.*, c.nome_curso, u.nome AS nome_instrutor
             FROM matriculas m
             JOIN turmas t ON t.id_turma = m.id_turma
             JOIN cursos c ON c.id_curso = t.id_curso
             JOIN usuarios u ON u.id_usuario = t.id_instrutor
             WHERE m.id_aluno = ? AND t.id_curso = ? AND t.ativo = 1
             ORDER BY t.nome_turma'
        );
        $stmt->execute([$idAluno, $idCurso]);
        return $stmt->fetchAll();
    }

    public static function criar(string $nome, string $turno, int $idCurso, int $idInstrutor, ?string $imagem = null): void
    {
        iniciarPDO()->prepare(
            'INSERT INTO turmas (nome_turma, turno, id_curso, id_instrutor, image_turma)
             VALUES (?, ?, ?, ?, ?)'
        )->execute([$nome, $turno, $idCurso, $idInstrutor, $imagem]);
    }

    public static function atualizar(int $idTurma, int $idInstrutor, string $nome, string $turno, ?string $imagem): bool
    {
        $pdo = iniciarPDO();
        $pdo->prepare(
            'UPDATE turmas SET nome_turma = ?, turno = ?, image_turma = ?
             WHERE id_turma = ? AND id_instrutor = ?'
        )->execute([$nome, $turno, $imagem, $idTurma, $idInstrutor]);

        // Confirma o estado persistido, inclusive quando o UPDATE não altera
        // linhas por os dados já serem iguais (rowCount() pode retornar zero).
        $verificar = $pdo->prepare(
            'SELECT image_turma FROM turmas WHERE id_turma = ? AND id_instrutor = ?'
        );
        $verificar->execute([$idTurma, $idInstrutor]);
        $imagemSalva = $verificar->fetchColumn();

        return $imagemSalva !== false && $imagemSalva === $imagem;
    }

    /** Informa se outro registro de turma ainda utiliza o mesmo arquivo. */
    public static function imagemEstaEmUso(string $nomeArquivo): bool
    {
        $stmt = iniciarPDO()->prepare('SELECT 1 FROM turmas WHERE image_turma = ? LIMIT 1');
        $stmt->execute([$nomeArquivo]);
        return (bool) $stmt->fetchColumn();
    }

    public static function definirAtivo(int $idTurma, int $idInstrutor, int $ativo): void
    {
        iniciarPDO()->prepare('UPDATE turmas SET ativo = ? WHERE id_turma = ? AND id_instrutor = ?')
            ->execute([$ativo, $idTurma, $idInstrutor]);
    }

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


}

class MatriculaModel
{
    public static function matricular(int $idTurma, int $idAluno): bool
    {
        $pdo = iniciarPDO();
        $stmt = $pdo->prepare('INSERT IGNORE INTO matriculas (id_turma, id_aluno) VALUES (?, ?)');
        $stmt->execute([$idTurma, $idAluno]);
        return $stmt->rowCount() > 0;
    }

    public static function desmatricular(int $idTurma, int $idAluno): void
    {
        iniciarPDO()->prepare('DELETE FROM matriculas WHERE id_turma = ? AND id_aluno = ?')
            ->execute([$idTurma, $idAluno]);
    }
}

class AlunoModel
{
    public static function listar(): array
    {
        return iniciarPDO()->query(
            "SELECT u.id_usuario, u.nome, u.email, u.ativo, a.matricula, a.xp_total,
                    (SELECT GROUP_CONCAT(CONCAT(c.nome_curso, ' - ', t.nome_turma)
                                         ORDER BY c.nome_curso, t.nome_turma SEPARATOR ', ')
                     FROM matriculas m
                     JOIN turmas t ON t.id_turma = m.id_turma AND t.ativo = 1
                     JOIN cursos c ON c.id_curso = t.id_curso
                     WHERE m.id_aluno = a.id_usuario) AS turmas
             FROM alunos a
             JOIN usuarios u ON u.id_usuario = a.id_usuario
             ORDER BY u.nome"
        )->fetchAll();
    }

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
        $stmt = iniciarPDO()->prepare("SELECT 1 FROM alunos a JOIN usuarios u ON u.id_usuario = a.id_usuario WHERE a.id_usuario = ? AND u.ativo = 1");
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

    public static function definirAtivo(int $idUsuario, int $ativo): void
    {
        iniciarPDO()->prepare('UPDATE usuarios SET ativo = ? WHERE id_usuario = ?')->execute([$ativo, $idUsuario]);
    }

    public static function definirAtivoAluno(int $idAluno, int $ativo): bool
    {
        $stmt = iniciarPDO()->prepare("UPDATE usuarios SET ativo = ? WHERE id_usuario = ? AND tipo_usuario = 'aluno'");
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
