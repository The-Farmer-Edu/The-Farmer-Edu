<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['rota'] = 'gamificacao/arvore';
require 'd:\xampp\htdocs\Aprimoramento de arvore\The-Farmer-Edu\app\core\router.php';
class DummyController { public function index(){ echo 'OK'; } }
Router::get('/gamificacao/arvore', [DummyController::class, 'index']);
Router::enviarRota();
