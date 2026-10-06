<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Novo Usuário</title>
</head>
<body>

    <h1>Teste de Cadastro de Usuário</h1>

    <p><strong>Usuário salvo:</strong> <?= $usuario->nome ?></p>
    <p><strong>ID gerado:</strong> <?= $idSalvo ?></p>
    <p><strong>E-mail:</strong> <?= $usuario->email ?></p>
    <p><strong>Tipo:</strong> <?= $usuario->tipo ?></p>

    <hr>

    <h2>Teste de busca</h2>

    <?php if ($usuarioEncontrado !== null): ?>
        <p>Usuário encontrado com sucesso.</p>
        <p>Nome: <?= $usuarioEncontrado->nome ?></p>
        <p>E-mail: <?= $usuarioEncontrado->email ?></p>
        <p>ID: <?= $usuarioEncontrado->id ?></p>
    <?php else: ?>
        <p>Usuário não encontrado.</p>
    <?php endif; ?>

    <hr>

    <h2>Teste de SQL Injection</h2>

    <?php if ($resultadoAtaque === null): ?>
        <p>SQL Injection bloqueado corretamente. Retorno: NULL</p>
    <?php else: ?>
        <p>O teste retornou um usuário.</p>
    <?php endif; ?>

    <p>
        <a href="/The-Farmer-Edu/public/atividade-09/buscarUsuario">
            Buscar usuário
        </a>
    </p>

</body>
</html>