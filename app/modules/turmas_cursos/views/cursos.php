<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>The Farmer Edu - Cursos</title>
</head>
<body>
    <?php require __DIR__ . '/partials/cabecalho.php'; ?>

    <main>
        <h1>Cursos</h1>
        <?php if ($msg): ?><p><strong><?= e($msg) ?></strong></p><?php endif; ?>
        <?php if ($erro): ?><p><strong><?= e($erro) ?></strong></p><?php endif; ?>

        <p><a href="<?= $base ?>/turmas_cursos/cursoNovo">Cadastrar novo curso</a></p>
        <p>Selecione um curso para gerenciar as turmas vinculadas a ele.</p>

        <?php if ($cursos): ?>
            <ul>
                <?php foreach ($cursos as $c): ?>
                    <li>
                        <article>
                            <h2>
                                <a href="<?= $base ?>/turmas_cursos/turmaForm?curso=<?= (int) $c['id_curso'] ?>">
                                    <?= e($c['nome_curso']) ?>
                                </a>
                            </h2>
                            <?php if (!empty($c['descricao'])): ?><p><?= e($c['descricao']) ?></p><?php endif; ?>
                            <p><?= (int) $c['total_turmas'] ?> turma(s) ativa(s)</p>
                            <p>
                                <a href="<?= $base ?>/turmas_cursos/cursoEditar?id=<?= (int) $c['id_curso'] ?>">Editar curso</a>
                            </p>
                            <form method="POST" action="<?= $base ?>/turmas_cursos/cursoExcluir">
                                <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                                <input type="hidden" name="id_curso" value="<?= (int) $c['id_curso'] ?>">
                                <button type="submit">Excluir curso</button>
                            </form>
                        </article>
                    </li>
                <?php endforeach; ?>
            </ul>
        <?php else: ?>
            <p>Nenhum curso cadastrado. Use a opção acima para criar o primeiro.</p>
        <?php endif; ?>
    </main>
</body>
</html>
