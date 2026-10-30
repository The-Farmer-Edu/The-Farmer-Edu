<?php

 
require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';
require_once __DIR__ . '/../../core/session.php';
 
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
 