<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscar Usuário</title>
    <link rel="stylesheet" href="/Felipe/The-Farmer-Edu-Tarde/modules/atividade-09/views/style.css">
</head>
<body>
    <div class="container">
        <h1>Buscar Usuário</h1>

        <form method="get" action="">
            <p>
                <label for="email">Digite o e-mail:</label>
                <input type="email" id="email" name="email" value="<?= htmlspecialchars($_GET['email'] ?? '') ?>" required>
            </p>
            <button type="submit">Buscar</button>
        </form>

        <?php if ($mensagem): ?>
            <div class="alert"><?= htmlspecialchars($mensagem) ?></div>
        <?php endif; ?>

        <?php if ($resultado): ?>
            <h2>Resultado da busca</h2>
            <div class="result-card">
                <p><strong>ID:</strong> <?= htmlspecialchars((string) $resultado->id) ?></p>
                <p><strong>Nome:</strong> <?= htmlspecialchars($resultado->nome) ?></p>
                <p><strong>Email:</strong> <?= htmlspecialchars($resultado->email) ?></p>
                <p><strong>Tipo:</strong> <?= htmlspecialchars($resultado->tipo_formatado ?: $resultado->tipo) ?></p>
            </div>
        <?php endif; ?>

        <a href="novoUsuario" class="nav-link">← Cadastrar novo usuário</a>
    </div>
</body>
</html>