<?php
    require_once "Config.php";

    class Ollama {
        protected string $host;
        protected string $prompt;
        protected string $payload;
        protected array $routes;
        protected string $promptSistema;
        protected string $model;

        protected function __construct() {
            $this->host = (new InitConfig())->hostOllama;
            $this->routes = [
                'apiGen' => 'api/generate',
            ];
        }

        protected function gerar(bool $think = false): string{ // manda o prompt e retorna a resposta da IA
            $array_payload = [
                "model" => $this->model,
                "prompt" => $this->prompt,
                "stream" => false // false para receber a resposta toda de uma vez
            ];
            $think ? $array_payload['think'] = $think : null;
            $this->payload = json_encode($array_payload);

            $curlOllama = curl_init();
            curl_setopt($curlOllama, CURLOPT_URL, $this->host . base64_encode($this->routes['apiGen']) . '&isBase64=true');
            curl_setopt($curlOllama, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curlOllama, CURLOPT_POST, true);
            curl_setopt($curlOllama, CURLOPT_POSTFIELDS, $this->payload);
            curl_setopt($curlOllama, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

            $respostaOllama = json_decode(curl_exec($curlOllama), true);

            return $respostaOllama['response'] ?? "A IA não conseguiu gerar um feedback. Erro: " . curl_error($curlOllama);
        }
    }

    class SIAE extends Ollama {
        public function __construct() {
            parent::__construct();
            $this->model = "siae";
        }

        public function obterResultadoSIAE(string $linguagem, string $objetivoAtividade, string $notaMax, string $notaMin, string $codigoBase, string $codigoAluno, mixed $statusJudge0, mixed $saidaJudge0): mixed {
            $this->prompt = "";
            return $this->gerar(true);
        }
    }

    class Sophia extends Ollama {
        public function __construct() {
            parent::__construct();
            $this->model = "sophia";
        }

        public function obterResultadoSophia(
            string $linguagem, 
            string $objetivoAtividade, 
            string $notaMax, 
            string $notaMin, 
            string $codigoBase, 
            string $codigoAluno, 
            mixed $statusJudge0, 
            mixed $saidaJudge0
        ): mixed {
            // Tratamento de segurança para dados que vêm como array ou objeto
            $statusStr = is_array($statusJudge0) || is_object($statusJudge0) ? json_encode($statusJudge0, JSON_UNESCAPED_UNICODE) : (string)$statusJudge0;
            $saidaStr  = is_array($saidaJudge0)  || is_object($saidaJudge0)  ? json_encode($saidaJudge0, JSON_UNESCAPED_UNICODE)  : (string)$saidaJudge0;

            $this->prompt = <<<PROMPT
            Você deve processar a submissão de um aluno e gerar um feedback pedagógico intermediado no papel de Sophia.

            === CONTEXTO DA ATIVIDADE ===
            Linguagem de Programação: {$linguagem}
            Objetivo da Atividade: {$objetivoAtividade}
            Intervalo de Nota Permitido: Mínima {$notaMin} até Máxima {$notaMax}

            === CÓDIGOS ===
            [Código Base Fornecido]:
            {$codigoBase}

            [Código Enviado pelo Aluno]:
            {$codigoAluno}

            === EXECUÇÃO NO JUDGE0 ===
            Status de Execução: {$statusStr}
            Saída / Logs do Compilador/Interpretador: {$saidaStr}

            === FORMATO DE SAÍDA EXIGIDO (JSON) ===
            Retorne EXCLUSIVAMENTE um objeto JSON válido no seguinte formato:
            {
                "sucesso": boolean,          // true se o status do Judge0 for de sucesso/aprovação total, false caso contrário.
                "nota_sugerida": float,     // Valor numérico entre {$notaMin} e {$notaMax} baseado no progresso e acerto.
                "analise_tecnica": "string", // Breve resumo técnico interno do erro para o sistema/professor (máx 2 frases).
                "resposta_aluno": "string"   // Mensagem encorajadora de Sophia diretamente para o aluno (cumprindo TODAS as regras pedagógicas).
            }

            === REGRAS PARA O CAMPO 'resposta_aluno' ===
            - Seja didática, encorajadora e use o tom do SENAI.
            - Explique o erro de {$linguagem} ou a lógica incorreta de forma simples.
            - NUNCA dê a solução, trechos de código corrigidos ou respostas prontas.
            - Termine OBRIGATORIAMENTE com uma pergunta reflexiva para guiar o próximo passo do aluno.
            PROMPT;

            return $this->gerar();
        }
    }

?>