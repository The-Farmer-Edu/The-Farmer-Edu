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
    <link rel="stylesheet" href="file?type=css&file=loginAluno.css">
    <link rel="stylesheet" href="file?type=css&file=contaUsuario.css">
</head>
<body>
    <main class="tela-login">

        <section class="painel-login">
            <h1 class="titulo-login">Editar conta</h1>

            <?php if (!empty($mensagem)): ?>
                <p class="mensagem"><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
            <?php endif; ?>

            <form class="form-login" action="" method="POST">
                <div class="campo">
                    <label for="nome">Nome</label>
                    <input type="text" id="nome" name="nome" value="<?= $valor('nome') ?>" required>
                </div>

                <div class="campo">
                    <label for="email">E-mail</label>
                    <input type="email" id="email" name="email" value="<?= $valor('email') ?>" required>
                </div>

                <div class="campo">
                    <label for="nova_senha">Nova senha</label>
                    <input type="password" id="nova_senha" name="nova_senha" minlength="8" autocomplete="new-password">
                    <span class="dica">Deixe em branco para manter a atual</span>
                </div>

                <div class="campo">
                    <label for="senha_atual">Senha atual</label>
                    <input type="password" id="senha_atual" name="senha_atual" autocomplete="current-password" required>
                    <span class="dica">Necessária para confirmar as alterações</span>
                </div>

                <button type="submit" id="btn-entrar">Salvar alterações</button>
            </form>

            <div class="links-conta">
                <a class="link-perigo" href="desativarConta">Desativar conta</a>
                <a class="link-verde" href="logout">Sair</a>
            </div>
        </section>

        <aside class="painel-imagem">
            <img class="logo" id="logo" src="/assets/img/png/logo_icone.png" alt="Logo The Farm Edu">
            <h2 class="nome-marca" id="nome-marca">The Farm Edu</h2>
            <p class="subtitulo" id="subtitulo">Minha conta</p>
        </aside>

    </main>
</body>
</html>