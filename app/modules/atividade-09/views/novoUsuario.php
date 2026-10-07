<?php
    require_once __DIR__ . '/../Model.php';
    require_once __DIR__ . '/../../../core/database.php';

    $controller = new UsuarioController();
    $controller->exibirPerfil();

    
    
    $aluno = new Aluno("Cleiton", "alunoCleiton@gmail.com", "Aluno", "senha123!", 150);
    
    $pdo = iniciarPDO();

    try {
        $aluno->salvar($pdo);
        echo "Aluno salvo com sucesso!<br>";
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            echo "O e-mail '{$aluno->email}' já está cadastrado no sistema.<br>";
        } else {
            echo "Erro no banco de dados: " . $e->getMessage();
        }
    }