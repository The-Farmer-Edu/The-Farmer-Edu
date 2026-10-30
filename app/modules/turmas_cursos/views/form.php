<!DOCTYPE html>
<html lang="pt-br">
<head><meta charset="UTF-8"><title>Turmas - The Farmer Edu</title></head>
<body>
    <header>
        <b>The Farmer Edu</b> | Bem-vindo, <?= e($u['nome']) ?> |
        <a href="<?= $base ?>/auth/logout">Sair</a>
    </header>

    <h1>Turmas - <?= e($curso['nome_curso']) ?></h1>
    <p><a href="<?= $base ?>/turmas_cursos/instrutor">&larr; Voltar aos cursos</a></p>
    <?php if ($curso['descricao']): ?><p><?= e($curso['descricao']) ?></p><?php endif; ?>
    <?php if ($msg): ?><p><b><?= e($msg) ?></b></p><?php endif; ?>
    <?php if ($erro): ?><p><b style="color:#b00020"><?= e($erro) ?></b></p><?php endif; ?>

    <h2>Nova turma</h2>
    <form method="POST" action="<?= $base ?>/turmas_cursos/turmaSalvar">
        <input type="hidden" name="id_curso" value="<?= (int) $curso['id_curso'] ?>">
        <p><label>Nome da turma: <input name="nome" maxlength="100" required></label></p>
        <p><label>Turno:
            <select name="turno" required>
                <?php foreach (TurmaModel::TURNOS as $valor => $rotulo): ?>
                    <option value="<?= e($valor) ?>"><?= e($rotulo) ?></option>
                <?php endforeach; ?>
            </select>
        </label></p>
        <button type="submit">Criar turma</button>
        <a href="<?= $base ?>/turmas_cursos/instrutor">Cancelar</a>
    </form>

    <h2>Suas turmas neste curso</h2>
    <?php if ($turmas): ?>
    <table border="1" cellpadding="6" cellspacing="0">
        <tr><th>Turma</th><th>Turno</th><th>Alunos</th><th>Ações</th></tr>
        <?php foreach ($turmas as $t): ?>
            <tr>
                <td><?= e($t['nome_turma']) ?></td>
                <td><?= e(TurmaModel::TURNOS[$t['turno']] ?? $t['turno']) ?></td>
                <td><?= (int) $t['total_alunos'] ?></td>
                <td>
                    <a href="<?= $base ?>/turmas_cursos/turma?id=<?= (int) $t['id_turma'] ?>">Alunos</a> |
                    <a href="<?= $base ?>/turmas_cursos/turmaEditar?id=<?= (int) $t['id_turma'] ?>">Editar</a> |
                    <form method="POST" action="<?= $base ?>/turmas_cursos/turmaExcluir" style="display:inline"
                          onsubmit="return confirm('Excluir a turma &quot;<?= e(addslashes($t['nome_turma'])) ?>&quot;? As matrículas dela também serão removidas.');">
                        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                        <input type="hidden" name="id_turma" value="<?= (int) $t['id_turma'] ?>">
                        <button type="submit">Excluir</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
    </table>
    <?php else: ?>
        <p>Você ainda não criou turmas para este curso.</p>
    <?php endif; ?>
</body>
</html>
