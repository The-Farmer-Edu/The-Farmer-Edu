<?php
    require_once __DIR__ . '/Model.php';
    require_once __DIR__ . '/../../core/database.php';

    class baseFazenda {
        // CSS e JavaScript da fazenda: ficam ao lado do HTML (views/assets/css e views/assets/js) para o fazenda.html
        // continuar abrindo direto pelo arquivo.
        private const PASTA_DOS_ESTILOS = __DIR__ . '/views/assets/css';
        private const PASTA_DOS_SCRIPTS = __DIR__ . '/views/assets/js';

        public function showFazenda(): void {
            $html = file_get_contents(__DIR__ . '/views/fazenda.html');
            // Os <link> e <script src> do HTML são relativos ao próprio arquivo, mas a pasta views/ não é pública: pela rota,
            // cada href "assets/css/..." e src "assets/js/..." é trocado pela rota que entrega o arquivo. O resto do HTML sai
            // sem nenhuma alteração.
            $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
            $html = preg_replace_callback(
                '#href="assets/css/([0-9a-z-]+\.css)"#',
                fn(array $encontrado): string => 'href="' . htmlspecialchars($base . '/index.php?rota=fazenda/estilo&arquivo=' . $encontrado[1]) . '"',
                $html
            );
            echo preg_replace_callback(
                '#src="assets/js/([0-9a-z-]+\.js)"#',
                fn(array $encontrado): string => 'src="' . htmlspecialchars($base . '/index.php?rota=fazenda/script&arquivo=' . $encontrado[1]) . '"',
                $html
            );
        }

        public function enviarEstilo(): void {
            $this->enviarArquivo(self::PASTA_DOS_ESTILOS, 'css', 'text/css; charset=utf-8');
        }

        public function enviarScript(): void {
            $this->enviarArquivo(self::PASTA_DOS_SCRIPTS, 'js', 'text/javascript; charset=utf-8');
        }

        // Entrega um arquivo da pasta informada. Só aceita nomes simples com a extensão esperada que existam nessa pasta.
        private function enviarArquivo(string $pasta, string $extensao, string $tipo): void {
            $arquivo = $_GET['arquivo'] ?? '';
            if (!is_string($arquivo) || !preg_match('/^[0-9a-z-]+\.' . $extensao . '$/', $arquivo) || !is_file($pasta . '/' . $arquivo)) {
                http_response_code(404);
                return;
            }
            header('Content-Type: ' . $tipo);
            header('X-Content-Type-Options: nosniff');
            header('Cache-Control: no-cache');
            readfile($pasta . '/' . $arquivo);
        }

        public function sendFile(): void {
            $type = $_GET['type'] ?? null;
            $file = $_GET['file'] ?? null;
            $caminhoArquivo = __DIR__ . "/views/assets/$type/$file";
            if(file_exists($caminhoArquivo)) {
                $mimeType = $this->
                get_content_mime_type($caminhoArquivo);

                header("Content-Type: " . $mimeType);
                header("X-Content-Type-Options: nosniff");
                header("Content-Length: " . filesize($caminhoArquivo));

                require_once $caminhoArquivo;
            } else {
                http_response_code(404);
            }
        }

        private function get_content_mime_type($content)
        {
            $url = 'http://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types';
            $url_live = false;
            $handle = curl_init($url);
            curl_setopt_array($handle, array(
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_NOBODY => true,
                CURLOPT_HEADER => false,
                CURLOPT_RETURNTRANSFER => false,
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_SSL_VERIFYPEER => false
            ));
            $response = curl_exec($handle);
            $httpCode = curl_getinfo($handle, CURLINFO_EFFECTIVE_URL);
            $httpCode = curl_getinfo($handle, CURLINFO_HTTP_CODE);
            if ($httpCode == 200)
            {
                $url_live = true;
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
?>
