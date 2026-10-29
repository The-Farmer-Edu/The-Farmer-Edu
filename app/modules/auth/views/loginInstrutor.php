<?php
$antigo = static fn(string $campo): string => htmlspecialchars((string) ($_POST[$campo] ?? ''), ENT_QUOTES, 'UTF-8');

// usuarioLogado: devolve os dados da sessão ou null
$logado = usuarioLogado();
sessaoExpirouPorInatividade();

?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login do instrutor - The Farmer Edu</title>
</head>
<body>
    <h1>Entrar como instrutor </h1>

    <?php if (!empty($mensagem)): ?>
        <p><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
    <?php endif; ?>

    <?php if ($logado): ?>
        <p>
            Você está logado como <?= htmlspecialchars($logado['nome'], ENT_QUOTES, 'UTF-8') ?>
            (<?= htmlspecialchars($logado['perfilAcesso'], ENT_QUOTES, 'UTF-8') ?>).
        </p>
        <p><a href="logout">Sair</a></p>
    <?php else: ?>
        <form action="" method="POST">
            <p>
                <label for="email">E-mail:</label>
                <input type="email" id="email" name="email" value="<?= $antigo('email') ?>" required>
            </p>

            <p>
                <label for="senha">Senha:</label>
                <input type="password" id="senha" name="senha" required>
            </p>

            <button type="submit">Entrar</button>
        </form>

        <p>Ainda não tem conta? <a href="novoUsuario">Cadastre-se</a></p>
    <?php endif; ?>
</body>
</html>