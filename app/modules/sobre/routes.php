<?php
/**
 * ============================================================================
 * MÓDULO SOBRE - DEFINIÇÃO DE ROTAS (routes.php)
 * ============================================================================
 * Página pública "Sobre os Desenvolvedores": lista os squads do projeto e,
 * para cada squad, os alunos que participaram do desenvolvimento.
 * ============================================================================
 */

require_once __DIR__ . '/../../core/router.php';
require_once __DIR__ . '/Controller.php';

// Acessível com ou sem login (a página se adapta ao perfil quando há sessão)
Router::get('/sobre/desenvolvedores', [SobreController::class, 'mostrarDesenvolvedores']);
Router::get('/sobre/file', [SobreController::class, 'sendFile']);
