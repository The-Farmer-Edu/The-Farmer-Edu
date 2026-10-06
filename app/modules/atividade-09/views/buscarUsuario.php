<?php
    require_once __DIR__ . '/../Model.php';
    require_once __DIR__ . '/../../../core/database.php';

    $pdo = iniciarPDO();
    $emailBusca = "alunoCleiton@gmail.com";
    $aluno = Usuario::buscarPorEmail($pdo, $emailBusca);

    if ($aluno) {
        echo $aluno->saudacao();
    } else {
        echo "Usuário não encontrado com esse e-mail.";
    }