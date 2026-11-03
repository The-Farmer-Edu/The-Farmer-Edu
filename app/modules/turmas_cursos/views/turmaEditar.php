<!DOCTYPE html>
<html lang="pt-br">
<head><meta charset="UTF-8"><title>Editar turma - The Farmer Edu</title></head>
<body>
    <header>
        <b>The Farmer Edu</b> | Bem-vindo, <?= e($u['nome']) ?> |
        <a href="<?= $base ?>/auth/logout">Sair</a>
    </header>

    <h1>Editar turma - <?= e($turma['nome_curso']) ?></h1>
    <?php if ($erro): ?><p><b style="color:#b00020"><?= e($erro) ?></b></p><?php endif; ?>

    <form method="POST" action="<?= $base ?>/turmas_cursos/turmaAtualizar">
        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
        <input type="hidden" name="id_turma" value="<?= (int) $turma['id_turma'] ?>">
        <p><label>Nome da turma: <input name="nome" maxlength="100" value="<?= e($turma['nome_turma']) ?>" required></label></p>
        <p><label>Turno:
            <select name="turno" required>
                <?php foreach (TurmaModel::TURNOS as $valor => $rotulo): ?>
                    <option value="<?= e($valor) ?>" <?= $valor === $turma['turno'] ? 'selected' : '' ?>><?= e($rotulo) ?></option>
                <?php endforeach; ?>
            </select>
        </label></p>
        <button type="submit">Salvar alterações</button>
        <a href="<?= $base ?>/turmas_cursos/turmaForm?curso=<?= (int) $turma['id_curso'] ?>">Cancelar</a>
    </form>
</body>
</html>
