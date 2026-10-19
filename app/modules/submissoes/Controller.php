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
    public function showiniciarAtv() {
        require_once __DIR__ . '/view/iniciaratv.html';
    }
    public function alunoCSS() {
        header('Content-Type:text/css');
        require_once __DIR__ . '/view/assets/css/aluno.css';
    }
    public function alunoJS() {
        header('Content-Type:text/javascript');
        require_once __DIR__ . '/view/assets/js/aluno.js';
    }
}


?>