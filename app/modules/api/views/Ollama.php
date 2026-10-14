<?php
$path = $_GET['isBase64'] ? base64_decode($_GET['path']) : $_GET['path'];
$url = "http://192.168.0.21:11434/" . $path;

// 1. Descobre se quem chamou este script usou GET ou POST
$method = $_SERVER['REQUEST_METHOD'];

// 2. Configura o contexto base da requisição HTTP
$options = [
    'http' => [
        'method'        => $method,
        'header'        => "Content-Type: application/json\r\n",
        'ignore_errors' => true // Importante: não trava o PHP se o Ollama retornar erro (ex: 400 ou 404)
    ]
];

// 3. Se for POST, captura o JSON enviado e anexa na requisição
if ($method === 'POST') {
    // php://input lê o corpo bruto da requisição POST que chegou neste script
    $options['http']['content'] = file_get_contents('php://input');
}

// 4. Cria o contexto e faz a chamada ao servidor Ollama
$context = stream_context_create($options);
$external_content = file_get_contents($url, false, $context);

// 5. Retorna o resultado
header("Content-Type: application/json; charset=UTF-8");
echo $external_content;
?>