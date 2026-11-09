 <?php
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
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minhas Atividades - Google Classroom Style</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Google Sans', Roboto, Arial, sans-serif;
        }

        body {
            background-color: #ffffff;
            color: #3c4043;
        }

        /* Banner Superior (Estilo Header Classroom) */
        .classroom-nav {
            border-bottom: 1px solid #e0e0e0;
            padding: 15px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .class-title h1 {
            font-size: 1.35rem;
            color: #1f1f1f;
            font-weight: 400;
        }

        .class-title p {
            font-size: 0.85rem;
            color: #5f6368;
        }

        /* Container Principal */
        .main-container {
            max-width: 860px;
            margin: 30px auto;
            padding: 0 20px;
        }

        /* Menu de Abas Fictício do Classroom */
        .classroom-tabs {
            display: flex;
            border-bottom: 1px solid #e0e0e0;
            margin-bottom: 30px;
        }

        .tab {
            padding: 15px 24px;
            font-size: 0.9rem;
            font-weight: 500;
            color: #5f6368;
            cursor: pointer;
            text-decoration: none;
        }

        .tab.active {
            color: #1a73e8;
            border-bottom: 3px solid #1a73e8;
        }

        /* Tópicos (Módulos / Categorias) */
        .topic-section {
            margin-bottom: 40px;
        }

        .topic-title {
            font-size: 1.5rem;
            color: #1a73e8;
            font-weight: 400;
            margin-bottom: 15px;
            border-bottom: 1px solid #1a73e8;
            padding-bottom: 8px;
        }

        /* Lista de Atividades */
        .activity-card {
            border: 1px solid #dadce0;
            border-radius: 8px;
            margin-bottom: 12px;
            background: #fff;
            transition: box-shadow 0.2s;
        }

        .activity-card:hover {
            box-shadow: 0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15);
        }

        .activity-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 24px;
            cursor: pointer;
        }

        .activity-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        /* Ícone redondo simulando o Classroom */
        .icon-circle {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #f1f3f4;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1a73e8;
            font-weight: bold;
        }

        .activity-details h3 {
            font-size: 0.95rem;
            font-weight: 500;
            color: #3c4043;
            margin-bottom: 4px;
        }

        .activity-details p {
            font-size: 0.8rem;
            color: #5f6368;
        }

        .activity-right {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
        }

        /* Badges de Status e Notas */
        .grade-text {
            font-size: 1.1rem;
            font-weight: 500;
            color: #1e8e3e; /* Verde padrão Google */
        }

        .status-badge {
            font-size: 0.8rem;
            font-weight: 500;
            padding: 4px 8px;
            border-radius: 4px;
        }

        .status-eval {
            color: #5f6368;
        }

        .status-sent {
            color: #1e8e3e;
            background: #e6f4ea;
        }

        .status-missing {
            color: #d93025;
            background: #fce8e6;
        }
    </style>
</head>
<body>

    <!-- Header do topo -->
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

