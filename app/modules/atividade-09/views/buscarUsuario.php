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
        require_once __DIR__ . '/../Model.php';
        //FrebundaCompany@gmail.com
        //PedroTechJf@gmail.com
        $usuarioEncontrado = Usuario::buscarEmail(iniciarPDO(), "FrebundaCompany@gmail.com");
        ?>
        <?php 
        if ($usuarioEncontrado !== null) { ?>
            <p class="sucesso ">Email encontrado com sucesso!</p>
        <?php } 
        else { ?>
            <p class="erro"> Email não encontrado!</p>
        <?php } ?>

    </p>
</body>
</html>