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

        public function obterResultadoSophia(string $linguagem, string $objetivoAtividade, string $notaMax, string $notaMin, string $codigoBase, string $codigoAluno, mixed $statusJudge0, mixed $saidaJudge0): mixed {
            $this->prompt = "";
            return $this->gerar();
        }
    }

?>