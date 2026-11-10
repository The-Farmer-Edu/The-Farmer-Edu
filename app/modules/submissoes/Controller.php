<?php

class atividadesSub
{
    // ─── Views ────────────────────────────────────────────────────────────────

    public function showaluno(): void
    {
        require_once __DIR__ . '/view/aluno.html';
    }

    public function showiniciarAtv(): void
    {
        require_once __DIR__ . '/view/iniciaratv.html';
    }

    public function processarSubmissao(): void
    {
        require_once __DIR__ . '/view/processar_submissao.php';
    }

    // ─── Arquivos estáticos ────────────────────────────────────────────────────

    /**
     * Serve arquivos da pasta view/assets com o Content-Type correto.
     * URL: /submissoes/file?type=css&file=aluno.css
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
