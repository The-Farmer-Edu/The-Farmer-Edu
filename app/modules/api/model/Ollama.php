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
            $this->model = "professor-tfe";
            $this->routes = [
                'apiGen' => 'api/generate',
            ];
        }

        public function obterResultadoOllama(string $linguagem, string $objetivoAtividade, string $notaMax, string $notaMin, string $codigoBase, string $codigoAluno, mixed $statusJudge0, mixed $saidaJudge0): mixed {
            $this->promptSistema = "Você atua como o Professor Virtual do 'The Farmer Edu'. Sua tarefa é analisar a submissão de um aluno do SENAI, avaliar a lógica em conjunto com a saída do compilador (Judge0) e do códibo base enviado. Por fim, deve gerar um boletim de avaliação unicamente em formato JSON.

            [DADOS DA ATIVIDADE]
            - Linguagem/Matéria: $linguagem
            - Objetivo: $objetivoAtividade
            - Nota Máxima: $notaMax
            - Nota Mínima para Aprovação: $notaMin

            [CÓDIGO BASE DO PROJETO]
            $codigoBase

            [CÓDIGO DESENVOLVIDO PELO ALUNO]
            $codigoAluno

<<<<<<< HEAD
            [SAÍDA DO MOTOR DE AVALIAÇÃO (Judge0)]
            - Status: $statusJudge0
=======
            [SAÍDA DO COMPILADOR (Judge0)]
            - Status: " . implode(', ', $statusJudge0) . "
>>>>>>> ce39ba26f5f452f34e9cb6bcdb5a29e1b031a481
            - Terminal (stdout/stderr): $saidaJudge0

            [DIRETRIZES DE AVALIAÇÃO]
            1. Análise Lógica e de Regras: Verifique se o código atende ao objetivo da atividade gamificada. O código compilar sem erros no Judge0 não significa necessariamente que a lógica resolve o problema proposto.
            2. Boas Práticas Técnicas: Avalie a clareza, indentação e nomenclatura das variáveis segundo os padrões da linguagem ($linguagem).
            3. Feedback Formativo (Regra de Ouro): NUNCA forneça o código corrigido pronto. Guie o aluno a descobrir o erro (seja de sintaxe ou de lógica) através de dicas conceituais. No campo \"feedback_geral\", adote o tom de um instrutor técnico e encerre SEMPRE com uma pergunta que estimule o raciocínio.
            4. Avaliação e Nota: Seja justo. Atribua a nota (0 a $notaMax) baseada na proximidade da solução ideal e no cumprimento da demanda. Se houver erro crítico de compilação ou falha lógica grave, a nota deve refletir isso para que o status seja 'refazer'.

            [FORMATO DE SAÍDA OBRIGATÓRIO]
            Não inclua nenhuma saudação, explicação, formatação markdown (como ```json) ou texto fora do JSON. Retorne EXCLUSIVAMENTE um objeto JSON válido, pronto para ser lido por um decodificador (json_decode), utilizando a exata estrutura abaixo:

            {
                \"nota_atribuida\": 0.0,
                \"status_avaliacao\": \"aprovado|reprovado|refazer\",
                \"pontos_positivos\": [\"...\", \"...\"],
                \"pontos_melhoria\": [\"...\", \"...\"],
                \"feedback_geral\": \"...\"
            }";
            return $this->gerar($this->promptSistema);
            }

            public function gerar(string $prompt): string{ // manda o prompt e retorna a resposta da IA
                $this->payload = json_encode([
                    "model" => $this->model,
                    "prompt" => $prompt,
                    "stream" => false // false para receber a resposta toda de uma vez
                ]);

                $curlOllama = curl_init();
                curl_setopt($curlOllama, CURLOPT_URL, $this->host . base64_encode($this->routes['apiGen']) . '&isBase64=true');
                curl_setopt($curlOllama, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($curlOllama, CURLOPT_POST, true);
                curl_setopt($curlOllama, CURLOPT_POSTFIELDS, $this->payload);
                curl_setopt($curlOllama, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

                $respostaOllama = json_decode(curl_exec($curlOllama), true);

                return $respostaOllama['response'] ?? "A IA não conseguiu gerar um feedback.";
        }
    }

?>