<?php

$porAluno = [];

foreach ($submissoes as $sub) {
    $porAluno[$sub['id_aluno']]['nome'] = $sub['nome_aluno'];
    $porAluno[$sub['id_aluno']]['atividades'][] = $sub;
}

// Organiza atividades e registros para a visualização em boletim.
$atividadesUnicas = [];
$notasPorAlunoAtividade = [];

foreach ($submissoes as $sub) {
    $idAluno = (int) $sub['id_aluno'];
    $idAtividade = (int) $sub['id_atividade'];

    $atividadesUnicas[$idAtividade] = [
        'id' => $idAtividade,
        'titulo' => $sub['titulo_atividade'],
        'data_entrega' => $sub['data_entrega'] ?? null,
        'tipo' => $sub['tipo_atividade'] ?? '',
    ];

    $notasPorAlunoAtividade[$idAluno][$idAtividade] = $sub;
}

$atividadesUnicas = array_values($atividadesUnicas);

usort($atividadesUnicas, function ($a, $b) {
    return strcmp(
        $a['data_entrega'] ?? '',
        $b['data_entrega'] ?? ''
    );
});

$msgSucesso = htmlspecialchars($_GET['sucesso'] ?? '');
$msgErro = htmlspecialchars($_GET['erro'] ?? '');

?>

<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Notas: <?= htmlspecialchars($turma['nome_turma'] ?? 'Turma') ?> | The Farmer Edu</title>

    <meta name="description" content="Lançamento de notas da turma no The Farmer Edu.">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">

    <style>
        *,
        *::before,
        *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        :root {
            --verde-primario: #1B5E20;
            --verde-escuro: #089C2F;
            --verde-header: #A0FDA3;
            --verde-suave: #E8F5E9;
            --verde: #1B5E20;
            --verde-claro: #A0FDA3;

            --laranja: #FF8D28;
            --laranja-suave: #FFF3E0;
            --amarelo: #FF8D28;
            --amarelo-claro: #FFF3E0;

            --vermelho: #DC2626;
            --vermelho-claro: #FEE2E2;
            --roxo: #7E22CE;
            --roxo-claro: #F3E8FF;
            --azul: #002D38;
            --azul-claro: #A0FDA3;

            --texto-principal: #002D38;
            --texto-preto: #000000;
            --texto-secundario: #727272;
            --bg-pagina: #F5F7F0;
            --bg-card: #FFFFFF;
            --borda-card: #E6E6E6;
            --cinza-50: #F5F7F0;
            --cinza-100: #E6E6E6;
            --cinza-200: #D9D9D9;
            --cinza-400: #727272;
            --cinza-600: #727272;
            --cinza-800: #002D38;
            --cinza-900: #002D38;

            --sombra-card: 0px 4px 4px rgba(0, 0, 0, 0.25);
            --sombra-header: 0px 4px 3px rgba(248, 96, 17, 0.5);
            --sombra-sm: 0px 2px 4px rgba(0, 0, 0, 0.08);
            --sombra-md: 0px 4px 4px rgba(0, 0, 0, 0.25);

            --raio-card: 25px;
            --raio-pill: 20px;
            --raio-icone: 10px;
            --raio: 25px;
            --transicao: all .2s ease;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-pagina);
            color: var(--texto-principal);
            min-height: 100vh;
        }

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

        .container {
            max-width: 980px;
            margin: 0 auto;
            padding: 28px 20px 60px;
        }

        .breadcrumb {
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Inter', sans-serif;
            font-size: .85rem;
            color: var(--texto-secundario);
            margin-bottom: 20px;
        }

        .breadcrumb a {
            color: var(--verde-primario);
            font-weight: 500;
            text-decoration: none;
        }

        .breadcrumb a:hover {
            text-decoration: underline;
        }

        .page-header {
            margin-bottom: 24px;
        }

        .page-header h1 {
            font-family: 'Poppins', sans-serif;
            font-size: 1.6rem;
            font-weight: 700;
            color: var(--texto-principal);
            margin-bottom: 4px;
        }

        .page-header p {
            font-family: 'Inter', sans-serif;
            font-size: .92rem;
            color: var(--texto-secundario);
        }

        .alerta {
            padding: 12px 16px;
            border-radius: var(--raio-icone);
            font-family: 'Inter', sans-serif;
            font-size: .875rem;
            font-weight: 500;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .alerta-sucesso {
            background: var(--verde-suave);
            color: var(--verde-primario);
            border: 1px solid #bbf7d0;
        }

        .alerta-erro {
            background: var(--vermelho-claro);
            color: var(--vermelho);
            border: 1px solid #fecaca;
        }

        .filtro-bar {
            background: var(--bg-card);
            border: 1px solid var(--borda-card);
            border-radius: var(--raio-icone);
            padding: 14px 18px;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
            box-shadow: var(--sombra-card);
        }

        .filtro-bar input {
            flex: 1;
            border: none;
            outline: none;
            font-size: .9rem;
            font-family: 'Inter', sans-serif;
            color: var(--texto-principal);
            background: transparent;
        }

        .filtro-bar input::placeholder {
            color: var(--texto-secundario);
        }

        .aluno-secao {
            margin-bottom: 28px;
        }

        .aluno-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 14px;
            padding: 14px 20px;
            background: var(--bg-card);
            border-radius: var(--raio-card);
            border: 1px solid var(--borda-card);
            box-shadow: var(--sombra-card);
            cursor: pointer;
            user-select: none;
        }

        .aluno-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--verde-primario), #4ADE80);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Poppins', sans-serif;
            font-weight: 700;
            color: white;
            font-size: .9rem;
            flex-shrink: 0;
        }

        .aluno-nome {
            font-family: 'Poppins', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            color: var(--texto-principal);
        }

        .aluno-media {
            margin-left: auto;
            font-family: 'Inter', sans-serif;
            font-size: .85rem;
            color: var(--texto-secundario);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .aluno-media strong {
            font-family: 'Poppins', sans-serif;
            color: var(--texto-principal);
        }

        .chevron-icon {
            transition: transform 0.3s ease;
            color: var(--texto-secundario);
            transform: rotate(180deg);
        }

        .aluno-secao.fechado .chevron-icon {
            transform: rotate(0deg);
        }

        .substatus-prazo {
            font-size: 0.72rem;
            color: var(--verde-primario);
            margin-top: 3px;
            font-weight: 500;
        }

        .substatus-atraso {
            font-size: 0.72rem;
            color: var(--vermelho);
            margin-top: 3px;
            font-weight: 500;
        }

        .tabela-wrap {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: var(--bg-card);
            border-radius: var(--raio-card);
            overflow: hidden;
            box-shadow: var(--sombra-card);
            border: 1px solid var(--borda-card);
        }

        thead {
            background: var(--verde-suave);
        }

        thead th {
            padding: 12px 16px;
            text-align: left;
            font-family: 'Poppins', sans-serif;
            font-size: .78rem;
            font-weight: 600;
            color: var(--texto-principal);
            text-transform: uppercase;
            letter-spacing: .04em;
        }

        tbody tr {
            border-top: 1px solid var(--borda-card);
            transition: background .15s;
        }

        tbody tr:hover {
            background: rgba(160, 253, 163, 0.12);
        }

        tbody td {
            padding: 14px 16px;
            font-family: 'Inter', sans-serif;
            font-size: .875rem;
            vertical-align: middle;
            color: var(--texto-principal);
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 10px;
            border-radius: var(--raio-pill);
            font-family: 'Inter', sans-serif;
            font-size: .73rem;
            font-weight: 600;
            white-space: nowrap;
        }

        .badge-enviado {
            background: #E0F2FE;
            color: #0284C7;
        }

        .badge-corrigido {
            background: var(--verde-suave);
            color: var(--verde-primario);
        }

        .badge-pendente {
            background: var(--laranja-suave);
            color: var(--laranja);
        }

        .badge-ia {
            background: var(--roxo-claro);
            color: var(--roxo);
        }

        .tipo-chip {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 6px;
            font-family: 'Inter', sans-serif;
            font-size: .72rem;
            font-weight: 600;
            background: var(--cinza-100);
            color: var(--cinza-600);
        }

        .tipo-codigo {
            background: var(--laranja-suave);
            color: var(--laranja);
        }

        .tipo-quiz {
            background: var(--verde-suave);
            color: var(--verde-primario);
        }

        .tipo-texto {
            background: #E0F2FE;
            color: #0284C7;
        }

        .nota-atual {
            font-family: 'Poppins', sans-serif;
            font-weight: 700;
            font-size: 1rem;
        }

        .nota-10 {
            color: var(--verde-primario);
        }

        .nota-boa {
            color: var(--verde-escuro);
        }

        .nota-ok {
            color: var(--laranja);
        }

        .nota-ruim {
            color: var(--vermelho);
        }

        .form-nota {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .input-nota {
            width: 72px;
            padding: 7px 10px;
            border: 2px solid var(--borda-card);
            border-radius: 8px;
            font-size: .875rem;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            color: var(--texto-principal);
            text-align: center;
            transition: var(--transicao);
            outline: none;
            background: var(--bg-card);
        }

        .input-nota:focus {
            border-color: var(--verde-primario);
            box-shadow: 0 0 0 3px rgba(27, 94, 32, 0.15);
        }

        .btn-salvar {
            padding: 7px 14px;
            background: var(--verde-primario);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: .82rem;
            font-weight: 600;
            cursor: pointer;
            font-family: 'Poppins', sans-serif;
            transition: var(--transicao);
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .btn-salvar:hover {
            background: var(--verde-escuro);
        }

        .btn-salvar:disabled {
            opacity: .6;
            cursor: not-allowed;
        }

        .sem-envio {
            color: var(--texto-secundario);
            font-size: .82rem;
            font-style: italic;
        }

        #toast {
            position: fixed;
            bottom: 28px;
            right: 28px;
            padding: 14px 20px;
            border-radius: 10px;
            font-family: 'Inter', sans-serif;
            font-size: .875rem;
            font-weight: 600;
            color: white;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
            z-index: 999;
            display: none;
            align-items: center;
            gap: 8px;
            animation: fadeIn .3s ease;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(8px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .toast-ok {
            background: var(--verde);
        }

        .toast-err {
            background: var(--vermelho);
        }

        .vazio {
            text-align: center;
            padding: 60px 20px;
            color: var(--texto-secundario);
            font-family: 'Inter', sans-serif;
        }

        @media (max-width: 680px) {
            .form-nota {
                flex-direction: column;
                align-items: flex-start;
            }
        }

        /* Alternância entre as visualizações */
        .visualizacao-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 18px;
            flex-wrap: wrap;
        }

        .visualizacao-tabs button {
            border: 1px solid var(--borda-card);
            background: var(--bg-card);
            color: var(--texto-principal);
            border-radius: 20px;
            padding: 10px 18px;
            font-family: 'Inter', sans-serif;
            font-size: .875rem;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transicao);
        }

        .visualizacao-tabs button:hover,
        .visualizacao-tabs button.ativo {
            background: var(--verde-suave);
            border-color: var(--verde-primario);
            color: var(--verde-primario);
        }

        .boletim-wrap {
            width: 100%;
            overflow: auto;
            background: var(--bg-card);
            border: 1px solid var(--borda-card);
            border-radius: 14px;
            box-shadow: var(--sombra-card);
        }

        .tabela-boletim {
            width: max-content;
            min-width: 100%;
            border-collapse: separate;
            border-spacing: 0;
        }

        .tabela-boletim th,
        .tabela-boletim td {
            padding: 14px;
            border-right: 1px solid var(--borda-card);
            border-bottom: 1px solid var(--borda-card);
            text-align: center;
            min-width: 125px;
            font-size: .82rem;
        }

        .tabela-boletim thead th {
            background: var(--verde-suave);
            vertical-align: bottom;
            height: 100px;
        }

        .tabela-boletim .coluna-aluno {
            position: sticky;
            left: 0;
            z-index: 2;
            min-width: 220px;
            max-width: 260px;
            text-align: left;
            background: #fff;
        }

        .tabela-boletim thead .coluna-aluno {
            z-index: 3;
            background: var(--verde-suave);
        }

        .tabela-boletim .nome-atividade {
            display: block;
            max-width: 150px;
            white-space: normal;
            overflow-wrap: anywhere;
            text-transform: none;
            letter-spacing: normal;
            line-height: 1.4;
        }

        .tabela-boletim .prazo-atividade {
            display: block;
            margin-top: 7px;
            font-size: .72rem;
            font-weight: 400;
            color: var(--texto-secundario);
            text-transform: none;
            letter-spacing: normal;
        }

        .tabela-boletim tbody tr:hover td,
        .tabela-boletim tbody tr:hover .coluna-aluno {
            background-color: #f5fbf5;
        }

        .nota-boletim {
            display: block;
            font-size: 1rem;
            font-weight: 700;
            color: var(--verde-primario);
        }

        .status-boletim {
            display: block;
            margin-top: 5px;
            font-size: .7rem;
            color: var(--texto-secundario);
        }

        .status-boletim.pendente {
            color: var(--laranja);
        }

        .status-boletim.atraso {
            color: var(--vermelho);
        }

        .sem-nota-boletim {
            color: var(--texto-secundario);
        }

        @media (max-width: 680px) {
            .tabela-boletim .coluna-aluno {
                min-width: 165px;
            }

            .tabela-boletim th,
            .tabela-boletim td {
                padding: 10px;
                min-width: 110px;
            }
        }
    </style>,
    
</head>

<body>

    <nav class="topbar">
        <a class="topbar-logo" href="/">🌱 <span>The Farmer</span>Edu</a>

        <div class="topbar-user">
            <div class="avatar">
                <?= strtoupper(substr($usuario['nome'], 0, 2)) ?>
            </div>

            <span><?= htmlspecialchars($usuario['nome']) ?></span>
        </div>
    </nav>

    <div class="container">

        <nav class="breadcrumb" aria-label="Navegação">
            <a href="/notas/instrutor">Centro de Notas</a>
            <span>›</span>
            <span><?= htmlspecialchars($turma['nome_turma'] ?? 'Turma') ?></span>
        </nav>

        <header class="page-header">
            <h1>📊 <?= htmlspecialchars($turma['nome_turma'] ?? 'Turma') ?></h1>

            <p>
                <?= htmlspecialchars($turma['nome_curso'] ?? '') ?>

                <?php if (!empty($turma['turno'])): ?>
                    &nbsp;·&nbsp;

                    <?php
                    $turnos = [
                        'manha' => '☀️ Manhã',
                        'tarde' => '🌤️ Tarde',
                        'noite' => '🌙 Noite'
                    ];

                    echo $turnos[$turma['turno']] ?? $turma['turno'];
                    ?>
                <?php endif; ?>
            </p>
        </header>

        <?php if ($msgSucesso): ?>
            <div class="alerta alerta-sucesso" role="alert">
                ✅ <?= $msgSucesso ?>
            </div>
        <?php endif; ?>

        <?php if ($msgErro): ?>
            <div class="alerta alerta-erro" role="alert">
                ❌ <?= $msgErro ?>
            </div>
        <?php endif; ?>

        <div class="filtro-bar">
            <span>🔍</span>

            <input
                type="text"
                id="filtro-aluno"
                placeholder="Buscar aluno pelo nome..."
                oninput="filtrarAlunos(this.value)"
                aria-label="Filtrar alunos"
            >
        </div>

        <div class="visualizacao-tabs" role="group" aria-label="Modo de visualização das notas">
            <button
                type="button"
                id="btn-por-aluno"
                class="ativo"
                aria-pressed="true"
                onclick="alternarVisualizacao('aluno')"
            >
                👤 Por aluno
            </button>

            <button
                type="button"
                id="btn-boletim"
                aria-pressed="false"
                onclick="alternarVisualizacao('boletim')"
            >
                📊 Boletim de notas
            </button>
        </div>

        <div id="view-aluno">

            <?php if (empty($porAluno)): ?>

                <div class="vazio">
                    <p style="font-size:3rem">🌾</p>
                    <p>Nenhum aluno ou atividade encontrado nesta turma.</p>
                </div>

            <?php else: ?>

                <?php foreach ($porAluno as $idAluno => $dados): ?>

                    <?php
                    $nome = $dados['nome'];
                    $atvs = $dados['atividades'];

                    $notas = array_filter(
                        array_column($atvs, 'nota_valor'),
                        fn($v) => $v !== null
                    );

                    $mediaAluno = count($notas) > 0
                        ? array_sum($notas) / count($notas)
                        : null;
                    ?>

                    <div
                        class="aluno-secao"
                        data-nome="<?= htmlspecialchars(strtolower($nome)) ?>"
                    >

                        <div class="aluno-header" onclick="toggleAluno(this)">

                            <div class="aluno-avatar">
                                <?= strtoupper(substr($nome, 0, 2)) ?>
                            </div>

                            <span class="aluno-nome">
                                <?= htmlspecialchars($nome) ?>
                            </span>

                            <div class="aluno-media">
                                Média:

                                <strong>
                                    <?php if ($mediaAluno !== null): ?>
                                        <?= number_format($mediaAluno, 1, ',', '') ?> / 10
                                    <?php else: ?>
                                        —
                                    <?php endif; ?>
                                </strong>

                                <svg
                                    class="chevron-icon"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>

                        </div>

                        <div class="tabela-wrap">

                            <table aria-label="Atividades de <?= htmlspecialchars($nome) ?>">

                                <thead>
                                    <tr>
                                        <th>Atividade</th>
                                        <th>Tipo</th>
                                        <th>Prazo</th>
                                        <th>Status</th>
                                        <th>Nota atual</th>
                                        <th>Lançar nota</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    <?php foreach ($atvs as $atv): ?>

                                        <?php
                                        $idSub = $atv['id_submissao'] ?? null;
                                        $notaVal = $atv['nota_valor'] ?? null;
                                        $status = $atv['status_submissao'] ?? null;
                                        $origem = $atv['origem_nota'] ?? null;
                                        $tipo = $atv['tipo_atividade'] ?? '';
                                        $idAtv = (int) $atv['id_atividade'];

                                        $notaFmt = $notaVal !== null
                                            ? number_format((float) $notaVal, 1, ',', '')
                                            : null;

                                        $classNota = '';

                                        if ($notaVal !== null) {
                                            if ($notaVal == 10) {
                                                $classNota = 'nota-10';
                                            } elseif ($notaVal >= 7) {
                                                $classNota = 'nota-boa';
                                            } elseif ($notaVal >= 5) {
                                                $classNota = 'nota-ok';
                                            } else {
                                                $classNota = 'nota-ruim';
                                            }
                                        }

                                        $dataEntrega = strtotime($atv['data_entrega'] ?? '');
                                        $dataEnvio = !empty($atv['data_envio'])
                                            ? strtotime($atv['data_envio'])
                                            : null;

                                        $comAtraso = $dataEnvio && $dataEntrega
                                            && $dataEnvio > $dataEntrega;
                                        ?>

                                        <tr>

                                            <td>
                                                <?= htmlspecialchars($atv['titulo_atividade']) ?>
                                            </td>

                                            <td>
                                                <?php
                                                $tiposLabel = [
                                                    'codigo' => '💻 Código',
                                                    'quiz' => '📝 Quiz',
                                                    'texto' => '📄 Texto'
                                                ];
                                                ?>

                                                <span class="tipo-chip tipo-<?= htmlspecialchars($tipo) ?>">
                                                    <?= $tiposLabel[$tipo] ?? ucfirst($tipo) ?>
                                                </span>
                                            </td>

                                            <td>
                                                <?= !empty($atv['data_entrega'])
                                                    ? date('d/m/Y', strtotime($atv['data_entrega']))
                                                    : 'Sem prazo' ?>
                                            </td>

                                            <td>
                                                <?php if ($status === 'corrigida'): ?>

                                                    <span class="badge badge-corrigido">
                                                        ✔ Corrigida
                                                    </span>

                                                <?php elseif ($status === 'enviada' || $status === 'processando'): ?>

                                                    <span class="badge badge-enviado">
                                                        📤 Enviada
                                                    </span>

                                                <?php else: ?>

                                                    <span class="badge badge-pendente">
                                                        ⚠ Pendente
                                                    </span>

                                                <?php endif; ?>

                                                <?php if ($comAtraso): ?>

                                                    <div class="substatus-atraso">
                                                        Concluída com atraso
                                                    </div>

                                                <?php elseif ($status === 'corrigida' || $status === 'enviada'): ?>

                                                    <div class="substatus-prazo">
                                                        Concluída no prazo
                                                    </div>

                                                <?php endif; ?>
                                            </td>

                                            <td>
                                                <?php if ($notaFmt !== null): ?>

                                                    <span class="nota-atual <?= $classNota ?>">
                                                        <?= $notaFmt ?>
                                                    </span>

                                                    <?php if ($origem === 'ia'): ?>
                                                        <span class="badge badge-ia" style="margin-left:6px">
                                                            🤖 IA
                                                        </span>
                                                    <?php endif; ?>

                                                <?php else: ?>

                                                    <span class="sem-envio">—</span>

                                                <?php endif; ?>
                                            </td>

                                            <td>
                                                <?php if ($idSub): ?>

                                                    <form
                                                        class="form-nota"
                                                        onsubmit="lancarNota(event, this)"
                                                        data-submissao="<?= (int) $idSub ?>"
                                                        data-turma="<?= (int) ($turma['id_turma'] ?? 0) ?>"
                                                    >

                                                        <input
                                                            id="nota-<?= (int) $idSub ?>"
                                                            class="input-nota"
                                                            type="number"
                                                            name="valor"
                                                            min="0"
                                                            max="10"
                                                            step="0.1"
                                                            placeholder="0–10"
                                                            value="<?= $notaVal !== null ? (float) $notaVal : '' ?>"
                                                            required
                                                            aria-label="Nota para <?= htmlspecialchars($atv['titulo_atividade']) ?>"
                                                        >

                                                        <button class="btn-salvar" type="submit">
                                                            💾 Salvar
                                                        </button>

                                                    </form>

                                                <?php else: ?>

                                                    <span class="sem-envio">Sem envio</span>

                                                <?php endif; ?>
                                            </td>

                                        </tr>

                                    <?php endforeach; ?>

                                </tbody>
                            </table>

                        </div>

                    </div>

                <?php endforeach; ?>

            <?php endif; ?>

        </div><!-- Fim da visualização por aluno -->

        <!-- Visualização em formato de boletim -->
        <div id="view-boletim" style="display:none;">

            <?php if (empty($porAluno) || empty($atividadesUnicas)): ?>

                <div class="vazio">
                    <p style="font-size:3rem;">📊</p>
                    <p>Não há dados suficientes para montar o boletim.</p>
                </div>

            <?php else: ?>

                <div class="boletim-wrap">

                    <table class="tabela-boletim" aria-label="Boletim de notas da turma">

                        <thead>
                            <tr>
                                <th class="coluna-aluno">Aluno</th>

                                <?php foreach ($atividadesUnicas as $atividade): ?>

                                    <th>
                                        <span class="nome-atividade">
                                            <?= htmlspecialchars($atividade['titulo'], ENT_QUOTES, 'UTF-8') ?>
                                        </span>

                                        <span class="prazo-atividade">
                                            <?php
                                            $prazo = $atividade['data_entrega'] ?? null;

                                            echo $prazo
                                                ? date('d/m/Y', strtotime($prazo))
                                                : 'Sem prazo';
                                            ?>
                                        </span>
                                    </th>

                                <?php endforeach; ?>

                                <th>Média</th>
                            </tr>
                        </thead>

                        <tbody>

                            <?php foreach ($porAluno as $idAluno => $dados): ?>

                                <?php
                                $nomeAluno = $dados['nome'];
                                $notasValidas = [];

                                foreach ($dados['atividades'] as $atividadeAluno) {
                                    if (
                                        isset($atividadeAluno['nota_valor']) &&
                                        $atividadeAluno['nota_valor'] !== null &&
                                        $atividadeAluno['nota_valor'] !== ''
                                    ) {
                                        $notasValidas[] = (float) $atividadeAluno['nota_valor'];
                                    }
                                }

                                $media = count($notasValidas)
                                    ? array_sum($notasValidas) / count($notasValidas)
                                    : null;
                                ?>

                                <tr
                                    class="linha-boletim"
                                    data-nome="<?= htmlspecialchars(mb_strtolower($nomeAluno, 'UTF-8'), ENT_QUOTES, 'UTF-8') ?>"
                                >

                                    <td class="coluna-aluno">
                                        <strong>
                                            <?= htmlspecialchars($nomeAluno, ENT_QUOTES, 'UTF-8') ?>
                                        </strong>
                                    </td>

                                    <?php foreach ($atividadesUnicas as $atividade): ?>

                                        <?php
                                        $idAtividade = $atividade['id'];

                                        $registro = $notasPorAlunoAtividade[$idAluno][$idAtividade] ?? null;
                                        ?>

                                        <td>

                                            <?php if ($registro === null): ?>

                                                <span class="sem-nota-boletim">—</span>

                                            <?php else: ?>

                                                <?php
                                                $nota = $registro['nota_valor'] ?? null;
                                                $status = $registro['status_submissao'] ?? null;

                                                $dataEntrega = !empty($registro['data_entrega'])
                                                    ? strtotime($registro['data_entrega'])
                                                    : false;

                                                $dataEnvio = !empty($registro['data_envio'])
                                                    ? strtotime($registro['data_envio'])
                                                    : false;

                                                $atrasado = $dataEntrega &&
                                                    $dataEnvio &&
                                                    $dataEnvio > $dataEntrega;
                                                ?>

                                                <?php if ($nota !== null && $nota !== ''): ?>

                                                    <span class="nota-boletim">
                                                        <?= number_format((float) $nota, 1, ',', '') ?>
                                                    </span>

                                                <?php else: ?>

                                                    <span class="sem-nota-boletim">—</span>

                                                <?php endif; ?>

                                                <span class="status-boletim <?= $atrasado ? 'atraso' : (($status === 'corrigida') ? '' : 'pendente') ?>">
                                                    <?php
                                                    if ($atrasado) {
                                                        echo 'Atrasada';
                                                    } elseif ($status === 'corrigida') {
                                                        echo 'Corrigida';
                                                    } elseif ($status === 'enviada' || $status === 'processando') {
                                                        echo 'Entregue';
                                                    } else {
                                                        echo 'Pendente';
                                                    }
                                                    ?>
                                                </span>

                                            <?php endif; ?>

                                        </td>

                                    <?php endforeach; ?>

                                    <td>
                                        <?php if ($media !== null): ?>

                                            <strong>
                                                <?= number_format($media, 1, ',', '') ?>
                                            </strong>

                                            <span class="status-boletim">de 10</span>

                                        <?php else: ?>

                                            <span class="sem-nota-boletim">—</span>

                                        <?php endif; ?>
                                    </td>

                                </tr>

                            <?php endforeach; ?>

                        </tbody>
                    </table>

                </div>

                <p style="margin-top:12px;color:var(--texto-secundario);font-size:.8rem;">
                    💡 Deslize a tabela horizontalmente para consultar todas as atividades.
                    Para lançar ou editar notas, utilize a visualização “Por aluno”.
                </p>

            <?php endif; ?>

        </div><!-- Fim da visualização em boletim -->

    </div>

    <div id="toast" role="status" aria-live="polite"></div>

    <script>
        function toggleAluno(headerElement) {
            const secao = headerElement.closest('.aluno-secao');
            const tabela = secao.querySelector('.tabela-wrap');

            secao.classList.toggle('fechado');

            if (tabela.style.display === 'none') {
                tabela.style.display = 'block';
            } else {
                tabela.style.display = 'none';
            }
        }

        function alternarVisualizacao(modo) {
            const viewAluno = document.getElementById('view-aluno');
            const viewBoletim = document.getElementById('view-boletim');

            const btnAluno = document.getElementById('btn-por-aluno');
            const btnBoletim = document.getElementById('btn-boletim');

            const mostrarAluno = modo === 'aluno';

            viewAluno.style.display = mostrarAluno ? 'block' : 'none';
            viewBoletim.style.display = mostrarAluno ? 'none' : 'block';

            btnAluno.classList.toggle('ativo', mostrarAluno);
            btnBoletim.classList.toggle('ativo', !mostrarAluno);

            btnAluno.setAttribute('aria-pressed', String(mostrarAluno));
            btnBoletim.setAttribute('aria-pressed', String(!mostrarAluno));

            filtrarAlunos(document.getElementById('filtro-aluno').value);
        }

        function filtrarAlunos(termo) {
            const busca = termo.trim().toLocaleLowerCase('pt-BR');

            document.querySelectorAll('.aluno-secao').forEach(secao => {
                const nome = secao.dataset.nome || '';

                secao.style.display =
                    (!busca || nome.includes(busca)) ? '' : 'none';
            });

            document.querySelectorAll('.linha-boletim').forEach(linha => {
                const nome = linha.dataset.nome || '';

                linha.style.display =
                    (!busca || nome.includes(busca)) ? '' : 'none';
            });
        }

        function lancarNota(event, form) {
            event.preventDefault();

            const idSubmissao = form.dataset.submissao;
            const idTurma = form.dataset.turma;
            const inputNota = form.querySelector('input[name="valor"]');
            const btn = form.querySelector('button');
            const valor = parseFloat(inputNota.value);

            if (isNaN(valor) || valor < 0 || valor > 10) {
                mostrarToast('⚠ Nota deve ser entre 0 e 10.', false);
                return;
            }

            btn.disabled = true;
            btn.textContent = '⏳ Salvando...';

            const body = new URLSearchParams({
                id_submissao: idSubmissao,
                valor: valor,
                id_turma: idTurma
            });

            fetch('/notas/salvar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: body.toString()
            })
            .then(res => res.json())
            .then(data => {
                if (data.sucesso) {
                    mostrarToast('✅ ' + data.mensagem, true);

                    const tr = form.closest('tr');
                    const tdNota = tr.querySelector('td:nth-child(5)');

                    if (tdNota) {
                        const notaFmt = valor.toFixed(1).replace('.', ',');
                        let classe = 'nota-ruim';

                        if (valor == 10) {
                            classe = 'nota-10';
                        } else if (valor >= 7) {
                            classe = 'nota-boa';
                        } else if (valor >= 5) {
                            classe = 'nota-ok';
                        }

                        tdNota.innerHTML =
                            `<span class="nota-atual ${classe}">${notaFmt}</span>`;
                    }

                    const tdStatus = tr.querySelector('td:nth-child(4)');

                    if (tdStatus) {
                        tdStatus.innerHTML =
                            '<span class="badge badge-corrigido">✔ Corrigida</span>';
                    }

                    // Atualiza a nota correspondente no boletim sem recarregar.
                    const linhaAluno = form.closest('.aluno-secao');
                    const idAtividade = <?= json_encode(array_column($submissoes, 'id_atividade', 'id_submissao')) ?>[idSubmissao];

                    if (linhaAluno && idAtividade) {
                        const idAluno = Object.keys(<?= json_encode(array_column($submissoes, 'id_aluno', 'id_submissao')) ?>)
                            .find(id => String(id) === String(idSubmissao));

                        const nomeAluno = linhaAluno.dataset.nome;

                        const linhasBoletim = document.querySelectorAll('.linha-boletim');

                        linhasBoletim.forEach(linha => {
                            if (linha.dataset.nome === nomeAluno) {
                                const cabecalhos = Array.from(
                                    document.querySelectorAll('.tabela-boletim thead th')
                                );

                                const coluna = cabecalhos.findIndex(th =>
                                    th.textContent.trim().startsWith(
                                        tr.querySelector('td:first-child').textContent.trim()
                                    )
                                );

                                if (coluna >= 0) {
                                    const celula = linha.cells[coluna];
                                    if (celula) {
                                        celula.innerHTML =
                                            `<span class="nota-boletim">${notaFmt}</span>
                                             <span class="status-boletim">Corrigida</span>`;
                                    }
                                }
                            }
                        });
                    }

                    recalcularMedia(form);
                } else {
                    mostrarToast('❌ ' + data.mensagem, false);
                }
            })
            .catch(() => {
                mostrarToast('❌ Erro de conexão. Tente novamente.', false);
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = '💾 Salvar';
            });
        }

        function recalcularMedia(formElement) {
            const secao = formElement.closest('.aluno-secao');

            if (!secao) {
                return;
            }

            const inputs = secao.querySelectorAll('input.input-nota');
            const valores = [];

            inputs.forEach(inp => {
                const v = parseFloat(inp.value);

                if (!isNaN(v)) {
                    valores.push(v);
                }
            });

            if (valores.length === 0) {
                return;
            }

            const media = valores.reduce((a, b) => a + b, 0) / valores.length;
            const mediaFmt = media.toFixed(1).replace('.', ',');

            const mediaSpan = secao.querySelector('.aluno-media strong');

            if (mediaSpan) {
                mediaSpan.textContent = mediaFmt + ' / 10';
            }

            // Atualiza também a média mostrada no boletim.
            const linhaBoletim = Array.from(
                document.querySelectorAll('.linha-boletim')
            ).find(linha => linha.dataset.nome === secao.dataset.nome);

            if (linhaBoletim) {
                const celulaMedia = linhaBoletim.cells[linhaBoletim.cells.length - 1];

                if (celulaMedia) {
                    celulaMedia.innerHTML =
                        `<strong>${mediaFmt}</strong>
                         <span class="status-boletim">de 10</span>`;
                }
            }
        }

        function mostrarToast(msg, sucesso) {
            const toast = document.getElementById('toast');

            toast.textContent = msg;
            toast.className = sucesso ? 'toast-ok' : 'toast-err';
            toast.style.display = 'flex';

            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }
    </script>

</body>
</html>