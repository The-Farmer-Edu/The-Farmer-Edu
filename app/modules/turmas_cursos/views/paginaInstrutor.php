<!DOCTYPE html>
<html lang="pt-br">
<head><meta charset="UTF-8"><title>The Farmer Edu - Instrutor</title></head>
<body>
    <header>
        <b>The Farmer Edu</b> | Bem-vindo, <?= e($u['nome']) ?> |
        <a href="<?= $base ?>/auth/logout">Sair</a>
    </header>

    <h1>Cursos</h1>
    <?php if ($msg): ?><p><b><?= e($msg) ?></b></p><?php endif; ?>
    <p><a href="<?= $base ?>/turmas_cursos/alunos"><button type="button">Visualizar alunos</button></a></p>
    <p>Clique em um curso para criar, editar, excluir turmas e matricular alunos.</p>

    <?php foreach ($cursos as $c): ?>
        <div>
            <h3><a href="<?= $base ?>/turmas_cursos/turmaForm?curso=<?= (int) $c['id_curso'] ?>"><?= e($c['nome_curso']) ?></a></h3>
            <p><?= e($c['descricao']) ?></p>
            <small><?= (int) $c['total_turmas'] ?> turma(s)</small>
        </div>
    <?php endforeach; ?>
    <?php if (!$cursos): ?><p>Nenhum curso cadastrado.</p><?php endif; ?>
</body>
</html>
