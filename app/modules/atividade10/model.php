<?php

/**
 * model.php — Atividade 10
 * Responsável por se comunicar com as APIs externas:
 *  - Judge0: executa/valida o código de XP do aluno
 *  - Ollama: gera uma dica de IA sobre a estratégia de XP
 */

class Atividade10Model {

    // Endereços das APIs (ajuste conforme seu ambiente)
    private string $urlJudge0 = 'http://192.168.0.22:2358/submissions?base64_encoded=true&wait=true';
    private string $urlOllama = 'http://192.168.0.21:11434/api/generate';

    /**
     * Envia o código do aluno para o Judge0 e retorna o resultado da execução.
     *
     * @param string $codigo  Código a ser executado
     * @param int    $linguagem ID da linguagem no Judge0 (71 = Python 3)
     * @return array resultado com 'status' e 'saida'
     */
    public function executarNoJudge0(string $codigo, int $linguagem = 71): array {
        $payload = json_encode([
            'source_code' => base64_encode($codigo),
            'language_id' => $linguagem,
            'stdin'       => base64_encode(''),
        ]);

        $ch = curl_init($this->urlJudge0);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

        $resposta = curl_exec($ch);
        $erro     = curl_error($ch);
        curl_close($ch);

        // Se não conseguir conectar, retorna um fallback demonstrativo
        if ($erro || !$resposta) {
            return [
                'status' => 'Indisponível (modo offline)',
                'saida'  => "[Judge0 offline]\nSua lógica seria executada aqui.\nO sistema detectou estruturas de repetição no seu código.",
            ];
        }

        $dados  = json_decode($resposta, true);
        $stdout = isset($dados['stdout']) ? base64_decode($dados['stdout']) : '';
        $stderr = isset($dados['stderr']) ? base64_decode($dados['stderr']) : '';
        $status = $dados['status']['description'] ?? 'Desconhecido';

        return [
            'status' => $status,
            'saida'  => trim($stdout ?: $stderr ?: 'Sem saída.'),
        ];
    }

    /**
     * Envia um contexto ao Ollama e retorna uma dica de IA sobre a estratégia de XP.
     *
     * @param string $estrategia Descrição da estratégia de looping de XP informada pelo aluno
     * @param string $resultadoJudge0 Saída do compilador para contexto da IA
     * @return string Dica gerada pela IA
     */
    public function obterDicaOllama(string $estrategia, string $resultadoJudge0): string {
        $prompt = "Você é um tutor de gamificação. Um aluno descreveu a seguinte estratégia de looping de XP:\n"
                . "\"$estrategia\"\n\n"
                . "Resultado do compilador:\n$resultadoJudge0\n\n"
                . "Em 2 frases curtas, dê uma dica construtiva sobre como melhorar essa mecânica de XP.";

        $payload = json_encode([
            'model'  => 'llama3.1:8b',
            'prompt' => $prompt,
            'stream' => false,
        ]);

        $ch = curl_init($this->urlOllama);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

        $resposta = curl_exec($ch);
        $erro     = curl_error($ch);
        curl_close($ch);

        // Fallback se Ollama estiver offline
        if ($erro || !$resposta) {
            return "💡 Dica (modo offline): Considere adicionar um multiplicador de streak para recompensar jogadores consecutivos. Lembre-se de colocar um teto máximo de XP por sessão para evitar exploits.";
        }

        $dados = json_decode($resposta, true);
        return $dados['response'] ?? 'A IA não retornou uma dica desta vez.';
    }
}
