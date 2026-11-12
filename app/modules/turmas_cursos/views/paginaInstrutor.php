<!DOCTYPE html>
<html lang="pt-br">
<head><meta charset="UTF-8"><title>The Farmer Edu - Instrutor</title></head>
<body>
    <header>
        <b>The Farmer Edu</b> | Bem-vindo, <?= e($u['nome']) ?> |
        <a href="<?= $base ?>/turmas_cursos/minhaConta">Minha conta</a> |
        <a href="<?= $base ?>/auth/logout">Sair</a>
    </header>

    <h1>Cursos</h1>
    <?php if ($msg): ?><p><b><?= e($msg) ?></b></p><?php endif; ?>
    <?php if ($erro): ?><p><b style="color:#b00020"><?= e($erro) ?></b></p><?php endif; ?>
    <p>
        <a href="<?= $base ?>/turmas_cursos/cursoNovo"><button type="button">Novo curso</button></a>
        <a href="<?= $base ?>/turmas_cursos/alunos"><button type="button">Visualizar alunos</button></a>
    </p>
    <p>Clique em um curso para criar, editar e arquivar turmas e matricular alunos.</p>

    <?php foreach ($cursos as $c): ?>
        <div>
            <h3><a href="<?= $base ?>/turmas_cursos/turmaForm?curso=<?= (int) $c['id_curso'] ?>"><?= e($c['nome_curso']) ?></a></h3>
            <p><?= e($c['descricao']) ?></p>
            <small><?= (int) $c['total_turmas'] ?> turma(s) ativa(s)</small>
            <p>
                <a href="<?= $base ?>/turmas_cursos/cursoEditar?id=<?= (int) $c['id_curso'] ?>">Editar curso</a> |
                <form method="POST" action="<?= $base ?>/turmas_cursos/cursoExcluir" style="display:inline"
                      onsubmit="return confirm('Excluir este curso? Só é possível se ele não tiver turmas.');">
                    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                    <input type="hidden" name="id_curso" value="<?= (int) $c['id_curso'] ?>">
                    <button type="submit">Excluir curso</button>
                </form>
            </p>
        </div>
    <?php endforeach; ?>
    <?php if (!$cursos): ?><p>Nenhum curso cadastrado. Clique em "Novo curso" para criar o primeiro.</p><?php endif; ?>
</body>
</html>
