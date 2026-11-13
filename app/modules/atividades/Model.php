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

class Criterios
{
    private const maxItens    = 20;
    private const maxTamanho  = 300;

    public static function ler(?string $json): array
    {
        $resultado = ['criterios' => [], 'alternativas' => null, 'correta' => null];

        $dados = json_decode((string) $json, true);
        if (!is_array($dados)) {
            return $resultado;
        }

        if ($dados === array_values($dados)) {
            $resultado['criterios'] = self::textos($dados);
            return $resultado;
        }

        $formatoAtual = array_key_exists('criterios', $dados)
            || array_key_exists('alternativas', $dados)
            || array_key_exists('correta', $dados);

        if (!$formatoAtual) {
            foreach ($dados as $nome => $peso) {
                $texto = ucfirst(str_replace('_', ' ', (string) $nome));
                if (is_numeric($peso)) {
                    $texto .= ' (peso ' . $peso . ')';
                }
                $resultado['criterios'][] = $texto;
            }
            return $resultado;
        }

        if (isset($dados['criterios']) && is_array($dados['criterios'])) {
            $resultado['criterios'] = self::textos($dados['criterios']);
        }

        if (isset($dados['alternativas']) && is_array($dados['alternativas'])) {
            $alternativas = [];
            foreach (TipoAtividade::alternativas as $letra) {
                $alternativas[$letra] = (string) ($dados['alternativas'][$letra] ?? '');
            }
            $resultado['alternativas'] = $alternativas;
        }

        if (isset($dados['correta'])) {
            $correta = strtoupper((string) $dados['correta']);
            if (in_array($correta, TipoAtividade::alternativas, true)) {
                $resultado['correta'] = $correta;
            }
        }

        return $resultado;
    }

    public static function limpar($bruto): array
    {
        $texto = is_string($bruto) ? trim($bruto) : '';
        if ($texto === '') {
            return [];
        }

        $lista = json_decode($texto, true);
        if (!is_array($lista) || $lista !== array_values($lista)) {
            throw new InvalidArgumentException('Os critérios de avaliação estão em um formato inválido.');
        }

        $limpos = [];
        foreach ($lista as $item) {
            if (!is_string($item)) {
                throw new InvalidArgumentException('Os critérios de avaliação estão em um formato inválido.');
            }

            $item = trim((string) preg_replace('/\s+/u', ' ', $item));
            if ($item === '') {
                continue;
            }
            if (mb_strlen($item) > self::maxTamanho) {
                throw new InvalidArgumentException('Cada critério de avaliação pode ter no máximo ' . self::maxTamanho . ' caracteres.');
            }
            $limpos[] = $item;
        }

        if (count($limpos) > self::maxItens) {
            throw new InvalidArgumentException('Use no máximo ' . self::maxItens . ' critérios de avaliação.');
        }

        return $limpos;
    }

    public static function montar(array $criterios, ?array $alternativas, ?string $correta): ?string
    {
        $dados = [];

        if ($criterios !== []) {
            $dados['criterios'] = array_values($criterios);
        }
        if ($alternativas !== null) {
            $dados['alternativas'] = $alternativas;
        }
        if ($correta !== null) {
            $dados['correta'] = $correta;
        }

        return $dados === [] ? null : json_encode($dados, JSON_UNESCAPED_UNICODE);
    }

    private static function textos(array $lista): array
    {
        $textos = [];
        foreach ($lista as $item) {
            if (is_string($item) && trim($item) !== '') {
                $textos[] = trim($item);
            }
        }
        return $textos;
    }
}

class Gabarito
{
    public const extensoes   = ['txt', 'md', 'json', 'csv', 'sql', 'php', 'js', 'py', 'java', 'c', 'cpp', 'html', 'css'];
    public const maxArquivos = 5;
    public const maxBytes    = 2097152;

    private const maxDescricao = 45;

    public static function config(): array
    {
        return [
            'extensoes'    => self::extensoes,
            'max_arquivos' => self::maxArquivos,
            'max_mb'       => intdiv(self::maxBytes, 1048576),
        ];
    }

    public static function passouDoLimiteDoPost(): bool
    {
        return ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST'
            && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0
            && empty($_POST)
            && empty($_FILES);
    }

    public static function ids($valores): array
    {
        if (!is_array($valores)) {
            return [];
        }

        $ids = [];
        foreach ($valores as $valor) {
            if (is_scalar($valor) && (int) $valor > 0) {
                $ids[(int) $valor] = (int) $valor;
            }
        }
        return array_values($ids);
    }

    public static function doUpload($entrada): array
    {
        if (!is_array($entrada) || !isset($entrada['name']) || !is_array($entrada['name'])) {
            return [];
        }

        $envios = [];

        foreach ($entrada['name'] as $posicao => $nomeOriginal) {
            $erro = (int) ($entrada['error'][$posicao] ?? UPLOAD_ERR_NO_FILE);
            if ($erro === UPLOAD_ERR_NO_FILE) {
                continue;
            }

            $nome = (string) $nomeOriginal;

            if ($erro === UPLOAD_ERR_INI_SIZE || $erro === UPLOAD_ERR_FORM_SIZE) {
                throw new InvalidArgumentException('O arquivo "' . $nome . '" passou do limite de tamanho.');
            }
            if ($erro !== UPLOAD_ERR_OK) {
                throw new RuntimeException('Não foi possível receber o arquivo "' . $nome . '".');
            }

            $temporario = (string) ($entrada['tmp_name'][$posicao] ?? '');
            if (!is_uploaded_file($temporario)) {
                throw new RuntimeException('Não foi possível receber o arquivo "' . $nome . '".');
            }

            $tamanho = (int) filesize($temporario);
            if ($tamanho <= 0) {
                throw new InvalidArgumentException('O arquivo "' . $nome . '" está vazio.');
            }
            if ($tamanho > self::maxBytes) {
                throw new InvalidArgumentException('O arquivo "' . $nome . '" passou de ' . intdiv(self::maxBytes, 1048576) . ' MB.');
            }

            $extensao = strtolower(pathinfo($nome, PATHINFO_EXTENSION));
            if (!in_array($extensao, self::extensoes, true)) {
                throw new InvalidArgumentException(
                    'O arquivo "' . $nome . '" não é de um tipo aceito (' . implode(', ', self::extensoes) . ').'
                );
            }

            $conteudo = file_get_contents($temporario);
            if ($conteudo === false || str_contains($conteudo, "\0") || !mb_check_encoding($conteudo, 'UTF-8')) {
                throw new InvalidArgumentException('O arquivo "' . $nome . '" precisa ser um texto salvo em UTF-8.');
            }

            $envios[] = [
                'temporario' => $temporario,
                'descricao'  => self::descricao($nome, $extensao),
                'extensao'   => $extensao,
            ];
        }

        return $envios;
    }

    private static function descricao(string $nome, string $extensao): string
    {
        $base = pathinfo($nome, PATHINFO_FILENAME);
        $base = str_replace(['\\', '/'], '_', $base);
        $base = trim((string) preg_replace('/[\x00-\x1F\x7F]+/u', '', $base));

        if ($base === '') {
            $base = 'gabarito';
        }

        $sufixo = '.' . $extensao;
        $limite = self::maxDescricao - mb_strlen($sufixo);
        if (mb_strlen($base) > $limite) {
            $base = mb_substr($base, 0, $limite);
        }

        return $base . $sufixo;
    }

    public static function pasta(): string
    {
        $storage = realpath(__DIR__ . '/../../../storage');
        if ($storage === false) {
            throw new RuntimeException('A pasta de armazenamento não existe no servidor.');
        }

        $pasta = $storage . DIRECTORY_SEPARATOR . 'gabaritos';
        if (!is_dir($pasta) && !@mkdir($pasta, 0775, true) && !is_dir($pasta)) {
            throw new RuntimeException('Não foi possível criar a pasta dos gabaritos.');
        }

        return (string) realpath($pasta);
    }

    public static function caminhoAbsoluto(string $caminho): ?string
    {
        $base    = self::pasta();
        $arquivo = realpath($base . DIRECTORY_SEPARATOR . $caminho);

        if ($arquivo === false || !str_starts_with($arquivo, $base . DIRECTORY_SEPARATOR) || !is_file($arquivo)) {
            return null;
        }

        return $arquivo;
    }

    public static function buscarDoInstrutor(PDO $pdo, int $idArquivo, int $idInstrutor): ?array
    {
        $stmt = $pdo->prepare(
            'SELECT ar.id_arquivo, ar.id_atividade, ar.descricao_arquivo, ar.caminho
               FROM arquivos ar
               JOIN atividades a ON a.id_atividade = ar.id_atividade
               JOIN turmas t ON t.id_turma = a.id_turma
              WHERE ar.id_arquivo = ? AND t.id_instrutor = ?'
        );
        $stmt->execute([$idArquivo, $idInstrutor]);

        return $stmt->fetch() ?: null;
    }

    public static function caminhosDaAtividade(PDO $pdo, int $idAtividade): array
    {
        $stmt = $pdo->prepare('SELECT caminho FROM arquivos WHERE id_atividade = ?');
        $stmt->execute([$idAtividade]);

        return self::existentes($stmt->fetchAll(PDO::FETCH_COLUMN));
    }

    public static function remover(PDO $pdo, int $idAtividade, array $ids): array
    {
        $caminhos = [];

        foreach ($ids as $idArquivo) {
            $busca = $pdo->prepare('SELECT caminho FROM arquivos WHERE id_arquivo = ? AND id_atividade = ?');
            $busca->execute([$idArquivo, $idAtividade]);
            $caminho = $busca->fetchColumn();

            if ($caminho === false) {
                continue;
            }

            $pdo->prepare('DELETE FROM arquivos WHERE id_arquivo = ?')->execute([$idArquivo]);
            $caminhos[] = (string) $caminho;
        }

        return self::existentes($caminhos);
    }

    public static function copiar(PDO $pdo, int $idAtividade, int $idInstrutor, array $ids, array &$criados): void
    {
        foreach ($ids as $idArquivo) {
            $origem = self::buscarDoInstrutor($pdo, $idArquivo, $idInstrutor);
            if ($origem === null) {
                throw new RuntimeException('Um dos gabaritos escolhidos para copiar não foi encontrado.');
            }

            $caminhoOrigem = self::caminhoAbsoluto($origem['caminho']);
            if ($caminhoOrigem === null) {
                throw new RuntimeException('O gabarito "' . $origem['descricao_arquivo'] . '" não está mais disponível no servidor.');
            }

            $nome    = self::nomeUnico(strtolower(pathinfo($origem['caminho'], PATHINFO_EXTENSION)));
            $destino = self::pasta() . DIRECTORY_SEPARATOR . $nome;

            if (!@copy($caminhoOrigem, $destino)) {
                throw new RuntimeException('Não foi possível copiar o gabarito "' . $origem['descricao_arquivo'] . '".');
            }
            $criados[] = $destino;

            self::inserir($pdo, $idAtividade, $origem['descricao_arquivo'], $nome);
        }
    }

    public static function guardar(PDO $pdo, int $idAtividade, array $envios, array &$criados): void
    {
        foreach ($envios as $envio) {
            $nome    = self::nomeUnico($envio['extensao']);
            $destino = self::pasta() . DIRECTORY_SEPARATOR . $nome;

            if (!move_uploaded_file($envio['temporario'], $destino)) {
                throw new RuntimeException('Não foi possível salvar o arquivo "' . $envio['descricao'] . '".');
            }
            @chmod($destino, 0644);
            $criados[] = $destino;

            self::inserir($pdo, $idAtividade, $envio['descricao'], $nome);
        }
    }

    public static function exigirLimite(PDO $pdo, int $idAtividade): void
    {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM arquivos WHERE id_atividade = ?');
        $stmt->execute([$idAtividade]);

        if ((int) $stmt->fetchColumn() > self::maxArquivos) {
            throw new InvalidArgumentException('Cada atividade aceita no máximo ' . self::maxArquivos . ' arquivos de gabarito.');
        }
    }

    public static function listarDasAtividades(PDO $pdo, array $idsAtividades): array
    {
        if ($idsAtividades === []) {
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

    private static function inserir(PDO $pdo, int $idAtividade, string $descricao, string $caminho): void
    {
        $pdo->prepare('INSERT INTO arquivos (id_atividade, descricao_arquivo, caminho) VALUES (?, ?, ?)')
            ->execute([$idAtividade, $descricao, $caminho]);
    }

    private static function nomeUnico(string $extensao): string
    {
        return bin2hex(random_bytes(16)) . '.' . $extensao;
    }

    private static function existentes(array $caminhos): array
    {
        $existentes = [];
        foreach ($caminhos as $caminho) {
            $absoluto = self::caminhoAbsoluto((string) $caminho);
            if ($absoluto !== null) {
                $existentes[] = $absoluto;
            }
        }
        return $existentes;
    }
}

class Atividade
{
    private const maxEnunciado   = 10000;
    private const maxAlternativa = 255;

    public ?int $id = null;
    public int $idTurma;
    public string $titulo;
    public string $descricao;
    public string $tipo;
    public string $prazo;
    public string $dataEntrega;
    public ?string $linguagem = null;
    public ?string $correta = null;
    public ?array $alternativas = null;
    public array $criterios = [];

    public function __construct(
        int $idTurma,
        string $titulo,
        string $descricao,
        string $tipo,
        string $prazo,
        string $linguagem = '',
        string $correta = '',
        array $alternativas = [],
        array $criterios = []
    ) {
        $titulo    = trim($titulo);
        $descricao = trim($descricao);

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
        if (mb_strlen($descricao) > self::maxEnunciado) {
            throw new InvalidArgumentException('O enunciado pode ter no máximo 10.000 caracteres.');
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
        $this->prazo       = $prazo;
        $this->dataEntrega = $prazo . ' 23:59:59';
        $this->criterios   = $criterios;

        if ($tipo === TipoAtividade::CODIGO) {
            $linguagem = strtolower(trim($linguagem));
            if (!in_array($linguagem, TipoAtividade::linguagens, true)) {
                throw new InvalidArgumentException('Escolha uma linguagem da lista.');
            }
            $this->linguagem = $linguagem;
        }

        if ($tipo === TipoAtividade::QUIZ) {
            $this->alternativas = self::limparAlternativas($alternativas);

            $correta = strtoupper(trim($correta));
            if (!in_array($correta, TipoAtividade::alternativas, true)) {
                throw new InvalidArgumentException('Marque qual alternativa é a correta.');
            }
            $this->correta = $correta;
        }
    }

    public static function doFormulario(array $post): self
    {
        $tipo = (string) ($post['tipo'] ?? '');

        $alternativas = [];
        foreach (TipoAtividade::alternativas as $letra) {
            $alternativas[$letra] = (string) ($post['alternativa' . $letra] ?? '');
        }

        return new self(
            (int) ($post['id_turma'] ?? 0),
            (string) ($post['titulo'] ?? ''),
            (string) ($post['descricao'] ?? ''),
            $tipo,
            (string) ($post['prazo'] ?? ''),
            (string) ($post['linguagem'] ?? ''),
            (string) ($post['correta'] ?? ''),
            $alternativas,
            Criterios::limpar($post['criterios'] ?? '')
        );
    }

    private static function limparAlternativas(array $alternativas): array
    {
        $limpas = [];
        foreach (TipoAtividade::alternativas as $letra) {
            $texto = trim((string) ($alternativas[$letra] ?? ''));
            if ($texto === '') {
                throw new InvalidArgumentException("Preencha a alternativa $letra.");
            }
            if (mb_strlen($texto) > self::maxAlternativa) {
                throw new InvalidArgumentException("A alternativa $letra pode ter no máximo " . self::maxAlternativa . ' caracteres.');
            }
            $limpas[$letra] = $texto;
        }
        return $limpas;
    }

    public function gravar(PDO $pdo, int $idInstrutor, ?int $id, array $uploads, array $copiar, array $remover): void
    {
        $criados = [];
        $apagar  = [];

        try {
            $pdo->beginTransaction();

            if ($id === null) {
                $this->inserir($pdo, $idInstrutor);
            } else {
                $this->atualizar($pdo, $id, $idInstrutor);
            }

            $apagar = Gabarito::remover($pdo, (int) $this->id, $remover);
            Gabarito::copiar($pdo, (int) $this->id, $idInstrutor, $copiar, $criados);
            Gabarito::guardar($pdo, (int) $this->id, $uploads, $criados);
            Gabarito::exigirLimite($pdo, (int) $this->id);

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            foreach ($criados as $arquivo) {
                @unlink($arquivo);
            }
            throw $e;
        }

        foreach ($apagar as $arquivo) {
            @unlink($arquivo);
        }
    }

    private function inserir(PDO $pdo, int $idInstrutor): void
    {
        self::exigirTurma($pdo, $this->idTurma, $idInstrutor);
        self::exigirPrazoFuturo($pdo, $this->prazo);

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
            Criterios::montar($this->criterios, $this->alternativas, $this->correta),
            $this->dataEntrega,
        ]);

        $this->id = (int) $pdo->lastInsertId();
    }

    private function atualizar(PDO $pdo, int $id, int $idInstrutor): void
    {
        $atual = self::buscarDoInstrutor($pdo, $id, $idInstrutor);
        if ($atual === null) {
            throw new RuntimeException('Atividade não encontrada.');
        }
        if ((int) $atual['turma_ativa'] !== 1) {
            throw new RuntimeException('A turma desta atividade está arquivada. Restaure a turma para editar a atividade.');
        }

        self::exigirTurma($pdo, $this->idTurma, $idInstrutor);

        $mudouTurmaOuTipo = (int) $atual['id_turma'] !== $this->idTurma
            || $atual['tipo_atividade'] !== $this->tipo;

        if ($mudouTurmaOuTipo && (int) $atual['total_submissoes'] > 0) {
            throw new RuntimeException('Esta atividade já tem submissões, então não dá para trocar a turma nem o tipo.');
        }

        if (substr((string) $atual['data_entrega'], 0, 10) !== $this->prazo) {
            self::exigirPrazoFuturo($pdo, $this->prazo);
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
            Criterios::montar($this->criterios, $this->alternativas, $this->correta),
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
            throw new RuntimeException('A turma desta atividade está arquivada. Restaure a turma para remover a atividade.');
        }
        if ((int) $atividade['total_submissoes'] > 0) {
            throw new RuntimeException('Esta atividade já recebeu submissões e não pode ser removida.');
        }

        $apagar = [];

        try {
            $pdo->beginTransaction();

            $apagar = Gabarito::caminhosDaAtividade($pdo, $id);
            $pdo->prepare('DELETE FROM arquivos WHERE id_atividade = ?')->execute([$id]);
            $pdo->prepare('DELETE FROM atividades WHERE id_atividade = ?')->execute([$id]);

            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        foreach ($apagar as $arquivo) {
            @unlink($arquivo);
        }
    }

    /** A turma precisa ser do instrutor e estar ativa (turma e curso). */
    private static function exigirTurma(PDO $pdo, int $idTurma, int $idInstrutor): void
    {
        $stmt = $pdo->prepare(
            'SELECT t.ativo AS turma_ativa, c.ativo AS curso_ativo
               FROM turmas t
               JOIN cursos c ON c.id_curso = t.id_curso
              WHERE t.id_turma = ? AND t.id_instrutor = ?'
        );
        $stmt->execute([$idTurma, $idInstrutor]);
        $turma = $stmt->fetch();

        if (!$turma) {
            throw new RuntimeException('Você não é responsável por essa turma.');
        }
        if ((int) $turma['turma_ativa'] !== 1 || (int) $turma['curso_ativo'] !== 1) {
            throw new RuntimeException('Essa turma está arquivada. Restaure a turma para publicar atividades nela.');
        }
    }

    private static function exigirPrazoFuturo(PDO $pdo, string $prazo): void
    {
        $hoje = (string) $pdo->query('SELECT CURDATE()')->fetchColumn();

        if ($prazo < $hoje) {
            throw new InvalidArgumentException('O prazo não pode ser uma data que já passou.');
        }
    }

    public static function contaAtiva(PDO $pdo, int $idUsuario): bool
    {
        $stmt = $pdo->prepare('SELECT ativo FROM usuarios WHERE id_usuario = ?');
        $stmt->execute([$idUsuario]);

        return (int) $stmt->fetchColumn() === 1;
    }

    public static function buscarDoInstrutor(PDO $pdo, int $id, int $idInstrutor): ?array
    {
        $stmt = $pdo->prepare(
            'SELECT a.*,
                    (t.ativo = 1 AND c.ativo = 1) AS turma_ativa,
                    (SELECT COUNT(*) FROM submissoes s WHERE s.id_atividade = a.id_atividade) AS total_submissoes
               FROM atividades a
               JOIN turmas t ON t.id_turma = a.id_turma
               JOIN cursos c ON c.id_curso = t.id_curso
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
              WHERE t.id_instrutor = ? AND t.ativo = 1 AND c.ativo = 1
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

        if ($turmas === []) {
            return [];
        }

        $ids    = array_column($turmas, 'id_turma');
        $marcas = implode(',', array_fill(0, count($ids), '?'));

        $stmt = $pdo->prepare(
            "SELECT m.id_turma, u.id_usuario, u.nome, u.email, u.ativo, a.matricula
               FROM matriculas m
               JOIN alunos a ON a.id_usuario = m.id_aluno
               JOIN usuarios u ON u.id_usuario = a.id_usuario
              WHERE m.id_turma IN ($marcas)
              ORDER BY u.nome"
        );
        $stmt->execute($ids);

        $alunosPorTurma = [];
        foreach ($stmt->fetchAll() as $aluno) {
            $idTurma = (int) $aluno['id_turma'];
            unset($aluno['id_turma']);
            $alunosPorTurma[$idTurma][] = $aluno;
        }

        foreach ($turmas as &$turma) {
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
                    t.nome_turma, c.nome_curso,
                    (t.ativo = 1 AND c.ativo = 1) AS turma_ativa,
                    (SELECT COUNT(*) FROM submissoes s WHERE s.id_atividade = a.id_atividade) AS total_submissoes
               FROM atividades a
               JOIN turmas t ON t.id_turma = a.id_turma
               JOIN cursos c ON c.id_curso = t.id_curso
              WHERE t.id_instrutor = ?
              ORDER BY a.criado_em DESC, a.id_atividade DESC'
        );
        $stmt->execute([$idInstrutor]);
        $linhas = $stmt->fetchAll();

        $arquivos = Gabarito::listarDasAtividades($pdo, array_column($linhas, 'id_atividade'));

        return array_map(function (array $linha) use ($arquivos): array {
            $dados = Criterios::ler($linha['criterios_correcao']);
            unset($linha['criterios_correcao']);

            $linha['criterios']    = $dados['criterios'];
            $linha['alternativas'] = $linha['tipo_atividade'] === TipoAtividade::QUIZ ? $dados['alternativas'] : null;
            $linha['correta']      = $linha['tipo_atividade'] === TipoAtividade::QUIZ ? $dados['correta'] : null;
            $linha['arquivos']     = $arquivos[(int) $linha['id_atividade']] ?? [];

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
              WHERE m.id_aluno = ? AND t.ativo = 1 AND c.ativo = 1
              ORDER BY c.nome_curso'
        );
        $stmt->execute([$idAluno]);

        return $stmt->fetchAll();
    }

    public static function atividadesDoAluno(PDO $pdo, int $idAluno, int $idCurso): array
    {
        $stmt = $pdo->prepare(
            <<<'SQL'
            SELECT a.id_atividade, a.titulo, a.tipo_atividade, a.linguagem, a.data_entrega,
                   (a.data_entrega < NOW()) AS atrasada,
                   t.nome_turma,
                   s.id_submissao, s.tentativa_num, s.status, s.data_envio,
                   CASE WHEN n.origem = 'instrutor' THEN n.valor END AS nota
              FROM atividades a
              JOIN turmas t ON t.id_turma = a.id_turma
              JOIN cursos c ON c.id_curso = t.id_curso
              JOIN matriculas m ON m.id_turma = t.id_turma AND m.id_aluno = ?
              LEFT JOIN submissoes s ON s.id_atividade = a.id_atividade
                   AND s.id_aluno = ?
                   AND s.tentativa_num = (SELECT MAX(s2.tentativa_num)
                                            FROM submissoes s2
                                           WHERE s2.id_atividade = a.id_atividade AND s2.id_aluno = ?)
              LEFT JOIN notas n ON n.id_submissao = s.id_submissao
             WHERE t.id_curso = ? AND t.ativo = 1 AND c.ativo = 1
             ORDER BY a.data_entrega ASC
            SQL
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

        usort($realizadas, fn($a, $b) => strcmp((string) $b['data_envio'], (string) $a['data_envio']));

        return ['pendentes' => $pendentes, 'realizadas' => $realizadas];
    }

    public static function listarDaTurma(PDO $pdo, int $idTurma): array
    {
        $stmt = $pdo->prepare(
            'SELECT id_atividade, id_turma, titulo, tipo_atividade, linguagem, data_entrega, criado_em
               FROM atividades
              WHERE id_turma = ?
              ORDER BY criado_em DESC, id_atividade DESC'
        );
        $stmt->execute([$idTurma]);

        return $stmt->fetchAll();
    }

    public static function listarDaTurmaParaAluno(PDO $pdo, int $idTurma, int $idAluno): array
    {
        $stmt = $pdo->prepare(
            'SELECT a.id_atividade, a.id_turma, a.titulo, a.tipo_atividade, a.linguagem, a.data_entrega, a.criado_em,
                    EXISTS(SELECT 1 FROM submissoes s
                            WHERE s.id_atividade = a.id_atividade AND s.id_aluno = ?) AS enviada
               FROM atividades a
              WHERE a.id_turma = ?
              ORDER BY a.criado_em DESC, a.id_atividade DESC'
        );
        $stmt->execute([$idAluno, $idTurma]);

        return $stmt->fetchAll();
    }
}