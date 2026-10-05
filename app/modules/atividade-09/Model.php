<?php

    class Usuario {
        public int $id;
        public string $nome;
        public string $email;
        public string $tipo;

        private string $senha_hash;

        public function definirSenha(string $senha): void{
            $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
        }

        public function verificarSenha(string $senha_digitada): bool {
            return password_verify($senha_digitada, $this->senha_hash);
        }

        public function saudacao(): string{
            return "Olá, {$this->nome}!";
        }

        public function __construct(int $id, string $nome, string $email, string $tipo, string $senha){
            $this->id = $id;
            $this->nome = $nome;
            $this->email = $email;
            $this->tipo = $tipo;
            $this->definirSenha($senha);
        }

    }

    class Instrutor extends Usuario{
        public array $materias_lecionadas;

        public function __construct(int $id, string $nome, string $email, string $senha, array $materias_lecionadas = []){
            parent::__construct( $id, $nome, $email, 'instrutor', $senha);
            $this->materias_lecionadas = $materias_lecionadas;
        }

        public function salvar(PDO $pdo): void{
            $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)");
            $stmt->execute([$this->nome, $this->email, $this->senha_hash, 'Instrutor']);
            $this->id = (int) $pdo->lastInsertId()
        }

    }

    class Aluno extends Usuario{
        public int $xp_total;

        public function __construct(int $id, string $nome, string $email, string $senha, int $xp_total = 0){
            parent::__construct( $id, $nome,  $email, 'Aluno',  $senha);
            $this->xp_total = $xp_total;
        }
    }

    class 
?>