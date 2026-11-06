<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Desativar conta - The Farmer Edu</title>
    <link rel="stylesheet" href="file?type=css&file=desativarconta.css">
</head>
<body>
    <h1 id="titulo-pagina">Desativar conta</h1>

    <?php if (!empty($mensagem)): ?>
        <p id="mensagem-alerta"><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
    <?php endif; ?>

    <?php if (!empty($sucesso)): ?>
        <p class="links-login">
            <a class="link-login-aluno" href="loginAluno">Entrar como aluno</a> | 
            <a class="link-login-instrutor" href="loginInstrutor">Entrar como instrutor</a>
        </p>
    <?php else: ?>
        <p class="descricao-desativacao">Ao desativar, você será desconectado e não conseguirá mais entrar com esta conta.</p>

        <form class="formulario" id="form-desativar-conta" action="" method="POST">
            <p class="campo-form">
                <label for="senha_atual" id="label-senha">Digite sua senha para confirmar:</label>
                <input type="password" id="senha_atual" name="senha_atual" required>
            </p>

            <p class="campo-form">
                <label id="label-confirmar">
                    <input type="checkbox" id="confirmar_desativacao" name="confirmar" value="1" required>
                    Entendo que minha conta será desativada.
                </label>
            </p>

            <button type="submit" class="btn-desativar">Desativar minha conta</button>
        </form>

        <p id="container-link-voltar">
            <a class="link-voltar" href="editarConta">Voltar para editar conta</a>
        </p>
    <?php endif; ?>
</body>
</html>