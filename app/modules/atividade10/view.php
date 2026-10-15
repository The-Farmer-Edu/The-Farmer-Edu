<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <title>The Farmer Edu - Atividade 10</title>
    <!-- Fontes Inter e Poppins para manter a estética dark tech -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@500;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #121212;
            color: #e0e0e0;
            padding: 20px;
        }

        h1,
        h2,
        h3 {
            font-family: 'Poppins', sans-serif;
            color: #00d2ff;
        }

        input[type="text"],
        select {
            width: 100%;
            background: #1e1e1e;
            color: #e0e0e0;
            font-family: 'Inter', sans-serif;
            padding: 10px;
            border: 1px solid #333;
            box-sizing: border-box;
            margin-top: 5px;
            margin-bottom: 15px;
            border-radius: 4px;
        }

        textarea {
            width: 100%;
            height: 200px;
            background: #1e1e1e;
            color: #c586c0;
            font-family: monospace;
            padding: 10px;
            border: 1px solid #333;
            box-sizing: border-box;
            margin-top: 5px;
        }

        input[type="text"]:focus,
        select:focus,
        textarea:focus {
            outline: 1px solid #00d2ff;
            border-color: #00d2ff;
        }

        button {
            background: #00d2ff;
            color: #000;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 10px;
            border-radius: 5px;
        }

        button:hover {
            background: #00a8cc;
        }

        #resultado-ia {
            margin-top: 20px;
            padding: 15px;
            background: #1e1e1e;
            border-left: 4px solid #00d2ff;
            display: block;
        }

        .missao {
            color: #ff5252;
            font-weight: bold;
        }

        pre {
            background: #000;
            padding: 10px;
            color: #0f0;
            overflow-x: auto;
        }

        .erro {
            margin-top: 15px;
            margin-bottom: 15px;
            padding: 12px 15px;
            background: #1e1e1e;
            border-left: 4px solid #ff5252;
            color: #ff5252;
        }
    </style>
</head>

<body>

    <h1>Desafio de Lógica</h1>
    <p>Objetivo: Implementar estratégia de looping para aumento de XP.</p>

    <?php if (!empty($erro)): ?>
        <div class="erro">⚠️ <?= htmlspecialchars($erro) ?></div>
    <?php endif; ?>

    <form method="POST" action="?acao=processar">
        <p><strong>Qual é sua estratégia de looping para aumentar XP?</strong></p>
        <input
            type="text"
            id="estrategia_xp"
            name="estrategia_xp"
            placeholder="Ex: Loop de colheitas consecutivas com bônus de streak diário"
            value="<?= htmlspecialchars($_POST['estrategia_xp'] ?? '') ?>"
            required
        >

        <p><strong>Linguagem:</strong></p>
        <select id="linguagem" name="linguagem">
            <option value="71" <?= (($_POST['linguagem'] ?? '71') == '71') ? 'selected' : '' ?>>Python 3</option>
            <option value="68" <?= (($_POST['linguagem'] ?? '') == '68') ? 'selected' : '' ?>>PHP</option>
            <option value="63" <?= (($_POST['linguagem'] ?? '') == '63') ? 'selected' : '' ?>>JavaScript (Node.js)</option>
        </select>

        <p><strong>Código de Looping de XP:</strong></p>
        <!-- O textarea pode ser substituído futuramente pela biblioteca do VS Code (Monaco Editor) -->
        <textarea
            id="codigo_aluno"
            name="codigo_aluno"
            placeholder="Escreva seu código de looping aqui..."
            required
        ><?= htmlspecialchars($_POST['codigo_aluno'] ?? "# Exemplo em Python\nciclos = 10\nxp = 0\nfor i in range(ciclos):\n    xp += 50\n    print(f'Ciclo {i+1}: XP acumulado = {xp}')") ?></textarea>

        <button type="submit">Submeter Código</button>
    </form>

    <?php if (!empty($resultado)): ?>
        <div id="resultado-ia">
            <h2>Estratégia: <?= htmlspecialchars($resultado['estrategia']) ?></h2>
            <p><strong>Status do Compilador:</strong> <span id="status-compilador"><?= htmlspecialchars($resultado['judge0_status']) ?></span></p>
            <p><strong>Terminal:</strong></p>
            <pre id="terminal-saida"><?= htmlspecialchars($resultado['judge0_saida']) ?></pre>

            <h3>Feedback do Professor IA:</h3>
            <p id="feedback-geral"><?= nl2br(htmlspecialchars($resultado['dica_ia'])) ?></p>
        </div>
    <?php endif; ?>

</body>

</html>
