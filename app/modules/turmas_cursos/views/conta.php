<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>The Farmer Edu - Minha conta</title>
</head>
<body>
    <?php require __DIR__ . '/partials/cabecalho.php'; ?>

    <main>
        <h1>Minha conta</h1>
        <p><a href="<?= $base ?>/turmas_cursos/<?= e($u['perfilAcesso']) ?>">Voltar às turmas</a></p>
        <p>Nome: <strong><?= e($u['nome']) ?></strong></p>
        <p>E-mail: <strong><?= e($u['email']) ?></strong></p>

        <?php if ($erro): ?><p><strong><?= e($erro) ?></strong></p><?php endif; ?>

        <section aria-labelledby="desativar-conta-titulo">
            <h2 id="desativar-conta-titulo">Desativar conta</h2>
            <p>
                Sua conta não será apagada: ela apenas ficará desativada e você será desconectado.
                Para reativá-la, será preciso pedir <?= $u['perfilAcesso'] === 'aluno' ? 'ao seu instrutor' : 'ao administrador do sistema' ?>.
            </p>
            <form method="POST" action="<?= $base ?>/turmas_cursos/contaDesativar">
                <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                <p><label>Confirme sua senha: <input type="password" name="senha" required></label></p>
                <button type="submit">Desativar minha conta</button>
            </form>
        </section>
    </main>
</body>
</html>
