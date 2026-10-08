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

    // $instrutor = new Instrutor(1, "Pedrão", "PedroTechJf@gmail.com", "123456", ["PHP", "Programação Orientada a Objetos"]);
    try {
        $salvarInstrutor = new Instrutor("Pedrão", "PedroTechJf@gmail.com", "123456", ["PHP", "Programação Orientada a Objetos"]);
        
        ?>
        <p class="sucesso">Instrutor salvo com sucesso!</p>
        <?php 
    } 
    catch (PDOException) { 
        ?>
        <p class="erro">Falha ao salvar Instrutor!</p>
        <?php 
    }

    try {
        $salvarAluno = new Aluno("Frecu", "FrebundaCompany@gmail.com", "sarahtraiu", "000120", 250);
        
        ?>
        <p class="sucesso">Aluno salvo com sucesso!</p>
        <?php 
    } 
    catch (PDOException) { 
        ?>
        <p class="erro">Falha ao salvar Aluno!</p>
        <?php 
    }
        ?>
</body>
</html>