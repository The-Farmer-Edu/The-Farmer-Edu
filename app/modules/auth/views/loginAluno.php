<?php
if($_SERVER['REQUEST_METHOD'] === 'POST' && empty($mensagem)){
    header("Location: loginAluno");
    exit();
}

$antigo = static fn(string $campo): string => htmlspecialchars((string) ($_POST[$campo] ?? ''), ENT_QUOTES, 'UTF-8');

// primeiro confere se a sessão expirou (4h sem atividade), depois lê o login
$expirou = sessaoExpirouPorInatividade() || isset($_GET['expirou']);

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

            <!-- Feedback de Sucesso ou Erro -->
            <?php if (!empty($mensagem)): ?>
                <div class="<?= !empty($sucesso) ? 'alerta-sucesso' : 'alerta-erro' ?>">
                    <?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?>
                </div>
            <?php endif; ?>

            <!-- Caso 1: Sessão Expirada -->
            <?php if ($expirou && !$logado): ?>
                <div class="painel-logado">
                    <p class="saudacao">Sua sessão expirou por inatividade.</p>
                    <div class="acoes-usuario-logado" style="margin-top: 15px;">
                        <a href="loginAluno" class="btn-acao-logado btn-primario">Fazer login novamente</a>
                    </div>
                </div>

            <!-- Caso 2: Já Logado (Painel com seus botões) -->
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

            <!-- Caso 3: Formulário de Login Padrão -->
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
            <h2 class="nome-marca" id="nome-marca">The Farm Edu</h2>
            <p class="subtitulo" id="subtitulo">Aluno</p>
        </aside>

    </main>
</body>
</html>