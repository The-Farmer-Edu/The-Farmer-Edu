<?php
$tituloPagina = $turma['nome_turma'] . ' · Mural';
$activeSection = 'mural';
$isArchived = (int) $turma['ativo'] !== 1;
require __DIR__ . '/partials/headClass.php';
?>
<div class="class-layout">
    <?php require __DIR__ . '/partials/sidebarTurma.php'; ?>
    <main class="class-content">
        <div class="class-title-row"><div><span class="page-kicker">Mural da turma</span><h2>Atividades</h2></div><?php if ($isArchived): ?><span class="status-pill status-pill--inactive">Turma arquivada</span><?php endif; ?></div>
        <section class="activity-section" id="atividades" aria-labelledby="atividades-title">
            <div class="activity-banner">
                <div class="activity-banner__title" id="atividades-title"><i class="bi bi-clipboard-check"></i>ATIVIDADES</div>
                <div class="activity-banner__image"><?php if (!empty($turma['image_turma'])): ?><img src="<?= $base ?>/turmas_cursos/imagemTurma?id=<?= (int) $turma['id_turma'] ?>" alt="Imagem da turma"><?php else: ?><div class="course-placeholder"><i class="bi bi-mortarboard"></i><span><?= e($turma['nome_curso']) ?></span></div><?php endif; ?></div>
            </div>
            <?php if ($atividades): ?>
                <div class="activity-list">
                    <?php foreach ($atividades as $atividade): ?>
                        <article class="activity-item">
                            <i class="bi bi-clipboard-check activity-item__icon"></i>
                            <div class="activity-item__body"><strong><?= e($atividade['titulo']) ?></strong><small><?php if (!empty($atividade['criado_em'])): ?><?= e(date('d/m/Y · H:i', strtotime($atividade['criado_em']))) ?><?php endif; ?><?php if (!empty($atividade['data_entrega'])): ?> · Entrega: <?= e(date('d/m/Y', strtotime($atividade['data_entrega']))) ?><?php endif; ?></small></div>
                            <span class="activity-item__status"><?= !empty($atividade['enviada']) ? 'Enviada' : 'Pendente' ?></span>
                        </article>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <div class="empty-state"><i class="bi bi-clipboard"></i><strong>Nenhuma atividade publicada ainda.</strong><div>As atividades desta turma aparecerão aqui.</div></div>
            <?php endif; ?>
        </section>
    </main>
</div>
<?php require __DIR__ . '/partials/rodape.php'; ?>
