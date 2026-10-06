<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Usuário</title>
</head>
<body>
    <?php
    require_once __DIR__ . '/../Model.php';

    // $instrutor = new Instrutor(1, "Pedrão", "PedroTechJf@gmail.com", "123456", ["PHP, Programação Orientada a Objetos"]);
    $salvar = new Usuario("Guilherme", "ChupoVivi@gmail.com", "Aluno", "abcdef");
    // $salvar->salvarUsuario()
    ?>
</body>
</html>
