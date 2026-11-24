<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/NotificacoesPush.php';
require_once __DIR__ . '/../../core/database.php';

// A sessão (login) existe nas versões com autenticação; se não existir, usa o usuário de teste.
$arquivoSessao = __DIR__ . '/../../core/session.php';

if (is_file($arquivoSessao)) {
    require_once $arquivoSessao;
}

class NotificacoesController
{
    /**
     * MODO DESENVOLVIMENTO: se não houver usuário logado, usa o usuário de teste abaixo.
     * Em PRODUÇÃO coloque false, senão qualquer visitante vê as notificações desse usuário.
     */
    const USAR_USUARIO_TESTE = false;
    const EMAIL_USUARIO_TESTE = 'teste.notificacoes@exemplo.com';

    private $pdo = null;

    // ------------------------------------------------------------------
    // Telas
    // ------------------------------------------------------------------

    public function listar(): void
    {
        $idUsuario = $this->idUsuarioAtual();

        if ($idUsuario === null) {
            if (function_exists('solicitarLogin') && !self::USAR_USUARIO_TESTE) {
                solicitarLogin('aluno');
                return;
            }

            $notificacoes = [];
        } else {
            $notificacoes = NotificacoesModel::listar($this->pdo(), $idUsuario);
        }

        require __DIR__ . '/views/notificacoes.php';
    }

    public function testarApi(): void
    {
        if ($this->idUsuarioAtual() === null) {
            http_response_code(401);
            echo 'Acesso negado';
            return;
        }

        require __DIR__ . '/views/testarApi.php';
    }

    // ------------------------------------------------------------------
    // API da tela (JSON)
    // ------------------------------------------------------------------

    public function marcarComoLida(): void
    {
        if (!$this->exigirPost()) {
            return;
        }

        $idUsuario = $this->exigirUsuario();

        if ($idUsuario === null) {
            return;
        }

        $idNotificacao = filter_input(INPUT_POST, 'id_notificacao', FILTER_VALIDATE_INT);
        $lida          = filter_input(INPUT_POST, 'lida', FILTER_VALIDATE_INT);

        if (!$idNotificacao || !in_array($lida, [0, 1], true)) {
            $this->json(['sucesso' => false, 'erro' => 'Dados inválidos'], 400);
            return;
        }

        try {
            $sucesso = NotificacoesModel::marcarComoLida(
                $this->pdo(),
                (int) $idNotificacao,
                $idUsuario,
                (bool) $lida
            );
        } catch (Throwable $e) {
            // Sempre responde JSON, mesmo em erro de banco (ex.: coluna inexistente).
            error_log('[notificacoes] marcarComoLida: ' . $e->getMessage());
            $this->json(['sucesso' => false, 'erro' => 'Erro interno ao salvar'], 500);
            return;
        }

        $this->json(['sucesso' => $sucesso]);
    }

    public function marcarTodas(): void
    {
        if (!$this->exigirPost()) {
            return;
        }

        $idUsuario = $this->exigirUsuario();

        if ($idUsuario === null) {
            return;
        }

        try {
            $alteradas = NotificacoesModel::marcarTodasComoLidas($this->pdo(), $idUsuario);
        } catch (Throwable $e) {
            error_log('[notificacoes] marcarTodas: ' . $e->getMessage());
            $this->json(['sucesso' => false, 'erro' => 'Erro interno ao salvar'], 500);
            return;
        }

        $this->json(['sucesso' => true, 'alteradas' => $alteradas]);
    }

    public function verificarNovas(): void
    {
        $idUsuario = $this->exigirUsuario();

        if ($idUsuario === null) {
            return;
        }

        try {
            // ?depois=<id>: devolve só o que é mais novo que o último id que a tela já tem.
            $depois = filter_input(INPUT_GET, 'depois', FILTER_VALIDATE_INT);

            $notificacoes = ($depois !== null && $depois !== false && $depois >= 0)
                ? NotificacoesModel::listarNovas($this->pdo(), $idUsuario, $depois)
                : NotificacoesModel::listar($this->pdo(), $idUsuario);
        } catch (Throwable $e) {
            error_log('[notificacoes] verificarNovas: ' . $e->getMessage());
            $this->json(['erro' => 'Erro interno'], 500);
            return;
        }

        $this->json(['notificacoes' => $notificacoes]);
    }

    // ------------------------------------------------------------------
    // Alertas no celular/PC (Web Push)
    // ------------------------------------------------------------------

    /** Service Worker: precisa ser público (o navegador baixa sem login). */
    public function serviceWorker(): void
    {
        $arquivo = __DIR__ . '/views/sw.js';

        if (!is_file($arquivo)) {
            http_response_code(404);
            return;
        }

        header('Content-Type: application/javascript; charset=utf-8');
        header('Cache-Control: no-cache, max-age=0');
        // Permite registrar o SW com escopo na pasta do sistema (necessário em URLs limpas: /notificacoes/sw.js).
        header('Service-Worker-Allowed: ' . $this->diretorioBase() . '/');

        readfile($arquivo);
    }

    /** Manifest do app (necessário para instalar na tela inicial do iPhone). */
    public function manifest(): void
    {
        header('Content-Type: application/manifest+json; charset=utf-8');

        echo json_encode([
            'name'             => 'Farmer Edu',
            'short_name'       => 'Farmer Edu',
            'start_url'        => $this->urlTela(),
            'scope'            => $this->diretorioBase() . '/',
            'display'          => 'standalone',
            'background_color' => '#f4f6fa',
            'theme_color'      => '#22c55e',
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function pushChave(): void
    {
        if ($this->exigirUsuario() === null) {
            return;
        }

        if (!NotificacoesPush::configurado()) {
            $this->json(['erro' => 'Push não configurado no servidor'], 503);
            return;
        }

        $config = NotificacoesPush::config();

        $this->json(['chave' => $config['vapid_public']]);
    }

    public function pushInscrever(): void
    {
        if (!$this->exigirPost()) {
            return;
        }

        $idUsuario = $this->exigirUsuario();

        if ($idUsuario === null) {
            return;
        }

        $dados  = json_decode((string) file_get_contents('php://input'), true);
        $dados  = is_array($dados) ? $dados : [];
        $chaves = (isset($dados['keys']) && is_array($dados['keys'])) ? $dados['keys'] : [];

        $endpoint = (string) ($dados['endpoint'] ?? '');
        $p256dh   = (string) ($chaves['p256dh'] ?? '');
        $auth     = (string) ($chaves['auth'] ?? '');

        $formatoChave = '/^[A-Za-z0-9_\-=+\/]{10,255}$/';

        if (
            !preg_match('#^https://#i', $endpoint) ||
            strlen($endpoint) > 2000 ||
            !preg_match($formatoChave, $p256dh) ||
            !preg_match($formatoChave, $auth)
        ) {
            $this->json(['sucesso' => false, 'erro' => 'Assinatura inválida'], 400);
            return;
        }

        try {
            $sucesso = NotificacoesModel::salvarAssinatura(
                $this->pdo(),
                $idUsuario,
                $endpoint,
                $p256dh,
                $auth,
                substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255)
            );
        } catch (Throwable $e) {
            error_log('[notificacoes] pushInscrever: ' . $e->getMessage());
            $this->json(['sucesso' => false, 'erro' => 'Erro interno ao salvar'], 500);
            return;
        }

        $this->json(['sucesso' => (bool) $sucesso]);
    }

    public function pushCancelar(): void
    {
        if (!$this->exigirPost()) {
            return;
        }

        $idUsuario = $this->exigirUsuario();

        if ($idUsuario === null) {
            return;
        }

        $dados    = json_decode((string) file_get_contents('php://input'), true);
        $endpoint = is_array($dados) ? (string) ($dados['endpoint'] ?? '') : '';

        if ($endpoint === '') {
            $this->json(['sucesso' => false, 'erro' => 'Dados inválidos'], 400);
            return;
        }

        try {
            NotificacoesModel::removerAssinatura($this->pdo(), $idUsuario, $endpoint);
        } catch (Throwable $e) {
            error_log('[notificacoes] pushCancelar: ' . $e->getMessage());
            $this->json(['sucesso' => false, 'erro' => 'Erro interno'], 500);
            return;
        }

        $this->json(['sucesso' => true]);
    }

    // ------------------------------------------------------------------
    // Auxiliares
    // ------------------------------------------------------------------

    private function pdo()
    {
        if ($this->pdo === null) {
            $this->pdo = iniciarPDO();
        }

        return $this->pdo;
    }

    /** Id do usuário atual: logado (core/session.php) ou, em desenvolvimento, o usuário de teste. */
    private function idUsuarioAtual()
    {
        if (function_exists('usuarioLogado')) {
            $usuario = usuarioLogado();

            if (is_array($usuario) && !empty($usuario['idUsuario'])) {
                return (int) $usuario['idUsuario'];
            }
        }

        if (self::USAR_USUARIO_TESTE) {
            $stmt = $this->pdo()->prepare("SELECT id_usuario FROM usuarios WHERE email = ?");
            $stmt->execute([self::EMAIL_USUARIO_TESTE]);

            $id = $stmt->fetchColumn();

            return $id ? (int) $id : null;
        }

        return null;
    }

    /** Devolve o id do usuário ou responde 401/500 em JSON e devolve null. */
    private function exigirUsuario()
    {
        try {
            $idUsuario = $this->idUsuarioAtual();
        } catch (Throwable $e) {
            error_log('[notificacoes] usuário atual: ' . $e->getMessage());
            $this->json(['sucesso' => false, 'erro' => 'Erro interno'], 500);
            return null;
        }

        if ($idUsuario === null) {
            $this->json(['sucesso' => false, 'erro' => 'Usuário não autenticado'], 401);
            return null;
        }

        return $idUsuario;
    }

    private function exigirPost(): bool
    {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            $this->json(['sucesso' => false, 'erro' => 'Método não permitido'], 405);
            return false;
        }

        return true;
    }

    private function json($dados, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    }

    /** Pasta onde o sistema está publicado (ex.: "" na raiz, "/guilherme22/The-Farmer-Edu/public" em subpasta). */
    private function diretorioBase(): string
    {
        $script = $_SERVER['SCRIPT_NAME'] ?? '/index.php';

        return rtrim(str_replace('\\', '/', dirname($script)), '/');
    }

    /** Endereço da tela, no mesmo formato em que o sistema está sendo acessado. */
    private function urlTela(): string
    {
        // index.php?rota=/notificacoes  ou  /notificacoes (URL limpa)
        if (isset($_GET['rota'])) {
            return ($_SERVER['SCRIPT_NAME'] ?? '/index.php') . '?rota=/notificacoes';
        }

        return $this->diretorioBase() . '/notificacoes';
    }
}
