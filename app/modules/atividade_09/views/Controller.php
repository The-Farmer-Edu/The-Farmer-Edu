<?php
require_once    __DIR__ . '/../models/Usuario.php';

class autenticarUsuario {
    public function autenticar() {
        $prof = new Instrutor(1, "Pedro", "pedrotechjf@gmail.com", "Instrutor");
        $prof->definirSenha = ("Pedro.123");
        $aluno = new Aluno(2, "Davi", "davipaiva@gmail.com", "Aluno");
        $aluno->definirSenha = ("Davi.123");
        $resultado = validar_login("davipaiva@gmail.com", "Davi.123");

        if ($resultado['status'] === 'sucesso') {
            $aluno->definirSenha("Davi.123");
        }

        require_once __DIR__ .'/../views/Usuario_view.php';
    }

}