<?php
    require_once "Config.php";

    class Ollama {
        private string $host;
        private string $payload;
        private array $routes;
        private string $promptSistema;
        public string $model;

        public function __construct() {
            $this->host = (new InitConfig())->hostOllama;
            $this->model = "llama3.1:8b";
            $this->routes = [
                'apiGen' => '/api/generate',
                'sendCode' => '/submissions?base64_encoded=true&wait=true'
            ];
        }

        public function obterResultadoOllama(string $objetivoAtividade, string $notaMax, string $notaMin, string $codigoBase, string $codigoAluno, mixed $statusJudge0, mixed $saidaJudge0): mixed {
            $this->promptSistema = "
            Você é um instrutor de programação rigoroso, porém didático. Sua missão é avaliar o código de um aluno, analisar a saída da compilação e retornar um feedback construtivo no formato JSON.

            [DADOS DA ATIVIDADE]
            - Objetivo: $objetivoAtividade
            - Nota Máxima: $notaMax
            - Nota Mínima para Aprovação: $notaMin

            [CÓDIGO BASE DO PROJETO]
            $codigoBase

            [CÓDIGO DESENVOLVIDO PELO ALUNO]
            $codigoAluno

            [SAÍDA DO COMPILADOR (Judge0)]
            - Status: $statusJudge0
            - Terminal (stdout/stderr): $saidaJudge0

            [DIRETRIZES DE AVALIAÇÃO]
            1. Análise Lógica: Verifique se o código do aluno atende ao Objetivo. O código compilar não significa que a lógica está correta.
            2. Boas Práticas: Avalie nomenclatura de variáveis, indentação e clareza.
            3. Feedback Formativo: Nunca dê o código corrigido pronto. Se houver erro (seja de sintaxe apontado pelo compilador ou erro de lógica), guie o aluno com dicas para que ele mesmo descubra o problema.
            4. Notas: Atribua uma nota de 0 a $notaMax. Seja justo e baseie-se no cumprimento da demanda.

            [FORMATO DE SAÍDA OBRIGATÓRIO]
            Não inclua nenhuma saudação ou texto fora do JSON. Retorne EXCLUSIVAMENTE um objeto JSON válido no seguinte formato:
            {
                \"nota_atribuida\": 0.0,
                \"status_avaliacao\": \"aprovado|reprovado|refazer\",
                \"pontos_positivos\": [\"...\", \"...\"],
                \"pontos_melhoria\": [\"...\", \"...\"],
                \"feedback_geral\": \"...\"
            }";

            $this->payload = json_encode([
                "model" => $this->model,
                "prompt" => $this->promptSistema,
                "stream" => false // false para receber a resposta toda de uma vez
            ]);

            $curlOllama = curl_init();
            curl_setopt($curlOllama, CURLOPT_URL, $this->host . $this->routes['apiGen']);
            curl_setopt($curlOllama, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curlOllama, CURLOPT_POST, true);
            curl_setopt($curlOllama, CURLOPT_POSTFIELDS, $this->payload);
            curl_setopt($curlOllama, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

            $respostaOllama = json_decode(curl_exec($curlOllama), true);
            return $respostaOllama['response'] ?? "A IA não conseguiu gerar um feedback.";
        }
    }

?>