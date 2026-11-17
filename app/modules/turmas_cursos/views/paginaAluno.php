<?php
$tituloPagina = 'Minhas turmas';
$ativas = array_filter($turmas, static fn($t) => (int) $t['ativo'] === 1);
$arquivadas = array_filter($turmas, static fn($t) => (int) $t['ativo'] !== 1);
require __DIR__ . '/partials/head.php';
?>
<main class="page-main">
    <div class="page-heading">
        <div><span class="page-kicker">Área do aluno</span><h1>Minhas turmas</h1><p>Acesse suas salas de aprendizagem e acompanhe as atividades.</p></div>
        <a class="btn btn-outline-theme" href="<?= $base ?>/turmas_cursos/cursos"><i class="bi bi-journals me-2"></i>Meus cursos</a>
    </div>

    <?php if (!empty($_GET['erro'])): ?><div class="alert alert-danger flash-message" role="alert"><?= e($_GET['erro']) ?></div><?php endif; ?>
    <section aria-labelledby="turmas-ativas-title">
        <h2 class="section-heading" id="turmas-ativas-title">Turmas ativas</h2>
        <?php if ($ativas): ?>
            <div class="card-grid">
                <?php foreach ($ativas as $t): ?>
                    <a class="course-card" href="<?= $base ?>/turmas_cursos/turmaAluno?id=<?= (int) $t['id_turma'] ?>">
                        <div class="course-card__title"><?= e($t['nome_turma']) ?></div>
                        <div class="course-card__cover">
                            <?php if (!empty($t['image_turma'])): ?>
                                <img src="<?= $base ?>/turmas_cursos/imagemTurma?id=<?= (int) $t['id_turma'] ?>" alt="Imagem da turma <?= e($t['nome_turma']) ?>">
                            <?php else: ?>
                                <div class="course-placeholder"><i class="bi bi-mortarboard"></i><span><?= e($t['nome_curso']) ?></span></div>
                            <?php endif; ?>
                        </div>
                        <div class="course-card__body"><div class="course-card__meta"><span><i class="bi bi-journal-bookmark"></i><?= e($t['nome_curso']) ?></span><span><i class="bi bi-sun"></i><?= e(TurmaModel::TURNOS[$t['turno']] ?? $t['turno']) ?></span></div><i class="bi bi-arrow-up-right-circle fs-4 text-success"></i></div>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <div class="empty-state"><i class="bi bi-mortarboard"></i><strong>Você ainda não está matriculado em uma turma ativa.</strong><div>Aguarde seu instrutor realizar sua matrícula.</div></div>
        <?php endif; ?>
    </section>

    <?php if ($arquivadas): ?>
        <section aria-labelledby="turmas-arquivadas-title">
            <h2 class="section-heading" id="turmas-arquivadas-title">Turmas arquivadas</h2>
            <div class="card-grid">
                <?php foreach ($arquivadas as $t): ?>
                    <a class="course-card archived-card" href="<?= $base ?>/turmas_cursos/turmaAluno?id=<?= (int) $t['id_turma'] ?>">
                        <div class="course-card__title"><?= e($t['nome_turma']) ?> <small class="d-block">Arquivada</small></div>
                        <div class="course-card__cover">
                            <?php if (!empty($t['image_turma'])): ?><img src="<?= $base ?>/turmas_cursos/imagemTurma?id=<?= (int) $t['id_turma'] ?>" alt="Imagem da turma">
                            <?php else: ?><div class="course-placeholder"><i class="bi bi-archive"></i><span><?= e($t['nome_curso']) ?></span></div><?php endif; ?>
                        </div>
                        <div class="course-card__body"><div class="course-card__meta"><span><?= e($t['nome_curso']) ?></span><span><?= e(TurmaModel::TURNOS[$t['turno']] ?? $t['turno']) ?></span></div></div>
                    </a>
                <?php endforeach; ?>
            </div>
        </section>
    <?php endif; ?>
</main>
<?php require __DIR__ . '/partials/rodape.php'; ?>
