<?php

 
require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';
require_once __DIR__ . '/../../core/session.php';
 
class UsuarioController
{

    public function sendFile(): void {
        $type = $_GET['type'] ?? null;
        $file = $_GET['file'] ?? null;
        $caminhoArquivo = __DIR__ . "/views/assets/$type/$file";
        if(file_exists($caminhoArquivo)) {
            // $finfo = new finfo(FILEINFO_MIME_TYPE);
            // $mimeType = $finfo->file($caminhoArquivo);
            // if (!$mimeType) {
            //     $mimeType = 'application/octet-stream';
            // }

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
        $url_live = $url_live;
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
            if (isset(pathinfo($content) ['extension']))
            {
                $content_ext = pathinfo($content) ['extension'];
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
                        if ($content_mime === null | $content_mime === "")
                        {
                            $content_mime = "application/octet-stream";
                        }
                        else
                        {
                            $content_mime = $content_mime;
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
        $content_mime = $content_mime;
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
            $usuario = match ($tipo) {
                'aluno'     => new Aluno($nome, $email, $senha),
                'instrutor' => new Instrutor($nome, $email, $senha, $this->lerMaterias()),
                default     => throw new InvalidArgumentException('Tipo de usuário inválido.'),
            };
 
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

    //só deixa entrar quem é aluno
    public function entrarAluno(): void
    {
        $this->autenticar('aluno', 'loginAluno');
    }

    //sair(logout)

    public function sair(): void
    {
        // "Descobre" o perfil antes de apagar a sessão
        $perfil = usuarioLogado()['perfilAcesso'] ?? 'instrutor';

        logout();

        header('Location: login' . ucfirst($perfil));
        exit;
    }

    

    private function autenticar(string $tipo, string $view): void
    {
        $email = (string) ($_POST['email'] ?? '');
        $senha = (string) ($_POST['senha'] ?? '');

        $mensagem = '';
        $sucesso  = false;

        try {
            $usuario = Usuario::buscarPorEmail(iniciarPDO(), $email);
            if ($usuario === null || $usuario->tipo !== $tipo || !$usuario->verificarSenha($senha)) {
                throw new InvalidArgumentException('E-mail ou senha incorretos.');
            }

            // login() é do core, gera de novo o id da sessão e guarda esses 4 
            login([
                'idUsuario'    => $usuario->id,
                'nome'         => $usuario->nome,
                'email'        => $usuario->email,
                'perfilAcesso' => $usuario->tipo, // 'aluno' ou 'instrutor'
            ]);

            $mensagem = 'Login realizado com sucesso!';
            $sucesso  = true;
        } catch (InvalidArgumentException $e) {
            $mensagem = $e->getMessage();
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $mensagem = 'Erro interno. Tente novamente.';
        }

        $this->view($view, ['mensagem' => $mensagem, 'sucesso' => $sucesso]);
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
 