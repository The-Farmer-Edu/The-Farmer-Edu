<?php
$tituloPagina = 'Editar curso';
require __DIR__ . '/partials/head.php';
?>
<main class="course-form-page">
    <section class="page-panel">
        <div class="course-form-page__header"><h1>Editar Curso</h1></div>
        <div class="course-form-page__body">
            <a href="<?= $base ?>/turmas_cursos/cursos" class="small d-inline-block mb-4"><i class="bi bi-arrow-left me-1"></i>Voltar para cursos</a>
            <?php if (!empty($erro)): ?><div class="alert alert-danger"><?= e($erro) ?></div><?php endif; ?>
            <form method="post" action="<?= $base ?>/turmas_cursos/cursoAtualizar">
                <input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="id_curso" value="<?= (int) $curso['id_curso'] ?>">
                <div class="mb-3"><label class="form-label" for="nomeCurso">Nome do curso</label><input class="form-control" id="nomeCurso" name="nome" maxlength="150" value="<?= e($curso['nome_curso']) ?>" required></div>
                <div class="mb-4"><label class="form-label" for="descricaoCurso">Descrição</label><textarea class="form-control" id="descricaoCurso" name="descricao" maxlength="1000" rows="5"><?= e($curso['descricao'] ?? '') ?></textarea></div>
                <div class="course-form-actions"><button class="btn btn-theme" type="submit">Salvar alterações</button><a class="btn btn-muted" href="<?= $base ?>/turmas_cursos/cursos">Cancelar</a></div>
            </form>
        </div>
    </section>
</main>
<?php require __DIR__ . '/partials/rodape.php'; ?>
