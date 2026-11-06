<!DOCTYPE html>
<html lang="pt-br">
<head><meta charset="UTF-8"><title><?= $curso ? 'Editar curso' : 'Novo curso' ?> - The Farmer Edu</title></head>
<body>
    <header>
        <b>The Farmer Edu</b> | Bem-vindo, <?= e($u['nome']) ?> |
        <a href="<?= $base ?>/turmas_cursos/minhaConta">Minha conta</a> |
        <a href="<?= $base ?>/auth/logout">Sair</a>
    </header>

    <h1><?= $curso ? 'Editar curso' : 'Novo curso' ?></h1>
    <p><a href="<?= $base ?>/turmas_cursos/instrutor">&larr; Voltar aos cursos</a></p>
    <?php if ($erro): ?><p><b style="color:#b00020"><?= e($erro) ?></b></p><?php endif; ?>

    <form method="POST" action="<?= $base ?>/turmas_cursos/<?= $curso ? 'cursoAtualizar' : 'cursoSalvar' ?>">
        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
        <?php if ($curso): ?><input type="hidden" name="id_curso" value="<?= (int) $curso['id_curso'] ?>"><?php endif; ?>
        <p><label>Nome do curso:
            <input name="nome" maxlength="150" value="<?= e($curso['nome_curso'] ?? '') ?>" required>
        </label></p>
        <p><label>Descrição (opcional):<br>
            <textarea name="descricao" rows="4" cols="50" maxlength="1000"><?= e($curso['descricao'] ?? '') ?></textarea>
        </label></p>
        <button type="submit"><?= $curso ? 'Salvar alterações' : 'Criar curso' ?></button>
        <a href="<?= $base ?>/turmas_cursos/instrutor">Cancelar</a>
    </form>
</body>
</html>
