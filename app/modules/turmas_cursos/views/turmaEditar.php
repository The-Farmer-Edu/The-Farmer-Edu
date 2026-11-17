<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>The Farmer Edu - Editar turma</title>
</head>
<body>
    <?php require __DIR__ . '/partials/cabecalho.php'; ?>

    <main>
        <h1>Editar turma - <?= e($turma['nome_curso']) ?></h1>
        <p><a href="<?= $base ?>/turmas_cursos/instrutor">Voltar às turmas</a></p>
        <?php if ($erro): ?><p><strong><?= e($erro) ?></strong></p><?php endif; ?>

        <form method="POST" action="<?= $base ?>/turmas_cursos/turmaAtualizar">
            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
            <input type="hidden" name="id_turma" value="<?= (int) $turma['id_turma'] ?>">
            <p><label>Nome da turma: <input name="nome" maxlength="100" value="<?= e($turma['nome_turma']) ?>" required></label></p>
            <p>
                <label>Turno:
                    <select name="turno" required>
                        <?php foreach (TurmaModel::TURNOS as $valor => $rotulo): ?>
                            <option value="<?= e($valor) ?>" <?= $valor === $turma['turno'] ? 'selected' : '' ?>><?= e($rotulo) ?></option>
                        <?php endforeach; ?>
                    </select>
                </label>
            </p>
            <button type="submit">Salvar alterações</button>
            <a href="<?= $base ?>/turmas_cursos/instrutor">Cancelar</a>
        </form>
    </main>
</body>
</html>
