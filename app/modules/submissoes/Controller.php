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
        curl_close($handle);
        $mimes = array();
        if ($url_live)
        {
            $mimes_file = file_get_contents($url);
            preg_match_all('#^([^\s]{2,}?)\s+(.+?)$#ism', $mimes_file, $matches, PREG_SET_ORDER);
            foreach ($matches as $match)
            {
                $exts = explode(" ", $match[2]);
                foreach ($exts as $ext)
                {
                    $mimes[$ext] = $match[1];
                }
            }
        }
        else
        {
            $mimes = array(
                'txt' => 'text/plain',
                'htm' => 'text/html',
                'html' => 'text/html',
                'php' => 'text/html',
                'css' => 'text/css',
                'js' => 'application/javascript',
                'json' => 'application/json',
                'xml' => 'application/xml',
                'swf' => 'application/x-shockwave-flash',
                'flv' => 'video/x-flv',
                // images
                'png' => 'image/png',
                'jpe' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'jpg' => 'image/jpeg',
                'gif' => 'image/gif',
                'bmp' => 'image/bmp',
                'ico' => 'image/vnd.microsoft.icon',
                'tiff' => 'image/tiff',
                'tif' => 'image/tiff',
                'svg' => 'image/svg+xml',
                'svgz' => 'image/svg+xml',
                // archives
                'zip' => 'application/zip',
                'rar' => 'application/x-rar-compressed',
                'exe' => 'application/x-msdownload',
                'msi' => 'application/x-msdownload',
                'cab' => 'application/vnd.ms-cab-compressed',
                // audio/video
                'mp3' => 'audio/mpeg',
                'qt' => 'video/quicktime',
                'mov' => 'video/quicktime',
                // adobe
                'pdf' => 'application/pdf',
                'psd' => 'image/vnd.adobe.photoshop',
                'ai' => 'application/postscript',
                'eps' => 'application/postscript',
                'ps' => 'application/postscript',
                // ms office
                'doc' => 'application/msword',
                'rtf' => 'application/rtf',
                'xls' => 'application/vnd.ms-excel',
                'ppt' => 'application/vnd.ms-powerpoint',
                'docx' => 'application/msword',
                'xlsx' => 'application/vnd.ms-excel',
                'pptx' => 'application/vnd.ms-powerpoint',
                // open office
                'odt' => 'application/vnd.oasis.opendocument.text',
                'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
            );
        }
        $content_mime = 'unknown';
        if (is_file($content))
        {
            if (isset(pathinfo($content)['extension']))
            {
                $content_ext = pathinfo($content)['extension'];
                if (isset($mimes[$content_ext]))
                {
                    $content_mime = $mimes[$content_ext];
                }
                else
                {
                    if (is_readable($content) && is_executable($content))
                    {
                        $finfo = finfo_open(FILEINFO_MIME_TYPE);
                        $content_mime = finfo_file($finfo, $content);
                        if ($content_mime === null || $content_mime === "")
                        {
                            $content_mime = "application/octet-stream";
                        }
                        finfo_close($finfo);
                    }
                    else
                    {
                        $content_mime = "application/octet-stream";
                    }
                }
            }
        }
        else
        {
            // return whatever you want
            // $content_mime = 'unknown';
        }
        return $content_mime;
    }
}