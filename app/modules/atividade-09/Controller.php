<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';

class UsuarioController {
    public function showNovoUsuario(): void {
        $pdo = iniciarPDO();
        $mensagem = '';
        $dadosForm = [
            'nome' => '',
            'email' => '',
            'tipo' => 'aluno',
        ];

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $dadosForm['nome'] = trim($_POST['nome'] ?? '');
            $dadosForm['email'] = trim($_POST['email'] ?? '');
            $dadosForm['tipo'] = in_array($_POST['tipo'] ?? 'aluno', ['instrutor', 'aluno'], true)
                ? $_POST['tipo']
                : 'aluno';
            $senha = $_POST['senha'] ?? '';

            if ($dadosForm['nome'] !== '' && $dadosForm['email'] !== '' && $senha !== '') {
                try {
                    $usuario = new Usuario($dadosForm['email'], $senha);
                    $usuario->nome = $dadosForm['nome'];
                    $usuario->tipo = $dadosForm['tipo'];
                    $usuario->salvar($pdo);

                    $mensagem = 'Usuário cadastrado com sucesso!';
                    $dadosForm['nome'] = '';
                    $dadosForm['email'] = '';
                    $dadosForm['tipo'] = 'aluno';
                } catch (Exception $erro) {
                    $mensagem = 'Erro ao cadastrar usuário: ' . $erro->getMessage();
                }
            } else {
                $mensagem = 'Preencha nome, email e senha para continuar.';
            }
        }

        require __DIR__ . '/views/novoUsuario.php';
    }

    public function showBuscarUsuario(): void {
        $pdo = iniciarPDO();
        $resultado = null;
        $mensagem = '';

        if (isset($_GET['email'])) {
            $email = trim($_GET['email'] ?? '');

            if ($email !== '') {
                try {
                    $resultado = Usuario::buscarPorEmail($pdo, $email);
                    $mensagem = $resultado ? 'Usuário encontrado.' : 'Usuário não encontrado.';
                } catch (Exception $erro) {
                    $mensagem = 'Erro ao buscar usuário: ' . $erro->getMessage();
                }
            }
        }

        require __DIR__ . '/views/buscarUsuario.php';
    }
}