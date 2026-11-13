<?php
    require_once __DIR__ . '/Model.php';
    require_once __DIR__ . '/../../core/database.php';
    require_once __DIR__ . '/../../core/session.php';

    class baseFazenda {
        // CSS e JavaScript da fazenda: ficam ao lado do HTML (views/assets/css e views/assets/js) para o fazenda.html
        // continuar abrindo direto pelo arquivo.
        private const PASTA_DOS_ESTILOS = __DIR__ . '/views/assets/css';
        private const PASTA_DOS_SCRIPTS = __DIR__ . '/views/assets/js';
        // Áudios (Fazenda 8.4.1): views/assets/audio, com uma subpasta por categoria. Só MP3 e OGG; ver views/assets/audio/LEIA-ME.md.
        private const PASTA_DOS_AUDIOS = __DIR__ . '/views/assets/audio';
        private const SUBPASTAS_DE_AUDIO = 'musica|ambiente|animais|segredos|efeitos';
        private const TIPOS_DE_AUDIO = ['mp3' => 'audio/mpeg', 'ogg' => 'audio/ogg'];
        // Backend: extensões que o sendFile entrega (views/assets). Qualquer outra extensão responde 404.
        private const TIPOS_DE_ARQUIVO = [
            'mp3' => 'audio/mpeg', 'ogg' => 'audio/ogg', 'wav' => 'audio/wav',
            'css' => 'text/css; charset=utf-8', 'js' => 'text/javascript; charset=utf-8',
            'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'webp' => 'image/webp', 'gif' => 'image/gif', 'svg' => 'image/svg+xml',
            'json' => 'application/json', 'txt' => 'text/plain; charset=utf-8',
        ];

        public function showFazenda(): void {
            $usuario = $this->exigirAluno();   // Backend: só aluno logado abre a fazenda
            $html = file_get_contents(__DIR__ . '/views/fazenda.html');
            // Os <link> e <script src> do HTML são relativos ao próprio arquivo, mas a pasta views/ não é pública: pela rota,
            // cada href "assets/css/..." e src "assets/js/..." é trocado pela rota que entrega o arquivo. O resto do HTML sai
            // sem nenhuma alteração.
            $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
            $html = preg_replace_callback(
                '#href="assets/css/([0-9a-z-]+\.css)"#',
                fn(array $encontrado): string => 'href="' . htmlspecialchars($base . '/fazenda/estilo?arquivo=' . $encontrado[1]) . '"',
                $html
            );
            $html = preg_replace_callback(
                '#src="assets/js/([0-9a-z-]+\.js)"#',
                fn(array $encontrado): string => 'src="' . htmlspecialchars($base . '/fazenda/script?arquivo=' . $encontrado[1]) . '"',
                $html
            );
            // Backend: save do banco e XP pendente entram no HTML (o jogo lê window.FARMEDU_SERVIDOR)
            try {
                $html = $this->injetarDadosDoServidor($html, $usuario, $base);
            } catch (Throwable $e) {
                error_log($e->getMessage());
                http_response_code(500);
                echo 'Não foi possível carregar a sua fazenda agora. Tente novamente em instantes.';
                return;
            }
            header('Cache-Control: no-store');
            echo $html;
        }

        public function enviarEstilo(): void {
            $this->enviarArquivo(self::PASTA_DOS_ESTILOS, 'css', 'text/css; charset=utf-8');
        }

        public function enviarScript(): void {
            $this->enviarArquivo(self::PASTA_DOS_SCRIPTS, 'js', 'text/javascript; charset=utf-8');
        }

        // Entrega um áudio da pasta views/assets/audio (rota fazenda/audio&arquivo=animais/vaca.mp3). Só aceita "subpasta/nome.ext"
        // com subpasta da lista, nome simples em minúsculas e extensão mp3/ogg; o caminho real ainda precisa ficar DENTRO da
        // pasta de áudio (protege contra atalhos). Qualquer recusa ou arquivo ausente responde 404 sem corpo: no jogo o som fica
        // "indisponível" e nada quebra. Aceita um intervalo "Range: bytes=..." (resposta 206), que os navegadores usam para
        // reposicionar e repetir áudio.
        public function enviarAudio(): void {
            $arquivo = $_GET['arquivo'] ?? '';
            if (!is_string($arquivo) || !preg_match('#^(?:' . self::SUBPASTAS_DE_AUDIO . ')/[0-9a-z-]+\.(mp3|ogg)$#', $arquivo, $partes)) {
                http_response_code(404);
                return;
            }
            $pasta = realpath(self::PASTA_DOS_AUDIOS);
            $caminho = $pasta === false ? false : realpath($pasta . '/' . $arquivo);
            if ($caminho === false || !is_file($caminho) || strpos($caminho, $pasta . DIRECTORY_SEPARATOR) !== 0) {
                http_response_code(404);
                return;
            }
            $tamanho = filesize($caminho);
            $inicio = 0;
            $fim = $tamanho - 1;
            $faixa = $_SERVER['HTTP_RANGE'] ?? '';
            if ($faixa !== '') {
                if (!preg_match('/^bytes=(\d*)-(\d*)$/', $faixa, $limites) || ($limites[1] === '' && $limites[2] === '')) {
                    http_response_code(416);
                    header('Content-Range: bytes */' . $tamanho);
                    return;
                }
                if ($limites[1] === '') {
                    $inicio = max(0, $tamanho - (int) $limites[2]);   // "bytes=-500": os últimos 500 bytes
                } else {
                    $inicio = (int) $limites[1];
                    if ($limites[2] !== '') $fim = min($fim, (int) $limites[2]);
                }
                if ($inicio > $fim) {
                    http_response_code(416);
                    header('Content-Range: bytes */' . $tamanho);
                    return;
                }
                http_response_code(206);
                header('Content-Range: bytes ' . $inicio . '-' . $fim . '/' . $tamanho);
            }
            header('Content-Type: ' . self::TIPOS_DE_AUDIO[$partes[1]]);
            header('X-Content-Type-Options: nosniff');
            header('Accept-Ranges: bytes');
            header('Cache-Control: no-cache');
            header('Content-Length: ' . ($fim - $inicio + 1));
            $leitor = fopen($caminho, 'rb');
            fseek($leitor, $inicio);
            $restante = $fim - $inicio + 1;
            while ($restante > 0) {
                $bloco = fread($leitor, min(65536, $restante));
                if ($bloco === false || $bloco === '') break;   // erro de leitura: para em vez de girar sem fim
                echo $bloco;
                $restante -= strlen($bloco);
            }
            fclose($leitor);
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

        // ---------------------------------------------------------------------------------------------
        // Entrega de arquivos de views/assets (usada pelos áudios: fazenda/arquivo?type=audio/Theme_songs&file=x.mp3)
        // Backend: antes, "type" e "file" eram concatenados no caminho sem validação (dava para ler arquivos fora de
        // views/assets com "../") e o arquivo era executado com require_once depois de enviado. Agora o caminho real
        // precisa ficar DENTRO de views/assets, a extensão precisa estar na lista e o arquivo é só enviado.
        // ---------------------------------------------------------------------------------------------
        public function sendFile(): void {
            $tipo = $_GET['type'] ?? null;
            $arquivo = $_GET['file'] ?? null;
            if (!is_string($tipo) || !is_string($arquivo) || $tipo === '' || $arquivo === '' || strpos($tipo . $arquivo, "\0") !== false) {
                http_response_code(404);
                return;
            }
            $pasta = realpath(__DIR__ . '/views/assets');
            $caminhoArquivo = $pasta === false ? false : realpath($pasta . '/' . $tipo . '/' . $arquivo);
            $extensao = $caminhoArquivo === false ? '' : strtolower(pathinfo($caminhoArquivo, PATHINFO_EXTENSION));
            if ($caminhoArquivo === false || strpos($caminhoArquivo, $pasta . DIRECTORY_SEPARATOR) !== 0
                || !is_file($caminhoArquivo) || !isset(self::TIPOS_DE_ARQUIVO[$extensao])) {
                http_response_code(404);
                return;
            }

            $tamanho = filesize($caminhoArquivo);
            $inicio = 0;
            $fim = $tamanho - 1;
            $faixa = $_SERVER['HTTP_RANGE'] ?? '';
            if ($faixa !== '') {
                if (!preg_match('/^bytes=(\d*)-(\d*)$/', $faixa, $limites) || ($limites[1] === '' && $limites[2] === '')) {
                    http_response_code(416);
                    header('Content-Range: bytes */' . $tamanho);
                    return;
                }
                if ($limites[1] === '') {
                    $inicio = max(0, $tamanho - (int) $limites[2]);   // "bytes=-500": os últimos 500 bytes
                } else {
                    $inicio = (int) $limites[1];
                    if ($limites[2] !== '') $fim = min($fim, (int) $limites[2]);
                }
                if ($inicio > $fim) {
                    http_response_code(416);
                    header('Content-Range: bytes */' . $tamanho);
                    return;
                }
                http_response_code(206);
                header('Content-Range: bytes ' . $inicio . '-' . $fim . '/' . $tamanho);
            }
            header('Content-Type: ' . self::TIPOS_DE_ARQUIVO[$extensao]);
            header('X-Content-Type-Options: nosniff');
            header('Accept-Ranges: bytes');
            header('Cache-Control: no-cache');
            header('Content-Length: ' . ($fim - $inicio + 1));
            $leitor = fopen($caminhoArquivo, 'rb');
            fseek($leitor, $inicio);
            $restante = $fim - $inicio + 1;
            while ($restante > 0) {
                $bloco = fread($leitor, min(65536, $restante));
                if ($bloco === false || $bloco === '') break;   // erro de leitura: para em vez de girar sem fim
                echo $bloco;
                $restante -= strlen($bloco);
            }
            fclose($leitor);
        }

        // ---------------------------------------------------------------------------------------------
        // BACKEND: save no banco e XP das atividades
        // ---------------------------------------------------------------------------------------------

        // GET /fazenda/xp-pendente — XP creditado no banco que o jogo ainda não aplicou.
        public function xpPendente(): void {
            $usuario = $this->exigirAluno(true);
            $this->responder(function () use ($usuario) {
                return ['xp' => (new FazendaModel())->xpPendente((int) $usuario['idUsuario'])];
            });
        }

        // POST /fazenda/salvar — corpo JSON: { revisao, xp_entregues: [ids], estado: {...} }
        public function salvar(): void {
            $usuario = $this->exigirAluno(true);
            $this->responder(function () use ($usuario) {
                // Exigir JSON impede que um formulário de outro site dispare o salvamento.
                if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) {
                    throw new InvalidArgumentException('Formato de envio inválido.');
                }
                $bruto = (string) file_get_contents('php://input');
                $dados = json_decode($bruto, true);
                if (!is_array($dados) || !isset($dados['estado']) || !is_array($dados['estado'])) {
                    throw new InvalidArgumentException('Save da fazenda ausente.');
                }
                // IMPORTANTE: o save é guardado como o jogo o enviou. Decodificar como array e codificar de novo transformaria todo
                // objeto vazio {} em lista vazia [] (no PHP os dois são o mesmo array vazio), e o jogo perderia o que gravasse depois
                // nessas chaves (instalações destruídas, melhorias da equipe, estado das invasões...). Por isso o JSON do estado
                // é recodificado a partir de OBJETOS, que preservam {} e [].
                $objeto = json_decode($bruto);
                $estadoJson = null;
                if (is_object($objeto) && isset($objeto->estado) && is_object($objeto->estado)) {
                    unset($objeto->estado->_abaId);   // marca de uma versão anterior do backend
                    $estadoJson = json_encode($objeto->estado, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    if ($estadoJson === false) {
                        $estadoJson = null;
                    }
                }
                $ids = isset($dados['xp_entregues']) && is_array($dados['xp_entregues']) ? $dados['xp_entregues'] : [];
                // "sessao": código que a página recebeu ao abrir (32 caracteres hexadecimais). Sem ele (página antiga), vira conflito.
                $sessao = isset($dados['sessao']) && is_string($dados['sessao']) && preg_match('/^[a-f0-9]{32}$/', $dados['sessao'])
                    ? $dados['sessao'] : '';
                $revisao = (new FazendaModel())->salvar(
                    (int) $usuario['idUsuario'],
                    $dados['estado'],
                    $sessao,
                    $ids,
                    $estadoJson
                );
                return ['ok' => true, 'revisao' => $revisao];
            });
        }

        // A Fazenda é só do aluno (RF12). Sem login → tela de login; instrutor → 403; chamadas JSON recebem 401.
        private function exigirAluno(bool $json = false): array {
            $usuario = usuarioLogado();
            if ($usuario !== null && ($usuario['perfilAcesso'] ?? '') === 'aluno') {
                return $usuario;
            }
            if ($json) {
                $this->json(['mensagem' => 'Sua sessão expirou. Entre novamente.'], 401);
            }
            if ($usuario !== null) {
                http_response_code(403);
                echo 'A Fazenda é exclusiva para alunos.';
                exit;
            }
            header('Location: ' . $this->baseDaAplicacao() . '/auth/loginAluno');
            exit;
        }

        private function baseDaAplicacao(): string {
            return rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
        }

        // Coloca no HTML, antes do primeiro <script>, o save do aluno e o XP pendente. O JSON sai com as
        // marcas HEX para que nenhum texto salvo (ex.: o nome da fazenda) consiga fechar a tag <script>.
        private function injetarDadosDoServidor(string $html, array $usuario, string $base): string {
            $idAluno = (int) $usuario['idUsuario'];
            $modelo = new FazendaModel();
            // estado e XP pendente lidos juntos; só uma abertura real da página (GET) vira a "sessão ativa" que pode salvar
            $carga = $modelo->carregarTudo($idAluno, ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET');

            $dados = [
                'idUsuario'  => $idAluno,
                'estado'     => $carga['estado'],
                'sessao'     => $carga['sessao'],
                'xpPendente' => $carga['xpPendente'],
                'urls'       => ['salvar' => $base . '/fazenda/salvar', 'xpPendente' => $base . '/fazenda/xp-pendente'],
            ];
            $json = json_encode($dados, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE);
            $script = '<script>window.FARMEDU_SERVIDOR = ' . $json . ';</script>' . "\n";

            $posicao = stripos($html, '<script');
            return $posicao === false ? $html : substr_replace($html, $script, $posicao, 0);
        }

        private function responder(callable $acao): void {
            try {
                $this->json($acao());
            } catch (ConflitoDeSaveException $e) {
                $this->json(['mensagem' => $e->getMessage()], 409);
            } catch (PDOException $e) {
                error_log($e->getMessage());
                $this->json(['mensagem' => 'Erro no banco de dados. Tente novamente.'], 500);
            } catch (InvalidArgumentException | RuntimeException $e) {
                $this->json(['mensagem' => $e->getMessage()], 422);
            } catch (Throwable $e) {
                error_log($e->getMessage());
                $this->json(['mensagem' => 'Erro interno. Tente novamente.'], 500);
            }
        }

        private function json(array $dados, int $codigo = 200): void {
            http_response_code($codigo);
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-store');
            echo json_encode($dados, JSON_UNESCAPED_UNICODE);
            exit;
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
