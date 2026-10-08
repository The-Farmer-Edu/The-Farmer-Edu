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
                'languages' => '/languages',
                'sendCode' => '/submissions?base64_encoded=true&wait=true'
            ];
            $this->obterLinguagens();
        }

        public function obterLinguagens(): void {
            $curlLinguagens = curl_init();
            curl_setopt($curlLinguagens, CURLOPT_URL, $this->host . $this->routes['languages']);
            curl_setopt($curlLinguagens, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curlLinguagens, CURLOPT_HTTPHEADER, [
                'Accept: application/json'
            ]);
            if(curl_errno($curlLinguagens)) {
                echo "Erro ao obter linguagens: " . curl_error($curlLinguagens);
                return;
            }
            $jsonlinguagens = json_decode(curl_exec($curlLinguagens), true);

            $this->linguagens = $jsonlinguagens;
        }

        public function buscarLinguagens(string $query): array|bool {
            $resultados = array_filter($this->linguagens, function($item) use ($query) {
                return stripos($item['name'], $query) !== false;
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
            curl_setopt($curlJudge0, CURLOPT_URL, $this->host . $this->routes['sendCode']);
            curl_setopt($curlJudge0, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curlJudge0, CURLOPT_POST, true);
            curl_setopt($curlJudge0, CURLOPT_POSTFIELDS, $this->payload);
            curl_setopt($curlJudge0, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

            $respostaJudge0 = json_decode(curl_exec($curlJudge0), true);

            $saidaDecodificada = isset($respostaJudge0['stdout']) ? base64_decode($respostaJudge0['stdout']) : "";
            $saidaCompiladaDecodificada = isset($respostaJudge0['compile_output']) ? base64_decode($respostaJudge0['compile_output']) : "";
            $erroDecodificado = isset($respostaJudge0['stderr']) ? base64_decode($respostaJudge0['stderr']) : "";

            $saidaCodigo = $saidaDecodificada ?: $erroDecodificado ?: $saidaCompiladaDecodificada ?: "Sem saída.";

            return ["status" => $respostaJudge0['status'], "saida" => $saidaCodigo];
        }

    }
?>