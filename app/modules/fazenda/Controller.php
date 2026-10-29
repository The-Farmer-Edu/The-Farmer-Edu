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
    }
?>
