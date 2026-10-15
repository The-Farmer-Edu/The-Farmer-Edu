<?php
// /localhost/agata/The-Farmer-Edu/public/teste-api/avaliar

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/controller.php';

// Registra as rotas usando os métodos estáticos do Router
Router::get('/teste-api/avaliar', [TesteApiController::class, 'showAvaliar']);

?>