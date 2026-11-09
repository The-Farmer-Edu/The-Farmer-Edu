<!DOCTYPE html>
<html lang="pt-br">
<head><meta charset="UTF-8"><title>Alunos da turma - The Farmer Edu</title></head>

<body>
    <header>
        <b>The Farmer Edu</b> | Bem-vindo, <?= e($u['nome']) ?> |
        <a href="<?= $base ?>/turmas_cursos/minhaConta">Minha conta</a> |
        <a href="<?= $base ?>/auth/logout">Sair</a>
    </header>

    <h1><?= e($turma['nome_turma']) ?> (<?= e(TurmaModel::TURNOS[$turma['turno']] ?? $turma['turno']) ?>)</h1>
    <p>Curso: <b><?= e($turma['nome_curso']) ?></b></p>
    <p><a href="<?= $base ?>/turmas_cursos/turmaForm?curso=<?= (int) $turma['id_curso'] ?>">&larr; Voltar às turmas do curso</a></p>
    <?php if ($msg): ?><p><b><?= e($msg) ?></b></p><?php endif; ?>
    <?php if ($erro): ?><p><b style="color:#b00020"><?= e($erro) ?></b></p><?php endif; ?>

    <?php $arquivada = (int) $turma['ativo'] !== 1; ?>
    <?php if ($arquivada): ?>
        <p><b>Esta turma está arquivada</b> (somente consulta). Para alterar matrículas, restaure-a na página do curso.</p>
    <?php else: ?>
    <h2>Matricular aluno</h2>
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
        <p>Não há alunos disponíveis para matricular (todos já estão nesta turma ou nenhum aluno ativo foi cadastrado).</p>
    <?php endif; ?>
    <?php endif; ?>

    <h2>Alunos matriculados (<?= count($matriculados) ?>)</h2>
    <?php if ($matriculados): ?>
    <table border="1" cellpadding="6" cellspacing="0">
        <tr><th>Matrícula</th><th>Nome</th><th>E-mail</th><th>Desde</th><?php if (!$arquivada): ?><th>Ação</th><?php endif; ?></tr>
        <?php foreach ($matriculados as $a): ?>
            <tr>
                <td><?= e($a['matricula']) ?></td>
                <td><?= e($a['nome']) ?><?= (int) $a['ativo'] === 1 ? '' : ' <i>(conta desativada)</i>' ?></td>
                <td><?= e($a['email']) ?></td>
                <td><?= e(date('d/m/Y', strtotime($a['data_matricula']))) ?></td>
                <?php if (!$arquivada): ?><td>
                    <form method="POST" action="<?= $base ?>/turmas_cursos/desmatricular" style="display:inline"
                          onsubmit="return confirm('Remover este aluno da turma?');">
                        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                        <input type="hidden" name="id_turma" value="<?= (int) $turma['id_turma'] ?>">
                        <input type="hidden" name="id_aluno" value="<?= (int) $a['id_usuario'] ?>">
                        <button type="submit">Remover</button>
                    </form>
                </td><?php endif; ?>
            </tr>
        <?php endforeach; ?>
    </table>
    <?php else: ?>
        <p>Nenhum aluno matriculado ainda.</p>
    <?php endif; ?>
</body>
</html>
