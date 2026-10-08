<?php
require_once    __DIR__ . '/../atividade-09/Model.php';



class autenticarUsuario {
    public function autenticar() {
        $prof = new Instrutor(1, "Pedro", "pedrotechjf@gmail.com", "Instrutor");
        $prof->definirSenha = ("Pedro.123");
        $aluno = new Aluno(2, "Breno", "brenosantos@gmail.com", "Aluno");
        $aluno->definirSenha = ("Breno.123");
        $resultado = validar_login("brenosantos@gmail.com", "Breno.123");

        if ($resultado['status'] === 'sucesso') {
            $aluno->definirSenha("Breno.123");
        }

        

        require_once __DIR__ .'/../view/buscarUsuario.php';
        require_once __DIR__ .'/../view/novoUsuario.php';
    }

}

class adicionarUsuario {
    public function adicionar() {
        $novoUsuario = new salvar("breno", "breno@gmail.com", "senha123!", "Instrutor");
        $novoUsuario->definirEmail = ("breno@gmail.com");
        $resultado = validar_login("breno", "senha123!");
        

    }
}