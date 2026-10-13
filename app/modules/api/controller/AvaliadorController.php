<?php

require_once __DIR__ . "/../model/Judge0.php";
require_once __DIR__ . "/../model/Ollama.php";

class AvaliadorController {
    
    public function avaliarAtividade(mixed $data) {

        if (!isset($data['codigo_aluno']) || !isset($data['id_linguagem'])) {
            http_response_code(400);
            echo json_encode(["erro" => "Parâmetros código_aluno e id_linguagem são obrigatórios."]);
            return;
        }
        // Extraindo variáveis
        $codigoAluno = $data['codigo_aluno'];
        $idLinguagem = $data['id_linguagem'];
        $dadosEntrada = $data['dados_entrada'] ?? "";
        
        $objetivoAtividade = $data['objetivo_atividade'] ?? "Escreva um código que funcione corretamente.";
        $notaMax = $data['nota_max'] ?? "10";
        $notaMin = $data['nota_min'] ?? "6";
        $codigoBase = $data['codigo_base'] ?? "";

        try {
            // =================================================================
            // PASSO 1: Enviar o código para o Judge0 compilar e obter a saída
            // =================================================================
            $judge0Model = new Judge0();
            
            // Opcional: Você pode querer validar se a linguagem existe antes.
            // Aqui estamos assumindo que o front-end mandou um ID válido.
            $respostaJudge0 = $judge0Model->obterResultadoJudge0($codigoAluno, $dadosEntrada, "", $idLinguagem);
            $statusJudge0 = $respostaJudge0['status'];
            $saidaJudge0 = $respostaJudge0['saida'];


            // =================================================================
            // PASSO 2: Enviar a saída e o código para o Ollama avaliar
            // =================================================================
            $ollamaModel = new Ollama();
            $feedbackIA_String = $ollamaModel->obterResultadoOllama(
                $objetivoAtividade,
                $notaMax,
                $notaMin,
                $codigoBase,
                $codigoAluno,
                $statusJudge0,
                $saidaJudge0
            );

            // =================================================================
            // PASSO 3: Retornar o resultado para a View
            // =================================================================
            
            // Como pedimos para o Llama retornar um JSON no Model, vamos garantir
            // que decodificamos a string dele para anexar no nosso retorno limpo.
            $feedbackIA_Objeto = json_decode($feedbackIA_String, true);
            
            // Se o Llama alucinar e não mandar um JSON válido, retornamos a string pura
            if (json_last_error() !== JSON_ERROR_NONE) {
                 $feedbackIA_Objeto = ["feedback_geral" => $feedbackIA_String, "alerta" => "IA não formatou como JSON"];
            }

            echo json_encode([
                "sucesso" => true,
                "compilacao" => [
                    "status" => $statusJudge0,
                    "saida_terminal" => $saidaJudge0
                ],
                "avaliacao" => $feedbackIA_Objeto
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["erro" => "Falha no servidor: " . $e->getMessage()]);
        }
    }
}