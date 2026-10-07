<?php

require_once 'Model.php';

class UsuarioController {

    public function validar_login(string $email, string $senha, array $usuarios): array {

        foreach ($usuarios as $usuario) {

            if ($usuario->email === $email) {

                if ($usuario->verificarSenha($senha)) {
                    return [
                        'sucesso' => true,
                        'mensagem' => "Login bem-sucedido! Bem-vindo, {$usuario->nome}.",
                        'usuario' => $usuario
                    ];
                }

                return [
                    'sucesso' => false,
                    'mensagem' => "Email ou senha incorretos.",
                    'usuario' => null
                ];
            }
        }

        return [
            'sucesso' => false,
            'mensagem' => "Erro: Usuário não encontrado.",
            'usuario' => null
        ];
    }
}

public static function buscarPorEmail(PDO $pdo, string $email): ?Usuario {
    $sql = "SELECT * FROM usuarios WHERE email = ?";

    $stmt = $pdo->prepare($sql);
    
    $stmt->execute([$email]);
    
    $dados = $stmt->fetch();

    if ($dados === false) {
        return null;
    }
  
    $usuario = new Usuario(
        (int) $dados['id_usuario'],
        $dados['nome'],
        $dados['email'],
        $dados['tipo_usuario']
    );

    return $usuario;
}