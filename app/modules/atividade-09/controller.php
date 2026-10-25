<?php

require_once __DIR__ . '/../model.php';

class BancoDeDados
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = new PDO(
            "mysql:host=localhost;dbname=the-framer-edu;charset=utf8",
            "root",
            ""
        );

        $this->pdo->setAttribute(
            PDO::ATTR_ERRMODE,
            PDO::ERRMODE_EXCEPTION
        );
    }

    public function getConexao(): PDO
    {
        return $this->pdo;
    }
}

$banco = new BancoDeDados();
$pdo = $banco->getConexao();
$usuario = new Usuario(
    0,
    "João",
    "joao@email.com",
    "aluno"
);

$usuario->definirsenha_hash("123456");

$usuario->salvar($pdo);


// Confirmando se o ID foi preenchido
echo "Usuário salvo com sucesso!<br>";
echo "ID gerado: " . $usuario->id;

public static function buscarPorEmail(PDO $pdo, string $email): ?self
{
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);

    $dados = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$dados) {
        return null;
    }

    $usuario = new self(
        (int) $dados['id'],
        $dados['nome'],
        $dados['email'],
        $dados['tipo_usuario']
    );

    return $usuario;
}

?>
