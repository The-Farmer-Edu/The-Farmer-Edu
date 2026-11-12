<?php

class atividadesSub {

    private const TIPOS_ASSETS_PERMITIDOS = ['css', 'img', 'js'];

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

    public function showaluno() {
        $dadosAtividade = null;
        require_once __DIR__ . '/view/aluno.html';
    }
    public function processarSubmisssao() {
        require_once __DIR__ . '/view/processar_submissao.php';
    }
    public function showiniciarAtv() {
        $dadosAtividade = null;
        require_once __DIR__ . '/view/iniciaratv.html';
    }
    public function sendFile(): void {
        $tipo = $_GET['type'] ?? '';
        $arquivo = basename($_GET['file'] ?? '');

        if (!in_array($tipo, self::TIPOS_ASSETS_PERMITIDOS, true) || $arquivo === '') {
            http_response_code(404);
            return;
        }

        $caminhoArquivo = __DIR__ . "/view/assets/$tipo/$arquivo";
        if (!is_file($caminhoArquivo)) {
            http_response_code(404);
            return;
        }

        header('Content-Type: ' . $this->resolverMimeType($caminhoArquivo));
        header('X-Content-Type-Options: nosniff');
        header('Content-Length: ' . filesize($caminhoArquivo));
        readfile($caminhoArquivo);
    }

    private function resolverMimeType(string $caminhoArquivo): string {
        $extensao = strtolower(pathinfo($caminhoArquivo, PATHINFO_EXTENSION));
        if (isset(self::MIME_TYPES[$extensao])) {
            return self::MIME_TYPES[$extensao];
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = $finfo ? finfo_file($finfo, $caminhoArquivo) : false;
        if ($finfo) {
            finfo_close($finfo);
        }
        return $mimeType ?: 'application/octet-stream';
    }
}