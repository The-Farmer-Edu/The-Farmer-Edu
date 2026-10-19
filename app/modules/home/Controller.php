<?php

class HomeController {

    public function showHome(): void {
        require_once __DIR__ . '/views/Home.php';
    }

}