<?php

class Usuario {
    public ?int $id = null;
    public string $nome;
    public string $email;
    public string $senha;

    public function __construct(string $nome = '', string $email = '', string $senha = '', ?int $id = null) {
        $this->nome = $nome;
        $this->email = $email;
        $this->senha = $senha;
        $this->id = $id;
    }

    public function salvar(PDO $pdo): bool {
        $sql = "INSERT INTO usuarios (nome, email, senha) VALUES (:nome, :email, :senha)";
        $stmt = $pdo->prepare($sql);
        
        $sucesso = $stmt->execute([
            ':nome' => $this->nome,
            ':email' => $this->email,
            ':senha' => $this->senha
        ]);

        if ($sucesso) {
            $this->id = (int)$pdo->lastInsertId();
        }

        return $sucesso;
    }

    public static function buscarPorEmail(PDO $pdo, string $email): ?Usuario {
        $sql = "SELECT * FROM usuarios WHERE email = :email LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':email' => $email]);

        $dados = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$dados) {
            return null;
        }

        return new Usuario(
            $dados['nome'],
            $dados['email'],
            $dados['senha'],
            (int)$dados['id']
        );
    }

    public function excluir(PDO $pdo): void {
        if ($this->id !== null) {
            $sql = "DELETE FROM usuarios WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':id' => $this->id]);
            $this->id = null;
        }
    }
}