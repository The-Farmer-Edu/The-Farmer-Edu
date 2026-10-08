<?php
    require_once __DIR__ . '/../Model.php';
    require_once __DIR__ . '/../../../core/database.php';

    $controller = new UsuarioController();
    $controller->exibirPerfil();

    
    
    $aluno = new Aluno("davi", "davipaiva@gmail.com", "Aluno", "Davi123!", 150);
    
    $pdo = iniciarPDO();

    try {
        $aluno->salvar($pdo);
        echo "Aluno salvo com sucesso.<br>";
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            echo "E-mail '{$aluno->email}' já está cadastrado.<br>";
        } else {
            echo "Erro no banco de dados: " . $e->getMessage();
        }
    }