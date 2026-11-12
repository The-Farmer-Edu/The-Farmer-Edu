<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>The Farmer Edu - <?= $curso ? 'Editar curso' : 'Novo curso' ?></title>
</head>
<body>
    <?php require __DIR__ . '/partials/cabecalho.php'; ?>

    <main>
        <h1><?= $curso ? 'Editar curso' : 'Novo curso' ?></h1>
        <p><a href="<?= $base ?>/turmas_cursos/cursos">Voltar para Cursos</a></p>
        <?php if ($erro): ?><p><strong><?= e($erro) ?></strong></p><?php endif; ?>

        <form method="POST" action="<?= $base ?>/turmas_cursos/<?= $curso ? 'cursoAtualizar' : 'cursoSalvar' ?>">
            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
            <?php if ($curso): ?>
                <input type="hidden" name="id_curso" value="<?= (int) $curso['id_curso'] ?>">
            <?php endif; ?>
            <p>
                <label>Nome do curso:
                    <input name="nome" maxlength="150" value="<?= e($curso['nome_curso'] ?? '') ?>" required>
                </label>
            </p>
            <p>
                <label>Descrição (opcional):<br>
                    <textarea name="descricao" rows="4" cols="50" maxlength="1000"><?= e($curso['descricao'] ?? '') ?></textarea>
                </label>
            </p>
            <button type="submit"><?= $curso ? 'Salvar alterações' : 'Criar curso' ?></button>
            <a href="<?= $base ?>/turmas_cursos/cursos">Cancelar</a>
        </form>
    </main>
</body>
</html>
