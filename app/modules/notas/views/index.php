<?php
// Esta view e carregada pelo NotasController::verNotasAluno()
// Variaveis disponiveis: $usuario, $atividades, $resumo

// Agrupa atividades por turma/curso para exibicao em secoes
$grupos = [];
foreach ($atividades as $atv) {
    $chave = $atv['nome_curso'] . ' — ' . $atv['nome_turma'];
    $grupos[$chave][] = $atv;
}

// Calcula cor da media para o card de resumo
$media = (float) ($resumo['media_geral'] ?? 0);
$corMedia = $media >= 7 ? '#22c55e' : ($media >= 5 ? '#f59e0b' : '#ef4444');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minhas Notas — The Farmer Edu</title>
    <meta name="description" content="Veja todas as suas notas e atividades na plataforma The Farmer Edu.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* ============================================================
           RESET E BASE
           ============================================================ */
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        :root {
            --verde:      #16a34a;
            --verde-claro:#dcfce7;
            --amarelo:    #d97706;
            --amarelo-claro:#fef3c7;
            --vermelho:   #dc2626;
            --vermelho-claro:#fee2e2;
            --azul:       #2563eb;
            --azul-claro: #dbeafe;
            --cinza-50:   #f8fafc;
            --cinza-100:  #f1f5f9;
            --cinza-200:  #e2e8f0;
            --cinza-400:  #94a3b8;
            --cinza-600:  #475569;
            --cinza-800:  #1e293b;
            --cinza-900:  #0f172a;
            --sombra-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);
            --sombra-md: 0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.06);
            --sombra-lg: 0 10px 15px rgba(0,0,0,.08), 0 4px 6px rgba(0,0,0,.05);
            --raio:       12px;
            --transicao:  all .2s ease;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--cinza-50);
            color: var(--cinza-800);
            min-height: 100vh;
        }

        /* ============================================================
           TOPBAR
           ============================================================ */
        .topbar {
            background: var(--cinza-900);
            color: white;
            padding: 0 24px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 8px rgba(0,0,0,.3);
        }

        .topbar-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 700;
            font-size: 1.1rem;
            color: #4ade80;
            text-decoration: none;
        }

        .topbar-logo span { color: white; }

        .topbar-user {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: .875rem;
        }

        .avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4ade80, #2563eb);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: .875rem;
            color: white;
            flex-shrink: 0;
        }

        /* ============================================================
           CONTAINER PRINCIPAL
           ============================================================ */
        .container {
            max-width: 960px;
            margin: 0 auto;
            padding: 28px 20px 60px;
        }

        /* ============================================================
           CABECALHO DA PAGINA
           ============================================================ */
        .page-header {
            margin-bottom: 28px;
        }

        .page-header h1 {
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--cinza-900);
            margin-bottom: 4px;
        }

        .page-header p {
            font-size: .9rem;
            color: var(--cinza-600);
        }

        /* ============================================================
           CARDS DE RESUMO
           ============================================================ */
        .resumo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }

        .card-resumo {
            background: white;
            border-radius: var(--raio);
            padding: 20px 24px;
            box-shadow: var(--sombra-sm);
            border: 1px solid var(--cinza-200);
            display: flex;
            flex-direction: column;
            gap: 6px;
            transition: var(--transicao);
        }

        .card-resumo:hover {
            box-shadow: var(--sombra-md);
            transform: translateY(-2px);
        }

        .card-resumo .icone {
            font-size: 1.6rem;
        }

        .card-resumo .valor {
            font-size: 2rem;
            font-weight: 700;
            line-height: 1;
        }

        .card-resumo .label {
            font-size: .8rem;
            color: var(--cinza-600);
            font-weight: 500;
        }

        /* ============================================================
           SECAO DE DISCIPLINA / TURMA
           ============================================================ */
        .secao {
            margin-bottom: 36px;
        }

        .secao-titulo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1rem;
            font-weight: 600;
            color: var(--azul);
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--azul-claro);
        }

        /* ============================================================
           CARDS DE ATIVIDADE
           ============================================================ */
        .lista-atividades {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .card-atividade {
            background: white;
            border-radius: var(--raio);
            border: 1px solid var(--cinza-200);
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            box-shadow: var(--sombra-sm);
            transition: var(--transicao);
        }

        .card-atividade:hover {
            box-shadow: var(--sombra-md);
            border-color: var(--cinza-400);
        }

        .atividade-esq {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
        }

        .tipo-icone {
            width: 42px;
            height: 42px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            flex-shrink: 0;
            background: var(--cinza-100);
        }

        .tipo-codigo  { background: #ede9fe; }
        .tipo-quiz    { background: #fef3c7; }
        .tipo-texto   { background: #dbeafe; }

        .atividade-info h3 {
            font-size: .925rem;
            font-weight: 600;
            color: var(--cinza-800);
            margin-bottom: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 420px;
        }

        .atividade-info .meta {
            font-size: .8rem;
            color: var(--cinza-400);
        }

        .atividade-dir {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 6px;
            flex-shrink: 0;
        }

        /* NOTA */
        .nota {
            font-size: 1.5rem;
            font-weight: 700;
        }
        .nota-10  { color: #16a34a; }
        .nota-boa { color: #2563eb; }
        .nota-ok  { color: #d97706; }
        .nota-ruim{ color: #dc2626; }

        .nota-max {
            font-size: .8rem;
            color: var(--cinza-400);
            font-weight: 400;
        }

        /* BADGES */
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: .75rem;
            font-weight: 600;
        }

        .badge-avaliado  { background: var(--verde-claro);   color: var(--verde); }
        .badge-enviado   { background: var(--azul-claro);    color: var(--azul); }
        .badge-pendente  { background: var(--vermelho-claro); color: var(--vermelho); }
        .badge-ia        { background: #f3e8ff;               color: #7e22ce; }

        /* ============================================================
           ESTADO VAZIO
           ============================================================ */
        .vazio {
            text-align: center;
            padding: 60px 20px;
            color: var(--cinza-400);
        }

        .vazio p { font-size: 1rem; margin-top: 12px; }

        /* ============================================================
           RESPONSIVO
           ============================================================ */
        @media (max-width: 600px) {
            .atividade-info h3 { max-width: 200px; }
            .nota { font-size: 1.2rem; }
        }
    </style>
</head>
<body>

<!-- TOPBAR -->
<nav class="topbar">
    <a class="topbar-logo" href="/">
        🌱 <span>The Farmer</span>Edu
    </a>
    <div class="topbar-user">
        <div class="avatar"><?= strtoupper(substr($usuario['nome'], 0, 2)) ?></div>
        <span><?= htmlspecialchars($usuario['nome']) ?></span>
    </div>
</nav>

<div class="container">

    <!-- CABECALHO -->
    <header class="page-header">
        <h1>📋 Minhas Notas</h1>
        <p>Acompanhe seu desempenho em todas as atividades</p>
    </header>

    <!-- CARDS DE RESUMO -->
    <section class="resumo-grid" aria-label="Resumo das notas">

        <div class="card-resumo">
            <span class="icone">📚</span>
            <span class="valor" style="color: var(--azul)">
                <?= (int) ($resumo['total_atividades'] ?? 0) ?>
            </span>
            <span class="label">Total de atividades</span>
        </div>

        <div class="card-resumo">
            <span class="icone">✅</span>
            <span class="valor" style="color: var(--verde)">
                <?= (int) ($resumo['total_avaliadas'] ?? 0) ?>
            </span>
            <span class="label">Avaliadas</span>
        </div>

        <div class="card-resumo">
            <span class="icone">⏳</span>
            <span class="valor" style="color: var(--amarelo)">
                <?= (int) ($resumo['pendentes'] ?? 0) ?>
            </span>
            <span class="label">Pendentes</span>
        </div>

        <div class="card-resumo">
            <span class="icone">🎯</span>
            <span class="valor" style="color: <?= $corMedia ?>">
                <?= number_format($media, 1, ',', '') ?>
            </span>
            <span class="label">Média geral</span>
        </div>

    </section>

    <!-- LISTA DE ATIVIDADES AGRUPADAS POR TURMA -->
    <?php if (empty($atividades)): ?>
        <div class="vazio">
            <p style="font-size:3rem">🌾</p>
            <p>Nenhuma atividade encontrada para a sua turma ainda.</p>
        </div>
    <?php else: ?>

        <?php foreach ($grupos as $nomeTurma => $itens): ?>
            <section class="secao">
                <h2 class="secao-titulo">
                    📖 <?= htmlspecialchars($nomeTurma) ?>
                </h2>

                <div class="lista-atividades">
                    <?php foreach ($itens as $atv): ?>
                        <?php
                        // Determina icone pelo tipo
                        $iconesTipo = ['codigo' => '💻', 'quiz' => '📝', 'texto' => '📄'];
                        $icone = $iconesTipo[$atv['tipo_atividade']] ?? '📋';
                        $classTipo = 'tipo-' . ($atv['tipo_atividade'] ?? 'texto');

                        // Determina nota e classe
                        $notaVal  = $atv['nota_valor'];
                        $notaFmt  = $notaVal !== null ? number_format((float)$notaVal, 1, ',', '') : null;
                        $classNota = '';
                        if ($notaVal !== null) {
                            if ($notaVal == 10)     $classNota = 'nota-10';
                            elseif ($notaVal >= 7)  $classNota = 'nota-boa';
                            elseif ($notaVal >= 5)  $classNota = 'nota-ok';
                            else                    $classNota = 'nota-ruim';
                        }

                        // Status/badge
                        $status = $atv['status_submissao'] ?? null;
                        $origem = $atv['origem_nota'] ?? null;
                        ?>
                        <article class="card-atividade">
                            <div class="atividade-esq">
                                <!-- Icone do tipo -->
                                <div class="tipo-icone <?= $classTipo ?>">
                                    <?= $icone ?>
                                </div>

                                <div class="atividade-info">
                                    <h3 title="<?= htmlspecialchars($atv['titulo']) ?>">
                                        <?= htmlspecialchars($atv['titulo']) ?>
                                    </h3>
                                    <p class="meta">
                                        Prazo: <?= date('d/m/Y H:i', strtotime($atv['data_entrega'])) ?>
                                        <?php if ($atv['tentativa_num'] ?? 0): ?>
                                            &nbsp;·&nbsp; Tentativa <?= (int)$atv['tentativa_num'] ?>
                                        <?php endif; ?>
                                    </p>
                                </div>
                            </div>

                            <div class="atividade-dir">
                                <?php if ($notaVal !== null): ?>
                                    <!-- Nota numerica -->
                                    <span class="nota <?= $classNota ?>">
                                        <?= $notaFmt ?><span class="nota-max">&nbsp;/10</span>
                                    </span>
                                    <?php if ($origem === 'ia'): ?>
                                        <span class="badge badge-ia">🤖 IA</span>
                                    <?php else: ?>
                                        <span class="badge badge-avaliado">✔ Avaliado</span>
                                    <?php endif; ?>

                                <?php elseif ($status === 'corrigida' || $status === 'enviada' || $status === 'processando'): ?>
                                    <span class="badge badge-enviado">📤 Enviado</span>

                                <?php else: ?>
                                    <span class="badge badge-pendente">⚠ Pendente</span>
                                <?php endif; ?>
                            </div>
                        </article>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endforeach; ?>

    <?php endif; ?>

</div><!-- /container -->

</body>
</html>