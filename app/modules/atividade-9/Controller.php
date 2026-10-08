<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';

class UsuarioController {

    public function show(): void {
        require_once __DIR__ . '/views/index.php';
    }

    public function shownovoUsuario(): void {
        require_once __DIR__ . '/views/novoUsuario.php';
    }

    public function showBuscarUsuario(): void {
        require_once __DIR__ . '/views/buscarUsuario.php';
    }
}   