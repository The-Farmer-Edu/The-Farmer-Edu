<?php

class NotificacoesController
{
    public function listar(): void
    {
        $notificacoes = [
            [
                "titulo" => "Atividade de PHP",
                "mensagem" => "Sua atividade foi entregue com sucesso.",
                "status" => "entregue",
                "data" => "28/10/2026 às 14:30"
            ],
            [
                "titulo" => "Exercício de lógica",
                "mensagem" => "Você possui uma atividade aguardando entrega.",
                "status" => "pendente",
                "data" => "30/10/2026 às 10:00"
            ],
            [
                "titulo" => "Trabalho de banco de dados",
                "mensagem" => "O prazo desta atividade foi encerrado.",
                "status" => "atrasado",
                "data" => "25/10/2026 às 18:00"
            ]
        ];

        require __DIR__ . '/views/notificacoes.php';
    }

    public function testarApi(): void
    {
        require __DIR__ . '/views/testarApi.php';
    }
}

