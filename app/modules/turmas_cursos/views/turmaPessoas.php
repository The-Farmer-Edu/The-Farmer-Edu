<?php
$tituloPagina = $turma['nome_turma'] . ' · Alunos';
$activeSection = 'pessoas';
$isArchived = (int) $turma['ativo'] !== 1;
require __DIR__ . '/partials/headClass.php';
?>
<div class="class-layout">
    <?php require __DIR__ . '/partials/sidebarTurma.php'; ?>
    <main class="class-content">
        <div class="people-wrap">
            <div class="class-title-row"><div><span class="page-kicker">Gerenciamento da turma</span><h2>Alunos</h2></div><span class="status-pill <?= $isArchived ? 'status-pill--inactive' : 'status-pill--active' ?>"><?= $isArchived ? 'Arquivada' : 'Ativa' ?></span></div>
            <?php if (!empty($msg)): ?><div class="alert alert-success flash-message"><?= e($msg) ?></div><?php endif; ?>
            <?php if (!empty($erro)): ?><div class="alert alert-danger flash-message"><?= e($erro) ?></div><?php endif; ?>
            <section aria-labelledby="instrutores-title">
                <h3 class="people-section-title" id="instrutores-title">Instrutores</h3>
                <div class="person-list"><div class="person-row"><span class="person-avatar"><i class="bi bi-person-workspace"></i></span><div class="person-info"><strong><?= e($turma['nome_instrutor'] ?? 'Instrutor responsável') ?></strong><small>Responsável pela turma</small></div><span class="status-pill status-pill--active">Instrutor</span></div></div>
            </section>
            <hr class="people-divider">
            <section aria-labelledby="alunos-title">
                <h3 class="people-section-title" id="alunos-title">Alunos <span class="text-muted fs-6">(<?= count($matriculados) ?>)</span></h3>
                <div class="person-list">
                    <?php foreach ($matriculados as $a): $ativo = (int) $a['ativo'] === 1; $modalId = 'modalConta' . (int) $a['id_usuario']; ?>
                        <div class="person-row">
                            <span class="person-avatar"><?= e(inicialNome((string) $a['nome'])) ?></span>
                            <div class="person-info"><strong><?= e($a['nome']) ?></strong><small><?= e($a['matricula']) ?> · <?= $ativo ? 'Conta ativa' : 'Conta desativada' ?></small></div>
                            <?php if (!$isArchived): ?>
                                <div class="person-actions">
                                    <button type="button" class="btn <?= $ativo ? 'btn-outline-danger' : 'btn-outline-success' ?>" data-bs-toggle="modal" data-bs-target="#<?= $modalId ?>"><?= $ativo ? 'Desativar conta' : 'Ativar conta' ?></button>
                                    <form method="post" action="<?= $base ?>/turmas_cursos/desmatricular" data-confirm="Deseja remover este aluno da turma?"><input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_turma" value="<?= (int) $turma['id_turma'] ?>"><input type="hidden" name="id_aluno" value="<?= (int) $a['id_usuario'] ?>"><button type="submit" class="btn btn-sm btn-muted" aria-label="Remover da turma"><i class="bi bi-person-dash"></i></button></form>
                                </div>
                                <div class="modal fade" id="<?= $modalId ?>" tabindex="-1" aria-labelledby="<?= $modalId ?>Titulo" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-header"><h2 class="modal-title" id="<?= $modalId ?>Titulo">Confirmar alteração</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button></div><div class="modal-body"><p class="mb-0">Tem certeza de que deseja <?= $ativo ? 'desativar' : 'reativar' ?> a conta de <strong><?= e($a['nome']) ?></strong>?</p></div><div class="modal-footer"><form method="post" action="<?= $base ?>/turmas_cursos/<?= $ativo ? 'alunoDesativar' : 'alunoReativar' ?>" class="flex-fill"><input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_aluno" value="<?= (int) $a['id_usuario'] ?>"><input type="hidden" name="id_turma" value="<?= (int) $turma['id_turma'] ?>"><button class="btn btn-theme w-100" type="submit">Sim, <?= $ativo ? 'desativar' : 'ativar' ?></button></form><button class="btn btn-muted" type="button" data-bs-dismiss="modal">Não</button></div></div></div></div>
                            <?php else: ?><span class="status-pill <?= $ativo ? 'status-pill--active' : 'status-pill--inactive' ?>"><?= $ativo ? 'Ativo' : 'Inativo' ?></span><?php endif; ?>
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
</div>

<?php if (!$isArchived): ?>
<div class="modal fade" id="modalCadastrarAluno" tabindex="-1" aria-labelledby="modalCadastrarAlunoTitulo" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content"><form method="post" action="<?= $base ?>/turmas_cursos/matricular"><div class="modal-header"><h2 class="modal-title" id="modalCadastrarAlunoTitulo">Cadastrar aluno</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button></div><div class="modal-body"><input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_turma" value="<?= (int) $turma['id_turma'] ?>"><label class="form-label" for="alunoSelecionado">Selecione um aluno</label><select class="form-select" id="alunoSelecionado" name="id_aluno" required><option value="">Selecione...</option><?php foreach ($disponiveis as $a): ?><option value="<?= (int) $a['id_usuario'] ?>"><?= e($a['nome']) ?> · <?= e($a['matricula']) ?></option><?php endforeach; ?></select><?php if (!$disponiveis): ?><small class="text-muted d-block mt-2">Não há alunos ativos disponíveis para matrícula.</small><?php endif; ?></div><div class="modal-footer"><button class="btn btn-theme" type="submit" <?= !$disponiveis ? 'disabled' : '' ?>>Cadastrar</button><button class="btn btn-muted" type="button" data-bs-dismiss="modal">Cancelar</button></div></form></div></div></div>
<?php endif; ?>
<?php require __DIR__ . '/partials/rodape.php'; ?>
