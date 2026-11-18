<?php
$tituloPagina = 'Turmas';
require __DIR__ . '/partials/head.php';
?>
<main class="page-main">
    <div class="page-heading">
        <div><span class="page-kicker">Área do instrutor</span><h1>Minhas turmas</h1><p>Gerencie suas turmas e acompanhe os alunos.</p></div>
        <a class="btn btn-outline-theme" href="<?= $base ?>/turmas_cursos/cursos"><i class="bi bi-journals me-2"></i>Gerenciar cursos</a>
    </div>
    <?php if (!empty($msg)): ?><div class="alert alert-success flash-message" role="status"><?= e($msg) ?></div><?php endif; ?>
    <?php if (!empty($erro)): ?><div class="alert alert-danger flash-message" role="alert"><?= e($erro) ?></div><?php endif; ?>

    <section aria-labelledby="turmas-ativas-title">
        <h2 class="section-heading" id="turmas-ativas-title">Turmas ativas</h2>
        <div class="card-grid">
            <?php foreach ($turmas as $t): ?>
                <article class="course-card">
                    <a href="<?= $base ?>/turmas_cursos/turma?id=<?= (int) $t['id_turma'] ?>" class="text-reset">
                        <div class="course-card__title"><?= e($t['nome_turma']) ?></div>
                        <div class="course-card__cover">
                            <?php if (!empty($t['image_turma'])): ?><img src="<?= $base ?>/turmas_cursos/imagemTurma?id=<?= (int) $t['id_turma'] ?>" alt="Imagem da turma <?= e($t['nome_turma']) ?>">
                            <?php else: ?><div class="course-placeholder"><i class="bi bi-mortarboard"></i><span><?= e($t['nome_curso']) ?></span></div><?php endif; ?>
                        </div>
                    </a>
                    <div class="course-card__body">
                        <div class="course-card__meta"><span><i class="bi bi-journal-bookmark"></i><?= e($t['nome_curso']) ?></span><span><i class="bi bi-people"></i><?= (int) $t['total_alunos'] ?> aluno(s)</span><span><i class="bi bi-clock"></i><?= e(TurmaModel::TURNOS[$t['turno']] ?? $t['turno']) ?></span></div>
                        <div class="course-card__actions">
                            <a class="btn btn-outline-theme" href="<?= $base ?>/turmas_cursos/turmaPessoas?id=<?= (int) $t['id_turma'] ?>" aria-label="Ver alunos"><i class="bi bi-people"></i></a>
                            <a class="btn btn-outline-theme" href="<?= $base ?>/turmas_cursos/turmaEditar?id=<?= (int) $t['id_turma'] ?>" aria-label="Editar turma"><i class="bi bi-pencil"></i></a>
                            <form method="post" action="<?= $base ?>/turmas_cursos/turmaArquivar" data-confirm="Deseja arquivar esta turma? Ela continuará disponível no histórico e poderá ser restaurada.">
                                <input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_turma" value="<?= (int) $t['id_turma'] ?>">
                                <button class="btn btn-outline-danger" type="submit" aria-label="Arquivar turma" title="Arquivar turma"><i class="bi bi-archive"></i></button>
                            </form>
                        </div>
                    </div>
                </article>
            <?php endforeach; ?>
            <button class="add-card" type="button" data-bs-toggle="modal" data-bs-target="#modalTurma">
                <span class="add-card__icon"><i class="bi bi-plus-lg"></i></span><span>Adicionar Turma</span>
            </button>
        </div>
        <?php if (!$turmas): ?><div class="empty-state mt-3"><i class="bi bi-collection"></i><strong>Você ainda não criou turmas.</strong><div>Use o card “Adicionar Turma” para começar.</div></div><?php endif; ?>
    </section>

    <?php if ($arquivadas): ?>
        <section aria-labelledby="turmas-arquivadas-title">
            <h2 class="section-heading" id="turmas-arquivadas-title">Turmas arquivadas</h2>
            <div class="card-grid">
                <?php foreach ($arquivadas as $t): ?>
                    <article class="course-card archived-card">
                        <a href="<?= $base ?>/turmas_cursos/turma?id=<?= (int) $t['id_turma'] ?>" class="text-reset">
                            <div class="course-card__title"><?= e($t['nome_turma']) ?> <small class="d-block">Arquivada</small></div>
                            <div class="course-card__cover"><?php if (!empty($t['image_turma'])): ?><img src="<?= $base ?>/turmas_cursos/imagemTurma?id=<?= (int) $t['id_turma'] ?>" alt="Imagem da turma"><?php else: ?><div class="course-placeholder"><i class="bi bi-archive"></i><span><?= e($t['nome_curso']) ?></span></div><?php endif; ?></div>
                        </a>
                        <div class="course-card__body"><div class="course-card__meta"><span><?= e($t['nome_curso']) ?></span><span><?= (int) $t['total_alunos'] ?> aluno(s)</span></div>
                            <form method="post" action="<?= $base ?>/turmas_cursos/turmaRestaurar" data-confirm="Deseja restaurar esta turma?">
                                <input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_turma" value="<?= (int) $t['id_turma'] ?>"><button class="btn btn-outline-theme" type="submit">Restaurar</button>
                            </form>
                        </div>
                    </article>
                <?php endforeach; ?>
            </div>
        </section>
    <?php endif; ?>
</main>

<div class="modal fade" id="modalTurma" tabindex="-1" aria-labelledby="modalTurmaTitulo" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content">
        <form method="post" action="<?= $base ?>/turmas_cursos/turmaSalvar" enctype="multipart/form-data">
            <div class="modal-header"><h2 class="modal-title" id="modalTurmaTitulo">Adicionar Turma</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button></div>
            <div class="modal-body">
                <?php if (!empty($erro) && ($abrirModal ?? '') === 'turma'): ?><div class="modal-error"><?= e($erro) ?></div><?php endif; ?>
                <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                <div class="row g-3">
                    <div class="col-12"><label class="form-label" for="turmaNome">Nome da Turma</label><input class="form-control" id="turmaNome" name="nome" maxlength="100" placeholder="Ex.: Automação em Python" required></div>
                    <div class="col-md-6"><label class="form-label" for="turmaCurso">Curso</label><select class="form-select" id="turmaCurso" name="id_curso" required><option value="">Selecione um curso...</option><?php foreach ($cursos as $c): ?><option value="<?= (int) $c['id_curso'] ?>"><?= e($c['nome_curso']) ?></option><?php endforeach; ?></select></div>
                    <div class="col-md-6"><label class="form-label" for="turmaTurno">Turno</label><select class="form-select" id="turmaTurno" name="turno" required><option value="">Selecione um turno...</option><?php foreach (TurmaModel::TURNOS as $valor => $rotulo): ?><option value="<?= e($valor) ?>"><?= e($rotulo) ?></option><?php endforeach; ?></select></div>
                    <div class="col-12"><label class="form-label" for="imagemTurma">Imagem da turma</label><label class="image-dropzone w-100" for="imagemTurma"><i class="bi bi-image"></i><strong data-image-label>Adicione uma imagem de até 5 MB, preferencialmente WEBP</strong><small>Formatos aceitos: JPG, PNG e WEBP.</small><img id="imagePreview" class="image-preview d-none" alt="Prévia da imagem selecionada"></label><input class="visually-hidden" id="imagemTurma" type="file" name="imagem_turma" accept="image/jpeg,image/png,image/webp" data-image-input data-preview-target="imagePreview" data-label-target="[data-image-label]"></div>
                </div>
            </div>
            <div class="modal-footer"><button class="btn btn-theme" type="submit" <?= !$cursos ? 'disabled' : '' ?>>Salvar</button><button class="btn btn-muted" type="button" data-bs-dismiss="modal">Cancelar</button></div>
        </form>
    </div></div>
</div>
<?php require __DIR__ . '/partials/rodape.php'; ?>
