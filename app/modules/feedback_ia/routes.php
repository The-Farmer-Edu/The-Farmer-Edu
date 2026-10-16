<?php
    require_once __DIR__ . '/../../core/router.php';
    require_once __DIR__ . '/Controller.php';
    
    Router::get('/feedback_ia/front-end/index', [indexController::class, 'index']);
    Router::post('/feedback_ia/front-end/index', [indexController::class, 'index']);