<?php
    require_once __DIR__ . '/../../core/database.php';

    $id_atividade = 1;
    $pdo = iniciarPDO();

    $stmt = $pdo->prepare("SELECT caminho, descricao_arquivo AS 'desc' FROM arquivos AS a WHERE id_atividade = ?;");
    $stmt -> execute([$id_atividade]);
    $dados = $stmt -> fetch();