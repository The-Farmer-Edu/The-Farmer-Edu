<?php
    require_once __DIR__ . '/../../core/database.php';

    class testarAPIController {
    public function showAvaliar(): void {
        require_once __DIR__ . '/view/index.php';
    }

    public function sendAvaliacao(): void {
        require_once __DIR__ . '/view/sendAvaliacao.php';
    }
    }
?>