<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>The Farmer Edu - Turmas</title>
</head>
<body>
    <?php require __DIR__ . '/partials/cabecalho.php'; ?>

    <main>
        <h1>Turmas</h1>
        <?php
            $ativas = array_filter($turmas, static fn($t) => (int) $t['ativo'] === 1);
            $arquivadas = array_filter($turmas, static fn($t) => (int) $t['ativo'] !== 1);
        ?>

        <section aria-labelledby="minhas-turmas-titulo">
            <h2 id="minhas-turmas-titulo">Minhas turmas</h2>
            <?php if ($ativas): ?>
                <ul>
                    <?php foreach ($ativas as $t): ?>
                        <li>
                            <article>
                                <h2><?= e($t['nome_turma']) ?></h2>
                                <p>Curso: <?= e($t['nome_curso']) ?></p>
                                <p>Turno: <?= e(TurmaModel::TURNOS[$t['turno']] ?? $t['turno']) ?></p>
                                <p>Instrutor: <?= e($t['nome_instrutor']) ?></p>
                            </article>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php else: ?>
                <p>Você não está matriculado em nenhuma turma ativa. Aguarde seu instrutor realizar a matrícula.</p>
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
                                <p>Instrutor: <?= e($t['nome_instrutor']) ?></p>
                            </article>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </section>
        <?php endif; ?>
    </main>
</body>
</html>
