

<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/database.php';
require_once __DIR__ . '/../../core/session.php';

class NotificacoesController
{
    public function listar(): void
    {
        $pdo = iniciarPDO();

        // Buscar usuário logado
        $usuario = usuarioLogado();

        if (!$usuario) {
            solicitarLogin();
            return;
        }

        $idUsuario = (int) $usuario['idUsuario'];

        // Buscar notificações do usuário
        $notificacoes = NotificacoesModel::listar($pdo, $idUsuario);

        require __DIR__ . '/views/notificacoes.php';
    }

    public function testarApi(): void
    {
        // Rota de teste: exige login para não expor Judge0/Ollama publicamente.
        if (!usuarioLogado()) {
            solicitarLogin();
            return;
        }

        require __DIR__ . '/views/testarApi.php';
    }

    public function marcarComoLida(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        // Permitir apenas requisições POST
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['sucesso' => false, 'erro' => 'Método não permitido']);
            return;
        }

        // Identificar usuário logado
        $usuario = usuarioLogado();

        if (!$usuario) {
            http_response_code(401);
            echo json_encode([
                'sucesso' => false,
                'erro' => 'Usuário não autenticado'
            ]);
            return;
        }

        $idUsuario = (int) $usuario['idUsuario'];

        // Receber dados da notificação
        $idNotificacao = filter_input(INPUT_POST, 'id_notificacao', FILTER_VALIDATE_INT);
        $lida = filter_input(INPUT_POST, 'lida', FILTER_VALIDATE_INT);

        // Validar dados
        if (
            !$idUsuario ||
            !$idNotificacao ||
            !in_array($lida, [0, 1], true)
        ) {
            http_response_code(400);
            echo json_encode(['sucesso' => false, 'erro' => 'Dados inválidos']);
            return;
        }

        try {
            $pdo = iniciarPDO();

            // Atualizar notificação no banco
            $sucesso = NotificacoesModel::marcarComoLida(
                $pdo,
                (int) $idNotificacao,
                $idUsuario,
                (bool) $lida
            );
        } catch (Throwable $e) {
            // Sempre responde JSON, mesmo em erro de banco (ex.: coluna inexistente).
            error_log('[notificacoes] marcarComoLida: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'erro' => 'Erro interno ao salvar']);
            return;
        }

        echo json_encode(['sucesso' => $sucesso]);
    }

    public function verificarNovas(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        $usuario = usuarioLogado();

        if (!$usuario) {
            http_response_code(401);
            echo json_encode(['erro' => 'Não autenticado']);
            return;
        }

        try {
            $pdo = iniciarPDO();
            $idUsuario = (int) $usuario['idUsuario'];

            $notificacoes = NotificacoesModel::listar($pdo, $idUsuario);
        } catch (Throwable $e) {
            error_log('[notificacoes] verificarNovas: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['erro' => 'Erro interno']);
            return;
        }

        echo json_encode([
            'notificacoes' => $notificacoes
        ], JSON_UNESCAPED_UNICODE);
    }
}