<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Nova senha - The Farmer Edu</title>
    <link rel="stylesheet" href="file?type=css&file=loginAluno.css">
</head>
<body>
    <main class="tela-login">

        <section class="painel-login">
            <h1 class="titulo-login">Nova senha</h1>

            <?php if (!empty($mensagem)): ?>
                <p class="mensagem"><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
            <?php endif; ?>

            <?php if (!empty($sucesso)): ?>
                <a class="criar-conta" href="<?= htmlspecialchars($destinoLogin ?? 'loginAluno', ENT_QUOTES, 'UTF-8') ?>">Ir para o login</a>
            <?php else: ?>
                <form class="form-login" action="" method="POST">
                    <div class="campo">
                        <label for="nova_senha">Nova senha</label>
                        <input type="password" id="nova_senha" name="nova_senha" minlength="8" autocomplete="new-password" required>
                    </div>

                    <div class="campo">
                        <label for="confirmar_senha">Confirmar nova senha</label>
                        <input type="password" id="confirmar_senha" name="confirmar_senha" minlength="8" autocomplete="new-password" required>
                    </div>

                    <button type="submit" id="btn-entrar">Redefinir senha</button>
                </form>
            <?php endif; ?>
        </section>

        <aside class="painel-imagem">
            <img class="logo" id="logo" src="/assets/img/png/logo_icone.png" alt="Logo The Farm Edu">
            <h2 class="nome-marca" id="nome-marca">The Farm Edu</h2>            <p class="subtitulo" id="subtitulo">Recuperar senha</p>
            <p class="subtitulo" id="subtitulo">Recuperar senha</p>
        </aside>

    </main>
</body>
</html>