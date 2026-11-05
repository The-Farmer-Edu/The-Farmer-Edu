<!DOCTYPE html>
<html lang="pt-br">
<head><meta charset="UTF-8"><title>Minha conta - The Farmer Edu</title></head>
<body>
    <header>
        <b>The Farmer Edu</b> | Bem-vindo, <?= e($u['nome']) ?> |
        <a href="<?= $base ?>/turmas_cursos/minhaConta">Minha conta</a> |
        <a href="<?= $base ?>/auth/logout">Sair</a>
    </header>

    <h1>Minha conta</h1>
    <p><a href="<?= $base ?>/turmas_cursos/<?= e($u['perfilAcesso']) ?>">&larr; Voltar</a></p>
    <p>Nome: <b><?= e($u['nome']) ?></b><br>E-mail: <b><?= e($u['email']) ?></b></p>
    <?php if ($erro): ?><p><b style="color:#b00020"><?= e($erro) ?></b></p><?php endif; ?>

    <h2>Desativar conta</h2>
    <p>Sua conta não é apagada: ela apenas fica desativada e você é desconectado.
       Para reativá-la, será preciso pedir <?= $u['perfilAcesso'] === 'aluno' ? 'ao seu instrutor' : 'ao administrador do sistema' ?>.</p>
    <form method="POST" action="<?= $base ?>/turmas_cursos/contaDesativar"
          onsubmit="return confirm('Desativar sua conta agora?');">
        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
        <p><label>Confirme sua senha: <input type="password" name="senha" required></label></p>
        <button type="submit">Desativar minha conta</button>
    </form>
</body>
</html>
