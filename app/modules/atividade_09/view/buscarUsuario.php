<?php
    require_once __DIR__ . '/../Model.php';
    require_once __DIR__ . '/../../../core/database.php';

    $pdo = iniciarPDO();
    $emailBusca = "davipaiva@gmail.com";
    $aluno = Usuario::buscarPorEmail($pdo, $emailBusca);

    if ($aluno) {
        echo $aluno->saudacao();
    } else {
        echo "Usuário não encontrado.<br>";
    }

    $pdo = iniciarPDO();
    $email = "' OR '1'='1";
    $aluno = Usuario::buscarPorEmail($pdo, $email);

    var_dump($aluno);
    echo "<br>";