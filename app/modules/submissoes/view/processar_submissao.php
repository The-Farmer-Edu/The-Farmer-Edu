<?php
/**
 * Endpoint de submissão do módulo.
 *
 * Este arquivo recebe uma requisição POST em JSON, cria uma instância do
 * AvaliadorController e repassa os dados para a rotina que executa a avaliação
 * da atividade. A resposta é devolvida em JSON para o frontend, que então
 * exibe o feedback ou a nota correspondente.
 *
 * O uso de Access-Control-Allow-Origin: * é uma convenção para permitir que a
 * página do frontend chame este endpoint em ambiente de desenvolvimento.
 */
    require_once __DIR__ . "/../../api/controller/AvaliadorController.php";

    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Methods: POST");

    $data = json_decode(file_get_contents("php://input"), true);
    $controller = new AvaliadorController();
    $controller->avaliarAtividade($data);
?>