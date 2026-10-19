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
        <p>Olá, <?= htmlspecialchars($usuario['nome']) ?>! (<?= htmlspecialchars($usuario['tipo_usuario']) ?>)</p>
        <p><a href="?rota=auth/logout">Sair</a></p>
    <?php else: ?>
        <p><a href="?rota=auth/login">Entrar</a></p>
    <?php endif; ?>
</body>
</html>