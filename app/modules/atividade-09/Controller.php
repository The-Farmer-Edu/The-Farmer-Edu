<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';

class UsuarioController
{
    public function showNovoUsuario(): void
    {
        $pdo = iniciarPDO();

        $email = 'teste1@senai.com';
        $usuario = new Usuario('Hendrick', $email, 'Senha123', 'aluno');
        $usuario->definirSenha('123456');
        $usuario->salvar($pdo);
        echo "Teste 1 - ID gerado: " . $usuario->id . "<br>";

        require __DIR__ . '/views/novoUsuario.php';
    }

    public function showBuscarUsuario(): void
    {
        $pdo = iniciarPDO();
        
        $email = 'teste1@senai.com';

        $usuario = Usuario::buscarPorEmail($pdo, $email);
        if ($usuario !== null) {
            echo "Teste 2 - OK<br>";
            print_r($usuario);
        } else {
            echo "Teste 2 - ERRO<br>";
        }

        $ataque = Usuario::buscarPorEmail($pdo, "' OR '1'='1");
        echo $ataque === null ? "Teste 3 - OK, retornou null<br>" : "Teste 3 - ERRO<br>";

        $usuario->excluir($pdo);
        echo "Bônus - usuário excluído<br>";

        require __DIR__ . '/views/buscarUsuario.php';
    }
}