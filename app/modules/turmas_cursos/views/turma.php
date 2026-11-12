<!DOCTYPE html>
<html lang="pt-br">
<<<<<<< HEAD
<head><meta charset="UTF-8"><title>Alunos da turma - The Farmer Edu</title></head>
=======
<head>
    <meta charset="UTF-8">
    <title>The Farmer Edu - <?= e($turma['nome_turma']) ?></title>
</head>
>>>>>>> 3e9abe84a4120effc4f0447c0318bbb0ab5d726f
<body>
    <?php require __DIR__ . '/partials/cabecalho.php'; ?>

    <main>
        <h1><?= e($turma['nome_turma']) ?> (<?= e(TurmaModel::TURNOS[$turma['turno']] ?? $turma['turno']) ?>)</h1>
        <p>Curso: <strong><?= e($turma['nome_curso']) ?></strong></p>
        <p><a href="<?= $base ?>/turmas_cursos/instrutor">Voltar às turmas</a></p>
        <?php if ($msg): ?><p><strong><?= e($msg) ?></strong></p><?php endif; ?>
        <?php if ($erro): ?><p><strong><?= e($erro) ?></strong></p><?php endif; ?>

        <?php $arquivada = (int) $turma['ativo'] !== 1; ?>
        <?php if ($arquivada): ?>
            <p>Esta turma está arquivada e pode ser consultada, mas não alterada. Restaure-a para modificar matrículas.</p>
        <?php else: ?>
            <section aria-labelledby="matricular-aluno-titulo">
                <h2 id="matricular-aluno-titulo">Matricular aluno</h2>
                <?php if ($disponiveis): ?>
                    <form method="POST" action="<?= $base ?>/turmas_cursos/matricular">
                        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                        <input type="hidden" name="id_turma" value="<?= (int) $turma['id_turma'] ?>">
                        <label>Aluno:
                            <select name="id_aluno" required>
                                <option value="">Selecione...</option>
                                <?php foreach ($disponiveis as $a): ?>
                                    <option value="<?= (int) $a['id_usuario'] ?>"><?= e($a['nome']) ?> (<?= e($a['email']) ?>)</option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                        <button type="submit">Matricular</button>
                    </form>
                <?php else: ?>
                    <p>Não há alunos disponíveis para matricular nesta turma.</p>
                <?php endif; ?>
            </section>
        <?php endif; ?>

        <section aria-labelledby="alunos-matriculados-titulo">
            <h2 id="alunos-matriculados-titulo">Alunos matriculados (<?= count($matriculados) ?>)</h2>
            <?php if ($matriculados): ?>
                <table>
                    <thead>
                        <tr>
                            <th>Matrícula</th><th>Nome</th><th>E-mail</th><th>Desde</th>
                            <?php if (!$arquivada): ?><th>Ação</th><?php endif; ?>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($matriculados as $a): ?>
                            <tr>
                                <td><?= e($a['matricula']) ?></td>
                                <td><?= e($a['nome']) ?><?= (int) $a['ativo'] === 1 ? '' : ' (conta desativada)' ?></td>
                                <td><?= e($a['email']) ?></td>
                                <td><?= e(date('d/m/Y', strtotime($a['data_matricula']))) ?></td>
                                <?php if (!$arquivada): ?>
                                    <td>
                                        <form method="POST" action="<?= $base ?>/turmas_cursos/desmatricular">
                                            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                                            <input type="hidden" name="id_turma" value="<?= (int) $turma['id_turma'] ?>">
                                            <input type="hidden" name="id_aluno" value="<?= (int) $a['id_usuario'] ?>">
                                            <button type="submit">Remover da turma</button>
                                        </form>
                                    </td>
                                <?php endif; ?>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <p>Nenhum aluno matriculado ainda.</p>
            <?php endif; ?>
        </section>
    </main>
</body>
</html>
