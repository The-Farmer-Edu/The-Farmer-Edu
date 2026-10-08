<?php
    class Usuario {
        public int $id;
        public string $nome;
        public string $email;
        public string $tipo;

        private string $senha_hash;

        public function definirSenha(string $senha): void {
            $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
        }

        public function verificarSenha(string $senha_digitada): bool {
            return password_verify($senha_digitada, $this->senha_hash);
        }

        public function saudacao(): string {
            return "Olá, {$this->nome}!";
        }

        public function __construct(int $id, string $nome, string $email, string $tipo, string $senha) {
            $this->id = $id;
            $this->nome = $nome;
            $this->email = $email;
            $this->tipo = $tipo;
            $this->definirSenha($senha);
        }

        public function salvar(PDO $pdo): void {
            $sql = "INSERT INTO usuarios (nome, email, tipo_usuario, senha_hash) VALUES (?, ?, ?, ?)";

            $stmt = $pdo->prepare($sql);

            $stmt->execute([
                $this->nome,
                $this->email,
                $this->tipo,
                $this->senha_hash
            ]);

            $this->id = (int) $pdo->lastInsertId();
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
                $dados['tipo_usuario'],
                ''
            );

            $usuario->senha_hash = $dados['senha_hash'];

            return $usuario;
        }

        public function excluir(PDO $pdo): void {
            $sql = "DELETE FROM usuarios WHERE id_usuario = ?";

            $stmt = $pdo->prepare($sql);

            $stmt->execute([$this->id]);
        }
    }
    
        class Instrutor extends Usuario {
            public array $materias_leciona;

            public function __construct(int $id, string $nome, string $email, string $senha, array $materias_leciona = []) {
                parent::__construct($id, $nome, $email, "instrutor", $senha);
                $this->materias_leciona = $materias_leciona;
            }
        }

        class Aluno extends Usuario {
            public int $xp_total;

            public function __construct(int $id, string $nome, string $email, string $senha, int $xp_total = 0) {
                parent::__construct($id, $nome, $email, "aluno", $senha);
                $this->xp_total = $xp_total;
            }
        }
?>