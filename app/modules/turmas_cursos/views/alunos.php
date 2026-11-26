<?php
$tituloPagina = 'Alunos cadastrados';
require __DIR__ . '/partials/head.php';
?>
<main class="page-main">
    <div class="page-heading"><div><span class="page-kicker">Área do instrutor</span><h1>Alunos</h1><p>Consulte os alunos cadastrados no sistema e as turmas em que estão matriculados.</p></div><a class="btn btn-outline-theme" href="<?= $base ?>/turmas_cursos/instrutor"><i class="bi bi-arrow-left me-2"></i>Voltar às turmas</a></div>
    <?php if (!empty($msg)): ?><div class="alert alert-success flash-message"><?= e($msg) ?></div><?php endif; ?>
    <?php if (!empty($erro)): ?><div class="alert alert-danger flash-message"><?= e($erro) ?></div><?php endif; ?>
    <div class="data-table-wrap table-responsive"><table class="table table-hover data-table align-middle"><thead><tr><th>Matrícula</th><th>Aluno</th><th>E-mail</th><th>Turmas</th><th>Conta</th></tr></thead><tbody>
        <?php foreach ($alunos as $a): $ativo = (int) $a['ativo'] === 1; ?>
            <tr><td><?= e($a['matricula']) ?></td><td><strong><?= e($a['nome']) ?></strong></td><td><?= e($a['email']) ?></td><td><?= e($a['turmas'] ?: 'Sem turma') ?></td><td><span class="status-pill <?= $ativo ? 'status-pill--active' : 'status-pill--inactive' ?>"><?= $ativo ? 'Ativa' : 'Desativada' ?></span></td></tr>
        <?php endforeach; ?>
        <?php if (!$alunos): ?><tr><td colspan="5" class="text-center text-muted py-4">Nenhum aluno cadastrado.</td></tr><?php endif; ?>
    </tbody></table></div>
</main>
<?php require __DIR__ . '/partials/rodape.php'; ?>
