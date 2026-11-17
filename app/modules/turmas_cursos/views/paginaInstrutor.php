<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>The Farmer Edu - Turmas</title>
</head>
<body>
    <?php require __DIR__ . '/partials/cabecalho.php'; ?>

<<<<<<< HEAD
    <h1>Cursos</h1>
    <?php if ($msg): ?><p><b><?= e($msg) ?></b></p><?php endif; ?>
    <p><a href="<?= $base ?>/turmas_cursos/alunos"><button type="button">Visualizar alunos</button></a></p>
    <p>Clique em um curso para criar, editar e arquivar turmas e matricular alunos.</p>

    <?php foreach ($cursos as $c): ?>
        <div>
            <h3><a href="<?= $base ?>/turmas_cursos/turmaForm?curso=<?= (int) $c['id_curso'] ?>"><?= e($c['nome_curso']) ?></a></h3>
            <p><?= e($c['descricao']) ?></p>
            <small><?= (int) $c['total_turmas'] ?> turma(s)</small>
        </div>
    <?php endforeach; ?>
    <?php if (!$cursos): ?><p>Nenhum curso cadastrado.</p><?php endif; ?>
=======
    <main>
        <h1>Turmas</h1>
        <?php if ($msg): ?><p><strong><?= e($msg) ?></strong></p><?php endif; ?>
        <?php if ($erro): ?><p><strong><?= e($erro) ?></strong></p><?php endif; ?>

        <section aria-labelledby="nova-turma-titulo">
            <h2 id="nova-turma-titulo">Criar turma</h2>
            <?php if ($cursos): ?>
                <form method="POST" action="<?= $base ?>/turmas_cursos/turmaSalvar">
                    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                    <p>
                        <label>Curso:
                            <select name="id_curso" required>
                                <option value="">Selecione um curso...</option>
                                <?php foreach ($cursos as $c): ?>
                                    <option value="<?= (int) $c['id_curso'] ?>"><?= e($c['nome_curso']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </label>
                    </p>
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
            <?php else: ?>
                <p>Nenhum curso cadastrado. Cadastre um curso antes de criar uma turma.</p>
                <p><a href="<?= $base ?>/turmas_cursos/cursos">Ir para Cursos</a></p>
            <?php endif; ?>
        </section>

        <section aria-labelledby="turmas-ativas-titulo">
            <h2 id="turmas-ativas-titulo">Turmas ativas</h2>
            <?php if ($turmas): ?>
                <ul>
                    <?php foreach ($turmas as $t): ?>
                        <li>
                            <article>
                                <h2><?= e($t['nome_turma']) ?></h2>
                                <p>Curso: <?= e($t['nome_curso']) ?></p>
                                <p>Turno: <?= e(TurmaModel::TURNOS[$t['turno']] ?? $t['turno']) ?></p>
                                <p>Alunos matriculados: <?= (int) $t['total_alunos'] ?></p>
                                <p>
                                    <a href="<?= $base ?>/turmas_cursos/turma?id=<?= (int) $t['id_turma'] ?>">Gerenciar alunos</a>
                                    |
                                    <a href="<?= $base ?>/turmas_cursos/turmaEditar?id=<?= (int) $t['id_turma'] ?>">Editar turma</a>
                                </p>
                                <form method="POST" action="<?= $base ?>/turmas_cursos/turmaArquivar">
                                    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                                    <input type="hidden" name="id_turma" value="<?= (int) $t['id_turma'] ?>">
                                    <button type="submit">Arquivar turma</button>
                                </form>
                            </article>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php else: ?>
                <p>Você ainda não criou turmas.</p>
            <?php endif; ?>
        </section>

        <?php if ($arquivadas): ?>
            <section aria-labelledby="turmas-arquivadas-titulo">
                <h2 id="turmas-arquivadas-titulo">Turmas arquivadas</h2>
                <ul>
                    <?php foreach ($arquivadas as $t): ?>
                        <li>
                            <article>
                                <h2><?= e($t['nome_turma']) ?></h2>
                                <p>Curso: <?= e($t['nome_curso']) ?></p>
                                <p>Turno: <?= e(TurmaModel::TURNOS[$t['turno']] ?? $t['turno']) ?></p>
                                <p>Alunos matriculados: <?= (int) $t['total_alunos'] ?></p>
                                <p><a href="<?= $base ?>/turmas_cursos/turma?id=<?= (int) $t['id_turma'] ?>">Consultar alunos</a></p>
                                <form method="POST" action="<?= $base ?>/turmas_cursos/turmaRestaurar">
                                    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                                    <input type="hidden" name="id_turma" value="<?= (int) $t['id_turma'] ?>">
                                    <button type="submit">Restaurar turma</button>
                                </form>
                            </article>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </section>
        <?php endif; ?>
    </main>
>>>>>>> 3e9abe84a4120effc4f0447c0318bbb0ab5d726f
</body>
</html>
