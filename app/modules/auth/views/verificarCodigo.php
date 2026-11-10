<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Confirmar código - The Farmer Edu</title>
    <link rel="stylesheet" href="file?type=css&file=loginAluno.css">
</head>
<body>
    <main class="tela-login">

        <section class="painel-login">
            <h1 class="titulo-login">Confirmar código</h1>

            <?php if (!empty($mensagem)): ?>
                <p class="mensagem"><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
            <?php endif; ?>

            <p class="mensagem">
                Se o e-mail informado estiver cadastrado, você receberá um código de 6 dígitos.
                Ele vale por <?= RecuperacaoSenha::VALIDADE_MINUTOS ?> minutos.
            </p>

            <form class="form-login" action="" method="POST">
                <div class="campo">
                    <label for="codigo">Código</label>
                    <input type="text" id="codigo" name="codigo" inputmode="numeric" pattern="[0-9]{6}"
                           maxlength="6" autocomplete="one-time-code" required>
                    <div class="links-campo">
                        <a href="esqueciSenha">Pedir outro código</a>
                    </div>
                </div>

                <button type="submit" id="btn-entrar">Confirmar código</button>
            </form>
        </section>

        <aside class="painel-imagem">
            <img class="logo" id="logo" src="/assets/img/png/logo_icone.png" alt="Logo The Farm Edu">
            <h2 class="nome-marca" id="nome-marca">The Farm Edu</h2>            <p class="subtitulo" id="subtitulo">Recuperar senha</p>
        </aside>

    </main>
</body>
</html>