<?php /** @var string|null $mensagem */ /** @var string|null $erro */ /** @var Usuario|null $usuarioCriado */ ?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Fazenda do Aluno</title>
</head>
<body>
    <h1>Nivel da Fazenda</h1>

     <p>XP Atual: <strong><?php echo $xp_total; ?></strong></p>
   
    <img src="<?= htmlspecialchars($foto_nivel) ?>" alt="<?= htmlspecialchars($alt_texto) ?>">
</div>
    
</body>
</html>