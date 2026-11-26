<?php
$inicial = mb_strtoupper(mb_substr($usuario['nome'], 0, 1, 'UTF-8'), 'UTF-8');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<base href="<?= htmlspecialchars($base, ENT_QUOTES, 'UTF-8') ?>/">
<meta name="csrf" content="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>">
<title>Atividade de anexo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Poppins:wght@500;700&display=swap">
<link rel="stylesheet" href="atividades/file?type=css&file=base.css">
<link rel="stylesheet" href="atividades/file?type=css&file=aluno.css">
<link rel="stylesheet" href="atividades/file?type=css&file=anexo.css">
</head>
<body class="tema-aluno" data-atividade="<?= (int) $idAtividade ?>">

<?php require_once __DIR__ . '/../../../core/cabecalho.php'; ?>

<div class="layout">
    <aside class="sidebar">
        <a class="menu-item back" href="atividades/aluno">Voltar às atividades</a>
    </aside>

    <main>
        <p id="aviso" class="aviso hidden" role="alert"></p>

        <div class="page-header">
            <h1 id="titulo-atividade">ATIVIDADE DE ANEXO</h1>
        </div>
        <hr>

        <section class="form-card">
            <p id="info-atividade" class="info-atividade"></p>
            <p id="enunciado" class="enunciado"></p>

            <form id="form-anexo">
                <div class="field">
                    <label for="arquivos">Seus arquivos</label>
                    <input type="file" id="arquivos" name="arquivos[]" multiple>
                    <small id="dica-arquivos" class="dica"></small>
                    <div id="selecionados" class="arquivos-existentes"></div>
                </div>

                <div class="form-actions">
                    <button class="primary" type="submit" id="botao-enviar">Enviar arquivos</button>
                </div>
            </form>
        </section>

        <section>
            <h3 class="barra-titulo">Meus envios <span id="total-envios" class="contador">0</span></h3>
            <div id="lista-envios" class="feed"></div>
        </section>
    </main>
</div>

<script src="atividades/file?type=js&file=menu.js"></script>
<script src="atividades/file?type=js&file=anexo.js"></script>
</body>
</html>