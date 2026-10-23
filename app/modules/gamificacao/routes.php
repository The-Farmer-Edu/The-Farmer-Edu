<?php

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

Router::get('/gamificacao', [GamificacaoController::class, 'showArvore']);
Router::get('/gamificacao/arvore', [GamificacaoController::class, 'showArvore']);
