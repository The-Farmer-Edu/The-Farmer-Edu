<?php
    require_once __DIR__ . '/../../core/router.php';
    $usuario = Usuario::buscarPorEmail($pdo, $email);
