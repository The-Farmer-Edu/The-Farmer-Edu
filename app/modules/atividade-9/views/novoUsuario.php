<?php

require_once __DIR__ . '/../../../core/database.php';
require_once __DIR__ . '/../../../core/init_database.php';
require_once __DIR__ . '/../Model.php';

$pdo = inicializarBancoDados();

$mensagem = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = $_POST['nome'] ?? '';
    $email = $_POST['email'] ?? '';
    $senha = $_POST['senha'] ?? '';

    if ($nome && $email && $senha) {
        try {
            $usuario = new Usuario09($nome, $email, password_hash($senha, PASSWORD_BCRYPT), 'aluno');
            $usuario->salvar($pdo);
            $mensagem = "✓ Usuário {$usuario->nome} criado com ID: {$usuario->id}";
        } catch (Exception $e) {
            $mensagem = "Erro: " . $e->getMessage();
        }
    } else {
        $mensagem = "Erro: Preencha todos os campos";
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Novo Usuário - Atividade 09</title>
</head>
<body>
    <h1>Criar Novo Usuário</h1>

    <?php if ($mensagem): ?>
        <p><strong><?= htmlspecialchars($mensagem) ?></strong></p>
    <?php endif; ?>

    <form method="POST">
        <p>Nome: <input type="text" name="nome" required></p>
        <p>Email: <input type="email" name="email" required></p>
        <p>Senha: <input type="password" name="senha" required></p>
        <p><button type="submit">Criar</button></p>
    </form>

</body>
</html>