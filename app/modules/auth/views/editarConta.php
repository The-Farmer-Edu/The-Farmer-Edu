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
    <link rel="stylesheet" href="file?type=css&file=editarconta.css">
</head>
<body>
    <h1 id="titulo-pagina" class="titulo">Editar conta</h1>

    <?php if (!empty($mensagem)): ?>
        <p id="mensagem-status"><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
    <?php endif; ?>

    <form id="form-editar-conta" class="form-editar-conta" action="" method="POST">
        <p> <label for="nome" class="label">Nome:</label> </p>
        <p id="campo-nome" class="campo">
            <input type="text" class="campo" name="nome" value="<?= $valor('nome') ?>" required>
        </p>

        <p>
            <label for="email" class="label">E-mail:</label></p>
        <p id="campo-email" class="campo">
            <input type="email" class="campo" name="email" value="<?= $valor('email') ?>" required>
        </p>

        <p>
            <label for="nova_senha" class="label">Nova senha:</label></p>
        <p id="campo-nova-senha" class="campo">
            <input type="password" class="campo" name="nova_senha" minlength="8">
        </p>

        <p><label for="senha_atual" class="label">Senha atual:</label></p>
        <p id="campo-senha-atual" class="campo">
            <input type="password" class="campo" name="senha_atual" required>
        </p>
    </form>
        <a href="desativarConta" class="btn-desativar">Desativar conta</a> | 
        <a href="logout" class="btn-sair">Sair</a>
</body>
        <button type="submit" id="btn-salvar">Salvar alterações</button>

</html>