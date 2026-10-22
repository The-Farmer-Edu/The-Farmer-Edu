<?php

class notasController {

    public function showTestarApi(): void {
        // Carrega a view de Home
        require_once __DIR__ . '/views/index.php';
    }

    public function sendAvaliacao(): void {
        require_once __DIR__ . '/views/sendAvaliacao.php';
    }

}