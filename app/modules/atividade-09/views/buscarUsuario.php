<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Buscar Usuário</title>
</head>
<body>

    <h1>Buscar Usuário</h1>

    <?php if ($usuario !== null): ?>

        <p><strong>Usuário encontrado:</strong></p>
        <p>ID: <?= $usuario->id ?></p>
        <p>Nome: <?= $usuario->nome ?></p>
        <p>E-mail: <?= $usuario->email ?></p>
        <p>Tipo: <?= $usuario->tipo ?></p>

    <?php else: ?>

        <p>Usuário não encontrado.</p>

    <?php endif; ?>

    <p>
        <a href="/The-Farmer-Edu/public/atividade-09/novoUsuario">
            Voltar para os testes
        </a>
    </p>

</body>
</html>