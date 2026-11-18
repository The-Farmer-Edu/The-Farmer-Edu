<?php
$tituloPagina = $curso['nome_curso'];
require __DIR__ . '/partials/head.php';
?>
<main class="page-main">
    <div class="page-heading"><div><span class="page-kicker">Meus cursos</span><h1><?= e($curso['nome_curso']) ?></h1><?php if (!empty($curso['descricao'])): ?><p><?= e($curso['descricao']) ?></p><?php else: ?><p>Turmas em que você está matriculado neste curso.</p><?php endif; ?></div><a class="btn btn-outline-theme" href="<?= $base ?>/turmas_cursos/cursos"><i class="bi bi-arrow-left me-2"></i>Voltar aos cursos</a></div>
    <div class="card-grid">
        <?php foreach ($turmas as $t): ?>
            <a class="course-card" href="<?= $base ?>/turmas_cursos/turmaAluno?id=<?= (int) $t['id_turma'] ?>">
                <div class="course-card__title"><?= e($t['nome_turma']) ?></div>
                <div class="course-card__cover"><?php if (!empty($t['image_turma'])): ?><img src="<?= $base ?>/turmas_cursos/imagemTurma?id=<?= (int) $t['id_turma'] ?>" alt="Imagem da turma"><?php else: ?><div class="course-placeholder"><i class="bi bi-mortarboard"></i><span><?= e($t['nome_instrutor']) ?></span></div><?php endif; ?></div>
                <div class="course-card__body"><div class="course-card__meta"><span><i class="bi bi-person"></i><?= e($t['nome_instrutor']) ?></span><span><i class="bi bi-clock"></i><?= e(TurmaModel::TURNOS[$t['turno']] ?? $t['turno']) ?></span></div><i class="bi bi-arrow-up-right-circle fs-4"></i></div>
            </a>
        <?php endforeach; ?>
    </div>
    <?php if (!$turmas): ?><div class="empty-state"><i class="bi bi-collection"></i><strong>Nenhuma turma ativa deste curso foi encontrada.</strong></div><?php endif; ?>
</main>
<?php require __DIR__ . '/partials/rodape.php'; ?>
