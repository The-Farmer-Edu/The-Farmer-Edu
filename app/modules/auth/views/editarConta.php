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

    <h1 class="titulo">Editar conta</h1>

    <?php if (!empty($mensagem)): ?>
        <p id="mensagem-status"><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
    <?php endif; ?>

    <form id="form-editar-conta" class="form-editar-conta" action="" method="POST">
        
        <div class="campo">
            <label for="nome" class="label">Nome:</label>
            <input type="text" id="nome" name="nome" value="<?= $valor('nome') ?>" required>
        </div>

        <div class="campo">
            <label for="email" class="label">Email:</label>
            <input type="email" id="email" name="email" value="<?= $valor('email') ?>" required>
        </div>

        <div class="campo">
            <label for="nova_senha" class="label">Nova senha (opcional):</label>
            <input type="password" id="nova_senha" name="nova_senha" autocomplete="new-password">
        </div>

        <div class="campo">
            <label for="senha_atual" class="label">Senha atual:</label>
            <input type="password" id="senha_atual" name="senha_atual" required>
        </div>

        <!-- Os 3 botões agrupados dentro do form -->
        <div class="botoes-acoes">
            <button type="submit" id="btn-salvar">Salvar alterações</button>
            <a href="desativarConta" class="btn-desativar">Desativar conta</a>
            <a href="logout" class="btn-sair">Sair</a>
        </div>

    </form>

</body>
</html>