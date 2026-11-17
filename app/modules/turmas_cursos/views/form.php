<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>The Farmer Edu - Turmas de <?= e($curso['nome_curso']) ?></title>
</head>
<body>
    <?php require __DIR__ . '/partials/cabecalho.php'; ?>

    <main>
        <h1>Turmas - <?= e($curso['nome_curso']) ?></h1>
        <p><a href="<?= $base ?>/turmas_cursos/cursos">Voltar para Cursos</a></p>
        <?php if ($curso['descricao']): ?><p><?= e($curso['descricao']) ?></p><?php endif; ?>
        <?php if ($msg): ?><p><strong><?= e($msg) ?></strong></p><?php endif; ?>
        <?php if ($erro): ?><p><strong><?= e($erro) ?></strong></p><?php endif; ?>

        <section aria-labelledby="nova-turma-titulo">
            <h2 id="nova-turma-titulo">Nova turma</h2>
            <form method="POST" action="<?= $base ?>/turmas_cursos/turmaSalvar">
                <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                <input type="hidden" name="id_curso" value="<?= (int) $curso['id_curso'] ?>">
                <p><label>Nome da turma: <input name="nome" maxlength="100" required></label></p>
                <p>
                    <label>Turno:
                        <select name="turno" required>
                            <?php foreach (TurmaModel::TURNOS as $valor => $rotulo): ?>
                                <option value="<?= e($valor) ?>"><?= e($rotulo) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </label>
                </p>
                <button type="submit">Criar turma</button>
            </form>
        </section>

        <section aria-labelledby="turmas-ativas-titulo">
            <h2 id="turmas-ativas-titulo">Suas turmas neste curso</h2>
            <?php if ($turmas): ?>
                <table>
                    <thead>
                        <tr><th>Turma</th><th>Turno</th><th>Alunos</th><th>Ações</th></tr>
                    </thead>
                    <tbody>
                        <?php foreach ($turmas as $t): ?>
                            <tr>
                                <td><?= e($t['nome_turma']) ?></td>
                                <td><?= e(TurmaModel::TURNOS[$t['turno']] ?? $t['turno']) ?></td>
                                <td><?= (int) $t['total_alunos'] ?></td>
                                <td>
                                    <a href="<?= $base ?>/turmas_cursos/turma?id=<?= (int) $t['id_turma'] ?>">Alunos</a>
                                    |
                                    <a href="<?= $base ?>/turmas_cursos/turmaEditar?id=<?= (int) $t['id_turma'] ?>">Editar</a>
                                    <form method="POST" action="<?= $base ?>/turmas_cursos/turmaArquivar">
                                        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                                        <input type="hidden" name="id_turma" value="<?= (int) $t['id_turma'] ?>">
                                        <button type="submit">Arquivar</button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <p>Você ainda não criou turmas para este curso.</p>
            <?php endif; ?>
        </section>

        <?php if ($arquivadas): ?>
            <section aria-labelledby="turmas-arquivadas-titulo">
                <h2 id="turmas-arquivadas-titulo">Turmas arquivadas</h2>
                <table>
                    <thead>
                        <tr><th>Turma</th><th>Turno</th><th>Alunos</th><th>Ações</th></tr>
                    </thead>
                    <tbody>
                        <?php foreach ($arquivadas as $t): ?>
                            <tr>
                                <td><?= e($t['nome_turma']) ?></td>
                                <td><?= e(TurmaModel::TURNOS[$t['turno']] ?? $t['turno']) ?></td>
                                <td><?= (int) $t['total_alunos'] ?></td>
                                <td>
                                    <a href="<?= $base ?>/turmas_cursos/turma?id=<?= (int) $t['id_turma'] ?>">Ver alunos</a>
                                    <form method="POST" action="<?= $base ?>/turmas_cursos/turmaRestaurar">
                                        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                                        <input type="hidden" name="id_turma" value="<?= (int) $t['id_turma'] ?>">
                                        <button type="submit">Restaurar</button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </section>
        <?php endif; ?>
    </main>
</body>
</html>
