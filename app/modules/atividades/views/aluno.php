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
</head>
<body class="tema-aluno">

<header>
    <img src="assets/img/svg/logo_icone.svg" alt="The Farmer Edu">
    <div class="titulo-header">
        <h2>MINHAS ATIVIDADES</h2>
        <p>The Farmer Edu</p>
    </div>

    <div>
        <h4>Bem-Vindo!</h4> <?= htmlspecialchars($usuario['nome'], ENT_QUOTES, 'UTF-8') ?></span>
    </div>

    <div class="menu-perfil">
        <button type="button" class="avatar" id="botao-perfil" aria-haspopup="true"
                aria-expanded="false" aria-controls="menu-perfil-lista" title="Menu do perfil"><?= htmlspecialchars($inicial, ENT_QUOTES, 'UTF-8') ?></button>
        <div class="menu-perfil-lista hidden" id="menu-perfil-lista" role="menu">
            <p class="menu-perfil-nome">
                <span><?= htmlspecialchars($usuario['nome'], ENT_QUOTES, 'UTF-8') ?></span>
                <small>Aluno</small>
            </p>
            <a role="menuitem" href="turmas_cursos/aluno">Meus cursos e turmas</a>
            <a role="menuitem" href="turmas_cursos/minhaConta">Minha conta</a>
            <a role="menuitem" class="sair" href="auth/logout">Sair</a>
        </div>
    </div>
    
</header>

<div class="layout">

    <aside class="sidebar">
        <p class="sidebar-titulo">Meus cursos</p>
        <div id="lista-cursos" class="lista-cursos"></div>
    </aside>

    <main>
        <p id="aviso" class="aviso hidden" role="alert"></p>

        <div class="page-header">
            <h1 id="titulo-curso">MENU ATIVIDADES</h1>
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

        <section>
            <button class="primary" type="submit">Postar Atividade </button>
        </section>

    </main>
</div>

<script src="atividades/file?type=js&file=menu.js"></script>
<script src="atividades/file?type=js&file=aluno.js"></script>
</body>
</html>