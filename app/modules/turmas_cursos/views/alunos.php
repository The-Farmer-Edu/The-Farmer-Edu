<?php
$tituloPagina = 'Alunos cadastrados';
require __DIR__ . '/partials/head.php';
?>
<main class="page-main">
    <div class="page-heading"><div><span class="page-kicker">Área administrativa</span><h1>Alunos</h1><p>Consulte os alunos cadastrados e gerencie a situação das contas.</p></div><a class="btn btn-outline-theme" href="<?= $base ?>/turmas_cursos/instrutor"><i class="bi bi-arrow-left me-2"></i>Voltar às turmas</a></div>
    <?php if (!empty($msg)): ?><div class="alert alert-success flash-message"><?= e($msg) ?></div><?php endif; ?>
    <?php if (!empty($erro)): ?><div class="alert alert-danger flash-message"><?= e($erro) ?></div><?php endif; ?>
    <div class="data-table-wrap table-responsive"><table class="table table-hover data-table align-middle"><thead><tr><th>Matrícula</th><th>Aluno</th><th>E-mail</th><th>Turmas</th><th>Conta</th><th class="text-end">Ação</th></tr></thead><tbody>
        <?php foreach ($alunos as $a): $ativo = (int) $a['ativo'] === 1; $modalId = 'modalGlobalConta' . (int) $a['id_usuario']; ?>
            <tr><td><?= e($a['matricula']) ?></td><td><strong><?= e($a['nome']) ?></strong></td><td><?= e($a['email']) ?></td><td><?= e($a['turmas'] ?: 'Sem turma') ?></td><td><span class="status-pill <?= $ativo ? 'status-pill--active' : 'status-pill--inactive' ?>"><?= $ativo ? 'Ativa' : 'Desativada' ?></span></td><td class="text-end"><button class="btn btn-sm <?= $ativo ? 'btn-outline-danger' : 'btn-outline-success' ?>" type="button" data-bs-toggle="modal" data-bs-target="#<?= $modalId ?>"><?= $ativo ? 'Desativar' : 'Reativar' ?></button></td></tr>
        <?php endforeach; ?>
        <?php if (!$alunos): ?><tr><td colspan="6" class="text-center text-muted py-4">Nenhum aluno cadastrado.</td></tr><?php endif; ?>
    </tbody></table></div>
</main>
<?php foreach ($alunos as $a): $ativo = (int) $a['ativo'] === 1; $modalId = 'modalGlobalConta' . (int) $a['id_usuario']; ?>
<div class="modal fade" id="<?= $modalId ?>" tabindex="-1" aria-labelledby="<?= $modalId ?>Titulo" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h2 class="modal-title" id="<?= $modalId ?>Titulo">Confirmar alteração</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button></div><div class="modal-body">Tem certeza de que deseja <?= $ativo ? 'desativar' : 'reativar' ?> a conta de <strong><?= e($a['nome']) ?></strong>?</div><div class="modal-footer"><form method="post" action="<?= $base ?>/turmas_cursos/<?= $ativo ? 'alunoDesativar' : 'alunoReativar' ?>"><input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_aluno" value="<?= (int) $a['id_usuario'] ?>"><button type="submit" class="btn btn-theme">Sim</button></form><button type="button" class="btn btn-muted" data-bs-dismiss="modal">Não</button></div></div></div></div>
<?php endforeach; ?>
<?php require __DIR__ . '/partials/rodape.php'; ?>
