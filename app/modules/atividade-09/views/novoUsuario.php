<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Usuário</title>
    <link rel="stylesheet" href="/Felipe/The-Farmer-Edu-Tarde/modules/atividade-09/views/style.css">
</head>
<body>
    <div class="container">
        <h1>Novo Usuário</h1>

        <?php if ($mensagem): ?>
            <div class="alert"><?= htmlspecialchars($mensagem) ?></div>
        <?php endif; ?>

        <form method="post" action="">
            <p>
                <label for="nome">Nome:</label>
                <input type="text" id="nome" name="nome" value="<?= htmlspecialchars($dadosForm['nome']) ?>" required>
            </p>

            <p>
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" value="<?= htmlspecialchars($dadosForm['email']) ?>" required>
            </p>

            <p>
                <label for="senha">Senha:</label>
                <input type="password" id="senha" name="senha" required>
            </p>

            <p>
                <label for="tipo">Tipo:</label>
                <select id="tipo" name="tipo">
                    <option value="aluno" <?= $dadosForm['tipo'] === 'aluno' ? 'selected' : '' ?>>Aluno</option>
                    <option value="instrutor" <?= $dadosForm['tipo'] === 'instrutor' ? 'selected' : '' ?>>Instrutor</option>
                </select>
            </p>

            <button type="submit">Salvar usuário</button>
        </form>

        <a href="buscarUsuario" class="nav-link">Buscar usuário existente →</a>
    </div>
</body>
</html>