<?php
$antigo = static fn(string $campo): string => htmlspecialchars((string) ($_POST[$campo] ?? ''), ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Recuperar senha - The Farmer Edu</title>
    <link rel="stylesheet" href="file?type=css&file=loginAluno.css">
</head>
<body>
    <main class="tela-login">

        <section class="painel-login">
            <h1 class="titulo-login">Esqueci a senha</h1>

            <?php if (!empty($mensagem)): ?>
                <p class="mensagem"><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
            <?php endif; ?>

            <p class="mensagem">Informe o e-mail da sua conta e enviaremos um código de 6 dígitos para redefinir a senha.</p>

            <form class="form-login" action="" method="POST">
                <div class="campo">
                    <label for="email">E-mail</label>
                    <input type="email" id="email" name="email" value="<?= $antigo('email') ?>" required>
                </div>

                <button type="submit" id="btn-entrar">Enviar código</button>
            </form>

            <a class="criar-conta" href="loginAluno">Voltar ao login</a>
        </section>

        <aside class="painel-imagem">
            <img class="logo" id="logo" src="/assets/img/png/logo_icone.png" alt="Logo The Farm Edu">
            <h2 class="nome-marca" id="nome-marca">The Farm Edu</h2>
            <p class="subtitulo" id="subtitulo">Recuperar senha</p>
        </aside>

    </main>
</body>
</html>