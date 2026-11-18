<?php
$tituloPagina = 'Editar turma';
require __DIR__ . '/partials/head.php';
?>
<main class="course-form-page">
    <section class="page-panel">
        <div class="course-form-page__header"><h1>Editar Turma</h1></div>
        <div class="course-form-page__body">
            <a class="small d-inline-block mb-4" href="<?= $base ?>/turmas_cursos/turma?id=<?= (int) $turma['id_turma'] ?>"><i class="bi bi-arrow-left me-1"></i>Voltar para a turma</a>
            <?php if (!empty($erro)): ?><div class="alert alert-danger"><?= e($erro) ?></div><?php endif; ?>
            <form method="post" action="<?= $base ?>/turmas_cursos/turmaAtualizar" enctype="multipart/form-data">
                <input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_turma" value="<?= (int) $turma['id_turma'] ?>">
                <div class="mb-3"><label class="form-label" for="nomeTurma">Nome da turma</label><input class="form-control" id="nomeTurma" name="nome" maxlength="100" value="<?= e($turma['nome_turma']) ?>" required></div>
                <div class="mb-3"><label class="form-label" for="turnoTurma">Turno</label><select class="form-select" id="turnoTurma" name="turno" required><?php foreach (TurmaModel::TURNOS as $valor => $rotulo): ?><option value="<?= e($valor) ?>" <?= $valor === $turma['turno'] ? 'selected' : '' ?>><?= e($rotulo) ?></option><?php endforeach; ?></select></div>
                <div class="mb-3"><label class="form-label" for="imagemTurma">Imagem da turma</label><label class="image-dropzone w-100" for="imagemTurma"><i class="bi bi-image"></i><strong data-image-label>Escolha uma nova imagem (opcional)</strong><small>Máximo 5 MB · JPG, PNG ou WEBP</small><?php if (!empty($turma['image_turma'])): ?><img src="<?= $base ?>/turmas_cursos/imagemTurma?id=<?= (int) $turma['id_turma'] ?>" class="image-preview" id="imagePreview" alt="Imagem atual da turma"><?php else: ?><img class="image-preview d-none" id="imagePreview" alt="Prévia da nova imagem"><?php endif; ?></label><input class="visually-hidden" id="imagemTurma" type="file" name="imagem_turma" accept="image/jpeg,image/png,image/webp" data-image-input data-preview-target="imagePreview" data-label-target="[data-image-label]"></div>
                <?php if (!empty($turma['image_turma'])): ?><div class="form-check mb-4"><input class="form-check-input" type="checkbox" value="1" id="removerImagem" name="remover_imagem"><label class="form-check-label" for="removerImagem">Remover imagem atual</label></div><?php endif; ?>
                <div class="course-form-actions"><button class="btn btn-theme" type="submit">Salvar alterações</button><a class="btn btn-muted" href="<?= $base ?>/turmas_cursos/turma?id=<?= (int) $turma['id_turma'] ?>">Cancelar</a></div>
            </form>
        </div>
    </section>
</main>
<?php require __DIR__ . '/partials/rodape.php'; ?>
