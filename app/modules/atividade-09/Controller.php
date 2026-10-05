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
    public function salvarUsuario(PDO $pdo): void {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)");
        $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
        $this->id = (int) $pdo->lastInsertId();
    }

    public static function buscarEmail(PDO $pdo, string $email): ?self{
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $usuario = $stmt->fetch();
        }
    }
   
?>