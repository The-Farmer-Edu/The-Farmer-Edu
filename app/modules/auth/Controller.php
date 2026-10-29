<?php

 
require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';
require_once __DIR__ . '/../../core/session.php';
require_once __DIR__ . '/sessao.php';

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

    private function exigirLogin(): array{
         if (sessaoExpirouPorInatividade() || usuarioLogado() === null) {
        header('Location: loginAluno');
        exit;
     }
    return usuarioLogado();
    }

    public function showEditarConta(): void{
        $logado = $this->exigirLogin();
        $usuario = Usuario::buscarPorId(iniciarPDO(), (int) $logado['idUsuario']);
        if ($usuario === null || !$usuario->ativo) {
        logout();
        header('Location: loginAluno');
        exit;
        }
    }

    $this->view('editarConta', ['dados' => ['nome' => $usuario->nome, 'email' => $usuario->email]]); }
        public function editarConta(): void {
        $logado = $this->exigirLogin();
        $dados = ['nome' => (string) ($_POST['nome'] ?? ''), 'email' => (string) ($_POST['email'] ?? '')];
        $senhaAtual = (string) ($_POST['senha_atual'] ?? '');
        $novaSenha = (string) ($_POST['nova_senha'] ?? '');
        $mensagem = '';
        $sucesso = false;

    private function
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
 


