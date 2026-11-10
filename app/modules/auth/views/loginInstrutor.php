<?php
if($_SERVER['REQUEST_METHOD'] === 'POST' && empty($mensagem)){
    header("Location: loginInstrutor");
    exit();
}
$antigo = static fn(string $campo): string => htmlspecialchars((string) ($_POST[$campo] ?? ''), ENT_QUOTES, 'UTF-8');

$expirou = sessaoExpirouPorInatividade() || isset($_GET['expirou']);
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
                <div class="alerta-erro">
                    <?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?>
                </div>
            <?php endif; ?>

            <?php if ($expirou && !$logado): ?>
                <p><strong>Sua sessão expirou por inatividade.</strong></p>
                <form action="loginInstrutor" method="GET">
                    <button type="submit">Voltar ao login</button>
                </form>

            <?php elseif ($logado): ?>
                <div class="painel-logado">
                    <p class="saudacao">Bem-vindo de volta,</p>
                    <h2 class="nome-usuario"><?= htmlspecialchars($logado['nome'], ENT_QUOTES, 'UTF-8') ?></h2>
                    <span class="badge-perfil"><?= htmlspecialchars(ucfirst($logado['perfilAcesso']), ENT_QUOTES, 'UTF-8') ?></span>

                    <div class="acoes-usuario-logado">
                        <a href="editarConta" class="btn-acao-logado btn-primario">Editar minha conta</a>
                        <a href="desativarConta" class="btn-acao-logado btn-perigo">Desativar conta</a>
                        <a href="logout" class="btn-acao-logado btn-neutro">Sair da conta</a>
                    </div>
                </div>

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
            <h2 class="nome-marca" id="nome-marca">The Farm Edu</h2>
            <p class="subtitulo" id="subtitulo">Instrutor</p>
        </aside>

    </main>
</body>
</html>