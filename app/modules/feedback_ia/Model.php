<?php
    require_once __DIR__ . '/../../core/database.php';

    $id_atividade = 1;
    $pdo = iniciarPDO();

    $stmt = $pdo->prepare("SELECT caminho, descricao_arquivo AS 'desc' FROM arquivos AS a WHERE id_atividade = ?;");
    $stmt -> execute([$id_atividade]);

    $base = realpath(__DIR__ . '/../../../storage/gabaritos');

    $gabarito = '';
    foreach ($stmt->fetchALL() as $a){
        $gabarito .= "### " . $a['descricao'] . "\n" . file_get_contents($base . '/' . $a['caminho']) . "\n\n";

    }

    $resposta = (new Ollama())->gerar("Compare com o gabarito...\n\n$gabarito\n\nResposta do aluno:\n$respostaAluno");

