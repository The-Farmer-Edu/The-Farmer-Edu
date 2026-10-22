<?php
// Função para reaproveitar o que a pessoa digitou quando der erro (e escapar o HTML)
$antigo = static fn(string $campo): string => htmlspecialchars((string) ($_POST[$campo] ?? ''), ENT_QUOTES, 'UTF-8');
$tipoEscolhido = $_POST['tipo'] ?? 'aluno';
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cadastro - The Farmer Edu</title>
</head>
<body>
    <h1>Cadastro 🌱</h1>
 
    <?php if (!empty($mensagem)): ?>
        <p><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
    <?php endif; ?>
 
    <form action="" method="POST">
        <p>
            <label for="tipo">Eu sou:</label>
            <select id="tipo" name="tipo" required>
                <option value="aluno" <?= $tipoEscolhido === 'aluno' ? 'selected' : '' ?>>Aluno</option>
                <option value="instrutor" <?= $tipoEscolhido === 'instrutor' ? 'selected' : '' ?>>Instrutor</option>
            </select>
        </p>
 
        <p>
            <label for="nome">Nome:</label>
            <input type="text" id="nome" name="nome" value="<?= $antigo('nome') ?>" required>
        </p>
 
        <p>
            <label for="email">E-mail:</label>
            <input type="email" id="email" name="email" value="<?= $antigo('email') ?>" required>
        </p>
 
        <p>
            <label for="senha">Senha (mínimo 8 caracteres):</label>
            <input type="password" id="senha" name="senha" minlength="8" required>
        </p>
 
        <!-- Só aparece quando o tipo for instrutor -->
        <p id="campo-materias" hidden>
            <label for="materias">Matérias (separe por vírgula):</label>
            <input type="text" id="materias" name="materias" value="<?= $antigo('materias') ?>" placeholder="Ex.: PHP, Banco de Dados">
        </p>
 
        <button type="submit">Cadastrar</button>
    </form>
 
    <script>
        const tipo = document.getElementById('tipo');
        const campoMaterias = document.getElementById('campo-materias');
 
        function atualizarCampos() {
            campoMaterias.hidden = tipo.value !== 'instrutor';
        }
 
        tipo.addEventListener('change', atualizarCampos);
        atualizarCampos(); // roda uma vez quando abre a página
    </script>
</body>
</html>
 
