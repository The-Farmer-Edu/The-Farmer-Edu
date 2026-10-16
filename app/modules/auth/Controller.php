<?php

class AuthController {

    public function showLogin(): void {
        require_once __DIR__ . '/views/login.php';
    }

    public function showenviarForm(): void {
        require_once __DIR__ . '/views/enviarForm.php';
    }

}