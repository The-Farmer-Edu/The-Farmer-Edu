<?php
require_once __DIR__ . '/../Model.php';
require_once __DIR__ . '/../../api/model/Ollama.php';

$idAtividade   = (int) ($_POST['id_atividade'] ?? 1);
$respostaAluno = trim((string) ($_POST['resposta_aluno'] ?? ''));
$resultado = null;
$erro      = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $respostaAluno !== '') {
    set_time_limit(300); // a IA pode demorar
    try {
        $gabarito = FeedbackIAModel::gabaritosDaAtividade($idAtividade);

        $prompt = "Você é um professor de programação. Compare a resposta do aluno com o gabarito do professor "
                . "e dê um feedback curto, dizendo o que está certo e o que melhorar, sem entregar o código corrigido pronto. "
                . "No fim, diga uma nota de 0 a 10.\n\n"
                . "[GABARITO DO PROFESSOR]\n$gabarito\n"
                . "[RESPOSTA DO ALUNO]\n$respostaAluno";

        $resultado = (new Ollama())->gerar($prompt);
    } catch (Throwable $e) {
        $erro = $e->getMessage();
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Teste Feedback IA</title>
</head>
<body>
    <h1>Teste do Feedback IA</h1>

    <form method="post">
        <p>
            <label>ID da atividade:
                <input type="number" name="id_atividade" value="<?= $idAtividade ?>" min="1">
            </label>
        </p>
        <p>
            <label>Resposta do aluno (simulada):<br>
                <textarea name="resposta_aluno" rows="10" cols="80"><?= htmlspecialchars($respostaAluno) ?></textarea>
            </label>
        </p>
        <button type="submit">Enviar para a IA</button>
    </form>

    <?php if ($erro): ?>
        <h2>Erro</h2>
        <p><?= htmlspecialchars($erro) ?></p>
    <?php endif; ?>

    <?php if ($resultado !== null): ?>
        <h2>Feedback da IA</h2>
        <pre style="white-space: pre-wrap;"><?= htmlspecialchars($resultado) ?></pre>
    <?php endif; ?>
</body>
</html>
