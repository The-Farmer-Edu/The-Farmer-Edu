<?php

require_once __DIR__ . '/../../core/database.php';
require_once __DIR__ . '/Model.php';

class UsuarioController
{
    public static function showBuscarUsuario(): void
    {
        $pdo = iniciarPDO();

        $email = 'aluno@senai.com';

        $usuario = Usuario::buscarPorEmail($pdo, $email);

        require __DIR__ . '/views/buscarUsuario.php';
    }

    public static function showNovoUsuario(): void
    {
        $pdo = iniciarPDO();

        $usuario = new Usuario(
            0,
            'Aluno Teste',
            'aluno@senai.com',
            'aluno'
        );
        
        $usuarioExistente = Usuario::buscarPorEmail(
        $pdo,
        'aluno@senai.com'
        );

        if ($usuarioExistente === null) {
            $usuario->salvar($pdo);
        }   else {
               $usuario = $usuarioExistente;
        }
            $idSalvo = $usuario->id;    

        $usuarioEncontrado = Usuario::buscarPorEmail(
            $pdo,
            'aluno@senai.com'
        );

        $ataque = "' OR '1'='1";

        $resultadoAtaque = Usuario::buscarPorEmail(
            $pdo,
            $ataque
        );

        require __DIR__ . '/views/novoUsuario.php';
    }
}