<?php
    require_once __DIR__ . '/Model.php';
    require_once __DIR__ . '/../../core/database.php';

    class UsuarioController {
        public function validar_login(string $email, string $senha, array $usuarios): ?Usuario {
            foreach ($usuarios as $usuario) {
                if ($usuario->email === $email) {
                    if ($usuario->verificarSenha($senha)) {
                        return $usuario;
                    }
                    return null;
                }
            }
            return null;
        }

        public function showBuscarUsuario(): void {

            $pdo = iniciarPDO();

            $email = "joao@gmail.com";
    
            $usuario = Usuario::buscarPorEmail($pdo, $email);

            $emailAtaque = "' OR '1'='1";

            $usuarioAtaque = Usuario::buscarPorEmail($pdo, $emailAtaque);

            require_once __DIR__ . '/views/buscarUsuario.php';
        }

        public function showNovoUsuario(): void {

            $pdo = iniciarPDO();

            $email = "joao@gmail.com";

            $usuarioExistente = Usuario::buscarPorEmail($pdo, $email);

            if ($usuarioExistente === null) {

                $usuarioNovo = new Usuario(
                    0,
                    "João",
                    $email,
                    "aluno",
                    "123456"
                );

                $usuarioNovo->salvar($pdo);

                $mensagem = "Usuário salvo com sucesso!";
            } else {
                $usuarioNovo = $usuarioExistente;

                $mensagem = "Esse e-mail já está cadastrado.";
            }
            
            require_once __DIR__ . '/views/novoUsuario.php';
        }
    }
?>