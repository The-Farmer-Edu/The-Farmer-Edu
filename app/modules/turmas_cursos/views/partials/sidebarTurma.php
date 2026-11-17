<?php
$isInstructor = $u['perfilAcesso'] === 'instrutor';
$activeSection = $activeSection ?? 'mural';
$turmaId = (int) $turma['id_turma'];
$rotaMural = $isInstructor ? 'turma' : 'turmaAluno';
$rotaPessoas = $isInstructor ? 'turmaPessoas' : 'turmaPessoasAluno';
?>
<aside class="class-sidebar" aria-label="Navegação da turma">
    <div class="class-sidebar__links">
        <a class="sidebar-link <?= $activeSection === 'mural' ? 'is-active' : '' ?>" href="<?= $base ?>/turmas_cursos/<?= $rotaMural ?>?id=<?= $turmaId ?>">
            <span class="sidebar-link__icon"><i class="bi bi-house-door"></i></span><span>Mural</span>
        </a>
        <a class="sidebar-link <?= $activeSection === 'atividades' ? 'is-active' : '' ?>" href="<?= $base ?>/turmas_cursos/<?= $rotaMural ?>?id=<?= $turmaId ?>#atividades">
            <span class="sidebar-link__icon"><i class="bi bi-clipboard-check"></i></span><span>Atividades</span>
        </a>
        <a class="sidebar-link <?= $activeSection === 'pessoas' ? 'is-active' : '' ?>" href="<?= $base ?>/turmas_cursos/<?= $rotaPessoas ?>?id=<?= $turmaId ?>">
            <span class="sidebar-link__icon"><i class="bi bi-people"></i></span><span><?= $isInstructor ? 'Alunos' : 'Pessoas' ?></span>
        </a>
        <?php if ($isInstructor): ?>
            <a class="sidebar-link" href="<?= $base ?>/turmas_cursos/turmaEditar?id=<?= $turmaId ?>">
                <span class="sidebar-link__icon"><i class="bi bi-pencil-square"></i></span><span>Editar turma</span>
            </a>
        <?php endif; ?>
    </div>
    <a class="sidebar-back" href="<?= $base ?>/turmas_cursos/<?= e($u['perfilAcesso']) ?>">
        <span class="sidebar-link__icon"><i class="bi bi-box-arrow-left"></i></span><span>Voltar</span>
    </a>
</aside>
