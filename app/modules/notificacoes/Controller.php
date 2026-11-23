<?php
require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';

class NotificacoesController
{
    private function usuario(): int
    {
        if (session_status() !== PHP_SESSION_ACTIVE) session_start();
        // Ajustar esta chave caso o módulo de login utilize outro nome.
        return (int) ($_SESSION['id_usuario'] ?? $_SESSION['usuario']['id_usuario'] ?? 0);
    }

    private function json(array $dados, int $codigo = 200): void
    {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    }

    public function listar(): void
    {
        $idUsuario = $this->usuario();
        $notificacoes = $idUsuario ? NotificacoesModel::listar(iniciarPDO(), $idUsuario) : [];
        require __DIR__ . '/views/notificacoes.php';
    }

    public function consultar(): void
    {
        $idUsuario = $this->usuario();
        if (!$idUsuario) { $this->json(['erro' => 'Faça login para ver suas notificações.'], 401); return; }
        $this->json(['notificacoes' => NotificacoesModel::listar(iniciarPDO(), $idUsuario)]);
    }

    public function marcarComoLida(): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') { $this->json(['sucesso' => false], 405); return; }
        $idUsuario = $this->usuario();
        if (!$idUsuario) { $this->json(['sucesso' => false], 401); return; }
        $id = filter_input(INPUT_POST, 'id_notificacao', FILTER_VALIDATE_INT);
        $lida = filter_input(INPUT_POST, 'lida', FILTER_VALIDATE_INT);
        if (!$id || !in_array($lida, [0, 1], true)) { $this->json(['sucesso' => false], 400); return; }
        $ok = NotificacoesModel::marcarComoLida(iniciarPDO(), $id, $idUsuario, (bool)$lida);
        $this->json(['sucesso' => $ok]);
    }

    public function marcarTodas(): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') { $this->json(['sucesso' => false], 405); return; }
        $idUsuario = $this->usuario();
        if (!$idUsuario) { $this->json(['sucesso' => false], 401); return; }
        $this->json(['sucesso' => NotificacoesModel::marcarTodasComoLidas(iniciarPDO(), $idUsuario)]);
    }

    public function testarApi(): void { require __DIR__ . '/views/testarApi.php'; }
}
