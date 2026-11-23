<?php

/**
 * Exemplo mínimo de módulo — cada squad vai substituir isso pelo
 * próprio módulo (auth, atividades, fazenda etc.), seguindo o mesmo
 * padrão: um arquivo .php dentro de app/modules/<seu-modulo>/,
 * usando usuario_logado() / exigir_login() / conectar() do core.
 */

$usuario = usuarioLogado();
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>The Farmer Edu</title>
</head>
<body>
    <h1>The Farmer Edu 🌱</h1>

    <?php if ($usuario): ?>
        <?php /* o perfil fica em 'perfilAcesso' (core/session.php: login()); 'tipo_usuario' não existe na sessão */ ?>
        <p>Olá, <?= htmlspecialchars($usuario['nome']) ?>! (<?= htmlspecialchars($usuario['perfilAcesso'] ?? '') ?>)</p>
        <p><a href="auth/logout">Sair</a></p>
    <?php else: ?>
        <?php /* não existe a rota auth/login: o acesso é por auth/loginAluno ou auth/loginInstrutor */ ?>
        <p><a href="auth/loginAluno">Entrar como aluno</a> · <a href="auth/loginInstrutor">Entrar como instrutor</a></p>
    <?php endif; ?>
</body>
</html>