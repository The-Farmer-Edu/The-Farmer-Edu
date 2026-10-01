<?php
require_once __DIR__ . '/views/novoUsuario.php';

class UsuarioController {
    public function exibirPerfil() {
        $user = new Usuario();
        $user->nome = "Hugo";

        $professor = new Instrutor();
        $professor->id = 1;
        $professor->nome = "Ronaldo";
        $professor->email = "instrutoRonaldo@gmail.com";
        $professor->tipo = "Instrutor";
        $professor->materias_leciona = ["PHP", "Python"];

        $aluno = new Aluno();
        $aluno->id = 2;
        $aluno->nome = "Cleiton";
        $aluno->email = "alunoCleiton@gmail.com";
        $aluno->tipo = "Aluno";
        $aluno->xp_total = 150;

        $resultado = validar_login("usuaraio@gmail.com", "senha123!");

        if ($resultado['status'] === 'sucesso') {
            $aluno->definirSenha("senha123!");
        }

        require_once __DIR__ . '/views/buscarUsuario.php'; 
    }
}