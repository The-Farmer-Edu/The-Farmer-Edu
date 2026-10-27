<?php
$antigo = static fn(string $campo): string => htmlspecialchars((string) ($_POST[$campo] ?? ''), ENT_QUOTES, 'UTF-8');

// usuarioLogado() é do core, devolve os dados da sessão ou null
$logado = usuarioLogado();
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Login do aluno - The Farmer Edu</title>
    <link rel="stylesheet" href="file?type=css&file=loginAluno.css">
</head>
<body>
        <main class="tela-login">

        <section class="painel-login">
            <h1 class="titulo-login">Entrar como Aluno</h1>

            <?php if (!empty($mensagem)): ?>
                <p class="mensagem"><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
            <?php endif; ?>

            <?php if ($logado): ?>
                <p class="mensagem">
                    Você está logado como <?= htmlspecialchars($logado['nome'], ENT_QUOTES, 'UTF-8') ?>
                    (<?= htmlspecialchars($logado['perfilAcesso'], ENT_QUOTES, 'UTF-8') ?>).
                </p>
                <p class="mensagem"><a class="link-verde" href="logout">Sair</a></p>
            <?php else: ?>
                <form class="form-login" action="" method="POST">
                    <div class="campo">
                        <label for="email">Usuário</label>
                        <input type="email" id="email" name="email" value="<?= $antigo('email') ?>" required>
                    </div>

                    <div class="campo">
                        <label for="senha">Senha</label>
                        <input type="password" id="senha" name="senha" required>
                        <div class="links-campo">
                            <a href="esqueciSenha">Esqueci a senha</a>
                            <a href="loginInstrutor">Sou Instrutor</a>
                        </div>
                    </div>

                    <button type="submit" id="btn-entrar">Entrar</button>
                </form>

                <a class="criar-conta" href="novoUsuario">Criar Conta</a>
            <?php endif; ?>
        </section>

        <aside class="painel-imagem">
            <img class="logo" src="img/logo-farm-edu.png" alt="Logo The Farm Edu">
            <h2 class="nome-marca">The Farm Edu</h2>
        </aside>

    </main>
</body>
</html>
