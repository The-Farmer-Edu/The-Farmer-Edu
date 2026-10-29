<?php
    require_once __DIR__ . '/../../core/router.php';
    require_once __DIR__ . '/Controller.php';

    // Registra as rotas usando os métodos estáticos do Router
    Router::get('/fazenda', [baseFazenda::class, 'showFazenda']);
    Router::get('/fazenda/estilo', [baseFazenda::class, 'enviarEstilo']);
    Router::get('/fazenda/script', [baseFazenda::class, 'enviarScript']);

?>
