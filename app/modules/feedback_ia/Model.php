<?php
    require_once __DIR__ . '/../../core/database.php';
    require_once __DIR__ . '/../api/model/Ollama.php';

    class FeedbackIAModel {
        

        public static function gabaritosDaAtividade(int $idAtividade): string {
            $pdo = iniciarPDO();
            $stmt = $pdo->prepare("SELECT caminho, descricao_arquivo AS descricao
                                    FROM arquivos WHERE id_atividade = ? ORDER BY id_arquivo");
            $stmt->execute([$idAtividade]);

            $base = realpath(__DIR__ . '/../../../storage/gabaritos');
            $texto = '';
            foreach ($stmt->fetchAll() as $a) {
                $arquivo = $base?realpath($base . '/' . $a['caminho']) : false;
                if ($arquivo===false||!str_starts_with($arquivo, $base . DIRECTORY_SEPARATOR)) {
                    throw new RuntimeException('Gabarito não encontrado: ' . $a['descricao']);
                }
                $texto .= "### " . $a['descricao'] . "\n" . file_get_contents($arquivo) . "\n\n";
            }
            return $texto;
        }

        public static function salvarProbabilidadeIA(PDO $pdo, int $idSubmissao, float $probabilidade, string $motivo): void {
            $stmt = $pdo->prepare('INSERT INTO feedback_ia (id_submissao, percentual_ia, motivo_ia) VALUES (?, ?, ?)');
            $stmt->execute([$idSubmissao, $probabilidade, $motivo]);
        }

        public static function acessarProbabilidadeIa(PDO $pdo, int $id_submissao){
            $stmt = $pdo->prepare(
                "SELECT percentual_ia, motivo_ia
                FROM feedback_ia
                WHERE id_submissao = ?"
            );

            $stmt->execute([$id_submissao]);
            $feedbackProbabilidade = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($feedbackProbabilidade === false) {
                return null;
            }

            $percentual = $feedbackProbabilidade['percentual_ia'];
            $motivo = $feedbackProbabilidade['motivo_ia'];

            

            return "Probabilidade de uso de IA: {$percentual}%\nMotivo: {$motivo}";

        }

        public static function mensagemAvisoAluno(float $probabilidade): ?string {
            if ($probabilidade <= 60) {
                return null;
            }

            return 'A análise automática identificou sinais de possível uso de IA neste código. Se houver dúvidas, converse com o professor.';
        }


        
    }
    // $gabarito = FeedbackIAModel::gabaritosDaAtividade($idAtividade );
    // $resposta = (new Ollama())->gerar("Compare com o gabarito...\n\n$gabarito\n\nResposta do aluno:\n$respostaAluno");

    
    //  Para a galera de Notas(lembra de mandar o feedbeck geral tambem Gustavo do futuro)
    // $textoFeedback = FeedbackIAModel::acessarProbabilidadeIa($pdo, $idSubmissao);


    //     Presente para o grupo de Submissões.
    // $resultadoIA = (new SIAE())->obterResultadoSIAE(
    //     $linguagem,
    //     $objetivoAtividade,
    //     $codigoAluno
    // );


    // FeedbackIAModel::salvarProbabilidadeIA(
    //     $pdo,
    //     $idSubmissao,
    //     $resultadoIA['probabilidade_ia'],
    //     $resultadoIA['motivo']
    // );

    // $aviso = FeedbackIAModel::mensagemAvisoAluno(
    //     $resultadoIA['probabilidade_ia']
    // );