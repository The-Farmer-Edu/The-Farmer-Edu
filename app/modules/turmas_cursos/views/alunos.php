<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>The Farmer Edu - Alunos</title>
</head>
<body>
    <?php require __DIR__ . '/partials/cabecalho.php'; ?>

    <main>
        <h1>Alunos cadastrados</h1>
        <p><a href="<?= $base ?>/turmas_cursos/instrutor">Voltar às turmas</a></p>

        <?php if ($msg): ?><p><strong><?= e($msg) ?></strong></p><?php endif; ?>
        <?php if ($erro): ?><p><strong><?= e($erro) ?></strong></p><?php endif; ?>

        <?php if ($alunos): ?>
            <table>
                <thead>
                    <tr>
                        <th>Matrícula</th>
                        <th>Nome</th>
                        <th>E-mail</th>
                        <th>Turmas</th>
                        <th>Conta</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($alunos as $a): ?>
                        <?php $ativo = (int) $a['ativo'] === 1; ?>
                        <tr>
                            <td><?= e($a['matricula']) ?></td>
                            <td><?= e($a['nome']) ?></td>
                            <td><?= e($a['email']) ?></td>
                            <td><?= e($a['turmas'] ?: 'Sem turma') ?></td>
                            <td><?= $ativo ? 'Ativa' : 'Desativada' ?></td>
                            <td>
                                <form method="POST" action="<?= $base ?>/turmas_cursos/<?= $ativo ? 'alunoDesativar' : 'alunoReativar' ?>">
                                    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                                    <input type="hidden" name="id_aluno" value="<?= (int) $a['id_usuario'] ?>">
                                    <button type="submit"><?= $ativo ? 'Desativar conta' : 'Reativar conta' ?></button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php else: ?>
            <p>Nenhum aluno cadastrado.</p>
        <?php endif; ?>
    </main>
</body>
</html>
