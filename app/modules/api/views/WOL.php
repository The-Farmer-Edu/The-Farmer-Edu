<?php
    header("Content-Type: application/json; charset=UTF-8");
    require_once __DIR__ . '/../model/Ollama.php';

    if(Ollama::wakeOnLan()){
        echo json_encode(['success' => true, 'message' => 'Pacote mágico enviado com sucesso.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Falha ao enviar pacote mágico.']);
    };
?>