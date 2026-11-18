<?php
$tituloPagina = $turma['nome_turma'] . ' · Pessoas';
$activeSection = 'pessoas';
require __DIR__ . '/partials/headClass.php';
?>
<div class="class-layout">
    <?php require __DIR__ . '/partials/sidebarTurma.php'; ?>
    <main class="class-content">
        <div class="people-wrap">
            <div class="class-title-row"><div><span class="page-kicker">Participantes da turma</span><h2>Pessoas</h2></div></div>
            <section><h3 class="people-section-title">Instrutores</h3><div class="person-list"><div class="person-row"><span class="person-avatar"><i class="bi bi-person-workspace"></i></span><div class="person-info"><strong><?= e($turma['nome_instrutor'] ?? 'Instrutor responsável') ?></strong><small>Instrutor</small></div></div></div></section>
            <hr class="people-divider">
            <section><h3 class="people-section-title">Alunos <span class="text-muted fs-6">(<?= count($pessoas) ?>)</span></h3><div class="person-list">
                <?php foreach ($pessoas as $p): ?><div class="person-row"><span class="person-avatar"><?= e(inicialNome((string) $p['nome'])) ?></span><div class="person-info"><strong><?= e($p['nome']) ?></strong><small><?= (int) $p['ativo'] === 1 ? 'Aluno' : 'Conta desativada' ?></small></div></div><?php endforeach; ?>
                <?php if (!$pessoas): ?><div class="empty-state"><i class="bi bi-people"></i><strong>Nenhum participante encontrado.</strong></div><?php endif; ?>
            </div></section>
        </div>
    </main>
</div>
<?php require __DIR__ . '/partials/rodape.php'; ?>
