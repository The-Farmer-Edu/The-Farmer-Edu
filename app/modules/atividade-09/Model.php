<?php

class Usuario
{
    public int $id;
    public string $nome;
    public string $email;
    public string $tipo;

    public function __construct(
        int $id = 0,
        string $nome = '',
        string $email = '',
        string $tipo = ''
    ) {
        $this->id = $id;
        $this->nome = $nome;
        $this->email = $email;
        $this->tipo = $tipo;
    }

    public function salvar(PDO $pdo): void
    {
        $sql = "INSERT INTO usuarios (nome, email, tipo)
                VALUES (:nome, :email, :tipo)";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ':nome' => $this->nome,
            ':email' => $this->email,
            ':tipo' => $this->tipo
        ]);

        $this->id = (int) $pdo->lastInsertId();
    }

    public static function buscarPorEmail(PDO $pdo, string $email): ?Usuario
    {
        $sql = "SELECT id, nome, email, tipo
                FROM usuarios
                WHERE email = :email";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ':email' => $email
        ]);

        $dados = $stmt->fetch();

        if ($dados === false) {
            return null;
        }

        return new Usuario(
            (int) $dados['id'],
            $dados['nome'],
            $dados['email'],
            $dados['tipo']
        );
    }

    public function excluir(PDO $pdo): void
    {
        $sql = "DELETE FROM usuarios WHERE id = :id";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ':id' => $this->id
        ]);
    }
}