<?php
$mensagem = $mensagem ?? '';
$dadosForm = $dadosForm ?? ['nome' => '', 'email' => '', 'tipo' => 'aluno'];
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Usuário</title>
</head>
<body>
    <h1>Novo Usuário</h1>

    <?php if ($mensagem): ?>
        <p><?= htmlspecialchars($mensagem) ?></p>
    <?php endif; ?>

    <form method="post" action="">
        <p>
            <label for="nome">Nome:</label><br>
            <input type="text" id="nome" name="nome" value="<?= htmlspecialchars($dadosForm['nome']) ?>" required>
        </p>

        <p>
            <label for="email">Email:</label><br>
            <input type="email" id="email" name="email" value="<?= htmlspecialchars($dadosForm['email']) ?>" required>
        </p>

        <p>
            <label for="senha">Senha:</label><br>
            <input type="password" id="senha" name="senha" required>
        </p>

        <p>
            <label for="tipo">Tipo:</label><br>
            <select id="tipo" name="tipo">
                <option value="aluno" <?= $dadosForm['tipo'] === 'aluno' ? 'selected' : '' ?>>Aluno</option>
                <option value="instrutor" <?= $dadosForm['tipo'] === 'instrutor' ? 'selected' : '' ?>>Instrutor</option>
            </select>
        </p>

        <button type="submit">Salvar usuário</button>
    </form>

    <p><a href="buscarUsuario">Buscar usuário</a></p>
</body>
</html>

