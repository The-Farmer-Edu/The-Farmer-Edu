<?php
    class testarApiController {
        public function showaluno() {
            require_once __DIR__ . '/view/aluno.html';
        }
        public function showtestarApi() {
            require_once __DIR__ . '/view/testarApi.php';
            }
        public function showtestarApi() {
            require_once __DIR__ . '/view/testarApi.php';
        }
        public function enviarSubmissao() {
            require_once __DIR__ . '/view/enviarSubmissao.php';
        }
    }

    public function sendFile(): void {
        $type = $_GET['type'] ?? null;
        $file = $_GET['file'] ?? null;
        $caminhoArquivo = __DIR__ . "/view/assets/$type/$file";
        if(file_exists($caminhoArquivo)) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $caminhoArquivo);
            finfo_close($finfo);
            if (!$mimeType) {
                $mimeType = 'application/octet-stream';
            }

            header("Content-Type: " . $mimeType);
            header("X-Content-Type-Options: nosniff");
            header("Content-Length: " . filesize($caminhoArquivo));

            require_once $caminhoArquivo;
        } else {
            http_response_code(404);
        }
    }
?>