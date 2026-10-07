<?php
    require __DIR__ . '/Model.php';
    require_once __DIR__ . '/../../core/database.php';
    require_once __DIR__ . '/views/novoUsuario.php';
    require_once __DIR__ . '/views/buscarUsuario.php'; 
    
    function validar_login(string $email, string $senha): array {
        $erros = [];
        if (empty($email) || empty($senha)) {
            $erros[] = "E-mail e senha são obrigatórios";
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $erros[] = "E-mail inválido";
        }
        if (strlen($senha) < 8) {
            $erros[] = "Senha muito curta";
        }
        if (!preg_match('/[\W_]/', $senha)) {
            $erros[] = "A senha deve conter pelo menos um caracter especial";
        }
        if (!empty($erros)) {
            return ['status' => 'erro', 'mensagem' => implode(', ', $erros)];
        } else {
            return ['status' => 'sucesso', 'mensagem' => 'Login e senha válidos'];
        }
    }

    class UsuarioController {
        public function exibirPerfil() {
            $resultado = validar_login("alunoCleiton@gmail.com", "senha123!");
        }
        
    }


