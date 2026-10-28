<?php
    require_once __DIR__ . '/Model.php';
    require_once __DIR__ . '/../../core/database.php';

    class baseFazenda {
        public function showFazenda(): void {
            require_once __DIR__ . '/views/fazenda.php';
        }
    }
?>