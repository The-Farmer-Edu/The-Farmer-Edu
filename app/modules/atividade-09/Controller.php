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

        public function showBuscarUsuario(): void{
            $pdo = iniciarPDO();

            $email = "joao@gmail.com";
        
            $usuario = Usuario::buscarEmail($pdo, $email);
            
            require_once __DIR__ . '/views/buscarUsuario.php';
        }

        public function showNovoUsuario(): void{
            // $pdo = iniciarPDO();

            // $usuario = new Usuario(
            //     0,
            //     "João",
            //     "joao@gmail.com",
            //     "aluno",
            //     "123456"
            // );

            // $usuario->salvarUsuario($pdo);

            require_once __DIR__ . '/views/novoUsuario.php';
        }
    }
?>