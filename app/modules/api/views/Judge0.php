<?php
    $path = $_GET['isBase64'] ? base64_decode($_GET['path']) : $_GET['path'];
    $url = "http://192.168.0.22:2358/" . $path;

    $method = $_SERVER['REQUEST_METHOD'];
    $options = [
        'http' => [
            'method'        => $method,
            'header'        => "Content-Type: application/json\r\n", 
            'ignore_errors' => true
        ]
    ];

    if ($method !== 'GET') {
        $options['http']['content'] = file_get_contents('php://input');
    }

    $context = stream_context_create($options);
    $external_content = file_get_contents($url, false, $context);

    switch ($path){
        case "dummy-client.html":
            header("Content-Type: text/html; charset=UTF-8");
            break;
        default:
            header("Content-Type: application/json; charset=UTF-8"); 
            break;
    }
    echo $external_content;
?>