<?php

require_once __DIR__ . '/../../core/database.php';

class TipoAtividade
{
    public const CODIGO = 'codigo';
    public const TEXTO  = 'texto';
    public const QUIZ   = 'quiz';

    public const tipos        = [self::CODIGO, self::TEXTO, self::QUIZ];
    public const linguagens   = ['php', 'javascript', 'python', 'java', 'c', 'cpp'];
    public const alternativas = ['A', 'B', 'C'];

    private const limiteResposta = 50000;

    public static function formatoResposta(string $tipo): string
    {
        return match ($tipo) {
            self::CODIGO => 'código-fonte digitado na plataforma, na linguagem definida pelo instrutor.',
            self::TEXTO  => 'texto livre digitado na plataforma.',
            self::QUIZ   => 'uma única alternativa (A, B ou C).',
            default      => throw new InvalidArgumentException('Tipo de atividade inválido.'),
        };
    }

    public static function formatos(): array
    {
        $formatos = [];
        foreach (self::tipos as $tipo) {
            $formatos[$tipo] = self::formatoResposta($tipo);
        }
        return $formatos;
    }

    public static function validarResposta(string $tipo, string $resposta): ?string
    {
        $resposta = trim($resposta);

        if ($resposta === '') {
            return 'A resposta não pode ficar em branco.';
        }
        if (mb_strlen($resposta) > self::limiteResposta) {
            return 'A resposta passou do tamanho máximo permitido.';
        }
        if ($tipo === self::QUIZ && !in_array($resposta, self::alternativas, true)) {
            return 'Escolha uma das alternativas: A, B ou C.';
        }

        return null;
    }
}

class Atividade
{
    public ?int $id = null;
    public int $idTurma;
    public string $titulo;
    public string $descricao;
    public string $tipo;
    public string $dataEntrega;
    public ?string $linguagem = null;
    public ?string $respostaReferencia = null;
    public ?array $alternativas = null;

    public function __construct(
        int $idTurma,
        string $titulo,
        string $descricao,
        string $tipo,
        string $prazo,
        string $linguagem = '',
        string $respostaReferencia = '',
        array $alternativas = []
    ) {
        $titulo     = trim($titulo);
        $descricao  = trim($descricao);
        $referencia = trim($respostaReferencia);

        if ($idTurma <= 0) {
            throw new InvalidArgumentException('Selecione uma turma.');
        }
        if ($titulo === '') {
            throw new InvalidArgumentException('O título é obrigatório.');
        }
        if (mb_strlen($titulo) > 150) {
            throw new InvalidArgumentException('O título pode ter no máximo 150 caracteres.');
        }
        if ($descricao === '') {
            throw new InvalidArgumentException('O enunciado é obrigatório.');
        }
        if (!in_array($tipo, TipoAtividade::tipos, true)) {
            throw new InvalidArgumentException('Tipo de atividade inválido.');
        }

        $data = DateTime::createFromFormat('!Y-m-d', $prazo);
        if ($data === false || $data->format('Y-m-d') !== $prazo) {
            throw new InvalidArgumentException('Informe um prazo válido.');
        }

        $this->idTurma     = $idTurma;
        $this->titulo      = $titulo;
        $this->descricao   = $descricao;
        $this->tipo        = $tipo;
        $this->dataEntrega = $prazo . ' 23:59:59';
        $this->respostaReferencia = $referencia === '' ? null : $referencia;

        if ($tipo === TipoAtividade::CODIGO) {
            $linguagem = strtolower(trim($linguagem));
            if (!in_array($linguagem, TipoAtividade::linguagens, true)) {
                throw new InvalidArgumentException('Escolha uma linguagem da lista.');
            }
            $this->linguagem = $linguagem;
        }

        if ($tipo === TipoAtividade::QUIZ) {
            $this->alternativas = self::limparAlternativas($alternativas);

            $correta = strtoupper($referencia);
            if (!in_array($correta, TipoAtividade::alternativas, true)) {
                throw new InvalidArgumentException('Marque qual alternativa é a correta.');
            }
            $this->respostaReferencia = $correta;
        }
    }

    public static function doFormulario(array $post): self
    {
        $tipo = (string) ($post['tipo'] ?? '');

        $alternativas = [];
        foreach (TipoAtividade::alternativas as $letra) {
            $alternativas[$letra] = (string) ($post['alternativa' . $letra] ?? '');
        }

        $referencia = $tipo === TipoAtividade::QUIZ
            ? ($post['correta'] ?? '')
            : ($post['resposta_referencia'] ?? '');

        return new self(
            (int) ($post['id_turma'] ?? 0),
            (string) ($post['titulo'] ?? ''),
            (string) ($post['descricao'] ?? ''),
            $tipo,
            (string) ($post['prazo'] ?? ''),
            (string) ($post['linguagem'] ?? ''),
            (string) $referencia,
            $alternativas
        );
    }

    private static function limparAlternativas(array $alternativas): array
    {
        $limpas = [];
        foreach (TipoAtividade::alternativas as $letra) {
            $texto = trim($alternativas[$letra] ?? '');
            if ($texto === '') {
                throw new InvalidArgumentException("Preencha a alternativa $letra.");
            }
            $limpas[$letra] = $texto;
        }
        return $limpas;
    }

    private function criterios(): ?string
    {
        if ($this->alternativas === null) {
            return null;
        }
        return json_encode(['alternativas' => $this->alternativas], JSON_UNESCAPED_UNICODE);
    }

    public function salvar(PDO $pdo, int $idInstrutor): void
    {
        self::exigirTurma($pdo, $this->idTurma, $idInstrutor);

        $stmt = $pdo->prepare(
            'INSERT INTO atividades
                (id_turma, titulo, descricao, tipo_atividade, linguagem, resposta_referencia, criterios_correcao, data_entrega)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $this->idTurma,
            $this->titulo,
            $this->descricao,
            $this->tipo,
            $this->linguagem,
            $this->respostaReferencia,
            $this->criterios(),
            $this->dataEntrega,
        ]);

        $this->id = (int) $pdo->lastInsertId();
    }

    public function atualizar(PDO $pdo, int $id, int $idInstrutor): void
    {
        $atual = self::buscarDoInstrutor($pdo, $id, $idInstrutor);
        if ($atual === null) {
            throw new RuntimeException('Atividade não encontrada.');
        }

        self::exigirTurma($pdo, $this->idTurma, $idInstrutor);

        $mudouTurmaOuTipo = (int) $atual['id_turma'] !== $this->idTurma
            || $atual['tipo_atividade'] !== $this->tipo;

        if ($mudouTurmaOuTipo && (int) $atual['total_submissoes'] > 0) {
            throw new RuntimeException('Esta atividade já tem submissões, então não dá para trocar a turma nem o tipo.');
        }

        $criterios = $this->criterios();
        if ($this->tipo !== TipoAtividade::QUIZ) {
            $criterios = $atual['tipo_atividade'] === TipoAtividade::QUIZ ? null : $atual['criterios_correcao'];
        }

        $stmt = $pdo->prepare(
            'UPDATE atividades
                SET id_turma = ?, titulo = ?, descricao = ?, tipo_atividade = ?, linguagem = ?,
                    resposta_referencia = ?, criterios_correcao = ?, data_entrega = ?
              WHERE id_atividade = ?'
        );
        $stmt->execute([
            $this->idTurma,
            $this->titulo,
            $this->descricao,
            $this->tipo,
            $this->linguagem,
            $this->respostaReferencia,
            $criterios,
            $this->dataEntrega,
            $id,
        ]);

        $this->id = $id;
    }

    public static function remover(PDO $pdo, int $id, int $idInstrutor): void
    {
        $atividade = self::buscarDoInstrutor($pdo, $id, $idInstrutor);
        if ($atividade === null) {
            throw new RuntimeException('Atividade não encontrada.');
        }
        if ((int) $atividade['total_submissoes'] > 0) {
            throw new RuntimeException('Esta atividade já recebeu submissões e não pode ser removida.');
        }

        $stmt = $pdo->prepare('DELETE FROM atividades WHERE id_atividade = ?');
        $stmt->execute([$id]);
    }

    private static function exigirTurma(PDO $pdo, int $idTurma, int $idInstrutor): void
    {
        $stmt = $pdo->prepare('SELECT 1 FROM turmas WHERE id_turma = ? AND id_instrutor = ?');
        $stmt->execute([$idTurma, $idInstrutor]);

        if (!$stmt->fetchColumn()) {
            throw new RuntimeException('Você não é responsável por essa turma.');
        }
    }

    public static function buscarDoInstrutor(PDO $pdo, int $id, int $idInstrutor): ?array
    {
        $stmt = $pdo->prepare(
            'SELECT a.*,
                    (SELECT COUNT(*) FROM submissoes s WHERE s.id_atividade = a.id_atividade) AS total_submissoes
               FROM atividades a
               JOIN turmas t ON t.id_turma = a.id_turma
              WHERE a.id_atividade = ? AND t.id_instrutor = ?'
        );
        $stmt->execute([$id, $idInstrutor]);

        return $stmt->fetch() ?: null;
    }

    public static function turmasDoInstrutor(PDO $pdo, int $idInstrutor): array
    {
        $stmt = $pdo->prepare(
            'SELECT t.id_turma, t.nome_turma, c.nome_curso
               FROM turmas t
               JOIN cursos c ON c.id_curso = t.id_curso
              WHERE t.id_instrutor = ?
              ORDER BY c.nome_curso, t.nome_turma'
        );
        $stmt->execute([$idInstrutor]);

        return $stmt->fetchAll();
    }

    public static function listarDoInstrutor(PDO $pdo, int $idInstrutor): array
    {
        $stmt = $pdo->prepare(
            'SELECT a.id_atividade, a.id_turma, a.titulo, a.descricao, a.tipo_atividade, a.linguagem,
                    a.resposta_referencia, a.criterios_correcao, a.data_entrega, a.criado_em,
                    t.nome_turma, c.nome_curso,
                    (SELECT COUNT(*) FROM submissoes s WHERE s.id_atividade = a.id_atividade) AS total_submissoes
               FROM atividades a
               JOIN turmas t ON t.id_turma = a.id_turma
               JOIN cursos c ON c.id_curso = t.id_curso
              WHERE t.id_instrutor = ?
              ORDER BY a.criado_em DESC, a.id_atividade DESC'
        );
        $stmt->execute([$idInstrutor]);

        return array_map(function (array $linha): array {
            $criterios = json_decode((string) $linha['criterios_correcao'], true);

            $linha['alternativas'] = $linha['tipo_atividade'] === TipoAtividade::QUIZ
                ? ($criterios['alternativas'] ?? [])
                : null;
            unset($linha['criterios_correcao']);

            return $linha;
        }, $stmt->fetchAll());
    }

    public static function cursosDoAluno(PDO $pdo, int $idAluno): array
    {
        $stmt = $pdo->prepare(
            'SELECT DISTINCT c.id_curso, c.nome_curso
               FROM matriculas m
               JOIN turmas t ON t.id_turma = m.id_turma
               JOIN cursos c ON c.id_curso = t.id_curso
              WHERE m.id_aluno = ?
              ORDER BY c.nome_curso'
        );
        $stmt->execute([$idAluno]);

        return $stmt->fetchAll();
    }

    public static function atividadesDoAluno(PDO $pdo, int $idAluno, int $idCurso): array
    {
        $stmt = $pdo->prepare(
            'SELECT a.id_atividade, a.titulo, a.tipo_atividade, a.linguagem, a.data_entrega,
                    (a.data_entrega < NOW()) AS atrasada,
                    t.nome_turma,
                    s.id_submissao, s.tentativa_num, s.status, s.data_envio,
                    CASE WHEN n.origem = \'instrutor\' THEN n.valor END AS nota
               FROM atividades a
               JOIN turmas t ON t.id_turma = a.id_turma
               JOIN matriculas m ON m.id_turma = t.id_turma AND m.id_aluno = ?
               LEFT JOIN submissoes s ON s.id_atividade = a.id_atividade
                    AND s.id_aluno = ?
                    AND s.tentativa_num = (SELECT MAX(s2.tentativa_num)
                                             FROM submissoes s2
                                            WHERE s2.id_atividade = a.id_atividade AND s2.id_aluno = ?)
               LEFT JOIN notas n ON n.id_submissao = s.id_submissao
              WHERE t.id_curso = ?
              ORDER BY a.data_entrega ASC'
        );
        $stmt->execute([$idAluno, $idAluno, $idAluno, $idCurso]);

        $pendentes  = [];
        $realizadas = [];

        foreach ($stmt->fetchAll() as $linha) {
            if ($linha['id_submissao'] === null) {
                $pendentes[] = $linha;
            } else {
                $realizadas[] = $linha;
            }
        }

        usort($realizadas, fn($a, $b) => strcmp($b['data_envio'], $a['data_envio']));

        return ['pendentes' => $pendentes, 'realizadas' => $realizadas];
    }
}

?>


