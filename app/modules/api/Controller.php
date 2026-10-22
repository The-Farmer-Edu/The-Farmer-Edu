<?php

class ApiController {

    public function showAvaliar(): void {
        require_once __DIR__ . '/views/Avaliar.php';
    }

    public function sendAvaliacao(): void {
        require_once __DIR__ . '/views/sendAvaliacao.php';
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
}