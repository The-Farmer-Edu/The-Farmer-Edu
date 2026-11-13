<?php
$tituloPagina = 'Minha conta';
require __DIR__ . '/partials/head.php';
?>
<main class="page-main">
    <section class="page-panel">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4"><div><span class="page-kicker">Perfil</span><h1 class="mb-0">Minha conta</h1></div><a class="btn btn-outline-theme" href="<?= $base ?>/turmas_cursos/<?= e($u['perfilAcesso']) ?>">Voltar</a></div>
        <p><strong>Nome:</strong> <?= e($u['nome']) ?></p><p><strong>E-mail:</strong> <?= e($u['email']) ?></p>
        <?php if (!empty($erro)): ?><div class="alert alert-danger"><?= e($erro) ?></div><?php endif; ?>
        <hr>
        <h2 class="h5 fw-bold">Desativar conta</h2><p class="text-secondary">Sua conta não será apagada. Ela ficará desativada e você será desconectado. Para reativá-la, será necessário solicitar <?= $u['perfilAcesso'] === 'aluno' ? 'ao seu instrutor' : 'ao administrador do sistema' ?>.</p>
        <form method="post" action="<?= $base ?>/turmas_cursos/contaDesativar" data-confirm="Deseja realmente desativar sua conta? Você será desconectado."><input type="hidden" name="csrf" value="<?= e($csrf) ?>"><div class="mb-3"><label class="form-label" for="senhaConta">Confirme sua senha</label><input class="form-control" type="password" id="senhaConta" name="senha" required></div><button type="submit" class="btn btn-outline-danger">Desativar minha conta</button></form>
    </section>
</main>
<?php require __DIR__ . '/partials/rodape.php'; ?>
