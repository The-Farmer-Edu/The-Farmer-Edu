<?php
    require_once "Config.php";

    class Judge0 {
        private string $host;
        private string $payload;
        private array $routes;
        public array $linguagens;
        public string $codigoAluno;
        public int $idLinguagem;
        public string $dadosEntrada;

        public function __construct() {
            $this->host = (new InitConfig())->hostJudge0;
            $this->routes = [
                'languages' => 'languages',
                'sendCode' => 'submissions?base64_encoded=true&wait=true',
            ];
            $this->linguagens = $this->obterLinguagens();
        }

        public function obterLinguagens(): ?array {
            $curlLinguagens = curl_init();
            curl_setopt($curlLinguagens, CURLOPT_URL, $this->host . $this->routes['languages']);
            curl_setopt($curlLinguagens, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curlLinguagens, CURLOPT_HTTPHEADER, [
                'Accept: application/json'
            ]);
            curl_setopt($curlLinguagens, CURLOPT_CONNECTTIMEOUT, 3);
            curl_setopt($curlLinguagens, CURLOPT_TIMEOUT, 6);
            curl_setopt($curlLinguagens, CURLOPT_SSL_VERIFYPEER, false);

            $raw = curl_exec($curlLinguagens);
            if(curl_errno($curlLinguagens)) {
                error_log("Erro ao obter linguagens: " . curl_error($curlLinguagens));
                curl_close($curlLinguagens);
                return null;
            }
            curl_close($curlLinguagens);

            $arrayLinguagens = json_decode($raw, true);
            return is_array($arrayLinguagens) ? $arrayLinguagens : null;
        }

        public function buscarLinguagens(string $query): array|bool {
            if (!$this->linguagens || !is_array($this->linguagens)) {
                return false;
            }

            $resultados = array_filter($this->linguagens, function($item) use ($query) {
                return isset($item['name']) && stripos($item['name'], $query) !== false;
            });

            $resultados = array_values($resultados);

            return count($resultados) > 0 ? $resultados : false;
        }

        public function obterResultadoJudge0(string $codigoAluno, string $dadosEntrada, string $queryLinguagem = "", int $idLinguagem = -1): array {
            if($idLinguagem < 0){
                $idLinguagem = $this->buscarLinguagens($queryLinguagem);
                if(!$idLinguagem){
                    return ["status" => "erro", "saida" => "Não foi encontrado nenhuma linguagem com o termo de busca enviado"];
                }
                $idLinguagem = $idLinguagem[0]['id'];
            }
            
            $this->payload = json_encode([
                "source_code" => base64_encode($codigoAluno),
                "language_id" => $idLinguagem,
                "stdin" => base64_encode($dadosEntrada)
            ]);

            $curlJudge0 = curl_init();
            curl_setopt($curlJudge0, CURLOPT_URL, $this->host . base64_encode($this->routes['sendCode']) . '&isBase64=true');
            curl_setopt($curlJudge0, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curlJudge0, CURLOPT_POST, true);
            curl_setopt($curlJudge0, CURLOPT_POSTFIELDS, $this->payload);
            curl_setopt($curlJudge0, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($curlJudge0, CURLOPT_CONNECTTIMEOUT, 3);
            curl_setopt($curlJudge0, CURLOPT_TIMEOUT, 20);
            curl_setopt($curlJudge0, CURLOPT_SSL_VERIFYPEER, false);

            $rawResponse = curl_exec($curlJudge0);
            $err = curl_error($curlJudge0);
            curl_close($curlJudge0);

            if ($rawResponse === false || $rawResponse === '') {
                return ["status" => "Erro na Execução", "saida" => "Não foi possível conectar ao servidor de compilação Judge0. ($err)"];
            }

            $respostaJudge0 = json_decode($rawResponse, true);

            $saidaDecodificada = isset($respostaJudge0['stdout']) ? base64_decode($respostaJudge0['stdout']) : "";
            $saidaCompiladaDecodificada = isset($respostaJudge0['compile_output']) ? base64_decode($respostaJudge0['compile_output']) : "";
            $erroDecodificado = isset($respostaJudge0['stderr']) ? base64_decode($respostaJudge0['stderr']) : "";

            $saidaCodigo = $saidaDecodificada ?: $erroDecodificado ?: $saidaCompiladaDecodificada ?: "Sem saída.";
            $desc = $respostaJudge0['status']['description'] ?? "Incorreto";
            $status = $desc === "Accepted" ? "Código Aceito!" : "Código Incorreto! ($desc)";
            return ["status" => $status, "saida" => $saidaCodigo];
        }

    }
?>