<?php
$antigo = static fn(string $campo): string => htmlspecialchars((string) ($_POST[$campo] ?? ''), ENT_QUOTES, 'UTF-8');

// usuarioLogado: devolve os dados da sessão ou null
$logado = usuarioLogado();
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login do instrutor - The Farmer Edu</title>
    <link rel="stylesheet" href="file?type=css&file=loginInstrutor.css">
</head>
<body id="pagina-login-instrutor">
    <main class="tela-login" id="tela-login">

        <section class="painel-login" id="painel-login">
            <h1 class="titulo-login" id="titulo-login">Entrar como Instrutor</h1>

            <?php if (!empty($mensagem)): ?>
                <p class="mensagem" id="mensagem-erro"><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
            <?php endif; ?>

            <?php if ($logado): ?>
                <p class="mensagem" id="mensagem-logado">
                    Você está logado como <?= htmlspecialchars($logado['nome'], ENT_QUOTES, 'UTF-8') ?>
                    (<?= htmlspecialchars($logado['perfilAcesso'], ENT_QUOTES, 'UTF-8') ?>).
                </p>
                <p class="mensagem"><a class="link-azul" id="link-sair" href="logout">Sair</a></p>
            <?php else: ?>
                <form class="form-login" id="form-login" action="" method="POST">
                    <div class="campo" id="campo-usuario">
                        <label for="email">Usuário</label>
                        <input type="email" id="email" name="email" value="<?= $antigo('email') ?>" required>
                    </div>

                    <div class="campo" id="campo-senha">
                        <label for="senha">Senha</label>
                        <input type="password" id="senha" name="senha" required>
                        <div class="links-campo">
                            <a class="link-azul" id="link-esqueci" href="esqueciSenha">Esqueci a senha</a>
                            <a class="link-azul" id="link-aluno" href="loginAluno">Sou Aluno</a>
                        </div>
                    </div>

                    <button type="submit" class="btn-entrar" id="btn-entrar">Entrar</button>
                </form>

                <a class="criar-conta" id="link-criar-conta" href="novoUsuario">Criar Conta</a>
            <?php endif; ?>
        </section>

        <aside class="painel-imagem" id="painel-imagem">
            <img class="logo" id="logo" src="/The-Farmer-Edu-tarde/public/assets/img/png/logo_icone.png" alt="Logo The Farm Edu">
            <h2 class="nome-marca" id="nome-marca">The Farm Edu</h2>
            <p class="subtitulo" id="subtitulo">Instrutor</p>
        </aside>

    </main>
</body>
</html>