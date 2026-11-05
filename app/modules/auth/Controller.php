<?php

 
require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';
require_once __DIR__ . '/../../core/session.php';
require_once __DIR__ . '/sessao.php';

class UsuarioController
{

    public function sendFile(): void {
            $type = $_GET['type'] ?? null;
            $file = $_GET['file'] ?? null;
            $caminhoArquivo = __DIR__ . "/views/assets/$type/$file";
            if(file_exists($caminhoArquivo)) {
                $mimeType = $this->
                get_content_mime_type($caminhoArquivo);

                // header("Content-Type: " . $mimeType);
                // header("X-Content-Type-Options: nosniff");
                // header("Content-Length: " . filesize($caminhoArquivo));

                // require_once $caminhoArquivo;

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
                header('Content-Type: ' . $mimeType);
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

    // só o formulário vazio
    public function showNovoUsuario(): void
    {
        $this->view('novoUsuario');
    }
 
    //recebe o formulário e mostra na tela
    public function novoUsuario(): void
    {
        $nome  = (string) ($_POST['nome'] ?? '');
        $email = (string) ($_POST['email'] ?? '');
        $senha = (string) ($_POST['senha'] ?? '');
        $tipo  = (string) ($_POST['tipo'] ?? '');
 
        $mensagem = '';
        $sucesso  = false;
 
        try {
            // $usuario = match ($tipo) {
            //     'aluno'     => new Aluno($nome, $email, $senha),
            //     'instrutor' => new Instrutor($nome, $email, $senha, $this->lerMaterias()),
            //     default     => throw new InvalidArgumentException('Tipo de usuário inválido.'),
            // };

            switch ($tipo){
                case 'aluno':
                    $usuario = new Aluno($nome, $email, $senha);
                    break;
                case 'instrutor':
                    $usuario = new Instrutor($nome, $email, $senha, $this->lerMaterias());
                    break;
                default:
                    throw new InvalidArgumentException('Tipo de usuário inválido.');
            }

            $usuario->salvar(iniciarPDO());
 
            $mensagem = 'Cadastro realizado com sucesso!';
            $sucesso  = true;
        } catch (InvalidArgumentException $e) {
            // dado inválido: nome vazio, email inválido, senha curta etc
            $mensagem = $e->getMessage();
        } catch (RuntimeException $e) {
            // ex: email já cadastrado
            $mensagem = $e->getMessage();
        } catch (Throwable $e) {
            //qualquer outro erro
            error_log($e->getMessage());
            $mensagem = 'Erro interno. Tente novamente.';
        }
 
        $this->view('novoUsuario', ['mensagem' => $mensagem, 'sucesso' => $sucesso]);
    }

    //login do instrutor
    
    public function showLoginInstrutor(): void
    {
        $this->view('loginInstrutor');
    }

    //só deixa entrar quem é instrutor
    public function entrarInstrutor(): void
    {
        $this->autenticar('instrutor', 'loginInstrutor');
    }

    //login aluno
    public function showLoginAluno(): void
    {
        $this->view('loginAluno');
    }

    public function showTesteEmail(): void
    {
        $this->view('testeEmail');
    }
    //só deixa entrar quem é aluno
    public function entrarAluno(): void
    {
        $this->autenticar('aluno', 'loginAluno');
    }



    // Só deixa passar quem está logado (e com a sessão dentro das 4h)
    private function exigirLogin(): array{
        $logado  = usuarioLogado();
        $destino = ($logado['perfilAcesso'] ?? 'aluno') === 'instrutor' ? 'loginInstrutor' : 'loginAluno';

        // sessão vencida: volta pro login do mesmo perfil, avisando que expirou
        if (sessaoExpirouPorInatividade()) {
            header('Location: ' . $destino . '?expirou=1');
            exit;
        }
        if ($logado === null) {
            header('Location: loginAluno');
            exit;
        }
        return $logado;
    }

    public function showEditarConta(): void {
        $logado  = $this->exigirLogin();
        $usuario = Usuario::buscarPorId(iniciarPDO(), (int) $logado['idUsuario']);

        if ($usuario === null || !$usuario->ativo) {
            logout();
            header('Location: loginAluno');
            exit;
        }

        $this->view('editarConta', ['dados' => ['nome' => $usuario->nome, 'email' => $usuario->email]]);
    }

    public function editarConta(): void{
        $logado     = $this->exigirLogin();
        $dados      = ['nome' => (string) ($_POST['nome'] ?? ''), 'email' => (string) ($_POST['email'] ?? '')];
        $senhaAtual = (string) ($_POST['senha_atual'] ?? '');
        $novaSenha  = (string) ($_POST['nova_senha'] ?? '');

        $mensagem = '';
        $sucesso  = false;

        try {
            $pdo     = iniciarPDO();
            $usuario = Usuario::buscarPorId($pdo, (int) $logado['idUsuario']);

            if ($usuario === null || !$usuario->ativo) {
                throw new RuntimeException('Conta não encontrada.');
            }
            if (!$usuario->verificarSenha($senhaAtual)) {
                throw new InvalidArgumentException('Senha atual incorreta.');
            }

            $usuario->atualizarDados($pdo, $dados['nome'], $dados['email'], $novaSenha);

            // mantém a sessão igual ao banco
            $_SESSION['usuario']['nome']  = $usuario->nome;
            $_SESSION['usuario']['email'] = $usuario->email;

            $dados    = ['nome' => $usuario->nome, 'email' => $usuario->email];
            $mensagem = 'Dados atualizados com sucesso!';
            $sucesso  = true;
        } catch (InvalidArgumentException | RuntimeException $e) {
            $mensagem = $e->getMessage();
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $mensagem = 'Erro interno. Tente novamente.';
        }

        $this->view('editarConta', ['dados' => $dados, 'mensagem' => $mensagem, 'sucesso' => $sucesso]);
    }

    public function showDesativarConta(): void{
        $this->exigirLogin();
        $this->view('desativarConta');
    }

    public function desativarConta(): void{
        $logado     = $this->exigirLogin();
        $senhaAtual = (string) ($_POST['senha_atual'] ?? '');

        $mensagem = '';
        $sucesso  = false;

        try {
            $pdo     = iniciarPDO();
            $usuario = Usuario::buscarPorId($pdo, (int) $logado['idUsuario']);

            if ($usuario === null || !$usuario->ativo) {
                throw new RuntimeException('Conta não encontrada.');
            }
            if (!$usuario->verificarSenha($senhaAtual)) {
                throw new InvalidArgumentException('Senha incorreta.');
            }

            $usuario->desativar($pdo);
            logout(); // encerra a sessão: a conta não pode mais ficar logada

            $mensagem = 'Conta desativada com sucesso.';
            $sucesso  = true;
        } catch (InvalidArgumentException | RuntimeException $e) {
            $mensagem = $e->getMessage();
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $mensagem = 'Erro interno. Tente novamente.';
        }

        $this->view('desativarConta', ['mensagem' => $mensagem, 'sucesso' => $sucesso]);
    }

    //sair(logout)
    public function sair(): void
    {
        // "Descobre" o perfil antes de apagar a sessão
        $perfil = usuarioLogado()['perfilAcesso'] ?? 'instrutor';

        logout();

        $rotaLogin = ($perfil === 'instrutor') ? '/auth/loginInstrutor' : '/auth/loginAluno';
        redirecionarParaRota($rotaLogin);
    }

    
    private function autenticar(string $tipo, string $view): void {
        $email = (string) ($_POST['email'] ?? '');
        $senha = (string) ($_POST['senha'] ?? '');

        $mensagem = '';
        $sucesso = false;
        
        try {
        $pdo = iniciarPDO();
        $usuario = Usuario::buscarPorEmail($pdo, $email);

        if ($usuario === null || $usuario->tipo !== $tipo) {
        throw new InvalidArgumentException('E-mail ou senha incorretos.');
        }

        $usuario->liberarSeBloqueioExpirou($pdo);
        $segundos = $usuario->segundosDeBloqueio($pdo);
        if ($segundos > 0) {
        throw new InvalidArgumentException($this->mensagemBloqueio($segundos));
        }

        if (!$usuario->verificarSenha($senha)) {
            $restantes = $usuario->registrarFalhaLogin($pdo);
            if ($restantes === 0) {
            throw new InvalidArgumentException($this->mensagemBloqueio(Usuario::MINUTOS_BLOQUEIO * 60));
            }
            throw new InvalidArgumentException('E-mail ou senha incorretos. Você ainda tem ' . $restantes . ' ' . ($restantes === 1 ? 'tentativa' : 'tentativas') . '.');
            }

            if (!$usuario->ativo) {
                throw new InvalidArgumentException('Esta conta está desativada.');
            }

            $usuario->zerarTentativasLogin($pdo);
            login([
            'idUsuario' => $usuario->id,
            'nome' => $usuario->nome,
            'email' => $usuario->email,
            'perfilAcesso' => $usuario->tipo,
            ]);

            registrarAtividadeSessao();
            $mensagem = 'Login realizado com sucesso!';
            $sucesso = true;
            } catch (InvalidArgumentException $e) {
            $mensagem = $e->getMessage();
            } catch (Throwable $e) {
            error_log($e->getMessage());
            $mensagem = 'Erro interno. Tente novamente.';
            }

            $this->view($view, ['mensagem' => $mensagem, 'sucesso' => $sucesso]);
            }

            private function mensagemBloqueio(int $segundos): string {
            $minutos = max(1, (int) ceil($segundos / 60));
            return 'Muitas tentativas incorretas. Tente novamente em ' . $minutos . ' ' . ($minutos === 1 ? 'minuto' : 'minutos') . '.';
            }

    private function lerMaterias(): array
    {
        $bruto = $_POST['materias'] ?? [];
 
        if (is_string($bruto)) {
            $bruto = explode(',', $bruto); // "PHP, SQL" vira ["PHP", " SQL"]
        }
        if (!is_array($bruto)) {
            return [];
        }
 
        // trim em cada item e descarta os vazios
        return array_values(array_filter(array_map(
            static fn($m) => is_string($m) ? trim($m) : '',
            $bruto
        )));
    }
 
    //$dados vira variáveis dentro dela ($mensagem, $sucesso)
    private function view(string $nome, array $dados = []): void
    {
        extract($dados);
        require __DIR__ . '/views/' . $nome . '.php';
    }
}
