<?php
class Usuario {
    public ?int $id = null;
    public string $nome;
    public string $email;
    public string $tipo;
    protected string $senha_hash;

    public function __construct(string $nome, string $email, string $tipo, string $senha) {
        $this->nome = $nome;
        $this->email = $email;
        $this->tipo = $tipo;
        $this->definirSenha($senha);
    }

    public function saudacao(): string {
        return "Olá {$this->nome}!";
    }

    public function definirSenha(string $senha): void {
        $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
    }

    public function verificarSenha(string $senha): bool {
        return password_verify($senha, $this->senha_hash);
    }

    public function salvar(PDO $pdo): void {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)");
        $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
        $this->id = (int) $pdo->lastInsertId();

    }

    public static function buscarPorEmail(PDO $pdo, string $email): ?self {
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $dados = $stmt->fetch();
        return $dados ? self::formatarDados($dados) : null;
    }

    protected static function formatarDados(array $dados): self {
        switch ($dados['tipo_usuario']) {
            case 'instrutor':
                $usuario = new Instrutor($dados['nome'], $dados['email'], $dados['tipo_usuario'], '');
                break;
            case 'aluno':
                $usuario = new Aluno($dados['nome'], $dados['email'], $dados['tipo_usuario'], '');
                break;
            default:
                $usuario = new self($dados['nome'], $dados['email'], $dados['tipo_usuario'], '');
                break;
        }

        $usuario->id = (int) $dados['id_usuario'];
        $usuario->senha_hash = $dados['senha_hash'];

        return $usuario;
    }

}

class Instrutor extends Usuario {
    public array $materias_leciona = [];

    public function saudacao(): string {
        return "Olá, Professor(a) {$this->nome}!<br>";
    }
    public function __construct(string $nome, string $email, string $tipo, string $senha, array $materias_leciona) {
        parent::__construct($nome, $email, $tipo, $senha);
        $this->materias_leciona = $materias_leciona;
    }
}

class Aluno extends Usuario {
    public int $xp_total = 0;
    public function saudacao(): string {
        return "Olá, Aluno(a) {$this->nome}!<br>";
    }
    public function __construct(string $nome, string $email, string $tipo, string $senha, int $xp_total = 0) {
        parent::__construct($nome, $email, $tipo, $senha);
        $this->xp_total = $xp_total;
    }
}

