<?php $tituloPagina = $tituloPagina ?? 'The Farmer Edu'; ?>
<!doctype html>
<html lang="pt-br">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="<?= $theme === 'student' ? '#A0FDA3' : '#90BDF0' ?>">
    <title><?= e($tituloPagina) ?> · The Farmer Edu</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <link href="<?= e($assetUrl . 'turmas-cursos.css') ?>" rel="stylesheet">
</head>
<body data-theme="<?= e($theme) ?>" data-open-modal="<?= ($abrirModal ?? '') === 'turma' ? 'modalTurma' : ((($abrirModal ?? '') === 'curso') ? 'modalCurso' : '') ?>">
<?php require __DIR__ . '/cabecalho.php'; ?>
