<?php
/**
 * Entrada do fluxo de avaliação da submissão.
 *
 * Esta página/endpoint recebe o JSON do navegador, decodifica o corpo da requisição e
 * repassa ao AvaliadorController. Em termos de arquitetura, esse script atua como um adaptador
 * entre a camada HTTP e a regra de negócio de avaliação.
 */
    require_once __DIR__ . "/../../api/controller/AvaliadorController.php";

    // Permite que o front-end do projeto consuma a API mesmo vindo de domínios diferentes.
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Methods: POST");

    // Lê o corpo em bruto da requisição, que normalmente chega como JSON com os dados da resposta.
    $data = json_decode(file_get_contents("php://input"), true);

    // Encapsula a execução da avaliação no controller específico do módulo de API.
    $controller = new AvaliadorController();
    $controller->avaliarAtividade($data);
?>