<?php

class NotificacoesController
{
    public function listar(): void
    {
        $notificacoes = [
            "Você possui uma atividade pendente.",
            "Uma nova nota foi disponibilizada.",
            "Confira suas atividades no sistema."
        ];

        require __DIR__ . '/views/index.php';
    }
}

