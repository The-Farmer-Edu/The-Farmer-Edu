<?php

require_once __DIR__ . '/../../core/database.php';

class Usuario09 {
    public int $id;
    public string $nome;
    public string $email;
    public string $senha_hash;
    public string $tipo_usuario;

    public function __construct(string $nome, string $email, string $senha_hash, string $tipo_usuario = 'aluno') {
        $this->nome = $nome;
        $this->email = $email;
        $this->senha_hash = $senha_hash;
        $this->tipo_usuario = $tipo_usuario;
    }

    public function salvar(PDO $pdo): void {
        $sql = "INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo_usuario]);
        $this->id = (int) $pdo->lastInsertId();
    }

    public static function buscarPorEmail(PDO $pdo, string $email): ?Usuario09 {
        $sql = "SELECT id_usuario, nome, email, senha_hash, tipo_usuario FROM usuarios WHERE email = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$email]);
        
        $dados = $stmt->fetch();
        if (!$dados) {
            return null;
        }

        $usuario = new Usuario09($dados['nome'], $dados['email'], $dados['senha_hash'], $dados['tipo_usuario']);
        $usuario->id = (int) $dados['id_usuario'];
        return $usuario;
    }

    public function excluir(PDO $pdo): void {
        $sql = "DELETE FROM usuarios WHERE id_usuario = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$this->id]);
    }
}