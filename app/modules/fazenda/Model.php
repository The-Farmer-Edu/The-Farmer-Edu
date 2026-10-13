<?php

class Usuario
{
    public int $id;
    public string $nome;
    public string $email;
    public string $tipo;
    private string $senha_hash;

    public function __construct(string $nome, string $email, string $tipo, string $senha = "")
    {
        $this->nome  = $nome;
        $this->email = $email;
        $this->tipo  = $tipo;
        if(!empty($senha)) {
            $this->definirSenha($senha);
        }
    }

    public function saudacao(): string
    {
        return "Olá, " . $this->nome . "!";
    }

    public function definirSenha(string $senha): void
    {
        $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
    }

    public function verificarSenha(string $senha): bool
    {
        return password_verify($senha, $this->senha_hash);
    }

    public function salvar(PDO $pdo): void {
        $stmt = $pdo->prepare(
            "INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)");
        $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
        $this->id = (int) $pdo->lastInsertId();
    }

    public static function buscarPorEmail(PDO $pdo, string $email): ?self {
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $dados = $stmt->fetch(PDO::FETCH_ASSOC);
        return $dados ? self::formatarDados($dados) : null;
    }


    private static function formatarDados(array $dados): self {
        $usuario = new self(
            $dados['nome'],
            $dados['email'],
            $dados['tipo_usuario']
        );
        $usuario->id = (int) $dados['id_usuario'];
        $usuario->senha_hash = $dados['senha_hash'];
        return $usuario;
    }


    public function excluir(PDO $pdo): void {
        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id_usuario = ?");
        $stmt->execute([$this->id]);
    }
}

class Aluno extends Usuario{
    public $xp_total = 0;
}

class Instrutor extends Usuario{
    public $materias_leciona = [];
}

