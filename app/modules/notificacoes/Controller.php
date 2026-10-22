
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

        echo "<h1>Notificações</h1>";

        foreach ($notificacoes as $mensagem) {
            echo "<p>" . htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') . "</p>";
        }
    }
}
