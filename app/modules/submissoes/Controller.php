<?php

// require_once __DIR__ . '/Model.php';

class testarApiController {
    public function showtestarApi() {
        require_once __DIR__ . '/view/testarApi.php';
    }
    public function enviarSubmissao() {
        require_once __DIR__ . '/view/enviarSubmissao.php';
    }
}
?>