<?php
    require_once __DIR__ . '/../../core/database.php';
    require_once __DIR__ . '/../api/model/Ollama.php';

    ////
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

        /**
         * Grava ou atualiza o percentual e o motivo de possível uso de IA para uma submissão.
         * O ON DUPLICATE KEY UPDATE garante idempotência pela chave única uq_feedback_submissao.
         */
        public static function salvarProbabilidadeIA(PDO $pdo, int $idSubmissao, float $probabilidade, string $motivo): void {
            $stmt = $pdo->prepare('INSERT INTO feedback_ia (id_submissao, percentual_ia, motivo_ia) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATEpercentual_ia = VALUES(percentual_ia), 
            motivo_ia = VALUES(motivo_ia)' );
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

        public static function salvarNotaIA(PDO $pdo, int $idSubmissao, float $nota): void {
            $nota = max(0, min(10, $nota)); // O professor define a nota entre 0 e 10, ou pode continuar assim?(ver com o Pedro)
            $stmt = $pdo->prepare("INSERT INTO notas (id_submissao, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = IF(origem = 'ia', VALUES(valor), valor)"
            );
            $stmt->execute([$idSubmissao, $nota]);

        FeedbackIAModel::salvarNotaIA($pdo, $idSubmissao, $nota);

        public static function salvarFeedbackGeral(PDO $pdo, int $idSubmissao, string $analiseTecnica, string $respostaAluno): void {
            $stmt = $pdo->prepare(
                'INSERT INTO feedback_ia (id_submissao, analise_tecnica, resposta_aluno) VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE analise_tecnica = VALUES(analise_tecnica), resposta_aluno = VALUES(resposta_aluno)'
            );
            $stmt->execute([$idSubmissao, $analiseTecnica, $respostaAluno]);
}
        }



}


        
    }
    // $gabarito = FeedbackIAModel::gabaritosDaAtividade($idAtividade );
    // $resposta = (new Ollama())->gerar("Compare com o gabarito...\n\n$gabarito\n\nResposta do aluno:\n$respostaAluno");


    //  Para a galera de Notas(lembra de mandar o feedbeck geral tambem Gustavo do futuro)
    // $textoFeedback = FeedbackIAModel::acessarProbabilidadeIa($pdo, $idSubmissao);


    //     Presente para o grupo de Submissões.
    // deois de criar a submissão:
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

    // $aviso = FeedbackIAModel::mensagemAvisoAluno($resultadoIA['probabilidade_ia']
    // );