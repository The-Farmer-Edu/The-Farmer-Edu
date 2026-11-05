<?php
// $dados vem do controller (nome e e-mail para preencher o formulário)
$valor = static fn(string $campo): string => htmlspecialchars((string) ($dados[$campo] ?? ''), ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Editar conta - The Farmer Edu</title>
</head>
<body>
    <h1>Editar conta</h1>

    <?php if (!empty($mensagem)): ?>
        <p><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
    <?php endif; ?>

    <form action="" method="POST">
        <p>
            <label for="nome">Nome:</label>
            <input type="text" id="nome" name="nome" value="<?= $valor('nome') ?>" required>
        </p>

        <p>
            <label for="email">E-mail:</label>
            <input type="email" id="email" name="email" value="<?= $valor('email') ?>" required>
        </p>

        <p>
            <label for="nova_senha">Nova senha (deixe em branco para manter a atual):</label>
            <input type="password" id="nova_senha" name="nova_senha" minlength="8">
        </p>

        <p>
            <label for="senha_atual">Senha atual (para confirmar):</label>
            <input type="password" id="senha_atual" name="senha_atual" required>
        </p>

        <button type="submit">Salvar alterações</button>
    </form>

    <p><a href="desativarConta">Desativar conta</a> | <a href="logout">Sair</a></p>
</body>
</html>
