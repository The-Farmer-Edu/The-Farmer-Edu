<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <title>Usuários</title>
</head>

<body>

    <h1>Usuários cadastrados</h1>

    <a href="?acao=novoUsuario">Novo usuário</a>

    <table border="1">
        <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Tipo</th>
        </tr>

        <?php foreach ($usuarios as $usuario): ?>
            <tr>
                <td><?= $usuario->id ?></td>
                <td><?= $usuario->nome ?></td>
                <td><?= $usuario->email ?></td>
                <td><?= $usuario->tipo ?></td>
            </tr>
        <?php endforeach; ?>

    </table>

</body>

</html>