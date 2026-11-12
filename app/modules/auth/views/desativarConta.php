<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Desativar conta - The Farmer Edu</title>
    <link rel="stylesheet" href="file?type=css&file=desativarconta.css">
</head>
<body>

    <h1 class="titulo">Desativar conta</h1>

    <?php if (!empty($mensagem)): ?>
        <p id="mensagem-status"><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
    <?php endif; ?>

    <?php if (!empty($sucesso)): ?>
        <div class="form-desativar-conta">
            <div class="caixa-aviso" style="border-color: rgba(52, 199, 89, 0.4); background-color: rgba(52, 199, 89, 0.1);">
                <p style="color: var(--azul-escuro); font-weight: 500;">Conta desativada com sucesso. Você foi desconectado.</p>
            </div>
            <div class="botoes-acoes">
                <a href="loginAluno" class="btn-cancelar">Entrar como aluno</a>
                <a href="loginInstrutor" class="btn-cancelar">Entrar como instrutor</a>
            </div>
        </div>
    <?php else: ?>
        <form class="form-desativar-conta" action="" method="POST">
            
            <div class="caixa-aviso">
                <p>Ao desativar, você será desconectado e não conseguirá mais entrar com esta conta.</p>
            </div>

            <div class="campo">
                <label for="senha_atual" class="label">Digite sua senha para confirmar:</label>
                <input type="password" id="senha_atual" name="senha_atual" required placeholder="Digite sua senha atual">
            </div>

            <div class="campo-checkbox">
                <label>
                    <input type="checkbox" name="confirmar" value="1" required>
                    Entendo que minha conta será desativada.
                </label>
            </div>

            <div class="botoes-acoes">
                <button type="submit" id="btn-confirmar-desativar" class="btn-perigo">Desativar minha conta</button>
                <a href="editarConta" class="btn-cancelar">Voltar para editar conta</a>
            </div>

        </form>
    <?php endif; ?>

</body>
</html>