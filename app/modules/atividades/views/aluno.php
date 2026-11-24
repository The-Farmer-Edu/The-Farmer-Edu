<?php
$inicial = mb_strtoupper(mb_substr($usuario['nome'], 0, 1, 'UTF-8'), 'UTF-8');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<base href="<?= htmlspecialchars($base, ENT_QUOTES, 'UTF-8') ?>/">
<title>Minhas Atividades</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Poppins:wght@500;700&display=swap">
<link rel="stylesheet" href="atividades/file?type=css&file=base.css">
<link rel="stylesheet" href="atividades/file?type=css&file=aluno.css">
<link rel="stylesheet" href="atividades/file?type=fazenda&file=botao-acesso-fazenda.css">
</head>
<body class="tema-aluno">

<?php require_once __DIR__ . '/../../../core/cabecalho.php'; ?>

<div class="layout">

    <aside class="sidebar">
        <p class="sidebar-titulo">Minhas turmas</p>
        <div id="lista-turmas" class="lista-cursos"></div>
    </aside>

    <main>
        <p id="aviso" class="aviso hidden" role="alert"></p>

        <div class="page-header">
            <h1 id="titulo-turma">MENU ATIVIDADES</h1>
        </div>

        <hr>

        <section>
            <h3 class="barra-titulo">Pendentes <span id="total-pendentes" class="contador">0</span></h3>
            <div id="lista-pendentes" class="feed"></div>
        </section>

        <section>
            <h3 class="barra-titulo">Realizadas <span id="total-realizadas" class="contador">0</span></h3>
            <div id="lista-realizadas" class="feed"></div>
        </section>
        
    </main>
</div>

<a class="btn-acessar-fazenda" href="fazenda" aria-label="Acessar a fazenda" title="Acessar a fazenda">
    <img src="atividades/file?type=fazenda&file=icone-acesso-fazenda.png" alt="">
</a>

<script src="atividades/file?type=js&file=menu.js"></script>
<script src="atividades/file?type=js&file=aluno.js"></script>
</body>
</html>