<?php

require_once __DIR__ . '/../../../core/database.php';
require_once __DIR__ . '/../../../core/init_database.php';
require_once __DIR__ . '/../Model.php';

$pdo = inicializarBancoDados();

$mensagem = '';
$resultado = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';

    if ($email) {
        try {
            $resultado = Usuario09::buscarPorEmail($pdo, $email);
            if ($resultado) {
                $mensagem = "Usuário encontrado!";
            } else {
                $mensagem = "Nenhum usuário encontrado";
            }
        } catch (Exception $e) {
            $mensagem = "Erro: " . $e->getMessage();
        }
    } else {
        $mensagem = "Digite um email";
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Buscar Usuário - Atividade 09</title>
</head>
<body>
    <h1>Buscar Usuário por Email</h1>

    <?php if ($mensagem): ?>
        <p><strong><?= htmlspecialchars($mensagem) ?></strong></p>
    <?php endif; ?>

    <form method="POST">
        <p>Email: <input type="email" name="email" required></p>
        <p><button type="submit">Buscar</button></p>
    </form>

    <?php if ($resultado): ?>
        <h3>Resultado:</h3>
        <p>ID: <?= htmlspecialchars($resultado->id) ?></p>
        <p>Nome: <?= htmlspecialchars($resultado->nome) ?></p>
        <p>Email: <?= htmlspecialchars($resultado->email) ?></p>
        <p>Tipo: <?= htmlspecialchars($resultado->tipo_usuario) ?></p>
    <?php endif; ?>

    <p><a href="/atividade-09/novoUsuario">Novo Usuário</a></p>
    <p><a href="/atividade-09">Voltar</a></p>
</body>
</html>