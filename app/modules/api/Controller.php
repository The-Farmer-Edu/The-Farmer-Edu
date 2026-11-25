<?php

class ApiController {

    public function showAvaliar(): void {
        require_once __DIR__ . '/views/Avaliar.php';
    }

    public function sendAvaliacao(): void {
        require_once __DIR__ . '/views/sendAvaliacao.php';
    }

    public function showConsultarSophia(): void {
        require_once __DIR__ . '/views/consultarSophia.php';
    }

    public function showLinguagens(): void {
        require_once __DIR__ . '/views/ListarLinguagens.php';
    }

    public function showJudge0(): void {
        require_once __DIR__ . '/views/Judge0.php';
    }

    public function showOllama(): void {
        require_once __DIR__ . '/views/Ollama.php';
    }
    
    public function showWOL(): void {
        require_once __DIR__ . '/model/Ollama.php';
        require_once __DIR__ . '/model/Config.php';

        if ($_SERVER['SERVER_NAME'] !== 'the-farmer-edu.pedrotech.com.br') {
            $url = (new InitConfig())->mainHost . "api/WOL";
            $method = 'GET';
            $options = [
                'http' => [
                    'method'        => $method,
                    'header'        => "Content-Type: application/json\r\n",
                    'ignore_errors' => true
                ]
            ];

            $context = stream_context_create($options);
            $external_content = file_get_contents($url, false, $context);

            header("Content-Type: application/json; charset=UTF-8");
            echo $external_content;
        } else {
            require_once __DIR__ . '/views/WOL.php';
        }
    }
}