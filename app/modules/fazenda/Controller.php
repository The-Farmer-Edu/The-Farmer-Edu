<?php
    require_once __DIR__ . '/Model.php';
    require_once __DIR__ . '/../../core/database.php';

    class testeApiController {
        public function showTesteApi(): void {
            require_once __DIR__ . '/views/testarApi.php';
        }
        
        public function sendAvaliacao(): void {
            require_once __DIR__ . '/views/sendAvaliacao.php';
        }
    }

    class baseFazenda {
        public function showFazenda(): void {
            require_once __DIR__ . '/views/fazenda.html';
        }
    }
?>
