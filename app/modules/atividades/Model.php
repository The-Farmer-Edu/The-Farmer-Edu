<?php

require_once __DIR__ . '/../../core/database.php';

class TipoAtividade
{
    public const CODIGO = 'codigo';
    public const TEXTO  = 'texto';
    public const QUIZ   = 'quiz';

    public const tipos        = [self::CODIGO, self::TEXTO, self::QUIZ];
    public const linguagens   = ['php', 'javascript', 'python', 'java', 'c', 'cpp', 'sql'];
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
    public array $criterios = [];

    public function __construct(
        int $idTurma,
        string $titulo,
        string $descricao,
        string $tipo,
        string $prazo,
        string $linguagem = '',
        string $respostaReferencia = '',
        array $alternativas = [],
        array $criterios = []
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
        $this->criterios   = self::limparCriterios($criterios);

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

        $criterios = json_decode((string) ($post['criterios'] ?? '[]'), true);
        if (!is_array($criterios)) {
            throw new InvalidArgumentException('Os critérios de avaliação são inválidos.');
        }

        return new self(
            (int) ($post['id_turma'] ?? 0),
            (string) ($post['titulo'] ?? ''),
            (string) ($post['descricao'] ?? ''),
            $tipo,
            (string) ($post['prazo'] ?? ''),
            (string) ($post['linguagem'] ?? ''),
            (string) $referencia,
            $alternativas,
            $criterios
        );
    }

    // Critérios de avaliação da IA: lista de textos, até 20, cada um com até 300 caracteres
    private static function limparCriterios(array $criterios): array
    {
        $limpos = [];
        foreach ($criterios as $criterio) {
            if (!is_string($criterio)) {
                continue;
            }
            $criterio = trim($criterio);
            if ($criterio === '') {
                continue;
            }
            if (mb_strlen($criterio) > 300) {
                throw new InvalidArgumentException('Cada critério pode ter no máximo 300 caracteres.');
            }
            $limpos[] = $criterio;
        }

        $limpos = array_values(array_unique($limpos));
        if (count($limpos) > 20) {
            throw new InvalidArgumentException('Defina no máximo 20 critérios de avaliação.');
        }
        return $limpos;
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

    // Chaves que o JSON de criterios_correcao pode ter. Como a tabela `atividades`
    // não tem coluna própria para elas, tudo fica dentro do JSON:
    // {"criterios": [...], "alternativas": {...}, "correta": "A", "resposta_referencia": "..."}
    private const chavesReservadas = ['criterios', 'alternativas', 'correta', 'resposta_referencia'];

    // Lê o JSON salvo no banco. Também entende o formato antigo dos seeds
    // ({"sintaxe": 30, ...}), transformando cada chave em um critério de texto.
    public static function lerCriterios(?string $json): array
    {
        $dados = json_decode((string) $json, true);
        if (!is_array($dados)) {
            $dados = [];
        }

        $criterios = [];
        if (isset($dados['criterios']) && is_array($dados['criterios'])) {
            foreach ($dados['criterios'] as $criterio) {
                if (is_string($criterio) && trim($criterio) !== '') {
                    $criterios[] = trim($criterio);
                }
            }
        } else {
            foreach ($dados as $chave => $valor) {
                if (is_numeric($valor) && !in_array($chave, self::chavesReservadas, true)) {
                    $criterios[] = ucfirst(str_replace('_', ' ', (string) $chave)) . " ($valor%)";
                }
            }
        }

        $dados['criterios'] = $criterios;
        return $dados;
    }

    private function criteriosCorrecao(?string $jsonAtual = null): string
    {
        $atual = self::lerCriterios($jsonAtual);
        $novo  = ['criterios' => $this->criterios];

        if ($this->tipo === TipoAtividade::QUIZ) {
            $novo['alternativas'] = $this->alternativas;
            $novo['correta']      = $this->respostaReferencia;
        } else {
            $referencia = $this->respostaReferencia ?? ($atual['resposta_referencia'] ?? null);
            if ($referencia !== null) {
                $novo['resposta_referencia'] = $referencia;
            }
        }

        return json_encode($novo, JSON_UNESCAPED_UNICODE);
    }

    // Grava a atividade e o gabarito juntos: se algo falhar, nada fica pela metade
    // (nem no banco, nem em disco).
    //   $uploads: arquivos enviados agora | $copiar: ids de arquivos de outra atividade
    //   (reutilização) | $remover: ids de arquivos desta atividade a apagar
    public function gravar(PDO $pdo, int $idInstrutor, ?int $id, array $uploads, array $copiar, array $remover): void
    {
        $gravados = [];
        $apagar   = [];

        $pdo->beginTransaction();
        try {
            if ($id === null) {
                $this->salvar($pdo, $idInstrutor);
            } else {
                $this->atualizar($pdo, $id, $idInstrutor);
            }

            $apagar = Gabarito::removerDaAtividade($pdo, (int) $this->id, $remover);
            Gabarito::copiar($pdo, $idInstrutor, (int) $this->id, $copiar, $gravados);
            Gabarito::guardar($pdo, (int) $this->id, $uploads, $gravados);
            Gabarito::exigirLimite($pdo, (int) $this->id);

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            foreach ($gravados as $caminho) {
                Gabarito::apagarArquivo($caminho);
            }
            throw $e;
        }

        foreach ($apagar as $caminho) {
            Gabarito::apagarArquivo($caminho);
        }
    }

    public function salvar(PDO $pdo, int $idInstrutor): void
    {
        self::exigirTurma($pdo, $this->idTurma, $idInstrutor);

        $stmt = $pdo->prepare(
            'INSERT INTO atividades
                (id_turma, titulo, descricao, tipo_atividade, linguagem, criterios_correcao, data_entrega)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $this->idTurma,
            $this->titulo,
            $this->descricao,
            $this->tipo,
            $this->linguagem,
            $this->criteriosCorrecao(),
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
        if ((int) $atual['turma_ativa'] !== 1) {
            throw new RuntimeException('Esta atividade é de uma turma arquivada. Restaure a turma para alterá-la.');
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
                    criterios_correcao = ?, data_entrega = ?
              WHERE id_atividade = ?'
        );
        $stmt->execute([
            $this->idTurma,
            $this->titulo,
            $this->descricao,
            $this->tipo,
            $this->linguagem,
            $this->criteriosCorrecao($atual['criterios_correcao']),
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
        if ((int) $atividade['turma_ativa'] !== 1) {
            throw new RuntimeException('Esta atividade é de uma turma arquivada. Restaure a turma para removê-la.');
        }
        if ((int) $atividade['total_submissoes'] > 0) {
            throw new RuntimeException('Esta atividade já recebeu submissões e não pode ser removida.');
        }

        $pdo->beginTransaction();
        try {
            $caminhos = Gabarito::removerTodosDaAtividade($pdo, $id);

            $stmt = $pdo->prepare('DELETE FROM atividades WHERE id_atividade = ?');
            $stmt->execute([$id]);

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        foreach ($caminhos as $caminho) {
            Gabarito::apagarArquivo($caminho);
        }
    }

    private static function exigirTurma(PDO $pdo, int $idTurma, int $idInstrutor): void
    {
        $stmt = $pdo->prepare('SELECT ativo FROM turmas WHERE id_turma = ? AND id_instrutor = ?');
        $stmt->execute([$idTurma, $idInstrutor]);
        $ativo = $stmt->fetchColumn();

        if ($ativo === false) {
            throw new RuntimeException('Você não é responsável por essa turma.');
        }
        if ((int) $ativo !== 1) {
            throw new RuntimeException('Esta turma está arquivada. Restaure-a em Turmas e Cursos para publicar atividades.');
        }
    }

    public static function buscarDoInstrutor(PDO $pdo, int $id, int $idInstrutor): ?array
    {
        $stmt = $pdo->prepare(
            'SELECT a.*, t.ativo AS turma_ativa,
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
            'SELECT t.id_turma, t.nome_turma, t.turno, c.nome_curso
               FROM turmas t
               JOIN cursos c ON c.id_curso = t.id_curso
              WHERE t.id_instrutor = ? AND t.ativo = 1
              ORDER BY c.nome_curso, t.nome_turma'
        );
        $stmt->execute([$idInstrutor]);

        return $stmt->fetchAll();
    }

    public static function pessoasDoInstrutor(PDO $pdo, int $idInstrutor): array
    {
        $stmt = $pdo->prepare(
            'SELECT t.id_turma, t.nome_turma, t.turno, t.ativo, c.nome_curso
               FROM turmas t
               JOIN cursos c ON c.id_curso = t.id_curso
              WHERE t.id_instrutor = ?
              ORDER BY t.ativo DESC, c.nome_curso, t.nome_turma'
        );
        $stmt->execute([$idInstrutor]);
        $turmas = $stmt->fetchAll();

        $stmt = $pdo->prepare(
            'SELECT m.id_turma, u.nome, u.email, u.ativo, a.matricula
               FROM matriculas m
               JOIN turmas t ON t.id_turma = m.id_turma
               JOIN alunos a ON a.id_usuario = m.id_aluno
               JOIN usuarios u ON u.id_usuario = a.id_usuario
              WHERE t.id_instrutor = ?
              ORDER BY u.nome'
        );
        $stmt->execute([$idInstrutor]);

        $alunosPorTurma = [];
        foreach ($stmt->fetchAll() as $aluno) {
            $alunosPorTurma[(int) $aluno['id_turma']][] = [
                'nome'      => $aluno['nome'],
                'email'     => $aluno['email'],
                'matricula' => $aluno['matricula'],
                'ativo'     => (int) $aluno['ativo'],
            ];
        }

        foreach ($turmas as &$turma) {
            $turma['ativo']  = (int) $turma['ativo'];
            $turma['alunos'] = $alunosPorTurma[(int) $turma['id_turma']] ?? [];
        }
        unset($turma);

        return $turmas;
    }

    public static function listarDoInstrutor(PDO $pdo, int $idInstrutor): array
    {
        $stmt = $pdo->prepare(
            'SELECT a.id_atividade, a.id_turma, a.titulo, a.descricao, a.tipo_atividade, a.linguagem,
                    a.criterios_correcao, a.data_entrega, a.criado_em,
                    t.nome_turma, t.ativo AS turma_ativa, c.nome_curso,
                    (SELECT COUNT(*) FROM submissoes s WHERE s.id_atividade = a.id_atividade) AS total_submissoes
               FROM atividades a
               JOIN turmas t ON t.id_turma = a.id_turma
               JOIN cursos c ON c.id_curso = t.id_curso
              WHERE t.id_instrutor = ?
              ORDER BY a.criado_em DESC, a.id_atividade DESC'
        );
        $stmt->execute([$idInstrutor]);
        $linhas = $stmt->fetchAll();

        $arquivos = Gabarito::listarPorAtividades($pdo, array_map(fn($l) => (int) $l['id_atividade'], $linhas));

        return array_map(function (array $linha) use ($arquivos): array {
            $dados = self::lerCriterios($linha['criterios_correcao']);
            $quiz  = $linha['tipo_atividade'] === TipoAtividade::QUIZ;

            $linha['criterios']    = $dados['criterios'];
            $linha['alternativas'] = $quiz ? ($dados['alternativas'] ?? []) : null;
            $linha['correta']      = $quiz ? ($dados['correta'] ?? null) : null;
            $linha['turma_ativa']  = (int) $linha['turma_ativa'];
            $linha['arquivos']     = $arquivos[(int) $linha['id_atividade']] ?? [];
            unset($linha['criterios_correcao']);

            return $linha;
        }, $linhas);
    }

    public static function cursosDoAluno(PDO $pdo, int $idAluno): array
    {
        $stmt = $pdo->prepare(
            'SELECT DISTINCT c.id_curso, c.nome_curso
               FROM matriculas m
               JOIN turmas t ON t.id_turma = m.id_turma
               JOIN cursos c ON c.id_curso = t.id_curso
              WHERE m.id_aluno = ? AND t.ativo = 1
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
              WHERE t.id_curso = ? AND t.ativo = 1
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

class Gabarito
{
    public const MAX_ARQUIVOS    = 5;
    public const TAMANHO_MAXIMO  = 5 * 1024 * 1024; // 5 MB por arquivo
    public const extensoes       = [
        'txt', 'md', 'pdf', 'doc', 'docx', 'odt', 'csv', 'json', 'xml', 'sql',
        'html', 'css', 'js', 'php', 'py', 'java', 'c', 'cpp', 'h',
    ];

    private const limiteNome = 45; // tamanho de arquivos.descricao_arquivo

    public static function configuracao(): array
    {
        return [
            'max_arquivos' => self::MAX_ARQUIVOS,
            'max_mb'       => self::TAMANHO_MAXIMO / 1024 / 1024,
            'extensoes'    => self::extensoes,
        ];
    }

    private static function pasta(): string
    {
        return dirname(__DIR__, 2) . '/storage/gabaritos';
    }

    public static function passouDoLimiteDoPost(): bool
    {
        return ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST'
            && empty($_POST)
            && empty($_FILES)
            && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0;
    }

    public static function ids($valor): array
    {
        $ids = array_map('intval', (array) $valor);
        $ids = array_filter($ids, fn($id) => $id > 0);

        return array_values(array_unique($ids));
    }

    public static function doUpload($arquivos): array
    {
        if (!is_array($arquivos) || !isset($arquivos['name'])) {
            return [];
        }

        $nomes = (array) $arquivos['name'];
        $lista = [];

        foreach ($nomes as $i => $nomeOriginal) {
            $erro = (array) $arquivos['error'];
            $erro = (int) ($erro[$i] ?? UPLOAD_ERR_NO_FILE);

            if ($erro === UPLOAD_ERR_NO_FILE) {
                continue;
            }

            $nomeOriginal = (string) $nomeOriginal;
            if ($erro === UPLOAD_ERR_INI_SIZE || $erro === UPLOAD_ERR_FORM_SIZE) {
                throw new InvalidArgumentException("O arquivo \"$nomeOriginal\" passou do tamanho máximo permitido.");
            }
            if ($erro !== UPLOAD_ERR_OK) {
                throw new RuntimeException("Não foi possível enviar o arquivo \"$nomeOriginal\".");
            }

            $tmp     = (string) ((array) $arquivos['tmp_name'])[$i];
            $tamanho = (int) ((array) $arquivos['size'])[$i];
            $ext     = strtolower(pathinfo($nomeOriginal, PATHINFO_EXTENSION));

            if (!is_uploaded_file($tmp)) {
                throw new RuntimeException("Envio inválido do arquivo \"$nomeOriginal\".");
            }
            if ($tamanho > self::TAMANHO_MAXIMO) {
                throw new InvalidArgumentException("O arquivo \"$nomeOriginal\" passou de " . (self::TAMANHO_MAXIMO / 1024 / 1024) . ' MB.');
            }
            if (!in_array($ext, self::extensoes, true)) {
                throw new InvalidArgumentException("O formato do arquivo \"$nomeOriginal\" não é aceito no gabarito.");
            }

            $lista[] = ['nome' => self::nomeCurto($nomeOriginal, $ext), 'tmp' => $tmp];
        }

        if (count($lista) > self::MAX_ARQUIVOS) {
            throw new InvalidArgumentException('Envie no máximo ' . self::MAX_ARQUIVOS . ' arquivos de gabarito por vez.');
        }

        return $lista;
    }

    private static function nomeCurto(string $nome, string $ext): string
    {
        $nome = preg_replace('/[\x00-\x1F\x7F\/\\\\]/u', '', basename(str_replace('\\', '/', $nome))) ?? '';
        $nome = trim($nome);

        if ($nome === '') {
            $nome = 'gabarito.' . $ext;
        }
        if (mb_strlen($nome) <= self::limiteNome) {
            return $nome;
        }

        $sufixo = '.' . $ext;
        $base   = mb_substr(pathinfo($nome, PATHINFO_FILENAME), 0, self::limiteNome - mb_strlen($sufixo));

        return $base . $sufixo;
    }

    public static function guardar(PDO $pdo, int $idAtividade, array $uploads, array &$gravados): void
    {
        foreach ($uploads as $upload) {
            $caminho = self::novoCaminho($idAtividade);

            if (!move_uploaded_file($upload['tmp'], self::pasta() . '/' . $caminho)) {
                throw new RuntimeException('Não foi possível salvar o arquivo "' . $upload['nome'] . '".');
            }
            $gravados[] = $caminho;

            self::registrar($pdo, $idAtividade, $upload['nome'], $caminho);
        }
    }

    public static function copiar(PDO $pdo, int $idInstrutor, int $idDestino, array $ids, array &$gravados): void
    {
        foreach ($ids as $id) {
            $origem   = self::buscarDoInstrutor($pdo, $id, $idInstrutor);
            $absoluto = $origem ? self::caminhoAbsoluto($origem['caminho']) : null;

            if ($absoluto === null) {
                continue;
            }

            $caminho = self::novoCaminho($idDestino);
            if (!copy($absoluto, self::pasta() . '/' . $caminho)) {
                throw new RuntimeException('Não foi possível copiar o arquivo "' . $origem['descricao_arquivo'] . '".');
            }
            $gravados[] = $caminho;

            self::registrar($pdo, $idDestino, $origem['descricao_arquivo'], $caminho);
        }
    }

    private static function novoCaminho(int $idAtividade): string
    {
        $pasta = self::pasta() . '/' . $idAtividade;
        if (!is_dir($pasta) && !mkdir($pasta, 0775, true) && !is_dir($pasta)) {
            throw new RuntimeException('Não foi possível criar a pasta de arquivos do gabarito.');
        }

        return $idAtividade . '/' . bin2hex(random_bytes(16));
    }

    private static function registrar(PDO $pdo, int $idAtividade, string $nome, string $caminho): void
    {
        $stmt = $pdo->prepare('INSERT INTO arquivos (id_atividade, descricao_arquivo, caminho) VALUES (?, ?, ?)');
        $stmt->execute([$idAtividade, $nome, $caminho]);
    }

    public static function exigirLimite(PDO $pdo, int $idAtividade): void
    {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM arquivos WHERE id_atividade = ?');
        $stmt->execute([$idAtividade]);

        if ((int) $stmt->fetchColumn() > self::MAX_ARQUIVOS) {
            throw new InvalidArgumentException('Cada atividade aceita no máximo ' . self::MAX_ARQUIVOS . ' arquivos de gabarito.');
        }
    }

    public static function removerDaAtividade(PDO $pdo, int $idAtividade, array $ids): array
    {
        $caminhos = [];

        foreach ($ids as $id) {
            $stmt = $pdo->prepare('SELECT caminho FROM arquivos WHERE id_arquivo = ? AND id_atividade = ?');
            $stmt->execute([$id, $idAtividade]);
            $caminho = $stmt->fetchColumn();

            if ($caminho === false) {
                continue;
            }

            $stmt = $pdo->prepare('DELETE FROM arquivos WHERE id_arquivo = ?');
            $stmt->execute([$id]);
            $caminhos[] = $caminho;
        }

        return $caminhos;
    }

    public static function removerTodosDaAtividade(PDO $pdo, int $idAtividade): array
    {
        $stmt = $pdo->prepare('SELECT caminho FROM arquivos WHERE id_atividade = ?');
        $stmt->execute([$idAtividade]);
        $caminhos = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $stmt = $pdo->prepare('DELETE FROM arquivos WHERE id_atividade = ?');
        $stmt->execute([$idAtividade]);

        return $caminhos;
    }

    public static function listarPorAtividades(PDO $pdo, array $idsAtividades): array
    {
        if (!$idsAtividades) {
            return [];
        }

        $marcas = implode(',', array_fill(0, count($idsAtividades), '?'));
        $stmt = $pdo->prepare(
            "SELECT id_arquivo, id_atividade, descricao_arquivo
               FROM arquivos
              WHERE id_atividade IN ($marcas)
              ORDER BY id_arquivo"
        );
        $stmt->execute(array_values($idsAtividades));

        $porAtividade = [];
        foreach ($stmt->fetchAll() as $arquivo) {
            $porAtividade[(int) $arquivo['id_atividade']][] = [
                'id_arquivo'        => (int) $arquivo['id_arquivo'],
                'descricao_arquivo' => $arquivo['descricao_arquivo'],
            ];
        }

        return $porAtividade;
    }

    public static function buscarDoInstrutor(PDO $pdo, int $idArquivo, int $idInstrutor): ?array
    {
        $stmt = $pdo->prepare(
            'SELECT ar.*
               FROM arquivos ar
               JOIN atividades a ON a.id_atividade = ar.id_atividade
               JOIN turmas t ON t.id_turma = a.id_turma
              WHERE ar.id_arquivo = ? AND t.id_instrutor = ?'
        );
        $stmt->execute([$idArquivo, $idInstrutor]);

        return $stmt->fetch() ?: null;
    }

    public static function caminhoAbsoluto(string $caminho): ?string
    {
        $base = realpath(self::pasta());
        if ($base === false) {
            return null;
        }

        $real = realpath($base . '/' . $caminho);
        if ($real === false || strpos($real, $base . DIRECTORY_SEPARATOR) !== 0 || !is_file($real)) {
            return null;
        }

        return $real;
    }

    public static function apagarArquivo(string $caminho): void
    {
        $absoluto = self::caminhoAbsoluto($caminho);
        if ($absoluto === null) {
            return;
        }

        @unlink($absoluto);
        @rmdir(dirname($absoluto));
    }
}

?>