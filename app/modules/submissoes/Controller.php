<?php
/**
 * Controller do módulo de submissões.
 *
 * Este arquivo organiza a parte de navegação e entrega de recursos do módulo.
 * Ele centraliza três responsabilidades principais:
 *
 * 1. Renderizar as páginas HTML que o aluno acessa:
 *    - lista de atividades,
 *    - editor de código,
 *    - processamento da submissão.
 * 2. Servir arquivos estáticos do frontend (CSS, JS, imagens e outros assets)
 *    com o MIME correto, evitando acesso arbitrário fora da pasta pública do módulo.
 * 3. Delegar o processamento da avaliação para o AvaliadorController quando o
 *    cliente envia uma entrega via POST.
 *
 * O módulo de submissões é o ponto de entrada entre a interface do aluno e a
 * lógica de avaliação dos exercícios do sistema educacional.
 */

class atividadesSub
{
    // ─── Views ────────────────────────────────────────────────────────────────

    /**
     * Exibe a página inicial do aluno, onde são apresentadas as atividades e o
     * status das entregas.
     *
     * Normalmente esta tela lista a atividade selecionada, informa o prazo,
     * mostra se o trabalho já foi entregue e controla o acesso ao editor.
     */
    public function showaluno(): void
    {
        require_once __DIR__ . '/view/aluno.html';
    }

    /**
     * Abre a tela de resolução da atividade.
     *
     * Aqui o aluno entra no ambiente de programação, pode escrever código,
     * executar, usar a Sophia, entregar a resposta e acompanhar o resultado.
     */
    public function showiniciarAtv(): void
    {
        require_once __DIR__ . '/view/iniciaratv.html';
    }

    /**
     * Processa a requisição de submissão em formato JSON.
     *
     * Este método não avalia diretamente o código. Ele apenas encaminha a
     * requisição para o AvaliadorController, que faz a validação e retorna
     * o resultado da análise para o cliente.
     */
    public function processarSubmissao(): void
    {
        require_once __DIR__ . '/view/processar_submissao.php';
    }

    // ─── Arquivos estáticos ────────────────────────────────────────────────────

    /**
     * Serviço de arquivos estáticos do módulo.
     *
     * A rota /submissoes/file recebe parâmetros como type=css&file=base.css
     * ou type=js&file=iniciaratv.js e devolve o conteúdo correto do arquivo,
     * definindo o Content-Type apropriado para o navegador interpretar.
     *
     * Também bloqueia tentativa de path traversal e outros acessos fora do
     * diretório permitido, reforçando segurança.
     */
    public function sendFile(): void
    {
        $type = $_GET['type'] ?? null;
        $file = $_GET['file'] ?? null;

        if (!$type || !$file) {
            http_response_code(400);
            return;
        }

        // Bloqueia path traversal
        if (strpos($file, '..') !== false || strpos($type, '..') !== false) {
            http_response_code(400);
            return;
        }

        $caminho = __DIR__ . "/view/assets/{$type}/{$file}";

        if (!file_exists($caminho)) {
            http_response_code(404);
            return;
        }

        $mimeType = $this->resolverMimeType($caminho);

        header("Content-Type: {$mimeType}");
        header("X-Content-Type-Options: nosniff");
        header("Content-Length: " . filesize($caminho));

        readfile($caminho);
    }

    // ─── Utilitários ──────────────────────────────────────────────────────────

    /**
     * Resolve o MIME type de um arquivo pela extensão.
     * Usa finfo como fallback para extensões desconhecidas.
     */
    private function resolverMimeType(string $caminho): string
    {
        static $mimes = [
            // texto / web
            'txt'  => 'text/plain',
            'htm'  => 'text/html',
            'html' => 'text/html',
            'php'  => 'text/html',
            'css'  => 'text/css',
            'js'   => 'application/javascript',
            'json' => 'application/json',
            'xml'  => 'application/xml',
            // imagens
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'jpe'  => 'image/jpeg',
            'gif'  => 'image/gif',
            'bmp'  => 'image/bmp',
            'ico'  => 'image/vnd.microsoft.icon',
            'svg'  => 'image/svg+xml',
            'svgz' => 'image/svg+xml',
            'webp' => 'image/webp',
            'tif'  => 'image/tiff',
            'tiff' => 'image/tiff',
            // vídeo / áudio
            'mp4'  => 'video/mp4',
            'webm' => 'video/webm',
            'mp3'  => 'audio/mpeg',
            'ogg'  => 'audio/ogg',
            // fonte
            'woff'  => 'font/woff',
            'woff2' => 'font/woff2',
            // documentos
            'pdf'  => 'application/pdf',
            // arquivos comprimidos
            'zip'  => 'application/zip',
        ];

        $ext = strtolower(pathinfo($caminho, PATHINFO_EXTENSION));

        if (isset($mimes[$ext])) {
            return $mimes[$ext];
        }

        // Fallback: finfo (não faz requisições externas)
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $tipo  = finfo_file($finfo, $caminho);
        finfo_close($finfo);

        return $tipo ?: 'application/octet-stream';
    }
}
