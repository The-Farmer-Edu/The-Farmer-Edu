<?php

class Usuario {
    public ?int $id = null;
    public string $nome = '';
    public string $email = '';
    public string $tipo = 'aluno';
    public string $tipo_formatado = '';
    private string $senha_hash = '';

    public function __construct(string $email, string $senha = '') {
        $this->email = $email;

        if ($senha !== '') {
            $this->definirSenha($senha);
        }
    }

    public function getEmail(): string {
        return $this->email;
    }

    public function saudacao(): string {
        return "Olá, {$this->nome}!";
    }
            
    public function definirSenha(string $senha): void {
        $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
    }

    public function verificarSenha(string $senha): bool {
        return !empty($this->senha_hash) && password_verify($senha, $this->senha_hash);
    }

    public function salvar(PDO $pdo): void {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $this->nome,
            $this->email,
            $this->senha_hash,
            $this->tipo,
        ]);

        $this->id = (int) $pdo->lastInsertId();
    }

    public static function buscarPorEmail(PDO $pdo, string $email): ?self {
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $dados = $stmt->fetch(PDO::FETCH_ASSOC);

        return $dados ? self::formatarDados($dados) : null;
    }

    private static function formatarDados(array $dados): self {
        $usuario = new self($dados['email'] ?? '');
        $usuario->id = (int) ($dados['id_usuario'] ?? $dados['id'] ?? 0);
        $usuario->nome = $dados['nome'] ?? '';
        $usuario->tipo = $dados['tipo_usuario'] ?? 'aluno';
        $usuario->tipo_formatado = $usuario->tipo === 'instrutor' ? 'Instrutor' : 'Aluno';
        $usuario->senha_hash = $dados['senha_hash'] ?? '';

        return $usuario;
    }
}