<!-- <!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscar Usuário</title>
</head>
<body>
    <h1>Buscar Usuário</h1>
</body>
</html> -->

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscar Usuário</title>
</head>

<body>

    <h1>Buscar Usuário</h1>

    <h2>Usuário encontrado</h2>

    <?php
    if ($usuario !== null) {
        echo "<p>ID: {$usuario->id}</p>";
        echo "<p>Nome: {$usuario->nome}</p>";
        echo "<p>E-mail: {$usuario->email}</p>";
        echo "<p>Tipo: {$usuario->tipo}</p>";
    } else {
        echo "<p>Usuário não encontrado.</p>";
    }
    ?>

    <h2>Teste de SQL Injection</h2>

    <?php
    if ($usuarioAtaque === null) {
        echo "<p>SQL Injection bloqueado com sucesso.</p>";
    } else {
        echo "<p>O teste retornou um usuário.</p>";
    }
    ?>

</body>

</html>