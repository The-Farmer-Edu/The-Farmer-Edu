<?php
// View: painel do instrutor — lista as turmas
// Variaveis disponiveis: $usuario, $turmas
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Centro de Notas — Instrutor | The Farmer Edu</title>
    <meta name="description" content="Painel do instrutor para gerenciar notas das turmas no The Farmer Edu.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            /* Perfil Verde - Guia de Design (Mesmo do Index) */
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
           Faixa verde claro (#A0FDA3) de ponta a ponta, logo circular + "The Farmer Edu"
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

        /* CONTAINER */
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 28px 20px 60px;
        }

        /* PAGE HEADER */
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

        /* BADGE DE PERFIL */
        .badge-perfil {
            display: inline-block;
            background: var(--verde-suave);
            color: var(--verde-primario);
            border: 1px solid rgba(27, 94, 32, 0.25);
            padding: 4px 14px;
            border-radius: var(--raio-pill);
            font-family: 'Poppins', sans-serif;
            font-size: .75rem;
            font-weight: 600;
            margin-bottom: 16px;
        }

        /* GRID DE TURMAS */
        .turmas-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 18px;
        }

        .card-turma {
            background: var(--bg-card);
            border-radius: var(--raio-card);
            border: 1px solid var(--borda-card);
            padding: 24px;
            box-shadow: var(--sombra-card);
            text-decoration: none;
            color: inherit;
            display: block;
            transition: var(--transicao);
            position: relative;
            overflow: hidden;
        }

        .card-turma::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--verde-primario), #4ADE80);
        }

        .card-turma:hover {
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
            transform: translateY(-3px);
            border-color: var(--verde-escuro);
        }

        .card-turma .icone-turma {
            font-size: 2.2rem;
            margin-bottom: 14px;
            display: block;
        }

        .card-turma h2 {
            font-family: 'Poppins', sans-serif;
            font-size: 1.05rem;
            font-weight: 700;
            color: var(--texto-preto);
            margin-bottom: 6px;
        }

        .card-turma .curso {
            font-family: 'Inter', sans-serif;
            font-size: .82rem;
            color: var(--texto-secundario);
            margin-bottom: 14px;
        }

        .card-turma .turno-badge {
            display: inline-block;
            padding: 3px 12px;
            border-radius: var(--raio-pill);
            font-family: 'Inter', sans-serif;
            font-size: .75rem;
            font-weight: 600;
            background: var(--verde-suave);
            color: var(--verde-primario);
        }

        .card-turma .cta {
            margin-top: 16px;
            font-family: 'Poppins', sans-serif;
            font-size: .85rem;
            color: var(--verde-primario);
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        /* ESTADO VAZIO */
        .vazio {
            text-align: center;
            padding: 60px 20px;
            color: var(--texto-secundario);
            font-family: 'Inter', sans-serif;
        }

        .vazio p {
            margin-top: 12px;
            font-size: 1rem;
        }
    </style>
</head>
<body>

<nav class="topbar">
    <a class="topbar-logo" href="/">🌱 <span>The Farmer</span>Edu</a>
    <div class="topbar-user">
        <div class="avatar"><?= strtoupper(substr($usuario['nome'], 0, 2)) ?></div>
        <span><?= htmlspecialchars($usuario['nome']) ?></span>
    </div>
</nav>

<div class="container">

    <header class="page-header">
        <div class="badge-perfil">👨‍🏫 Instrutor</div>
        <h1>🏫 Centro de Controle de Notas</h1>
        <p>Selecione uma turma para visualizar e lançar notas</p>
    </header>

    <?php if (empty($turmas)): ?>
        <div class="vazio">
            <p style="font-size:3rem">🌾</p>
            <p>Nenhuma turma vinculada a você ainda.</p>
        </div>
    <?php else: ?>
        <div class="turmas-grid">
            <?php
            $icones = ['🌱','🚜','🌾','🐄','🌻','🏡'];
            $i = 0;
            foreach ($turmas as $turma):
                $icone = $icones[$i % count($icones)];
                $i++;
                $turnoLabel = ['manha' => '☀️ Manhã', 'tarde' => '🌤️ Tarde', 'noite' => '🌙 Noite'];
                $turnoExib = $turnoLabel[$turma['turno']] ?? $turma['turno'];
            ?>
                <a class="card-turma" href="turma?id=<?= (int)$turma['id_turma'] ?>">
                    <span class="icone-turma"><?= $icone ?></span>
                    <h2><?= htmlspecialchars($turma['nome_turma']) ?></h2>
                    <p class="curso"><?= htmlspecialchars($turma['nome_curso']) ?></p>
                    <span class="turno-badge"><?= $turnoExib ?></span>
                    <p class="cta">Ver notas →</p>
                </a>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

</div>
</body>
</html>