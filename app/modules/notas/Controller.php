<?php

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/session.php';

// =====================================================================
// NotasController — gerencia as rotas de notas para aluno e instrutor
// =====================================================================

class NotasController
{
    private NotasModel $model;

    public function __construct()
    {
        $this->model = new NotasModel();
    }

    // -----------------------------------------------------------------
    // VISÃO DO ALUNO — GET /notas/aluno
    // -----------------------------------------------------------------
    public function verNotasAluno(): void
    {
        // Garante que o usuario esta logado
        solicitarLogin();

        $usuario = usuarioLogado();

        // Se for instrutor, redireciona para o painel certo
        if ($usuario['perfilAcesso'] === 'instrutor') {
            header('Location: /notas/instrutor');
            exit;
        }

        $idAluno   = (int) $usuario['idUsuario'];
        $atividades = $this->model->buscarNotasDoAluno($idAluno);
        $resumo     = $this->model->calcularResumoAluno($idAluno);

        $this->view('index', [
            'usuario'    => $usuario,
            'atividades' => $atividades,
            'resumo'     => $resumo,
        ]);
    }

    // -----------------------------------------------------------------
    // PAINEL DO INSTRUTOR — GET /notas/instrutor
    // -----------------------------------------------------------------
    public function painelInstrutor(): void
    {
        solicitarLogin();

        $usuario = usuarioLogado();

        if ($usuario['perfilAcesso'] !== 'instrutor') {
            http_response_code(403);
            echo "Acesso negado.";
            exit;
        }

        $idInstrutor = (int) $usuario['idUsuario'];
        $turmas      = $this->model->buscarTurmasDoInstrutor($idInstrutor);

        $this->view('instrutor', [
            'usuario' => $usuario,
            'turmas'  => $turmas,
        ]);
    }

    // -----------------------------------------------------------------
    // TURMA ESPECIFICA — GET /notas/turma?id=X
    // -----------------------------------------------------------------
    public function verTurma(): void
    {
        solicitarLogin();

        $usuario = usuarioLogado();

        if ($usuario['perfilAcesso'] !== 'instrutor') {
            http_response_code(403);
            echo "Acesso negado.";
            exit;
        }

        $idTurma = (int) ($_GET['id'] ?? 0);
        if ($idTurma <= 0) {
            header('Location: /notas/instrutor');
            exit;
        }

        $turma       = $this->model->buscarTurma($idTurma);
        $submissoes  = $this->model->buscarSubmissoesDaTurma($idTurma);

        $this->view('turma', [
            'usuario'    => $usuario,
            'turma'      => $turma,
            'submissoes' => $submissoes,
        ]);
    }

    // -----------------------------------------------------------------
    // SALVAR NOTA — POST /notas/salvar
    // -----------------------------------------------------------------
    public function salvarNota(): void
    {
        solicitarLogin();

        $usuario = usuarioLogado();

        if ($usuario['perfilAcesso'] !== 'instrutor') {
            http_response_code(403);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Acesso negado.']);
            exit;
        }

        // Leitura dos dados enviados via POST (formulario ou fetch/AJAX)
        $idSubmissao = (int)   ($_POST['id_submissao'] ?? 0);
        $valor       = (float) ($_POST['valor']        ?? -1);
        $idTurma     = (int)   ($_POST['id_turma']     ?? 0);
        $idInstrutor = (int)   $usuario['idUsuario'];

        $erros = [];

        if ($idSubmissao <= 0) {
            $erros[] = 'Submissao invalida.';
        }
        if ($valor < 0 || $valor > 10) {
            $erros[] = 'Nota deve ser entre 0 e 10.';
        }

        if (!empty($erros)) {
            // Se for AJAX retorna JSON; se nao, redireciona com erro na URL
            if ($this->isAjax()) {
                header('Content-Type: application/json');
                echo json_encode(['sucesso' => false, 'mensagem' => implode(' ', $erros)]);
            } else {
                header("Location: /notas/turma?id={$idTurma}&erro=" . urlencode(implode(' ', $erros)));
            }
            exit;
        }

        try {
            $this->model->salvarNota($idSubmissao, $valor, $idInstrutor);
            $mensagem = "Nota lancada com sucesso!";
            $sucesso  = true;
        } catch (Throwable $e) {
            error_log($e->getMessage());
            $mensagem = "Erro ao salvar nota.";
            $sucesso  = false;
        }

        if ($this->isAjax()) {
            header('Content-Type: application/json');
            echo json_encode(['sucesso' => $sucesso, 'mensagem' => $mensagem]);
        } else {
            $param = $sucesso ? "sucesso=" . urlencode($mensagem) : "erro=" . urlencode($mensagem);
            header("Location: /notas/turma?id={$idTurma}&{$param}");
        }
        exit;
    }

    // -----------------------------------------------------------------
    // Helpers privados
    // -----------------------------------------------------------------

    /** Carrega a view passando variaveis como locais */
    private function view(string $nome, array $dados = []): void
    {
        extract($dados);
        require __DIR__ . '/views/' . $nome . '.php';
    }

    /** Verifica se a requisicao veio via AJAX / fetch */
    private function isAjax(): bool
    {
        return (
            ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest'
            || str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json')
        );
    }
}
