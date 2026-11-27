<?php
/**
 * ============================================================================
 * VIEW: ATIVIDADES E NOTAS ESTILO GOOGLE CLASSROOM (Notas.php)
 * ============================================================================
 * Visualização protótipo / conceitual inspirada na interface do Google Classroom.
 * Organiza atividades pedagógicas em blocos temáticos (Tópicos/Categorias) com
 * informações de prazo de entrega, status e notas máximas/obtidas.
 * ============================================================================
 */

// Inicia a sessão
session_start();

// Dados da Turma Atual
$nome_turma = "Desenvolvimento Web - Módulo notas";
$professor = "Prof. Pedro Lucas de Oliveira";

// Histórico de Atividades e Notas (Simulação de Banco de Dados)
$atividades = [
    [
        "titulo" => "Atividade Prática 01: Criação de Estrutura HTML5",
        "data_entrega" => "10 de Mar, 14:00",
        "status" => "Avaliado", // Avaliado, Entregue, Pendente
        "nota_aluno" => 100,
        "nota_maxima" => 100,
        "categoria" => "Trabalhos Práticos"
    ],
    [
        "titulo" => "Desafio CSS Grid: Recriando um Dashboard Responsivo",
        "data_entrega" => "28 de Mar, 23:59",
        "status" => "Avaliado",
        "nota_aluno" => 85,
        "nota_maxima" => 100,
        "categoria" => "Trabalhos Práticos"
    ],
    [
        "titulo" => "Questionário Teórico: Introdução ao PHP Estruturado",
        "data_entrega" => "14 de Abr, 11:30",
        "status" => "Avaliado",
        "nota_aluno" => 9.0,
        "nota_maxima" => 10,
        "categoria" => "Avaliações Oficiais"
    ],
    [
        "titulo" => "Mini-projeto: Sistema de Login com Sessões do PHP",
        "data_entrega" => "02 de Mai, 23:59",
        "status" => "Entregue", // Entregue mas o professor ainda não deu nota
        "nota_aluno" => null,
        "nota_maxima" => 100,
        "categoria" => "Projetos Semestrais"
    ],
    [
        "titulo" => "Exercício de Fixação: Manipulação de Arrays e Loops",
        "data_entrega" => "Amanhã, 18:00",
        "status" => "Pendente", // Ainda não enviado pelo aluno
        "nota_aluno" => null,
        "nota_maxima" => 50,
        "categoria" => "Exercícios Semanais"
    ]
];

// Agrupa as atividades por categoria para imitar os "Tópicos" do Google Classroom
$topicos = [];
foreach ($atividades as $atv) {
    $topicos[$atv['categoria']][] = $atv;
}
$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minhas Atividades - Google Classroom Style</title>
    <link rel="stylesheet" href="<?= $base ?>/notas/file?type=css&amp;file=Notas.css">

</head>
<body>

    <!-- Header do topo: Nome da turma e do professor -->
    <nav class="classroom-nav">
        <div class="class-title">
            <h1><?php echo $nome_turma; ?></h1>
            <p><?php echo $professor; ?></p>
        </div>
    </nav>

    <div class="main-container">
        <!-- Navegação de Abas -->
        <div class="classroom-tabs">
            <a href="#" class="tab active">Atividades e notas</a>
        </div>

        <!-- Loop pelos Tópicos da Disciplina -->
        <?php foreach ($topicos as $nome_topico => $lista_atividades): ?>
            <div class="topic-section">
                <h2 class="topic-title"><?php echo $nome_topico; ?></h2>
                
                <!-- Loop pelas Atividades do Tópico -->
                <?php foreach ($lista_atividades as $atv): ?>
                    <div class="activity-card">
                        <div class="activity-header">
                            <div class="activity-left">
                                <!-- Ícone de prancheta/tarefa -->
                                <div class="icon-circle">📋</div>
                                <div class="activity-details">
                                    <h3><?php echo $atv['titulo']; ?></h3>
                                    <p>Data de entrega: <?php echo $atv['data_entrega']; ?></p>
                                </div>
                            </div>
                            
                            <!-- Exibição de nota ou status de envio -->
                            <div class="activity-right">
                                <?php if ($atv['status'] === 'Avaliado'): ?>
                                    <span class="grade-text"><?php echo $atv['nota_aluno'] . '/' . $atv['nota_maxima']; ?></span>
                                    <span class="status-badge status-eval">Com nota</span>
                                <?php elseif ($atv['status'] === 'Entregue'): ?>
                                    <span class="status-badge status-sent">Devolvido (Pendente de nota)</span>
                                <?php else: ?>
                                    <span class="status-badge status-missing">Pendente</span>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endforeach; ?>
    </div>

</body>
</html>
