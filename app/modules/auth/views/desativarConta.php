<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Desativar conta - The Farmer Edu</title>
</head>
<body>
    <h1>Desativar conta</h1>

    <?php if (!empty($mensagem)): ?>
        <p><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
    <?php endif; ?>

    <?php if (!empty($sucesso)): ?>
        <p><a href="loginAluno">Entrar como aluno</a> | <a href="loginInstrutor">Entrar como instrutor</a></p>
    <?php else: ?>
        <p>Ao desativar, você será desconectado e não conseguirá mais entrar com esta conta.</p>

        <form action="" method="POST">
            <p>
                <label for="senha_atual">Digite sua senha para confirmar:</label>
                <input type="password" id="senha_atual" name="senha_atual" required>
            </p>

            <p>
                <label>
                    <input type="checkbox" name="confirmar" value="1" required>
                    Entendo que minha conta será desativada.
                </label>
            </p>

            <button type="submit">Desativar minha conta</button>
        </form>

        <p><a href="editarConta">Voltar para editar conta</a></p>
    <?php endif; ?>
</body>
</html>