<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Notificações - The Farmer Edu</title>
</head>
<body>
    <h1>Notificações</h1>

    <?php foreach ($notificacoes as $mensagem): ?>
        <p>
            <?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?>
        </p>
    <?php endforeach; ?>
</body>
</html>
