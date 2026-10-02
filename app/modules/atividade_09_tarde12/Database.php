<?php
/**
 * Conexão com Banco de Dados SQL para a Atividade 09 - Tarde 12
 */

require_once __DIR__ . '/Model.php';

class Database {
    private static ?PDO $instancia = null;

    /**
     * Retorna a conexão ativa com o banco de dados via PDO.
     */
    public static function obterConexao(): PDO {
        if (self::$instancia !== null) {
            return self::$instancia;
        }

        $host = 'localhost';
        $banco = 'the_farmer_edu';
        $usuario = 'root';
        $senha = '';

        try {
            // Tenta conectar no servidor MySQL do XAMPP
            $pdoRoot = new PDO("mysql:host=$host;charset=utf8mb4", $usuario, $senha, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            // Cria o banco de dados se não existir
            $pdoRoot->exec("CREATE DATABASE IF NOT EXISTS `$banco` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            self::$instancia = new PDO("mysql:host=$host;dbname=$banco;charset=utf8mb4", $usuario, $senha, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
        } catch (Throwable $e) {
            // Fallback robusto para SQLite local caso o MySQL não esteja rodando
            $caminhoSqlite = __DIR__ . '/banco_atividade09.sqlite';
            self::$instancia = new PDO("sqlite:" . $caminhoSqlite, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
        }

        // Garante que a tabela 'usuarios' esteja criada
        Usuario::criarTabela(self::$instancia);

        return self::$instancia;
    }
}
