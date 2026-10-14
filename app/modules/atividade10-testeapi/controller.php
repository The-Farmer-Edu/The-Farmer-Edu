<?php

class ApiController {

    public function showAvaliar(): void {
        require_once __DIR__ . '/./views/teste_api.php';
    }

    public function sendAvaliacao(): void {
        require_once __DIR__ . '/../api/views/sendAvaliacao.php';
    }

    public function showLinguagens(): void {
        require_once __DIR__ . '/../api/views/ListarLinguagens.php';
    }

    public function showJudge0(): void {
        require_once __DIR__ . '/../api/views/Judge0.php';
    }

    public function showOllama(): void {
        require_once __DIR__ . '/../api/views/Ollama.php';
    }
}