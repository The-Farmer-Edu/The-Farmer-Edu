<?php
$tituloPagina = $turma['nome_turma'] . ' · Alunos';
$isArchived = (int) $turma['ativo'] !== 1;
require __DIR__ . '/partials/head.php';
?>
<main class="page-main">
    <div class="page-heading">
        <div>
            <span class="page-kicker">Gerenciamento da turma</span>
            <h1>Alunos</h1>
            <p><?= e($turma['nome_turma']) ?> · <?= e($turma['nome_curso']) ?> · <?= e(TurmaModel::TURNOS[$turma['turno']] ?? $turma['turno']) ?></p>
        </div>
        <div class="d-flex align-items-center gap-3 flex-wrap">
            <span class="status-pill <?= $isArchived ? 'status-pill--inactive' : 'status-pill--active' ?>"><?= $isArchived ? 'Arquivada' : 'Ativa' ?></span>
            <a class="btn btn-outline-theme" href="<?= $base ?>/turmas_cursos/instrutor"><i class="bi bi-arrow-left me-2"></i>Voltar às turmas</a>
        </div>
    </div>
    <?php if (!empty($msg)): ?><div class="alert alert-success flash-message" role="status"><?= e($msg) ?></div><?php endif; ?>
    <?php if (!empty($erro)): ?><div class="alert alert-danger flash-message" role="alert"><?= e($erro) ?></div><?php endif; ?>

    <div class="people-wrap">
        <section aria-labelledby="instrutores-title">
            <h2 class="people-section-title" id="instrutores-title">Instrutores</h2>
            <div class="person-list">
                <div class="person-row">
                    <span class="person-avatar"><i class="bi bi-person-workspace"></i></span>
                    <div class="person-info"><strong><?= e($turma['nome_instrutor'] ?? 'Instrutor responsável') ?></strong><small>Responsável pela turma</small></div>
                    <span class="status-pill status-pill--active">Instrutor</span>
                </div>
            </div>
        </section>
        <hr class="people-divider">
        <section aria-labelledby="alunos-title">
            <h2 class="people-section-title" id="alunos-title">Alunos <span class="text-muted fs-6">(<?= count($matriculados) ?>)</span></h2>
            <div class="person-list">
                <?php foreach ($matriculados as $a): $ativo = (int) $a['ativo'] === 1; ?>
                    <div class="person-row">
                        <span class="person-avatar"><?= e(inicialNome((string) $a['nome'])) ?></span>
                        <div class="person-info"><strong><?= e($a['nome']) ?></strong><small><?= e($a['matricula']) ?> · <?= $ativo ? 'Conta ativa' : 'Conta desativada' ?></small></div>
                        <?php if (!$isArchived): ?>
                            <div class="person-actions">
                                <form method="post" action="<?= $base ?>/turmas_cursos/desmatricular" data-confirm="Deseja remover este aluno da turma?">
                                    <input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_turma" value="<?= (int) $turma['id_turma'] ?>"><input type="hidden" name="id_aluno" value="<?= (int) $a['id_usuario'] ?>">
                                    <button type="submit" class="btn btn-sm btn-outline-danger" aria-label="Remover da turma" title="Remover da turma"><i class="bi bi-person-dash me-1"></i>Remover</button>
                                </form>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
                <?php if (!$matriculados): ?><div class="empty-state"><i class="bi bi-people"></i><strong>Nenhum aluno matriculado.</strong></div><?php endif; ?>
            </div>
            <?php if (!$isArchived): ?>
                <button class="btn btn-theme" type="button" data-bs-toggle="modal" data-bs-target="#modalCadastrarAluno"><i class="bi bi-person-plus me-2"></i>Cadastrar aluno</button>
            <?php endif; ?>
        </section>
    </div>
</main>

<?php if (!$isArchived): ?>
<div class="modal fade" id="modalCadastrarAluno" tabindex="-1" aria-labelledby="modalCadastrarAlunoTitulo" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><form method="post" action="<?= $base ?>/turmas_cursos/matricular"><div class="modal-header"><h2 class="modal-title" id="modalCadastrarAlunoTitulo">Cadastrar aluno</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button></div><div class="modal-body"><input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_turma" value="<?= (int) $turma['id_turma'] ?>"><label class="form-label" for="alunoSelecionado">Selecione um aluno</label><select class="form-select" id="alunoSelecionado" name="id_aluno" required><option value="">Selecione...</option><?php foreach ($disponiveis as $a): ?><option value="<?= (int) $a['id_usuario'] ?>"><?= e($a['nome']) ?> · <?= e($a['matricula']) ?></option><?php endforeach; ?></select><?php if (!$disponiveis): ?><small class="text-muted d-block mt-2">Não há alunos ativos disponíveis para matrícula.</small><?php endif; ?></div><div class="modal-footer"><button class="btn btn-theme" type="submit" <?= !$disponiveis ? 'disabled' : '' ?>>Cadastrar</button><button class="btn btn-muted" type="button" data-bs-dismiss="modal">Cancelar</button></div></form></div></div></div>
<?php endif; ?>
<?php require __DIR__ . '/partials/rodape.php'; ?>
