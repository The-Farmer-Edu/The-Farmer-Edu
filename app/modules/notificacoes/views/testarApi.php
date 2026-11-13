
<?php
require_once __DIR__ . '/../../api/model/Judge0.php';
require_once __DIR__ . '/../../api/model/Ollama.php';

$objetivo = "Criar uma mensagem de notificacao para um aluno.";

$codigo = 'print("Voce tem uma nova atividade!")';

$resultadoJudge = null;
$resultadoOllama = null;
$erro = null;

try {
    $judge = new Judge0();

    $resultadoJudge = $judge->obterResultadoJudge0(
        $codigo,
        "",
        "Python"
    );

    $ollama = new Ollama();

    $resultadoOllama = $ollama->obterResultadoOllama(
        $objetivo,
        "10",
        "6",
        "",
        $codigo,
        $resultadoJudge["status"],
        $resultadoJudge["saida"]
    );
} catch (Throwable $e) {
    $erro = $e->getMessage();
}
?>

<h1>Teste de API - Notificacoes</h1>

<h2>Judge0</h2>
<pre><?= htmlspecialchars(print_r($resultadoJudge, true)) ?></pre>

<h2>Ollama</h2>
<pre><?= htmlspecialchars(
    is_string($resultadoOllama)
        ? $resultadoOllama
        : print_r($resultadoOllama, true)
) ?></pre>

<?php if ($erro): ?>
    <p>Erro: <?= htmlspecialchars($erro) ?></p>
<?php endif; ?>
