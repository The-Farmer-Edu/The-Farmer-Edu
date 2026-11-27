<?php
    // require_once __DIR__ . '/../../core/router.php';
    require_once __DIR__ . '/Controller.php';

    // Registra as rotas usando os métodos estáticos do Router
    Router::get('/fazenda', [baseFazenda::class, 'showFazenda']);
    Router::get('/fazenda/file', [baseFazenda::class, 'sendFile']);
    // Backend: save no banco e XP vindo das atividades
    Router::post('/fazenda/salvar', [baseFazenda::class, 'salvar']);
    Router::get('/fazenda/xp-pendente', [baseFazenda::class, 'xpPendente']);

?>