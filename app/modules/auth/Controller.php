<?php 
    require_once __DIR__ . '/Model.php';
    require_once __DIR__ . '/../../core/database.php';

    class testarApiController{

    public function showTestarApi(): void {
            require_once __DIR__ . '/views/testarApi.php';
        }

    public function sendAvaliacao(): void {
            require_once __DIR__ . '/views/sendAvaliacao.php';
        }
    }
?>