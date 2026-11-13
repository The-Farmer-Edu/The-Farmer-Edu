<?php

require_once __DIR__ . '/session.php';
require_once __DIR__ . '/database.php';

class Router {
    private static array $routes = [];

    public static function get(string $path, array $handler): void {
        self::$routes['GET'][$path] = $handler;
    }

    public static function post(string $path, array $handler): void {
        self::$routes['POST'][$path] = $handler;
    }

    public static function carregarRotas(): void {
        $modulesPath = __DIR__ . '/../modules';
        $routeFiles = glob($modulesPath . '/*/routes.php');

        foreach ($routeFiles as $file) {
            require_once realpath($file);
        }
    }

    public static function enviarRota(): void {
        self::carregarRotas();

       
$rotaConsulta = $_GET['rota'] ?? null;

if (is_string($rotaConsulta) && $rotaConsulta !== '') {
    $uri = '/' . trim($rotaConsulta, '/');
} else {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    $scriptName = dirname($_SERVER['SCRIPT_NAME']);

    if ($scriptName !== '/' && $scriptName !== '\\') {
        if (strpos($uri, $scriptName . '/') === 0) {
            $uri = substr($uri, strlen($scriptName));
        }
    }

    if (strpos($uri, '/index.php/') === 0) {
        $uri = substr($uri, strlen('/index.php'));
    }

    $uri = '/' . trim($uri, '/');
}


        $method = $_SERVER['REQUEST_METHOD'];

        // Procura a rota e executa o Controller
        if (isset(self::$routes[$method][$uri])) {
            [$controllerClass, $action] = self::$routes[$method][$uri];

            if (class_exists($controllerClass)) {
                $controller = new $controllerClass();
                if (method_exists($controller, $action)) {
                    $controller->$action();
                    return;
                }
            }
        }

        http_response_code(404);
        echo "404 - Rota não encontrada: " . htmlspecialchars($uri);
    }
}

?>