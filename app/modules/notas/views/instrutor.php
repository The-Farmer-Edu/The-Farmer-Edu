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
    <link rel="stylesheet" href="<?= $base ?>/notas/file?type=css&amp;file=instrutor.css">

</head>
<body>

<?php require_once __DIR__ . '/../../../core/cabecalho.php'; ?>

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
<script src="<?= $base ?>/notas/file?type=js&amp;file=instrutor.js"></script>

</body>
</html>
