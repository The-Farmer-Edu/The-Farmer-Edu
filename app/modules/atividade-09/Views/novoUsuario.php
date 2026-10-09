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

      try {
        $salvarInstrutor = new Instrutor("Predo", "PedroTechJf@gmail.com", "1234", ["PHP", "Programação Orientada a Objetos/poo"]);
        
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
        $salvarAluno = new Aluno("Esther", "teté@gmail.com", "123", "000667", 250);
        
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
//catch é pra tratar erros, se der erro ele vai cair no catch e mostrar a mensagem de erro, se não der erro ele vai mostrar a mensagem de sucesso
    
</body> 
</html>