<?php
    require_once __DIR__ "/controller.php";
    require_once __DIR__ . '/../../core/router.php';

    Router::get('/contarTentativas', [ContadorTentativas::class, 'showContagem']);
?>