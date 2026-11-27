<?php
    require_once __DIR__ . '/Model.php';
    require_once __DIR__ . '/../../core/database.php';
    require_once __DIR__ . '/../../core/session.php';
    require_once __DIR__ . '/../../core/arquivosEstaticos.php';

    class baseFazenda {
        // Backend: tamanho máximo do corpo de /fazenda/salvar (512 KB ≈ 100 vezes um save real; abaixo do max_allowed_packet
        // de 1 MB do MySQL do XAMPP, para o banco nunca receber um pacote que ele recusaria com erro 500).
        private const TAMANHO_MAXIMO_DO_SAVE = 512 * 1024;

        public function showFazenda(): void {
            $usuario = $this->exigirAluno();   // Backend: só aluno logado abre a fazenda
            $html = file_get_contents(__DIR__ . '/views/fazenda.html');
            // print_r($this->getFolderTree(__DIR__ . '/views/assets/audio/'));
            // exit();
            // Os <link> e <script src> do HTML são relativos ao próprio arquivo, mas a pasta views/ não é pública: pela rota,
            // cada href "assets/css/..." e src "assets/js/..." é trocado pela rota que entrega o arquivo. O resto do HTML sai
            // sem nenhuma alteração.
            $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
            $html = preg_replace_callback(
                '#href="assets/css/([0-9a-z-]+\.css)"#',
                fn(array $encontrado): string => 'href="' . htmlspecialchars($base . '/fazenda/file?type=css&file=' . $encontrado[1]) . '"',
                $html
            );
            $html = preg_replace_callback(
                '#src="assets/js/([0-9a-z-]+\.js)"#',
                fn(array $encontrado): string => 'src="' . htmlspecialchars($base . '/fazenda/file?type=js&file=' . $encontrado[1]) . '"',
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

        // ---------------------------------------------------------------------------------------------
        // Entrega de arquivos de views/assets (usada pelos áudios: fazenda/file?type=audio/Theme_songs&file=x.mp3)
        // Backend: antes, "type" e "file" eram concatenados no caminho sem validação (dava para ler arquivos fora de
        // views/assets com "../") e o arquivo era executado com require_once depois de enviado. Agora o caminho real
        // precisa ficar DENTRO de views/assets, a extensão precisa estar na lista e o arquivo é só enviado.
        // ---------------------------------------------------------------------------------------------
        public function sendFile(): void {
            $paths = ['botao-acesso-fazenda', 'css', 'js', 'audio/Theme_songs', 'audio/SFX/areas-do-jogo',
            'audio/SFX/cavalo', 'audio/SFX/galinhas', 'audio/SFX/mobs/esqueleto', 'audio/SFX/mobs/fazendeiros', 
            'audio/SFX/mobs/lenhador', 'audio/SFX/mobs/vampiro', 'audio/SFX/mobs/zumbi', 'audio/SFX/ovelhas',
             'audio/SFX/pocoes', 'audio/SFX/porcos', 'audio/SFX/segredos', 'audio/SFX/sons-do-jogo/acoes',
             'audio/SFX/sons-do-jogo/botoes-e-menu', 'audio/SFX/vacas', 

             //EASTER EGGS CAVERNA

             'easter-eggs/caverna', 'easter-eggs/caverna/_estudos', 'easter-eggs/caverna/_estudos/_fonte',
             'easter-eggs/caverna/cenario', 'easter-eggs/caverna/personagens', 
             'easter-eggs/caverna/sprites','easter-eggs/caverna/sprites/_fonte',


            //EASTER EGGS VINGADORES

            'easter-eggs/vingadores' , 'easter-eggs/vingadores/cenario', 
            'easter-eggs/vingadores/dialogos', 'easter-eggs/vingadores/personagens']


           /*  $paths = array_merge($paths, $this->getFolderTree(__DIR__ . '/views/assets/audio/'));
            $paths = array_merge($paths, $this->getFolderTree(__DIR__ . '/views/assets/easter-eggs/')); */
            enviarArquivoEstatico(__DIR__ . '/views/assets', $paths);
        }

        private function getFolderTree(string $dir, string $baseDir = ''): array {
            if ($baseDir === '') {
                $baseDir = rtrim($dir, DIRECTORY_SEPARATOR);
            }

            $items = scandir($dir);
            if ($items === false) {
                return [];
            }

            $paths = [];

            foreach ($items as $item) {
                if ($item === '.' || $item === '..') {
                    continue;
                }

                $fullPath = $dir . DIRECTORY_SEPARATOR . $item;

                if (!is_dir($fullPath)) {
                    continue;
                }

                $relativePath = ltrim(str_replace($baseDir, '', $fullPath), DIRECTORY_SEPARATOR);
                $paths[] = str_replace('\\', '/', explode('assets/', $baseDir)[1] . $relativePath);

                // Adiciona os caminhos das subpastas diretamente no mesmo array
                $paths = array_merge($paths, $this->getFolderTree($fullPath, $baseDir));
            }

            return $paths;
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
                // Limite de tamanho: um save real tem poucos KB (≈5 KB no save de referência, com 32 registros no diário). Sem
                // limite, um envio enorme gastava memória do PHP e esbarrava no max_allowed_packet do MySQL (1 MB no XAMPP).
                $bruto = (string) file_get_contents('php://input', false, null, 0, self::TAMANHO_MAXIMO_DO_SAVE + 1);
                if (strlen($bruto) > self::TAMANHO_MAXIMO_DO_SAVE) {
                    $this->json(['mensagem' => 'O save da fazenda passou do tamanho permitido.'], 413);
                }
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
            solicitarPerfilDeAcesso();
            exit;
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
                'revisao'    => $carga['revisao'],
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

    }
?>