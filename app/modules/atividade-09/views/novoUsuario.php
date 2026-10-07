<!-- <!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Usuário</title>
</head>
<body>
    <h1>Novo Usuário</h1>
</body>
</html> -->

<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Usuário</title>
</head>

<body>

    <h1>Novo Usuário</h1>

    <p><?= $mensagem ?></p>

    <h2>Dados do usuário:</h2>

    <p>ID: <?= $usuarioNovo->id ?></p>
    <p>Nome: <?= $usuarioNovo->nome ?></p>
    <p>E-mail: <?= $usuarioNovo->email ?></p>
    <p>Tipo: <?= $usuarioNovo->tipo ?></p>

</body>

</html>