<?php
// /localhost/agata/The-Farmer-Edu/public/teste-api/avaliar

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/controller.php';

// Registra as rotas usando os métodos estáticos do Router
Router::get('/teste-api/avaliar', [ApiController::class, 'showAvaliar']);
Router::get('/teste-api/linguagens', [ApiController::class, 'showLinguagens']);
Router::get('/teste-api/Judge0', [ApiController::class, 'showJudge0']);
Router::get('/teste-api/Ollama', [ApiController::class, 'showOllama']);

Router::post('/teste-api/sendAvaliacao', [ApiController::class, 'sendAvaliacao']);
Router::post('/teste-api/Judge0', [ApiController::class, 'showJudge0']);
Router::post('/teste-api/Ollama', [ApiController::class, 'showOllama']);

?>