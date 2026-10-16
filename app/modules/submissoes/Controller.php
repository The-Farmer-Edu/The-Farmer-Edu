<?php

// require_once __DIR__ . '/Model.php';

class testarApiController {
    public function showaluno() {
        require_once __DIR__ . '/view/aluno.html';
    }
    public function showtestarApi() {
        require_once __DIR__ . '/view/testarApi.php';
        }
    public function enviarSubmissao() {
        require_once __DIR__ . '/view/enviarSubmissao.php';
    }
}
?>