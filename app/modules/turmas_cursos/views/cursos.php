<?php
$tituloPagina = 'Cursos';
$abrirModal = $abrirModal ?? '';
require __DIR__ . '/partials/head.php';
?>
<main class="page-main">
    <div class="page-heading">
        <div><span class="page-kicker"><?= $ehInstrutor ? 'Área do instrutor' : 'Área do aluno' ?></span><h1><?= $ehInstrutor ? 'Cursos' : 'Meus cursos' ?></h1><p><?= $ehInstrutor ? 'Organize os cursos e gerencie as turmas vinculadas.' : 'Consulte os cursos em que você possui matrícula.' ?></p></div>
        <a class="btn btn-outline-theme" href="<?= $base ?>/turmas_cursos/<?= e($u['perfilAcesso']) ?>"><i class="bi bi-collection me-2"></i>Voltar às turmas</a>
    </div>
    <?php if (!empty($msg)): ?><div class="alert alert-success flash-message" role="status"><?= e($msg) ?></div><?php endif; ?>
    <?php if (!empty($erro) && $abrirModal !== 'curso'): ?><div class="alert alert-danger flash-message" role="alert"><?= e($erro) ?></div><?php endif; ?>

    <section aria-label="Lista de cursos">
        <div class="card-grid">
            <?php foreach ($cursos as $c): ?>
                <article class="course-card <?= !$ehInstrutor && (int) ($c['ativo'] ?? 1) !== 1 ? 'archived-card' : '' ?>">
                    <a class="text-reset" href="<?= $base ?>/turmas_cursos/<?= $ehInstrutor ? 'turmaForm?curso=' . (int) $c['id_curso'] : 'cursoAluno?id=' . (int) $c['id_curso'] ?>">
                        <div class="course-card__title"><?= e($c['nome_curso']) ?><?php if (!$ehInstrutor && (int) ($c['ativo'] ?? 1) !== 1): ?><small class="d-block">Curso arquivado</small><?php endif; ?></div>
                        <div class="course-card__cover"><div class="course-placeholder"><i class="bi bi-journal-richtext"></i><span>The Farmer Edu · Curso</span></div></div>
                    </a>
                    <div class="course-card__body">
                        <div class="course-card__meta"><span><i class="bi bi-collection"></i><?= (int) ($c['total_turmas'] ?? 0) ?> turma(s)</span><?php if (!empty($c['descricao'])): ?><span><i class="bi bi-info-circle"></i>Com descrição</span><?php endif; ?></div>
                        <?php if ($ehInstrutor): ?>
                            <div class="course-card__actions">
                                <a class="btn btn-outline-theme" href="<?= $base ?>/turmas_cursos/cursoEditar?id=<?= (int) $c['id_curso'] ?>" aria-label="Editar curso" title="Editar curso"><i class="bi bi-pencil"></i></a>
                                <form method="post" action="<?= $base ?>/turmas_cursos/cursoArquivar" data-confirm="Deseja arquivar este curso? As turmas e matrículas existentes serão preservadas."><input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_curso" value="<?= (int) $c['id_curso'] ?>"><button class="btn btn-outline-theme" type="submit" aria-label="Arquivar curso" title="Arquivar curso"><i class="bi bi-archive"></i></button></form>
                                <?php if ((int) ($c['total_turmas_vinculadas'] ?? 0) === 0): ?><form method="post" action="<?= $base ?>/turmas_cursos/cursoExcluir" data-confirm="Tem certeza de que deseja excluir permanentemente este curso?"><input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_curso" value="<?= (int) $c['id_curso'] ?>"><button class="btn btn-outline-danger" type="submit" aria-label="Excluir curso" title="Excluir curso"><i class="bi bi-trash"></i></button></form><?php endif; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                    <?php if (!empty($c['descricao'])): ?><div class="px-3 pb-3 course-description"><?= e($c['descricao']) ?></div><?php endif; ?>
                </article>
            <?php endforeach; ?>

            <?php if ($ehInstrutor): ?>
                <button class="add-card" type="button" data-bs-toggle="modal" data-bs-target="#modalCurso"><span class="add-card__icon"><i class="bi bi-plus-lg"></i></span><span>Adicionar Curso</span></button>
            <?php endif; ?>
        </div>
        <?php if (!$cursos && !$ehInstrutor): ?><div class="empty-state mt-3"><i class="bi bi-journals"></i><strong>Você ainda não está matriculado em nenhum curso.</strong><div>Quando seu instrutor realizar sua matrícula, os cursos aparecerão aqui.</div></div><?php elseif (!$cursos && $ehInstrutor): ?><div class="empty-state mt-3"><i class="bi bi-journal-plus"></i><strong>Nenhum curso cadastrado.</strong><div>Use o card “Adicionar Curso” para cadastrar o primeiro.</div></div><?php endif; ?>
    </section>

    <?php if ($ehInstrutor && !empty($cursosArquivados)): ?>
        <section class="mt-5" aria-labelledby="cursos-arquivados-title">
            <h2 class="section-heading" id="cursos-arquivados-title">Cursos arquivados</h2>
            <p class="archived-course-note">Arquivar um curso não apaga suas turmas nem matrículas. As turmas existentes continuam acessíveis; o curso arquivado deixa de aceitar novas turmas até ser restaurado.</p>
            <div class="card-grid">
                <?php foreach ($cursosArquivados as $c): ?>
                    <article class="course-card archived-card">
                        <div class="course-card__title"><?= e($c['nome_curso']) ?><small class="d-block">Arquivado</small></div>
                        <div class="course-card__cover"><div class="course-placeholder"><i class="bi bi-archive"></i><span>The Farmer Edu · Curso</span></div></div>
                        <div class="course-card__body">
                            <div class="course-card__meta"><span><i class="bi bi-collection"></i><?= (int) ($c['total_turmas'] ?? 0) ?> turma(s) ativa(s)</span></div>
                            <div class="course-card__actions">
                                <form method="post" action="<?= $base ?>/turmas_cursos/cursoRestaurar" data-confirm="Deseja restaurar este curso? Será possível adicionar novas turmas novamente."><input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_curso" value="<?= (int) $c['id_curso'] ?>"><button class="btn btn-outline-theme" type="submit" title="Restaurar curso"><i class="bi bi-arrow-counterclockwise"></i> Restaurar</button></form>
                                <?php if ((int) ($c['total_turmas_vinculadas'] ?? 0) === 0): ?><form method="post" action="<?= $base ?>/turmas_cursos/cursoExcluir" data-confirm="Tem certeza de que deseja excluir permanentemente este curso?"><input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_curso" value="<?= (int) $c['id_curso'] ?>"><button class="btn btn-outline-danger" type="submit" aria-label="Excluir curso" title="Excluir curso"><i class="bi bi-trash"></i></button></form><?php endif; ?>
                            </div>
                        </div>
                        <?php if (!empty($c['descricao'])): ?><div class="px-3 pb-3 course-description"><?= e($c['descricao']) ?></div><?php endif; ?>
                    </article>
                <?php endforeach; ?>
            </div>
        </section>
    <?php endif; ?>
</main>

<?php if ($ehInstrutor): ?>
<div class="modal fade" id="modalCurso" tabindex="-1" aria-labelledby="modalCursoTitulo" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered"><div class="modal-content">
        <form method="post" action="<?= $base ?>/turmas_cursos/cursoSalvar">
            <div class="modal-header"><h2 class="modal-title" id="modalCursoTitulo">Adicionar Curso</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button></div>
            <div class="modal-body">
                <?php if (!empty($erro) && $abrirModal === 'curso'): ?><div class="modal-error"><?= e($erro) ?></div><?php endif; ?>
                <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                <div class="mb-3"><label class="form-label" for="cursoNome">Nome do curso</label><input class="form-control" id="cursoNome" name="nome" maxlength="150" placeholder="Ex.: Desenvolvimento Web" required></div>
                <div><label class="form-label" for="cursoDescricao">Descrição</label><textarea class="form-control" id="cursoDescricao" name="descricao" maxlength="1000" rows="4" placeholder="Descreva brevemente o curso..."></textarea></div>
            </div>
            <div class="modal-footer"><button class="btn btn-theme" type="submit">Salvar</button><button class="btn btn-muted" type="button" data-bs-dismiss="modal">Cancelar</button></div>
        </form>
    </div></div>
</div>
<?php endif; ?>
<?php require __DIR__ . '/partials/rodape.php'; ?>
