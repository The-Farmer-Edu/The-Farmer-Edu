<?php
/**
 * ============================================================================
 * VIEW: PAINEL DO INSTRUTOR - SELEÇÃO DE TURMAS (instrutor.php)
 * ============================================================================
 * Esta view é o ponto de entrada do módulo de notas para o perfil Docente/Instrutor.
 * É carregada a partir de NotasController::painelInstrutor().
 *
 * Funcionalidades:
 * - Cabeçalho com identificação do usuário e menu suspenso de logout.
 * - Cartões de métricas rápidas (total de turmas sob gestão, status de sincronização e data).
 * - Vitrine de turmas com badges informativos de turno (Manhã, Tarde, Noite).
 * - Acesso direto ao painel detalhado de lançamento de notas de cada turma.
 *
 * Variáveis disponíveis:
 * - $usuario : Array com os dados da sessão do instrutor.
 * - $turmas  : Array com as turmas atribuídas ao instrutor no banco de dados.
 * ============================================================================
 */

// View: painel do instrutor — lista as turmas
// Variaveis disponiveis: $usuario, $turmas
$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Centro de Notas — Instrutor | The Farmer Edu</title>
    <meta name="description" content="Painel do instrutor para gerenciar notas das turmas no The Farmer Edu.">
    <!-- Fontes do Google (Inter e Poppins) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            /* Perfil Instrutor (Azul) - Guia de Design */
            --verde-primario:   #0088ff;
            --verde-escuro:     #90bdf0;
            --verde-header:     #D9EEFF;
            --verde-suave:      #EAF5FF;
            --verde:            #2276e3;
            --verde-claro:      #D9EEFF;

            /* Destaque Secundário */
            --laranja:          #FF8D28;
            --laranja-suave:    #FFF3E0;
            --amarelo:          #FF8D28;
            --amarelo-claro:    #FFF3E0;

            /* Feedback / Status */
            --vermelho:         #DC2626;
            --vermelho-claro:   #FEE2E2;
            --azul:             #002D38;
            --azul-claro:       #D9EEFF;

            /* Neutros */
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

            /* Sombras */
            --sombra-card:      0px 4px 6px rgba(0, 0, 0, 0.08);
            --sombra-header:    0px 4px 3px rgba(248, 96, 17, 0.5);
            --sombra-sm:        0px 2px 4px rgba(0, 0, 0, 0.06);
            --sombra-md:        0px 6px 14px rgba(0, 0, 0, 0.12);

            /* Geometria */
            --raio-card:        24px;
            --raio-pill:        20px;
            --raio-icone:       12px;
            --transicao:        all .2s ease;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-pagina);
            color: var(--texto-principal);
            min-height: 100vh;
        }

        /* TOPBAR: Barra de cabeçalho fixa */
        .topbar {
            background: var(--verde-header);
            color: var(--texto-principal);
            padding: 0 28px;
            height: 62px;
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

        .topbar-logo span { color: var(--texto-principal); }

        .topbar-right {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .topbar-user {
            display: flex;
            align-items: center;
            gap: 10px;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            font-size: .875rem;
            color: var(--texto-principal);
            position: relative;
            cursor: pointer;
            padding: 5px 12px 5px 6px;
            border-radius: var(--raio-pill);
            transition: var(--transicao);
            user-select: none;
        }

        .topbar-user:hover {
            background: rgba(255, 255, 255, 0.45);
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

        .seta-user {
            transition: transform 0.2s ease;
        }

        .topbar-user.aberto .seta-user {
            transform: rotate(180deg);
        }

        /* DROPDOWN DO USUÁRIO */
        .user-dropdown {
            position: absolute;
            top: calc(100% + 8px);
            right: 0;
            background: var(--bg-card);
            border: 1px solid var(--borda-card);
            border-radius: 16px;
            box-shadow: 0 12px 28px rgba(0,0,0,.15);
            min-width: 210px;
            z-index: 200;
            overflow: hidden;
            display: none;
            animation: fadeInMenu .2s ease;
        }

        @keyframes fadeInMenu {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .topbar-user.aberto .user-dropdown {
            display: block;
        }

        .user-dropdown-header {
            padding: 14px 16px 10px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .user-dropdown-header strong {
            font-size: .875rem;
            color: var(--texto-principal);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .user-dropdown-header span {
            font-size: .75rem;
            color: var(--verde-primario);
            font-weight: 600;
        }

        .user-dropdown-divider {
            height: 1px;
            background: var(--cinza-100);
            margin: 4px 0;
        }

        .user-dropdown .item-logout {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            font-family: 'Inter', sans-serif;
            font-size: .85rem;
            font-weight: 600;
            color: var(--vermelho);
            text-decoration: none;
            transition: background .15s;
        }

        .user-dropdown .item-logout:hover {
            background: var(--vermelho-claro);
        }

        /* CONTAINER PRINCIPAL */
        .container {
            max-width: 980px;
            margin: 0 auto;
            padding: 36px 20px 72px;
        }

        /* HERO: Banner de boas-vindas do instrutor */
        .hero {
            margin-bottom: 28px;
        }

        .badge-perfil {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: var(--verde-suave);
            color: var(--verde-primario);
            border: 1px solid rgba(11, 87, 168, 0.25);
            padding: 5px 14px;
            border-radius: var(--raio-pill);
            font-family: 'Poppins', sans-serif;
            font-size: .75rem;
            font-weight: 600;
            margin-bottom: 12px;
        }

        .hero h1 {
            font-family: 'Poppins', sans-serif;
            font-size: 1.85rem;
            font-weight: 700;
            color: var(--texto-principal);
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .hero p {
            font-family: 'Inter', sans-serif;
            font-size: .95rem;
            color: var(--texto-secundario);
        }

        /* STATS RÁPIDOS */
        .stats-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 34px;
        }

        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--borda-card);
            border-radius: 18px;
            padding: 18px 22px;
            box-shadow: var(--sombra-sm);
            display: flex;
            align-items: center;
            gap: 16px;
            transition: var(--transicao);
        }

        .stat-card:hover {
            box-shadow: var(--sombra-md);
            transform: translateY(-2px);
        }

        .stat-icone {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            background: var(--verde-suave);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
            flex-shrink: 0;
        }

        .stat-info {
            display: flex;
            flex-direction: column;
        }

        .stat-valor {
            font-family: 'Poppins', sans-serif;
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--texto-principal);
            line-height: 1.2;
        }

        .stat-label {
            font-family: 'Inter', sans-serif;
            font-size: .78rem;
            color: var(--texto-secundario);
            margin-top: 3px;
        }

        /* SEÇÃO DE TURMAS HEADER */
        .secao-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 18px;
        }

        .secao-titulo {
            font-family: 'Poppins', sans-serif;
            font-size: 1.15rem;
            font-weight: 700;
            color: var(--texto-principal);
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .badge-contador {
            background: var(--verde-suave);
            color: var(--verde-primario);
            font-size: .75rem;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: var(--raio-pill);
        }

        /* GRID DE TURMAS */
        .turmas-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
            gap: 22px;
        }

        .card-turma {
            background: var(--bg-card);
            border-radius: var(--raio-card);
            border: 1px solid var(--borda-card);
            padding: 24px;
            box-shadow: var(--sombra-card);
            text-decoration: none;
            color: inherit;
            display: flex;
            flex-direction: column;
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
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
            transform: translateY(-4px);
            border-color: rgba(28, 122, 230, 0.4);
        }

        .card-topo {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }

        .icone-turma {
            font-size: 1.8rem;
            width: 46px;
            height: 46px;
            background: var(--verde-suave);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .turno-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 12px;
            border-radius: var(--raio-pill);
            font-family: 'Inter', sans-serif;
            font-size: .75rem;
            font-weight: 600;
        }

        .turno-badge.manha { background: #FFF8E1; color: #E65100; }
        .turno-badge.tarde { background: #E3F2FD; color: #1565C0; }
        .turno-badge.noite { background: #EDE7F6; color: #4527A0; }

        .card-turma h2 {
            font-family: 'Poppins', sans-serif;
            font-size: 1.12rem;
            font-weight: 700;
            color: var(--texto-preto);
            margin-bottom: 6px;
            line-height: 1.3;
        }

        .card-turma .curso {
            font-family: 'Inter', sans-serif;
            font-size: .84rem;
            color: var(--texto-secundario);
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .card-footer {
            margin-top: auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 16px;
            border-top: 1px solid var(--cinza-100);
        }

        .btn-acao-card {
            font-family: 'Poppins', sans-serif;
            font-size: .82rem;
            font-weight: 600;
            color: var(--verde-primario);
            display: flex;
            align-items: center;
            gap: 6px;
            transition: var(--transicao);
        }

        .card-turma:hover .btn-acao-card {
            color: var(--verde-escuro);
        }

        .seta-card {
            transition: transform .2s ease;
        }

        .card-turma:hover .seta-card {
            transform: translateX(4px);
        }

        /* VAZIO: Quando não há turmas vinculadas ao docente */
        .vazio {
            text-align: center;
            padding: 64px 20px;
            color: var(--texto-secundario);
            background: var(--bg-card);
            border-radius: var(--raio-card);
            border: 1px dashed var(--borda-card);
        }
        .vazio-emoji { font-size: 3rem; margin-bottom: 12px; display: block; }
    </style>
</head>
<body>

<!-- TOPBAR: Barra de navegação com logotipo e controle de perfil do instrutor -->
<nav class="topbar">
    <a class="topbar-logo" href="<?= $base ?>/notas/instrutor">🌱 <span>The Farmer</span>Edu</a>
    <div class="topbar-right">
        <!-- Gatilho do menu suspenso do usuário -->
        <div class="topbar-user" id="userMenuBtn" tabindex="0">
            <div class="avatar"><?= strtoupper(substr($usuario['nome'] ?? 'IN', 0, 2)) ?></div>
            <span><?= htmlspecialchars($usuario['nome'] ?? 'Instrutor') ?></span>
            <svg class="seta-user" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            <!-- Dropdown do perfil -->
            <div class="user-dropdown">
                <div class="user-dropdown-header">
                    <strong><?= htmlspecialchars($usuario['nome'] ?? '') ?></strong>
                    <span>👨‍🏫 Instrutor</span>
                </div>
                <div class="user-dropdown-divider"></div>
                <a href="<?= $base ?>/notas/logout" class="item-logout">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    <span>Sair da conta</span>
                </a>
            </div>
        </div>
    </div>
</nav>

<div class="container">

    <!-- HERO: Cabeçalho com identificação do painel docente -->
    <section class="hero">
        <div class="badge-perfil">👨‍🏫 Painel do Instrutor</div>
        <h1>🏫 Centro de Controle de Notas</h1>
        <p>Selecione uma turma para gerenciar notas, submissões e médias dos alunos.</p>
    </section>

    <!-- STATS: Resumo numérico com turmas ativas e data corrente -->
    <?php $totalTurmas = count($turmas); ?>
    <div class="stats-row">
        <!-- Quantidade de turmas sob coordenação do instrutor -->
        <div class="stat-card">
            <div class="stat-icone">🏫</div>
            <div class="stat-info">
                <div class="stat-valor"><?= $totalTurmas ?></div>
                <div class="stat-label"><?= $totalTurmas === 1 ? 'Turma ativa' : 'Turmas ativas' ?></div>
            </div>
        </div>
        <!-- Status do painel de notas -->
        <div class="stat-card">
            <div class="stat-icone">📊</div>
            <div class="stat-info">
                <div class="stat-valor">Avaliação</div>
                <div class="stat-label">Painel sincronizado</div>
            </div>
        </div>
        <!-- Data e dia da semana formatados em português -->
        <div class="stat-card">
            <div class="stat-icone">📅</div>
            <div class="stat-info">
                <div class="stat-valor"><?= date('d/m/Y') ?></div>
                <div class="stat-label"><?php
                    $dias = ['Sunday'=>'Domingo','Monday'=>'Segunda-feira','Tuesday'=>'Terça-feira','Wednesday'=>'Quarta-feira','Thursday'=>'Quinta-feira','Friday'=>'Sexta-feira','Saturday'=>'Sábado'];
                    echo $dias[date('l')] ?? date('D');
                ?></div>
            </div>
        </div>
    </div>

    <!-- SEÇÃO TURMAS: Cabeçalho com contador -->
    <div class="secao-header">
        <h2 class="secao-titulo">
            Suas Turmas
            <span class="badge-contador"><?= $totalTurmas ?></span>
        </h2>
    </div>

    <!-- LISTAGEM DAS TURMAS ATRIBUÍDAS -->
    <?php if (empty($turmas)): ?>
        <!-- Estado vazio exibido quando o instrutor não possui turmas vinculadas -->
        <div class="vazio">
            <span class="vazio-emoji">🌾</span>
            <h3>Nenhuma turma vinculada a você</h3>
            <p>Assim que turmas forem atribuídas à sua conta, elas aparecerão aqui.</p>
        </div>
    <?php else: ?>
        <div class="turmas-grid">
            <?php
            // Ícones ilustrativos alternados para os cards das turmas
            $icones = ['🌱','🚜','🌾','🐄','🌻','🏡'];
            // Rótulos e classes visuais dos turnos letivos
            $turnosLabel = [
                'manha' => ['emoji' => '☀️', 'texto' => 'Manhã',  'cls' => 'manha'],
                'tarde' => ['emoji' => '🌤️', 'texto' => 'Tarde',  'cls' => 'tarde'],
                'noite' => ['emoji' => '🌙', 'texto' => 'Noite',  'cls' => 'noite'],
            ];
            foreach ($turmas as $i => $turma):
                $icone  = $icones[$i % count($icones)];
                $turnoInfo = $turnosLabel[$turma['turno']] ?? ['emoji' => '📅', 'texto' => $turma['turno'], 'cls' => ''];
            ?>
                <!-- Card de link para a turma específica -->
                <a class="card-turma" href="<?= $base ?>/notas/turma?id=<?= (int)$turma['id_turma'] ?>">
                    <div class="card-topo">
                        <div class="icone-turma"><?= $icone ?></div>
                        <span class="turno-badge <?= $turnoInfo['cls'] ?>"><?= $turnoInfo['emoji'] ?> <?= $turnoInfo['texto'] ?></span>
                    </div>
                    <h2><?= htmlspecialchars($turma['nome_turma']) ?></h2>
                    <p class="curso">📘 <?= htmlspecialchars($turma['nome_curso']) ?></p>
                    <div class="card-footer">
                        <span class="btn-acao-card">
                            Ver notas e alunos <span class="seta-card">→</span>
                        </span>
                    </div>
                </a>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

</div>

<!-- SCRIPT: Controle de abertura e fechamento do dropdown de usuário -->
<script>
const userBtn = document.getElementById('userMenuBtn');
if (userBtn) {
    userBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('aberto');
    });
}
// Fecha o dropdown ao clicar em qualquer outra área da página
document.addEventListener('click', function(e) {
    if (userBtn && !userBtn.contains(e.target)) {
        userBtn.classList.remove('aberto');
    }
});
</script>

</body>
</html>
