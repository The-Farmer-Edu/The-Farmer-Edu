<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php'; 

class UsuarioController {

    public static function showNovoUsuario() {
        require_once __DIR__ . '/views/novoUsuario.php';
    }

    public static function showBuscarUsuario() {
        require_once __DIR__ . '/views/buscarUsuario.php';
    }

    public static function rodarTestes() {
        $pdo = conectar();
        
        echo "<h2>--- Testes Obrigatórios ---</h2>";

        $novoUsuario = new Usuario("Aluno Teste", "aluno" . rand(100,999) . "@email.com", "senha123");
        $novoUsuario->salvar($pdo);
        echo "<p><strong>Teste 1 (Salvar):</strong> ID gerado = " . ($novoUsuario->id ?? 'FALHOU') . "</p>";

        $usuarioBuscado = Usuario::buscarPorEmail($pdo, $novoUsuario->email);
        echo "<p><strong>Teste 2 (Buscar):</strong> Encontrado = " . ($usuarioBuscado ? $usuarioBuscado->nome . " (" . $usuarioBuscado->email . ")" : 'NÃO ENCONTRADO') . "</p>";

        $ataqueSql = "' OR '1'='1";
        $resultadoAtaque = Usuario::buscarPorEmail($pdo, $ataqueSql);
        echo "<p><strong>Teste 3 (SQL Injection):</strong> Busca por <code>" . htmlspecialchars($ataqueSql) . "</code> gerou resultado = " . ($resultadoAtaque === null ? '<strong>NULL (Seguro!)</strong>' : 'VULNERÁVEL!') . "</p>";
    }
}