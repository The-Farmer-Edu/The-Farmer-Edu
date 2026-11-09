<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Desativar conta - The Farmer Edu</title>
    <link rel="stylesheet" href="file?type=css&file=loginAluno.css">
    <link rel="stylesheet" href="file?type=css&file=contaUsuario.css">
</head>
<body>
    <main class="tela-login">

        <section class="painel-login">
            <h1 class="titulo-login">Desativar conta</h1>

            <?php if (!empty($mensagem)): ?>
                <p class="mensagem"><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
            <?php endif; ?>

            <?php if (!empty($sucesso)): ?>
                <div class="links-conta">
                    <a class="link-verde" href="loginAluno">Entrar como aluno</a>
                    <a class="link-verde" href="loginInstrutor">Entrar como instrutor</a>
                </div>
            <?php else: ?>
                <p class="texto-aviso">Ao desativar, você será desconectado e não conseguirá mais entrar com esta conta.</p>

                <form class="form-login" action="" method="POST">
                    <div class="campo">
                        <label for="senha_atual">Senha</label>
                        <input type="password" id="senha_atual" name="senha_atual" autocomplete="current-password" required>
                        <span class="dica">Digite sua senha para confirmar</span>
                    </div>

                    <div class="campo-check">
                        <input type="checkbox" id="confirmar" name="confirmar" value="1" required>
                        <label for="confirmar">Entendo que minha conta será desativada.</label>
                    </div>

                    <button type="submit" id="btn-entrar" class="btn-perigo">Desativar minha conta</button>
                </form>

                <div class="links-conta">
                    <a class="link-verde" href="editarConta">Voltar para editar conta</a>
                </div>
            <?php endif; ?>
        </section>

        <aside class="painel-imagem">
            <img class="logo" id="logo" src="/assets/img/png/logo_icone.png" alt="Logo The Farm Edu">
            <h2 class="nome-marca" id="nome-marca">The Farm Edu</h2>
            <p class="subtitulo" id="subtitulo">Minha conta</p>
        </aside>

    </main>
</body>
</html>