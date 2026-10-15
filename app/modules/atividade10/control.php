<?php

/**
 * control.php — Atividade 10
 * Recebe a requisição, usa o Model para processar e
 * repassa os dados para a View exibir.
 */

require_once __DIR__ . '/model.php';

class Atividade10Controller {

    private Atividade10Model $model;

    public function __construct() {
        $this->model = new Atividade10Model();
    }

    /**
     * Exibe o formulário inicial (view.php).
     */
    public function index(): void {
        require __DIR__ . '/view.php';
    }

    /**
     * Processa o formulário enviado pelo aluno:
     * 1. Pega a estratégia de XP e o código digitado
     * 2. Envia o código ao Judge0
     * 3. Pede uma dica ao Ollama
     * 4. Exibe a view com os resultados
     */
    public function processar(): void {
        // Sanitização básica das entradas
        $estrategia = htmlspecialchars(trim($_POST['estrategia_xp'] ?? ''));
        $codigo     = trim($_POST['codigo_aluno'] ?? '');
        $linguagem  = (int) ($_POST['linguagem'] ?? 71);

        if (empty($estrategia) || empty($codigo)) {
            $erro = 'Por favor, preencha todos os campos antes de enviar.';
            require __DIR__ . '/view.php';
            return;
        }

        // Chama o Model para usar as APIs externas
        $resultadoJudge0 = $this->model->executarNoJudge0($codigo, $linguagem);
        $dicaOllama      = $this->model->obterDicaOllama($estrategia, $resultadoJudge0['saida']);

        // Passa os resultados para a view
        $resultado = [
            'estrategia'   => $estrategia,
            'judge0_status' => $resultadoJudge0['status'],
            'judge0_saida'  => $resultadoJudge0['saida'],
            'dica_ia'       => $dicaOllama,
        ];

        require __DIR__ . '/view.php';
    }
}
