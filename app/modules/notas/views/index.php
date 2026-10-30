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
$corMedia = $media >= 7 ? '#1B5E20' : ($media >= 5 ? '#FF8D28' : '#dc2626');
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
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
            /* Perfil Aluno (Verde) - Guia de Design */
            --verde-primario:   #1B5E20;
            --verde-escuro:     #089C2F;
            --verde-header:     #A0FDA3;
            --verde-suave:      #E8F5E9;
            --verde:            #1B5E20;
            --verde-claro:      #A0FDA3;

            /* Destaque Secundário (Laranja) - Guia de Design */
            --laranja:          #FF8D28;
            --laranja-suave:    #FFF3E0;
            --amarelo:          #FF8D28;
            --amarelo-claro:    #FFF3E0;

            /* Feedback / Status */
            --vermelho:         #DC2626;
            --vermelho-claro:   #FEE2E2;
            --azul:             #002D38;
            --azul-claro:       #A0FDA3;

            /* Neutros - Guia de Design */
            --texto-principal:  #002D38;
            --texto-preto:      #000000;
            --texto-secundario: #727272;
            --bg-pagina:        #F5F7F0;
            --bg-card:          #FFFFFF;
            --borda-card:       #E6E6E6;
            --cinza-50:         #F5F7F0;
            --cinza-100:        #E6E6E6;
            --cinza-200:        #D9D9D9;
            --cinza-400:        #727272;
            --cinza-600:        #727272;
            --cinza-800:        #002D38;
            --cinza-900:        #002D38;

            /* Sombras do Guia de Design */
            --sombra-card:      0px 4px 4px rgba(0, 0, 0, 0.25);
            --sombra-header:    0px 4px 3px rgba(248, 96, 17, 0.5);
            --sombra-sm:        0px 2px 4px rgba(0, 0, 0, 0.08);
            --sombra-md:        0px 4px 4px rgba(0, 0, 0, 0.25);
            --sombra-lg:        0 10px 15px rgba(0, 0, 0, 0.1);

            /* Geometria do Guia de Design */
            --raio-card:        25px;
            --raio-pill:        20px;
            --raio-icone:       10px;
            --raio:             25px;
            --transicao:        all .2s ease;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-pagina);
            color: var(--texto-principal);
            min-height: 100vh;
        }

        /* ============================================================
           TOPBAR (HEADER) - Guia de Design
           Faixa colorida de ponta a ponta (#A0FDA3), logo circular + "The Farmer Edu"
           com "Edu" em verde (#1B5E20) e o restante em navy (#002D38),
           avatar em verde escuro (#089C2F) e brilho laranja por baixo.
           ============================================================ */
        .topbar {
            background: var(--verde-header);
            color: var(--texto-principal);
            padding: 0 24px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: var(--sombra-header);
        }

        .topbar-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Poppins', sans-serif;
            font-weight: 700;
            font-size: 1.15rem;
            color: var(--verde-primario);
            text-decoration: none;
        }

        .topbar-logo span {
            color: var(--texto-principal);
        }

        .topbar-user {
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            font-size: .875rem;
            color: var(--texto-principal);
        }

        .avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--verde-escuro);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Poppins', sans-serif;
            font-weight: 700;
            font-size: .875rem;
            color: #ffffff;
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
            font-family: 'Poppins', sans-serif;
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--texto-principal);
            margin-bottom: 4px;
        }

        .page-header p {
            font-family: 'Inter', sans-serif;
            font-size: .95rem;
            color: var(--texto-secundario);
        }

        /* ============================================================
           CARDS DE RESUMO (Raio: 25px, Sombra padrão de card)
           ============================================================ */
        .resumo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }

        .card-resumo {
            background: var(--bg-card);
            border-radius: var(--raio-card);
            padding: 20px 24px;
            box-shadow: var(--sombra-card);
            border: 1px solid var(--borda-card);
            display: flex;
            flex-direction: column;
            gap: 6px;
            transition: var(--transicao);
        }

        .card-resumo:hover {
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
            transform: translateY(-2px);
        }

        .card-resumo .icone {
            font-size: 1.6rem;
        }

        .card-resumo .valor {
            font-family: 'Poppins', sans-serif;
            font-size: 2rem;
            font-weight: 700;
            line-height: 1;
        }

        .card-resumo .label {
            font-family: 'Inter', sans-serif;
            font-size: .8rem;
            color: var(--texto-secundario);
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
            font-family: 'Poppins', sans-serif;
            font-size: 1.05rem;
            font-weight: 700;
            color: var(--verde-primario);
            margin-bottom: 14px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--verde-header);
        }

        /* ============================================================
           CARDS DE ATIVIDADE (Raio: 25px, Sombra padrão de card)
           ============================================================ */
        .lista-atividades {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .card-atividade {
            background: var(--bg-card);
            border-radius: var(--raio-card);
            border: 1px solid var(--borda-card);
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            box-shadow: var(--sombra-card);
            transition: var(--transicao);
        }

        .card-atividade:hover {
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
            border-color: var(--verde-escuro);
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
            border-radius: var(--raio-icone);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            flex-shrink: 0;
            background: var(--cinza-100);
        }

        .tipo-codigo  { background: var(--laranja-suave); }
        .tipo-quiz    { background: var(--verde-suave); }
        .tipo-texto   { background: #E0F2FE; }

        .atividade-info h3 {
            font-family: 'Poppins', sans-serif;
            font-size: .925rem;
            font-weight: 700;
            color: var(--texto-preto);
            margin-bottom: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 420px;
        }

        .atividade-info .meta {
            font-family: 'Inter', sans-serif;
            font-size: .8rem;
            color: var(--texto-secundario);
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
            font-family: 'Poppins', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
        }
        .nota-10  { color: var(--verde-primario); }
        .nota-boa { color: var(--verde-escuro); }
        .nota-ok  { color: var(--laranja); }
        .nota-ruim{ color: var(--vermelho); }

        .nota-max {
            font-family: 'Inter', sans-serif;
            font-size: .8rem;
            color: var(--texto-secundario);
            font-weight: 400;
        }

        /* BADGES (Formato pílula: 20px) */
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 10px;
            border-radius: var(--raio-pill);
            font-family: 'Inter', sans-serif;
            font-size: .75rem;
            font-weight: 600;
        }

        .badge-avaliado  { background: var(--verde-suave);   color: var(--verde-primario); }
        .badge-enviado   { background: #E0F2FE;              color: #0284C7; }
        .badge-pendente  { background: var(--laranja-suave); color: var(--laranja); }
        .badge-ia        { background: #F3E8FF;              color: #7E22CE; }

        /* ============================================================
           ESTADO VAZIO
           ============================================================ */
        .vazio {
            text-align: center;
            padding: 60px 20px;
            color: var(--texto-secundario);
            font-family: 'Inter', sans-serif;
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