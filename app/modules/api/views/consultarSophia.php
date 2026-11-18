<?php
    require_once __DIR__ . "/../controller/AvaliadorController.php";

    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Methods: POST");

    $data = json_decode(file_get_contents("php://input"), true);
    // print_r("A");
    // print_r($data);
    $controller = new AvaliadorController();
    $controller->avaliarSophiaCopilot($data);
?>