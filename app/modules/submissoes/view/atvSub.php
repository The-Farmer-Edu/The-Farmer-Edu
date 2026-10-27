<?php
public function processarSubmissaoJudge0() {
    session_start();
    $alunoId = $_SESSION['id_usuario'] ?? null; 
    $atividadeId = $_POST['atividade_id'] ?? null;
    $turmaId = $_POST['turma_id'] ?? null;
    $codigo = $_POST['codigo'] ?? '';
    $linguagemId = $_POST['linguagem_id'] ?? 63; 
    if (!$alunoId || !$atividadeId || !$turmaId) {
        http_response_code(400);
        echo json_encode(['erro' => 'Dados incompletos para a submissão.']);
        return;
    }

    if (!$this->verificarMatricula($alunoId, $turmaId)) {
        http_response_code(403);
        echo json_encode(['erro' => 'Acesso negado: Apenas alunos matriculados podem enviar atividades.']);
        return;
    }

    $tentativaAtual = $this->obterProximaTentativa($alunoId, $atividadeId);
    if ($tentativaAtual > 3) {
        http_response_code(429);
        echo json_encode(['erro' => 'Limite de 3 tentativas esgotado. Aguarde o período de espera para refazer.']);
        return;
    }

    $resultadoJudge = $this->enviarParaJudge0($codigo, $linguagemId);

    $this->salvarSubmissaoBanco(
        $atividadeId, 
        $alunoId, 
        $codigo, 
        $tentativaAtual, 
        $resultadoJudge['status'] ?? 'enviada', 
        json_encode($resultadoJudge)
    );

    echo json_encode($resultadoJudge);
}

private function verificarMatricula($alunoId, $turmaId) {
    global $pdo; 
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM matriculas WHERE id_aluno = ? AND id_turma = ?");
    $stmt->execute([$alunoId, $turmaId]);
    return $stmt->fetchColumn() > 0;
}

private function obterProximaTentativa($alunoId, $atividadeId) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT MAX(tentativa_num) FROM submissoes WHERE id_aluno = ? AND id_atividade = ?");
    $stmt->execute([$alunoId, $atividadeId]);
    $ultima = $stmt->fetchColumn();
    return ($ultima ? (int)$ultima + 1 : 1);
}

private function enviarParaJudge0($codigo, $linguagemId) {
    $payload = json_encode([
        'source_code' => base64_encode($codigo),
        'language_id' => $linguagemId,
        'stdin' => base64_encode('')
    ]);

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => "POST",
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            "content-type: application/json",
            "X-RapidAPI-Key: SUA_CHAVE_RAPIDAPI_AQUI",
            "X-RapidAPI-Host: judge0-ce.p.rapidapi.com"
        ],
    ]);

    $response = curl_exec($curl);
    curl_close($curl);

    return json_decode($response, true) ?: ['status' => 'erro', 'stderr' => 'Falha de comunicação com o Judge0'];
}

private function salvarSubmissaoBanco($atividadeId, $alunoId, $conteudo, $tentativaNum, $status, $resultado) {
    global $pdo;
    $stmt = $pdo->prepare("
        INSERT INTO submissoes (id_atividade, id_aluno, conteudo_resposta, tentativa_num, status, resultado_execucao)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$atividadeId, $alunoId, $conteudo, $tentativaNum, $status, $resultado]);
}

?>