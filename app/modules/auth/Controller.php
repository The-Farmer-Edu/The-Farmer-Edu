<?php

 
require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';
require_once __DIR__ . '/../../core/session.php';
require_once __DIR__ . '/Sessao.php';
 
class UsuarioController
{
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

        header('Location: login' . ucfirst($perfil));
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