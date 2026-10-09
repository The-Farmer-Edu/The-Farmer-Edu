<?php
    class UsuarioController {
        public function validar_login(string $email, string $senha, array $usuarios): ?Usuario {
            foreach($usuarios as $usuario) {
                if ($usuario->email === $email){
                    if($usuario->verificarSenha($senha)){
                        return $usuario;
                    }
                    return null;
                }
            }
            return null;
        }

        public function showBuscarUsuario(): void {
            require_once __DIR__ . '/views/novoUsuario.php';
            require_once __DIR__ . '/views/buscarUsuario.php';
        }

        public function showNovoUsuario(): void {
            require_once __DIR__ . '/views/novoUsuario.php';
        }
    }


