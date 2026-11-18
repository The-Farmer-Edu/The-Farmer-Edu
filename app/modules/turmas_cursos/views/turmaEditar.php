<?php
$tituloPagina = 'Editar turma';
require __DIR__ . '/partials/head.php';
?>
<main class="course-form-page">
    <section class="page-panel">
        <div class="course-form-page__header"><h1>Editar Turma</h1></div>
        <div class="course-form-page__body">
            <a class="small d-inline-block mb-4" href="<?= $base ?>/turmas_cursos/instrutor"><i class="bi bi-arrow-left me-1"></i>Voltar para as turmas</a>
            <?php if (!empty($erro)): ?><div class="alert alert-danger"><?= e($erro) ?></div><?php endif; ?>
            <form method="post" action="<?= $base ?>/turmas_cursos/turmaAtualizar" enctype="multipart/form-data">
                <input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_turma" value="<?= (int) $turma['id_turma'] ?>">
                <div class="mb-3"><label class="form-label" for="nomeTurma">Nome da turma</label><input class="form-control" id="nomeTurma" name="nome" maxlength="100" value="<?= e($turma['nome_turma']) ?>" required></div>
                <div class="mb-3"><label class="form-label" for="turnoTurma">Turno</label><select class="form-select" id="turnoTurma" name="turno" required><?php foreach (TurmaModel::TURNOS as $valor => $rotulo): ?><option value="<?= e($valor) ?>" <?= $valor === $turma['turno'] ? 'selected' : '' ?>><?= e($rotulo) ?></option><?php endforeach; ?></select></div>
                <?php $imagemAtualUrl = !empty($turma['image_turma']) ? $base . '/turmas_cursos/imagemTurma?id=' . (int) $turma['id_turma'] : null; ?>
                <div class="mb-4"><label class="form-label" for="imagemTurma">Imagem da turma</label><?php require __DIR__ . '/partials/campoImagemTurma.php'; ?></div>
                <div class="course-form-actions"><button class="btn btn-theme" type="submit">Salvar alterações</button><a class="btn btn-muted" href="<?= $base ?>/turmas_cursos/instrutor">Cancelar</a></div>
            </form>
        </div>
    </section>
</main>
<?php require __DIR__ . '/partials/rodape.php'; ?>
