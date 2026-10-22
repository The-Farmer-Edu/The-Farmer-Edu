<?php

 
require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';
 
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
 