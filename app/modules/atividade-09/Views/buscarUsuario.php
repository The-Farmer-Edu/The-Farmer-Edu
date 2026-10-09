<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BUsca usuario </title>
</head>
<body>
    //não utilizar IA nessa parte aqui 
    <?php
        $buscar = new Usuario;
        $buscar->buscarEmail(iniciarPDO(), "Pedromãoderaquete@gmail.com");
        require_once __DIR__ . '/../Model.php';
        $usuarioEncontrado = Usuario::buscarEmail(iniciarPDO(), "Esther@gmail.com");
        ?>
   <?php 
        if ($usuarioEncontrado !== null){ ?>
            <p class="sucesso ">Email encontrado com sucesso!</p>
        <?php } 
        else { ?>
            <p class="erro"> Email não encontrado!</p>
        <?php } ?>
      </p>
</body>
</html>

//usei do gui de ref 