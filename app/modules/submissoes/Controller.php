<?php
require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/session.php';
require_once __DIR__ . '/../api/model/Ollama.php';
require_once __DIR__ . '/../feedback_ia/Model.php';
require_once __DIR__ . '/../../core/arquivosEstaticos.php';

/**
 * Controlador do módulo de submissões.
 *
 * Responsável por encapsular a regra de apresentação da página do aluno,
 * o fluxo de início da atividade, a visualização somente leitura do instrutor,
 * a persistência/cancelamento de entregas no banco de dados e a integração
 * com o detector de uso de IA (SIAE / FeedbackIAModel).
 */
class atividadesSub {

    private const EXT_ANEXOS = ['pdf', 'png', 'jpg', 'jpeg', 'zip', 'txt', 'doc', 'docx'];
    private const MAX_ARQUIVOS = 5;
    private const MAX_BYTES = 10 * 1024 * 1024;
    private const PASTA_UPLOADS = __DIR__ . '/../../../storage/submissoes';
    /**
     * Método que dispara o processamento da submissão.
     * No fluxo atual, ele apenas inclui o script PHP responsável por receber JSON e lidar
     * com a avaliação; a lógica real fica no AvaliadorController.
     */
    public function processarSubmisssao() {
        require_once __DIR__ . '/views/processar_submissao.php';
    }

    /**
     * Lê ?id= (ou ?id_atividade=) da URL e busca a atividade no banco.
     * Para o instrutor visualizar a atividade de um aluno, a URL precisa informar
     * obrigatoriamente o id da atividade e o id_aluno, retornando somente a última
     * submissão ativa referente àquele aluno.
     */
    private function carregarAtividade(): ?array {
        // Aceita ?id= (padrão do módulo) ou ?id_atividade= por compatibilidade na URL.
        $id = filter_var($_GET['id'] ?? $_GET['id_atividade'] ?? null, FILTER_VALIDATE_INT);
        if (!$id || $id < 1) return null;

        try {
            if (isset($_GET['id_aluno'])) {
                solicitarPerfilDeAcesso('instrutor');

                // Validações do acesso do instrutor: exige id_aluno válido, vínculo com a turma e matrícula do aluno.
                $idAlunoUrl = filter_var($_GET['id_aluno'], FILTER_VALIDATE_INT);
                if (!$idAlunoUrl || $idAlunoUrl < 1) return null;

                $model = new SubmissoesModel();
                $atividade = $model->buscarAtividade($id);
                if (!$atividade) return null;

                $idTurma = (int) $atividade['id_turma'];
                if (!$model->instrutorDaTurma($this->idUsuarioLogado(), $idTurma)) return null;
                if (!$model->alunoMatriculado($idAlunoUrl, $idTurma)) return null;

                // Carrega exclusivamente a última submissão ativa do aluno informado para esta atividade.
                $dados = $model->dadosParaView($id, $idAlunoUrl, true);
                if ($dados) $dados['modoInstrutor'] = true; // O JS usa isso para abrir somente leitura.
                return $dados;
            } else {
                solicitarPerfilDeAcesso('aluno');
            }

            $idAluno = $this->idAlunoDaRequisicao();
            if (!$idAluno || $idAluno < 1) return null;

            $model = new SubmissoesModel();
            $atividade = $model->buscarAtividade($id);
            if (!$atividade) return null;

            // Garante que o aluno só visualize atividades das turmas em que está matriculado.
            if (!$model->alunoMatriculado($idAluno, (int) $atividade['id_turma'])) return null;

            return $model->dadosParaView($id, $idAluno, false);
        } catch (Throwable $e) {
            error_log('[submissoes] ' . $e->getMessage());
            return null;
        }
    }

    // Descobre o id do usuário logado, tentando as chaves de sessão mais comuns.
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

    // Define de qual aluno carregar a submissão
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
        require_once __DIR__ . '/views/aluno.html';
    }

    public function showiniciarAtv() {
        $dadosAtividade = $this->carregarAtividade();
        require_once __DIR__ . '/views/iniciaratv.html';
    }

    /**
     * Endpoint GET /submissoes/status?id=...
     * Permite ao front-end atualizar o estado real da entrega e das tentativas direto do BD,
     * evitando inconsistências causadas por cache do navegador (bfcache) ou manipulação do localStorage.
     */
    public function statusAtividade(): void
    {
        $dados = $this->carregarAtividade();
        if (!$dados) {
            $this->responderJson(['sucesso' => false, 'erro' => 'Atividade não encontrada.'], 404);
        }
        $this->responderJson(['sucesso' => true, 'dados' => $dados]);
    }

    public function sendFile(): void {
        enviarArquivoEstatico(__DIR__ . '/views/assets', ['css', 'img', 'js']);
    }

    public function enviarAnexo(): void{
        solicitarPerfilDeAcesso('aluno');
        $idAluno = $this->idUsuarioLogado();
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
            $salvos[] = ['caminho' => "submissoes/$idAtividade/$idAluno/$fisico", 'nome_original' => $nome];
        }

        try {
            $r = $model->criarSubmissaoAnexo($idAtividade, $idAluno, $salvos);
            $this->responderJson([
                'sucesso'       => true,
                'id_submissao'  => $r['id_submissao'],
                'tentativa'     => $r['tentativa'],
                'data_envio'    => $r['data_envio'],
                'cancelamentos' => $r['cancelamentos'],
            ]);
        } catch (Throwable $e) {
            $limpar();
            error_log('[submissoes] ' . $e->getMessage());
            $this->responderJson(['sucesso' => false, 'erro' => 'Erro ao registrar a entrega.'], 500);
        }
    }

    /**
     * Salva a resolução (código ou texto) do aluno na tabela "submissoes".
     * Aceita JSON ({"id_atividade":1,"conteudo":"..."}) ou POST comum.
     * Após gravar no BD, aciona a análise do SIAE (Feedback IA) quando for atividade de código.
     */
    public function salvarResolucao(): void
    {
        solicitarPerfilDeAcesso('aluno');

        $idAluno = $this->idUsuarioLogado();

        $entrada = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($entrada)) $entrada = $_POST;

        $idAtividade = filter_var($entrada['id_atividade'] ?? null, FILTER_VALIDATE_INT);
        $conteudo    = (string) ($entrada['conteudo'] ?? '');

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
            // Integração com o bloco do SIAE (equipe de Feedback IA) após persistir a submissão.
            $avisoIa = $this->analisarUsoIaNaSubmissao(
                $model->getPdo(),
                (int) $r['id_submissao'],
                $atividade,
                $conteudo
            );

            $this->responderJson([
                'sucesso'       => true,
                'id_submissao'  => $r['id_submissao'],
                'tentativa'     => $r['tentativa'],
                'data_envio'    => $r['data_envio'],
                'cancelamentos' => $r['cancelamentos'],
                'aviso_ia'      => $avisoIa,
            ]);
        } catch (RuntimeException $e) {
            // Ex.: já existe uma entrega ativa não cancelada no banco.
            $this->responderJson(['sucesso' => false, 'erro' => $e->getMessage()], 409);
        } catch (Throwable $e) {
            error_log('[submissoes] ' . $e->getMessage());
            $this->responderJson(['sucesso' => false, 'erro' => 'Erro ao salvar a resolução.'], 500);
        }
    }

    /**
     * Cancela a entrega ativa do aluno no banco de dados (marca status = 'cancelado').
     * Todas as regras (prazo, entrega ativa, limite de 3 cancelamentos) são validadas no servidor.
     */
    public function cancelarEntrega(): void
    {
        solicitarPerfilDeAcesso('aluno');
        $idAluno = $this->idUsuarioLogado();

        $entrada = json_decode((string) file_get_contents('php://input'), true);
        if (!is_array($entrada)) $entrada = $_POST;
        $idAtividade = filter_var($entrada['id_atividade'] ?? null, FILTER_VALIDATE_INT);

        if ($idAluno < 1 || !$idAtividade) {
            $this->responderJson(['sucesso' => false, 'erro' => 'Requisição inválida.'], 400);
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
            $this->responderJson(['sucesso' => false, 'erro' => 'O prazo acabou: a entrega não pode mais ser cancelada.'], 403);
        }

        try {
            $r = $model->cancelarUltimaSubmissao($idAtividade, $idAluno);
            $this->responderJson([
                'sucesso'       => true,
                'id_submissao'  => $r['id_submissao'],
                'cancelamentos' => $r['cancelamentos'],
            ]);
        } catch (RuntimeException $e) {
            $this->responderJson(['sucesso' => false, 'erro' => $e->getMessage()], 409);
        } catch (Throwable $e) {
            error_log('[submissoes] ' . $e->getMessage());
            $this->responderJson(['sucesso' => false, 'erro' => 'Erro ao cancelar a entrega.'], 500);
        }
    }

    /**
     * Integração corrigida do bloco deixado pela equipe de Feedback IA ("presenteDoGustavin").
     *
     * Problemas corrigidos em relação ao bloco original:
     * 1) Require estava com "model.php" em minúsculo em vez de "Model.php";
     * 2) As variáveis ($linguagem, $objetivoAtividade, $codigoAluno, $pdo, $idSubmissao) não existiam no escopo;
     * 3) SIAE::obterResultadoSIAE pode retornar null se a IA estiver offline/sem .env ou sem tag <think>,
     *    o que causava TypeError ao chamar FeedbackIAModel::salvarProbabilidadeIA;
     * 4) O retorno $aviso não era devolvido para a tela do aluno;
     * 5) Falhas de rede/IA são isoladas em try/catch para nunca impedir a entrega do aluno.
     */
    private function analisarUsoIaNaSubmissao(PDO $pdo, int $idSubmissao, array $atividade, string $conteudo): ?string
    {
        // O detector SIAE analisa código-fonte; atividades puramente de texto não entram nessa checagem.
        if (($atividade['tipo_atividade'] ?? '') !== 'codigo') {
            return null;
        }

        $linguagem = trim((string) ($atividade['linguagem'] ?? 'web')) ?: 'web';
        $objetivoAtividade = trim(
            (string) $atividade['titulo'] . "\n" . (string) ($atividade['descricao'] ?? '')
        );

        // Em atividades Web (html/css/js), o conteúdo é salvo em JSON; formatamos os blocos para a IA ler melhor.
        $codigoAluno = $conteudo;
        $arquivosWeb = json_decode($conteudo, true);
        if (is_array($arquivosWeb)) {
            $partes = [];
            foreach ($arquivosWeb as $ext => $codigo) {
                if (trim((string) $codigo) !== '') {
                    $partes[] = "=== {$ext} ===\n{$codigo}";
                }
            }
            if (!empty($partes)) {
                $codigoAluno = implode("\n\n", $partes);
            }
        }

        try {
            $resultadoIA = (new SIAE())->obterResultadoSIAE(
                $linguagem,
                $objetivoAtividade,
                $codigoAluno
            );

            // Garante que o retorno da IA é um array válido com probabilidade numérica antes de gravar no BD.
            if (!is_array($resultadoIA) || !isset($resultadoIA['probabilidade_ia']) || !is_numeric($resultadoIA['probabilidade_ia'])) {
                error_log("[submissoes/SIAE] Retorno inválido para submissão #{$idSubmissao}: " . json_encode($resultadoIA));
                return null;
            }

            $probabilidade = max(0.0, min(100.0, (float) $resultadoIA['probabilidade_ia']));
            $motivo = trim((string) ($resultadoIA['motivo'] ?? 'Análise automática concluída.'));

            FeedbackIAModel::salvarProbabilidadeIA(
                $pdo,
                $idSubmissao,
                $probabilidade,
                $motivo
            );

            return FeedbackIAModel::mensagemAvisoAluno($probabilidade);
        } catch (Throwable $e) {
            // A entrega já foi gravada no BD; registramos o erro sem quebrar o fluxo do aluno.
            error_log('[submissoes/SIAE] Falha na análise de IA: ' . $e->getMessage());
            return null;
        }
    }

    private function responderJson(array $corpo, int $status = 200): void{
        http_response_code($status);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($corpo, JSON_UNESCAPED_UNICODE);
        exit;
    }
}
