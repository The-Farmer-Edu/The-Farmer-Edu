<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buscar Usuário</title>
</head>
<body>
    <?php
        $buscar = new Usuario;
        $buscar->buscarEmail(iniciarPDO(), "PedroTechJf@gmail.com");
        ?>
    <p>
        <strong>Usuário encontrado:</strong>
             <?= $buscar->email ?>
    </p>
</body>
</html>