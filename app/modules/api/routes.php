<?php

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

// Registra as rotas usando os métodos estáticos do Router
Router::get('/api/avaliar', [ApiController::class, 'showAvaliar']);
Router::get('/api/linguagens', [ApiController::class, 'showLinguagens']);
Router::get('/api/Judge0', [ApiController::class, 'showJudge0']);
Router::get('/api/Ollama', [ApiController::class, 'showOllama']);

Router::post('/api/sendAvaliacao', [ApiController::class, 'sendAvaliacao']);
Router::post('/api/Judge0', [ApiController::class, 'showJudge0']);
Router::post('/api/Ollama', [ApiController::class, 'showOllama']);