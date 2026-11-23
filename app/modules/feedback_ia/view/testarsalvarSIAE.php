<?php
require_once __DIR__ . '/../../api/model/Ollama.php';
require_once __DIR__ . '/../../../core/database.php';
require_once __DIR__ . '/../Model.php'; 

$pdo = iniciarPDO();
$idSubmissao = 1;

FeedbackIAModel::salvarProbabilidadeIA($pdo, $idSubmissao, 80,  'Uma bosta');
echo FeedbackIAModel::acessarProbabilidadeIa($pdo, $idSubmissao );
    
