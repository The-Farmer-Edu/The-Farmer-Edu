<!DOCTYPE html>
<html lang="pt-br">
<head><meta charset="UTF-8"><title>The Farmer Edu - Aluno</title></head>
<body>
    <header>
        <b>The Farmer Edu</b> | Bem-vindo, <?= e($u['nome']) ?> |
        <a href="<?= $base ?>/auth/logout">Sair</a>
    </header>

    <h1>Meus cursos</h1>
    <?php foreach ($cursos as $c): ?>
        <div>
            <h3><?= e($c['nome_curso']) ?></h3>
            <p><?= e($c['descricao']) ?></p>
            <ul>
                <?php foreach ($turmas as $t): if ((int) $t['id_curso'] !== (int) $c['id_curso']) continue; ?>
                    <li>
                        Turma <b><?= e($t['nome_turma']) ?></b>
                        (<?= e(TurmaModel::TURNOS[$t['turno']] ?? $t['turno']) ?>)
                        - Instrutor: <?= e($t['nome_instrutor']) ?>
                    </li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endforeach; ?>
    <?php if (!$cursos): ?><p>Você ainda não está matriculado em nenhum curso.</p><?php endif; ?>

    <h2>Minhas turmas</h2>
    <?php if ($turmas): ?>
    <table border="1" cellpadding="6" cellspacing="0">
        <tr><th>Turma</th><th>Curso</th><th>Turno</th><th>Instrutor</th></tr>
        <?php foreach ($turmas as $t): ?>
            <tr>
                <td><?= e($t['nome_turma']) ?></td>
                <td><?= e($t['nome_curso']) ?></td>
                <td><?= e(TurmaModel::TURNOS[$t['turno']] ?? $t['turno']) ?></td>
                <td><?= e($t['nome_instrutor']) ?></td>
            </tr>
        <?php endforeach; ?>
    </table>
    <?php else: ?>
        <p>Você ainda não foi adicionado a nenhuma turma. Aguarde seu instrutor realizar a matrícula.</p>
    <?php endif; ?>

    <h2>Cursos da plataforma</h2>
    <ul>
        <?php foreach ($todosCursos as $c): ?>
            <li><b><?= e($c['nome_curso']) ?></b><?= $c['descricao'] ? ' - ' . e($c['descricao']) : '' ?></li>
        <?php endforeach; ?>
    </ul>
</body>
</html>
