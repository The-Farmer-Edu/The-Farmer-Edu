<?php
/** @var Usuario|null $resultado */
/** @var bool $buscou */
/** @var string|null $erro */
/** @var string $emailBuscado */
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Buscar Usuário</title>
</head>
<body>
    <h1>Buscar usuário por e-mail</h1>

    <?php if ($usuario !== null): ?>

        <p><strong>Usuario encontrado</strong></p>
        <p>ID: <?= $usuario->id ?></p>
        <p>Nome: <?= $usuario->nome ?></p>
        <p>E-mail: <?= $usuario->email ?></p>
        <p>Tipo: <?= $usuario->tipo ?></p>
    
    <?php else: ?>

        <p>Usuario não encontrado!</p>

    <?php endif; ?>

    
    <p><a href="/The-Farmer-Edu/public/atividade-09/novoUsuario">Ir para cadastro de usuário</a></p>
</body>
</html>