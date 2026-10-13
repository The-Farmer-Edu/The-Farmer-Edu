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

    public function showNivelUsuario(): void
    {
        $pdo = iniciarPDO();

        $xp_total = 120;
        $limite_medio = 100;
        $limite_maximo = 250;

        if ($xp_total >= $limite_maximo) {
            $foto_nivel = BASE_URL . "/assets/fazenda/hacker.jpg";
            $alt_texto = "Nível Máximo";
        } elseif ($xp_total >= $limite_medio) {
            $foto_nivel = BASE_URL . "/assets/fazenda/pro.jpg";
            $alt_texto = "Nível Médio";
        } else {
            $foto_nivel = BASE_URL . "/assets/fazenda/noob.jpg";
            $alt_texto = "Nível Básico";
        }

        require __DIR__ . '/views/testarApi.php';
    }
}