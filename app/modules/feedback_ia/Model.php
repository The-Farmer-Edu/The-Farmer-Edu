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
    }
    $gabarito = FeedbackIAModel::gabaritosDaAtividade($idAtividade );
    $resposta = (new Ollama())->gerar("Compare com o gabarito...\n\n$gabarito\n\nResposta do aluno:\n$respostaAluno");