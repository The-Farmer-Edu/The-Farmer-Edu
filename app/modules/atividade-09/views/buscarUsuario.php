<?php
$mensagem = $mensagem ?? '';
$resultado = $resultado ?? null;
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscar Usuário</title>
</head>
<body>
    <h1>Buscar Usuário</h1>

    <form method="get" action="">
        <label for="email">Digite o e-mail:</label><br>
        <input type="email" id="email" name="email" required>
        <button type="submit">Buscar</button>
    </form>

    <?php if ($mensagem): ?>
        <p><?= htmlspecialchars($mensagem) ?></p>
    <?php endif; ?>

    <?php if ($resultado): ?>
        <h2>Resultado da busca</h2>
        <p><strong>ID:</strong> <?= htmlspecialchars((string) $resultado->id) ?></p>
        <p><strong>Nome:</strong> <?= htmlspecialchars($resultado->nome) ?></p>
        <p><strong>Email:</strong> <?= htmlspecialchars($resultado->email) ?></p>
        <p><strong>Tipo:</strong> <?= htmlspecialchars($resultado->tipo_formatado ?: $resultado->tipo) ?></p>
    <?php endif; ?>

    <p><a href="novoUsuario">Cadastrar novo usuário</a></p>
</body>
</html>
