<?php

class ApiController {

    public function showAvaliar(): void {
        // Carrega a view de Avaliar
        require_once __DIR__ . '/views/Avaliar.php';
    }

    public function sendAvaliar(): void {
        // Lógica para enviar a avaliação
        require_once __DIR__ . '/views/sendAvaliar.php';
    }

}