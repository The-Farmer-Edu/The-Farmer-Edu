<!DOCTYPE html>
<html lang="pt-br">
<head><meta charset="UTF-8"><title>Alunos - The Farmer Edu</title></head>
<body>
    <header>
        <b>The Farmer Edu</b> | Bem-vindo, <?= e($u['nome']) ?> |
        <a href="<?= $base ?>/turmas_cursos/minhaConta">Minha conta</a> |
        <a href="<?= $base ?>/auth/logout">Sair</a>
    </header>

    <h1>Alunos cadastrados</h1>
    <p><a href="<?= $base ?>/turmas_cursos/instrutor">&larr; Voltar aos cursos</a></p>

    <?php if ($msg): ?><p><b><?= e($msg) ?></b></p><?php endif; ?>
    <?php if ($erro): ?><p><b style="color:#b00020"><?= e($erro) ?></b></p><?php endif; ?>

    <?php if ($alunos): ?>
    <table border="1" cellpadding="6" cellspacing="0">
        <tr><th>Matrícula</th><th>Nome</th><th>E-mail</th><th>Turmas</th><th>Conta</th><th>Ação</th></tr>
        <?php foreach ($alunos as $a): ?>
            <tr>
                <td><?= e($a['matricula']) ?></td>
                <td><?= e($a['nome']) ?></td>
                <td><?= e($a['email']) ?></td>
                <td><?= e($a['turmas'] ?: 'Sem turma') ?></td>
                <?php $ativo = (int) $a['ativo'] === 1; ?>
                <td><?= $ativo ? 'Ativa' : 'Desativada' ?></td>
                <td>
                    <form method="POST" action="<?= $base ?>/turmas_cursos/<?= $ativo ? 'alunoDesativar' : 'alunoReativar' ?>" style="display:inline"
                          <?php if ($ativo): ?>onsubmit="return confirm('Desativar a conta deste aluno? Nada é apagado e você pode reativá-la depois.');"<?php endif; ?>>
                        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                        <input type="hidden" name="id_aluno" value="<?= (int) $a['id_usuario'] ?>">
                        <button type="submit"><?= $ativo ? 'Desativar' : 'Reativar' ?></button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
    </table>
    <?php else: ?>
        <p>Nenhum aluno cadastrado.</p>
    <?php endif; ?>
</body>
</html>
