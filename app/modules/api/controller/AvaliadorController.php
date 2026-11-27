<?php

require_once __DIR__ . "/../model/Judge0.php";
require_once __DIR__ . "/../model/Ollama.php";
require_once __DIR__ . "/../../feedback_ia/Model.php";
require_once __DIR__ . "/../../../core/database.php";

class AvaliadorController {
    
    private function enviarJudge0($codigoAluno, $dadosEntrada, $idLinguagem) {
        $judge0Model = new Judge0();
        // Opcional: Você pode querer validar se a linguagem existe antes.
        // Aqui estamos assumindo que o front-end mandou um ID válido.
        $respostaJudge0 = $judge0Model->obterResultadoJudge0($codigoAluno, $dadosEntrada, "", $idLinguagem);
        $statusJudge0 = $respostaJudge0['status'];
        $saidaJudge0 = $respostaJudge0['saida'];

        return [$statusJudge0, $saidaJudge0];
    }

    private function enviarIAs($linguagem, $objetivoAtividade, $notaMax, $notaMin, $codigoBase, $codigoAluno, $statusJudge0, $saidaJudge0, $idSubmissao){
        $ollamaModel = new Sophia();
        $feedbackIA_Sophia_String = $ollamaModel->obterResultadoSophia(
            $linguagem,
            $objetivoAtividade,
            $notaMax,
            $notaMin,
            $codigoBase,
            $codigoAluno,
            $statusJudge0,
            $saidaJudge0
        );

        // Como pedimos para o Llama retornar um JSON no Model, vamos garantir
        // que decodificamos a string dele para anexar no nosso retorno limpo.
        $feedbackIA_Sophia_Objeto = json_decode($feedbackIA_Sophia_String, true);
        
        // Se o Llama alucinar e não mandar um JSON válido, retornamos a string pura
        if (json_last_error() !== JSON_ERROR_NONE) {
            $feedbackIA_Sophia_Objeto = ["feedback_geral" => $feedbackIA_Sophia_String, "alerta" => "IA não formatou como JSON"];
        }

        $feedbackIA_SIAE = (new SIAE())->obterResultadoSIAE(
            $linguagem,
            $objetivoAtividade,
            $codigoAluno
        );

        FeedbackIAModel::salvarProbabilidadeIA(
            iniciarPDO(),
            $idSubmissao,
            $feedbackIA_SIAE['probabilidade_ia'] ?? 0,
            $feedbackIA_SIAE['motivo'] ?? 'Sem motivo fornecido'
        );

        FeedbackIAModel::salvarFeedbackGeral(
            iniciarPDO(),
            $idSubmissao,
            $feedbackIA_Sophia_Objeto['analise_tecnica'],
            $feedbackIA_Sophia_Objeto['resposta_aluno']
        );

        return [$feedbackIA_Sophia_Objeto, $feedbackIA_SIAE];
    }

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
        $linguagem = $data['linguagem'] ?? "Tente detectar automaticamente";

        $idSubmissao = $data['id_submissao'] ?? null;
        $tipoAvaliacao = $data['tipo_avaliacao'] ?? 'completa';

        try {
            if($tipoAvaliacao === 'completa'){
                [$statusJudge0, $saidaJudge0] = $this->enviarJudge0($codigoAluno, $dadosEntrada, $idLinguagem);
                [$feedbackIA_Sophia_Objeto, $feedbackIA_SIAE] = $this->enviarIAs($linguagem, $objetivoAtividade, $notaMax, $notaMin, $codigoBase, $codigoAluno, $statusJudge0, $saidaJudge0, $idSubmissao);

                echo json_encode([
                    "sucesso" => true,
                    "compilacao" => [
                        "status" => $statusJudge0,
                        "saida_terminal" => $saidaJudge0
                    ],
                    "avaliacao" => $feedbackIA_Sophia_Objeto,
                    "aviso_ia" => FeedbackIAModel::mensagemAvisoAluno($feedbackIA_SIAE['probabilidade_ia'])
                ]);
                return; 
            } else if ($tipoAvaliacao === 'judge0') {
                [$statusJudge0, $saidaJudge0] = $this->enviarJudge0($codigoAluno, $dadosEntrada, $idLinguagem);
                echo json_encode([
                    "sucesso" => true,
                    "compilacao" => [
                        "status" => $statusJudge0,
                        "saida_terminal" => $saidaJudge0
                    ]
                ]);
                return;
            } else if ($tipoAvaliacao === 'IAs'){
                [$statusJudge0, $saidaJudge0] = [$data['compilacao']['status'], $data['compilacao']['saida_terminal']];
                [$feedbackIA_Sophia_Objeto, $feedbackIA_SIAE] = $this->enviarIAs($linguagem, $objetivoAtividade, $notaMax, $notaMin, $codigoBase, $codigoAluno, $statusJudge0, $saidaJudge0, $idSubmissao);
                
                echo json_encode([
                    "sucesso" => true,
                    "avaliacao" => $feedbackIA_Sophia_Objeto,
                    "aviso_ia" => FeedbackIAModel::mensagemAvisoAluno($feedbackIA_SIAE['probabilidade_ia'])
                ]);
            } else {
                echo json_encode([
                    "sucesso" => false
                ]);
            }

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["erro" => "Falha no servidor: " . $e->getMessage()]);
        }
    }

    public function avaliarSophiaCopilot(mixed $data){
        if (!isset($data['linguagem']) || !isset($data['objetivo_atividade']) || !isset($data['leitura_codigo'])) {
            http_response_code(400);
            echo json_encode(["erro" => "Parâmetros linguagem, objetivo_atividade e leitura_codigo são obrigatórios."]);
            return;
        }
        // Extraindo variáveis
        $leituraCodigo = $data['leitura_codigo'];
        $linguagem = $data['linguagem'];
        $objetivoAtividade = $data['objetivo_atividade'];
        $errosCodigo = $data['erros_codigo'] ?? [""];


        try {
            $ollamaModel = new sophiaCopilot();
            $feedbackIA_Sophia_Copilot_String = $ollamaModel->obterResultadoSophia(
                $linguagem,
                $objetivoAtividade,
                $leituraCodigo,
                $errosCodigo
            );

            // Como pedimos para o Llama retornar um JSON no Model, vamos garantir
            // que decodificamos a string dele para anexar no nosso retorno limpo.
            $feedbackIA_Sophia_Copilot_Objeto = json_decode($feedbackIA_Sophia_Copilot_String, true);
            
            // Se o Llama alucinar e não mandar um JSON válido, retornamos a string pura
            if (json_last_error() !== JSON_ERROR_NONE) {
                 $feedbackIA_Sophia_Copilot_Objeto = ["feedback_geral" => $feedbackIA_Sophia_Copilot_String, "alerta" => "IA não formatou como JSON"];
            }

            echo json_encode([
                "sucesso" => true,
                "avaliacao" => $feedbackIA_Sophia_Copilot_Objeto
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["erro" => "Falha no servidor: " . $e->getMessage()]);
        }
    }
}