
<?php

class NotificacoesController
{
    public function listar(): void
    {
        $notificacoes = [
            "Bem-vindo ao The Farmer Edu!",
            "Você possui uma nova atividade.",
            "Confira as novidades do sistema."
        ];

        echo "<h1>Notificações</h1>";

        foreach ($notificacoes as $mensagem) {
            echo "<p>" . htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') . "</p>";
        }
    }
}
