<!DOCTYPE html>
<html lang="pt-br">
<head><meta charset="UTF-8"><title>Alunos - The Farmer Edu</title></head>
<body>
    <header>
        <b>The Farmer Edu</b> | Bem-vindo, <?= e($u['nome']) ?> |
        <a href="<?= $base ?>/auth/logout">Sair</a>
    </header>

    <h1>Alunos cadastrados</h1>
    <p><a href="<?= $base ?>/turmas_cursos/instrutor">&larr; Voltar aos cursos</a></p>

    <?php if ($alunos): ?>
    <table border="1" cellpadding="6" cellspacing="0">
        <tr><th>Matrícula</th><th>Nome</th><th>E-mail</th><th>Turmas</th></tr>
        <?php foreach ($alunos as $a): ?>
            <tr>
                <td><?= e($a['matricula']) ?></td>
                <td><?= e($a['nome']) ?></td>
                <td><?= e($a['email']) ?></td>
                <td><?= e($a['turmas'] ?: 'Sem turma') ?></td>
            </tr>
        <?php endforeach; ?>
    </table>
    <?php else: ?>
        <p>Nenhum aluno cadastrado.</p>
    <?php endif; ?>
</body>
</html>
