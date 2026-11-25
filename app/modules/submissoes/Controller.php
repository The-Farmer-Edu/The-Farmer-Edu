<?php
require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/session.php';
// require_once __DIR__ . '../api/model/Ollama.php';
// require_once __DIR__ . '../feedback_ia/model.php';


/**
 * Controlador do módulo de submissões.
 *
 * Responsável por encapsular a regra de apresentação da página do aluno,
 * o fluxo de início da atividade e o envio seguro de assets internos
 * (CSS, JS e imagens) sem expor diretórios do sistema.
 */
class atividadesSub {

    // adicionado 24/11 ¬
    private const EXT_ANEXOS = ['pdf', 'png', 'jpg', 'jpeg', 'zip', 'txt', 'doc', 'docx'];
    private const MAX_ARQUIVOS = 5;
    private const MAX_BYTES = 10 * 1024 * 1024;
    private const PASTA_UPLOADS = __DIR__ . '/../../../storage/submissoes';
    // adicionado 24/11 ^

    /**
     * Permite apenas os tipos de asset que o front-end realmente usa.
     * Isso evita que qualquer arquivo do servidor seja servido por URL arbitrária.
     */
    private const TIPOS_ASSETS_PERMITIDOS = ['css', 'img', 'js'];

    /**
     * Mapa de extensões para MIME type.
     * O navegador usa esse valor para interpretar corretamente o conteúdo retornado.
     */
    private const MIME_TYPES = [
        'html' => 'text/html',
        'htm'  => 'text/html',
        'css'  => 'text/css',
        'js'   => 'application/javascript',
        'json' => 'application/json',
        'txt'  => 'text/plain',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif'  => 'image/gif',
        'webp' => 'image/webp',
        'svg'  => 'image/svg+xml',
        'ico'  => 'image/vnd.microsoft.icon',
    ];


    /**
     * Método que dispara o processamento da submissão.
     * No fluxo atual, ele apenas inclui o script PHP responsável por receber JSON e lidar
     * com a avaliação; a lógica real fica no AvaliadorController.
     */
    public function processarSubmisssao() {
        require_once __DIR__ . '/view/processar_submissao.php';
    }
    /**
     * Lê ?id= da URL e busca a atividade no banco.
     * Sem id válido ou sem registro, devolve null (a tela fica vazia e bloqueada).
     */
private function carregarAtividade(): ?array {
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) return null;

    try {
        if (isset($_GET['id_aluno'])) {
            solicitarPerfilDeAcesso('instrutor');

            // NOVO: validações do acesso do instrutor
            $idAlunoUrl = filter_var($_GET['id_aluno'], FILTER_VALIDATE_INT);
            if (!$idAlunoUrl || $idAlunoUrl < 1) return null;

            $model = new SubmissoesModel();
            $atividade = $model->buscarAtividade($id);
            if (!$atividade) return null;

            $idTurma = (int) $atividade['id_turma'];
            if (!$model->instrutorDaTurma($this->idUsuarioLogado(), $idTurma)) return null;
            if (!$model->alunoMatriculado($idAlunoUrl, $idTurma)) return null;

            $dados = $model->dadosParaView($id, $idAlunoUrl);
            if ($dados) $dados['modoInstrutor'] = true; // o JS usa isso para abrir somente leitura
            return $dados;
        } else {
            solicitarPerfilDeAcesso('aluno');
        }
        return (new SubmissoesModel())->dadosParaView($id, $this->idAlunoDaRequisicao());
    } catch (Throwable $e) {
        error_log('[submissoes] ' . $e->getMessage());
        return null;
    }
}

    // descobre o id do usuário logado, tentando as chaves de sessão mais comuns.
    // Se nenhuma existir, grava a sessão no log do PHP para descobrir o nome real da chave.
    private function idUsuarioLogado(): int
    {
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();

        $chaves = ['id_usuario', 'id', 'usuario_id', 'user_id', 'idUsuario'];
        foreach ($chaves as $chave) {
            if (isset($_SESSION[$chave]) && (int) $_SESSION[$chave] > 0) {
                return (int) $_SESSION[$chave];
            }
        }

        // Sessão guardando um array: $_SESSION['usuario']['id'] etc.
        foreach (['usuario', 'user'] as $grupo) {
            if (isset($_SESSION[$grupo]) && is_array($_SESSION[$grupo])) {
                foreach ($chaves as $chave) {
                    if (isset($_SESSION[$grupo][$chave]) && (int) $_SESSION[$grupo][$chave] > 0) {
                        return (int) $_SESSION[$grupo][$chave];
                    }
                }
            }
        }

        error_log('[submissoes] id do usuário não encontrado na sessão: ' . json_encode($_SESSION));
        return 0;
    }

    //  define de qual aluno carregar a submissão
    // (instrutor: id_aluno da URL | aluno: o próprio usuário logado)
    private function idAlunoDaRequisicao(): ?int
    {
        if (isset($_GET['id_aluno'])) {
            return filter_var($_GET['id_aluno'], FILTER_VALIDATE_INT) ?: null;
        }
        return $this->idUsuarioLogado() ?: null;
    }

    public function showaluno() {
        $dadosAtividade = $this->carregarAtividade();
        require_once __DIR__ . '/view/aluno.html';
    }

    public function showiniciarAtv() {
        $dadosAtividade = $this->carregarAtividade();
        require_once __DIR__ . '/view/iniciaratv.html';
    }

    /**
     * Serve arquivos estáticos internos da pasta view/assets.
     *
     * O front-end usa URLs do tipo:
     * file?type=js&file=main.js
     * submissoes/file?type=js&file=main.js
     *
     * Isso centraliza a entrega desses recursos e impede leitura de arquivos arbitrários.
     */
    public function sendFile(): void {
        $tipo = $_GET['type'] ?? '';
        $arquivo = basename($_GET['file'] ?? '');

        // 1) Valida que a extensão solicitada é permitida e que o nome do arquivo é real.
        if (!in_array($tipo, self::TIPOS_ASSETS_PERMITIDOS, true) || $arquivo === '') {
            http_response_code(404);
            return;
        }

        // 2) Monta o caminho físico do arquivo, sem permitir traversal de diretórios.
        $caminhoArquivo = __DIR__ . "/view/assets/$tipo/$arquivo";
        if (!is_file($caminhoArquivo)) {
            http_response_code(404);
            return;
        }

        // 3) Define cabeçalhos para o navegador interpretar corretamente o recurso.
        header('Content-Type: ' . $this->resolverMimeType($caminhoArquivo));
        header('X-Content-Type-Options: nosniff');
        header('Content-Length: ' . filesize($caminhoArquivo));
        readfile($caminhoArquivo);
    }

     /**
     * Resolve o MIME type de um arquivo pela extensão.
     * Extensões fora do mapa caem em application/octet-stream.
     */
    private function resolverMimeType(string $caminhoArquivo): string {
        $extensao = strtolower(pathinfo($caminhoArquivo, PATHINFO_EXTENSION));
        return self::MIME_TYPES[$extensao] ?? 'application/octet-stream';
    }

    // adicionado 24/11 ¬
    public function enviarAnexo(): void{
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        $idAluno = (int) ($_SESSION['id_usuario'] ?? 0); // ajuste para a chave real da sua sessão
        $idAtividade = filter_var($_POST['id_atividade'] ?? null, FILTER_VALIDATE_INT);
        if ($idAluno < 1 || !$idAtividade) {
            $this->responderJson(['sucesso' => false, 'erro' => 'Requisição inválida.'], 400);
        }

        $model = new SubmissoesModel();
        $atividade = $model->buscarAtividade($idAtividade);
        if (!$atividade || $atividade['tipo_atividade'] !== 'anexo') {
            $this->responderJson(['sucesso' => false, 'erro' => 'Atividade não aceita anexos.'], 404);
        }
        if (!$model->alunoMatriculado($idAluno, (int) $atividade['id_turma'])) {
            $this->responderJson(['sucesso' => false, 'erro' => 'Você não está matriculado nesta turma.'], 403);
        }
        $fuso = new DateTimeZone('America/Sao_Paulo');
        if (new DateTime($atividade['data_entrega'], $fuso) < new DateTime('now', $fuso)) {
            $this->responderJson(['sucesso' => false, 'erro' => 'O prazo de entrega acabou.'], 403);
        }

        $enviados = $_FILES['arquivos'] ?? null;
        if (!$enviados || !is_array($enviados['name'])) {
            $this->responderJson(['sucesso' => false, 'erro' => 'Nenhum arquivo enviado.'], 400);
        }
        $total = count($enviados['name']);
        if ($total < 1 || $total > self::MAX_ARQUIVOS) {
            $this->responderJson(['sucesso' => false, 'erro' => 'Envie de 1 a ' . self::MAX_ARQUIVOS . ' arquivos.'], 400);
        }

        $pasta = self::PASTA_UPLOADS . "/$idAtividade/$idAluno";
        if (!is_dir($pasta) && !mkdir($pasta, 0755, true)) {
            $this->responderJson(['sucesso' => false, 'erro' => 'Erro ao preparar a pasta.'], 500);
        }

        $salvos = [];
        $limpar = function () use (&$salvos) {
            foreach ($salvos as $s) { @unlink(self::PASTA_UPLOADS . '/' . $s['caminho']); }
        };

        for ($i = 0; $i < $total; $i++) {
            $nome = basename((string) $enviados['name'][$i]);
            $ext  = strtolower(pathinfo($nome, PATHINFO_EXTENSION));

            if ($enviados['error'][$i] !== UPLOAD_ERR_OK
                || $enviados['size'][$i] > self::MAX_BYTES
                || !in_array($ext, self::EXT_ANEXOS, true)
                || !is_uploaded_file($enviados['tmp_name'][$i])) {
                $limpar();
                $this->responderJson(['sucesso' => false, 'erro' => "Arquivo inválido: $nome"], 400);
            }

            $fisico = bin2hex(random_bytes(16)) . '.' . $ext;
            if (!move_uploaded_file($enviados['tmp_name'][$i], "$pasta/$fisico")) {
                $limpar();
                $this->responderJson(['sucesso' => false, 'erro' => 'Falha ao salvar o arquivo.'], 500);
            }
            $salvos[] = ['caminho' => "$idAtividade/$idAluno/$fisico", 'nome_original' => $nome];
        }

        try {
            $r = $model->criarSubmissaoAnexo($idAtividade, $idAluno, $salvos);
        } catch (Throwable $e) {
            $limpar();
            error_log('[submissoes] ' . $e->getMessage());
            $this->responderJson(['sucesso' => false, 'erro' => 'Erro ao registrar a entrega.'], 500);
        }

        $this->responderJson(['sucesso' => true, 'id_submissao' => $r['id_submissao'], 'tentativa' => $r['tentativa']]);
    }

    //  salva a resolução (código ou texto) do aluno na tabela "submissoes".
    // Aceita JSON ({"id_atividade":1,"conteudo":"..."}) ou POST comum.
    public function salvarResolucao(): void
    {
        solicitarPerfilDeAcesso('aluno');

        // usa o auxiliar que tenta as chaves de sessão mais comuns
        $idAluno = $this->idUsuarioLogado();

        $entrada = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($entrada)) $entrada = $_POST;

        $idAtividade = filter_var($entrada['id_atividade'] ?? null, FILTER_VALIDATE_INT);
        $conteudo    = (string) ($entrada['conteudo'] ?? '');

        //a mensagem agora diz qual dado está faltando
        if ($idAluno < 1) {
            $this->responderJson(['sucesso' => false, 'erro' => 'Sessão inválida: usuário não identificado.'], 400);
        }
        if (!$idAtividade) {
            $this->responderJson(['sucesso' => false, 'erro' => 'Atividade não informada.'], 400);
        }
        if (trim($conteudo) === '') {
            $this->responderJson(['sucesso' => false, 'erro' => 'A resposta está vazia.'], 400);
        }
        if (mb_strlen($conteudo) > 200000) {
            $this->responderJson(['sucesso' => false, 'erro' => 'Resposta muito grande.'], 413);
        }

        $model = new SubmissoesModel();
        $atividade = $model->buscarAtividade($idAtividade);
        if (!$atividade || $atividade['tipo_atividade'] === 'anexo') {
            $this->responderJson(['sucesso' => false, 'erro' => 'Atividade não encontrada.'], 404);
        }
        if (!$model->alunoMatriculado($idAluno, (int) $atividade['id_turma'])) {
            $this->responderJson(['sucesso' => false, 'erro' => 'Você não está matriculado nesta turma.'], 403);
        }
        $fuso = new DateTimeZone('America/Sao_Paulo');
        if (new DateTime($atividade['data_entrega'], $fuso) < new DateTime('now', $fuso)) {
            $this->responderJson(['sucesso' => false, 'erro' => 'O prazo de entrega acabou.'], 403);
        }

        try {
            $r = $model->criarSubmissao($idAtividade, $idAluno, $conteudo);
        } catch (Throwable $e) {
            error_log('[submissoes] ' . $e->getMessage());
            $this->responderJson(['sucesso' => false, 'erro' => 'Erro ao salvar a resolução.'], 500);
        }

        $this->responderJson([
            'sucesso'      => true,
            'id_submissao' => $r['id_submissao'],
            'tentativa'    => $r['tentativa'],
        ]);
    }

    private function responderJson(array $corpo, int $status = 200): void{
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($corpo, JSON_UNESCAPED_UNICODE);
        exit;
    }
    //adicionado 24/11 ^

    // public function presenteDoGustavin(): void {
    //         //     Presente para o grupo de Submissões,
    //     $resultadoIA = (new SIAE())->obterResultadoSIAE(
    //         $linguagem,
    //         $objetivoAtividade,
    //         $codigoAluno
    //     );


    //     FeedbackIAModel::salvarProbabilidadeIA(
    //         $pdo,
    //         $idSubmissao,
    //         $resultadoIA['probabilidade_ia'],
    //         $resultadoIA['motivo']
    //     );

    //     $aviso = FeedbackIAModel::mensagemAvisoAluno(
    //         $resultadoIA['probabilidade_ia']
    //     );
    // }
}