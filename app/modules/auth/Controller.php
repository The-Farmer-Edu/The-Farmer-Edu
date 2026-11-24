<?php

 
require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';
require_once __DIR__ . '/../../core/session.php';
require_once __DIR__ . '/../../core/arquivosEstaticos.php';
require_once __DIR__ . '/sessao.php';
require_once __DIR__ . '/enviadorEmail.php';

class UsuarioController
{

    // Entrega os CSS e as imagens das telas de login/conta (rota auth/file&type=css|images&file=nome.ext).
    // Usa a função segura do core: só nomes simples, só as subpastas abaixo, só tipos estáticos, nunca executa o arquivo.
    // (Antes o caminho era montado direto com type/file e o arquivo ainda passava por require_once: com "../" dava para
    // ler qualquer arquivo do servidor, inclusive o .env com a senha do banco. A consulta remota de tipos MIME em
    // svn.apache.org, feita a cada pedido, também saiu: a lista de tipos agora é local.)
    public function sendFile(): void {
        enviarArquivoEstatico(__DIR__ . '/views/assets', ['css', 'images']);
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

    //recuperação de senha 
    //pedir o código por e-mail
    public function showEsqueciSenha(): void{
        $this->view('esqueciSenha');
    }

    public function solicitarCodigo(): void {
        $email = strtolower(trim((string) ($_POST['email'] ?? '')));

        try {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException('Informe um e-mail válido.');
            }

            iniciarSessao();
            $idRecuperacao = (int) ($_SESSION['recuperacao']['id'] ?? 0);

            $pdo     = iniciarPDO();
            $usuario = Usuario::buscarPorEmail($pdo, $email);

            // só envia se a conta existe,ta ativa e o tempo de reenvio passou
            // a resposta da tela é a mesma em todos os casos 
            if ($usuario !== null && $usuario->ativo
                && RecuperacaoSenha::segundosParaReenviar($pdo, $usuario->id) === 0) {
                $pedido = RecuperacaoSenha::criar($pdo, $usuario->id);
                try {
                    EnviadorEmail::enviarCodigoRecuperacao($usuario->email, $usuario->nome, $pedido['codigo']);
                } catch (Throwable $e) {
                    RecuperacaoSenha::apagar($pdo, $pedido['id']);
                    throw $e;
                }
                $idRecuperacao = $pedido['id'];
            }

            $_SESSION['recuperacao'] = ['id' => $idRecuperacao, 'verificado' => false];
            header('Location: verificarCodigo');
            exit;
        } catch (InvalidArgumentException $e) {
            $mensagem = $e->getMessage();
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $mensagem = 'Erro real: ' . $e->getMessage();
        }

        $this->view('esqueciSenha', ['mensagem' => $mensagem]);
    }

    //digitar o código recebido
    public function showVerificarCodigo(): void {
        iniciarSessao();
        if (!isset($_SESSION['recuperacao'])) {
            header('Location: esqueciSenha');
            exit;
        }
        $this->view('verificarCodigo');
    }

    public function verificarCodigo(): void {
        iniciarSessao();
        if (!isset($_SESSION['recuperacao'])) {
            header('Location: esqueciSenha');
            exit;
        }

        try {
            RecuperacaoSenha::validar(iniciarPDO(), (int) $_SESSION['recuperacao']['id'], (string) ($_POST['codigo'] ?? ''));

            // o verificado fica na sessão: só esse navegador pode abrir a tela da nova senha
            $_SESSION['recuperacao']['verificado'] = true;
            session_regenerate_id(true);
            header('Location: redefinirSenha');
            exit;
        } catch (InvalidArgumentException $e) {
            $mensagem = $e->getMessage();
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $mensagem = 'Erro interno. Tente novamente.';
        }

        $this->view('verificarCodigo', ['mensagem' => $mensagem]);
    }

    // definir a nova senha (com o código já validado)
    private function usuarioDaRecuperacao(): ?int {
        iniciarSessao();
        $recuperacao = $_SESSION['recuperacao'] ?? null;
        if ($recuperacao === null || empty($recuperacao['verificado'])) {
            return null;
        }
        return RecuperacaoSenha::buscarIdUsuario(iniciarPDO(), (int) $recuperacao['id']);
    }

    public function showRedefinirSenha(): void {
        if ($this->usuarioDaRecuperacao() === null) {
            header('Location: esqueciSenha');
            exit;
        }
        $this->view('redefinirSenha');
    }

    public function redefinirSenha(): void {
        $idUsuario = $this->usuarioDaRecuperacao();
        if ($idUsuario === null) {
            header('Location: esqueciSenha');
            exit;
        }

        $novaSenha   = (string) ($_POST['nova_senha'] ?? '');
        $confirmacao = (string) ($_POST['confirmar_senha'] ?? '');

        $mensagem     = '';
        $sucesso      = false;
        $destinoLogin = 'loginAluno';

        try {
            if ($novaSenha !== $confirmacao) {
                throw new InvalidArgumentException('As senhas não coincidem.');
            }

            $pdo     = iniciarPDO();
            $usuario = Usuario::buscarPorId($pdo, $idUsuario);

            if ($usuario === null || !$usuario->ativo) {
                throw new RuntimeException('Conta não encontrada.');
            }

            $usuario->redefinirSenha($pdo, $novaSenha);
            $usuario->zerarTentativasLogin($pdo); // quem esqueceu a senha pode estar bloqueado por tentativas

            RecuperacaoSenha::apagar($pdo, (int) $_SESSION['recuperacao']['id']);
            unset($_SESSION['recuperacao']);

            $destinoLogin = $usuario->tipo === 'instrutor' ? 'loginInstrutor' : 'loginAluno';
            $mensagem     = 'Senha redefinida com sucesso!';
            $sucesso      = true;
        } catch (InvalidArgumentException | RuntimeException $e) {
            $mensagem = $e->getMessage();
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $mensagem = 'Erro interno. Tente novamente.';
        }

        $this->view('redefinirSenha', ['mensagem' => $mensagem, 'sucesso' => $sucesso, 'destinoLogin' => $destinoLogin]);
    }

   //sair(logout)
    public function sair(): void
    {
        // "Descobre" o perfil antes de apagar a sessão
        $perfil = usuarioLogado()['perfilAcesso'] ?? 'instrutor';

        logout();

        $rotaLogin = ($perfil === 'instrutor') ? 'loginInstrutor' : 'loginAluno';
        header("Location: $rotaLogin");
        exit;
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

            $uri = $_SERVER['REQUEST_URI'];
            if(!$_GET['redirect']){
                $rota = '/turmas_cursos/' . $usuario->tipo;
                if (str_contains($uri, "public")){
                    $uri = explode('/public/', $uri)[0] . '/public' . $rota;
                } else {
                    $uri = $rota;
                }
            } else {
                $uri = $_GET['redirect'];
            }
            header("Location: $uri");
            exit;

        } catch (InvalidArgumentException $e) {
            $mensagem = $e->getMessage();
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $mensagem = 'Erro real: ' . $e->getMessage();
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
