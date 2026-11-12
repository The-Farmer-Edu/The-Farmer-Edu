<?php
/**
 * ============================================================================
 * VIEW: DETALHES DA TURMA E GESTÃO DE NOTAS (turma.php)
 * ============================================================================
 * Painel completo para o instrutor visualizar, filtrar e lançar notas de uma turma.
 * É renderizada por NotasController::verTurma().
 *
 * Funcionalidades principais:
 * - 3 modos de visualização via abas: "Por aluno", "Boletim de notas" e "Por atividades".
 * - Lançamento e atualização de notas via AJAX/fetch com recálculo em tempo real da média.
 * - Filtro dinâmico de busca por nome de aluno ou título de atividade.
 * - Indicação de pontualidade na entrega (no prazo vs com atraso).
 *
 * Variáveis recebidas:
 * - $usuario    : Array com dados do instrutor logado.
 * - $turma      : Array com dados cadastrais da turma (id_turma, nome_turma, turno, nome_curso).
 * - $submissoes : Array de submissões de todos os alunos da turma.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// ESTRUTURAÇÃO DE DADOS PARA AS TRÊS VISUALIZAÇÕES
// ----------------------------------------------------------------------------

// 1. Agrupamento de submissões por Aluno (usado na aba "Por aluno")
$porAluno = [];

foreach ($submissoes as $sub) {
    $porAluno[$sub['id_aluno']]['nome'] = $sub['nome_aluno'];
    $porAluno[$sub['id_aluno']]['atividades'][] = $sub;
}

// 2. Agrupamento de submissões por Atividade (usado na aba "Por atividades")
$porAtividade = [];
foreach ($submissoes as $sub) {
    $idAtv = (int) $sub['id_atividade'];
    if (!isset($porAtividade[$idAtv])) {
        $porAtividade[$idAtv] = [
            'titulo' => $sub['titulo_atividade'],
            'tipo' => $sub['tipo_atividade'] ?? '',
            'data_entrega' => $sub['data_entrega'] ?? null,
            'submissoes' => []
        ];
    }
    $porAtividade[$idAtv]['submissoes'][] = $sub;
}

// 3. Estruturação matricial para o Boletim (usado na aba "Boletim de notas")
$atividadesUnicas = [];
$notasPorAlunoAtividade = [];

foreach ($submissoes as $sub) {
    $idAluno = (int) $sub['id_aluno'];
    $idAtividade = (int) $sub['id_atividade'];

    // Mapeia colunas de atividades únicas
    $atividadesUnicas[$idAtividade] = [
        'id' => $idAtividade,
        'titulo' => $sub['titulo_atividade'],
        'data_entrega' => $sub['data_entrega'] ?? null,
        'tipo' => $sub['tipo_atividade'] ?? '',
    ];

    // Matriz de submissões indexada por aluno e atividade
    $notasPorAlunoAtividade[$idAluno][$idAtividade] = $sub;
}

$atividadesUnicas = array_values($atividadesUnicas);

// Ordena atividades do boletim cronologicamente por prazo de entrega
usort($atividadesUnicas, function ($a, $b) {
    return strcmp(
        $a['data_entrega'] ?? '',
        $b['data_entrega'] ?? ''
    );
});

// Mensagens flash de retorno (sucesso ou erro)
$msgSucesso = htmlspecialchars($_GET['sucesso'] ?? '');
$msgErro    = htmlspecialchars($_GET['erro']    ?? '');
// Caminho base para resolução de links
$base       = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
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
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            /* Perfil Instrutor (Azul) - Guia de Design */
            --verde-primario:   #0B57A8;
            --verde-escuro:     #1C7AE6;
            --verde-header:     #D9EEFF;
            --verde-suave:      #EAF5FF;
            --verde:            #0B57A8;
            --verde-claro:      #D9EEFF;

            --laranja:          #FF8D28;
            --laranja-suave:    #FFF3E0;
            --amarelo:          #FF8D28;
            --amarelo-claro:    #FFF3E0;

            --vermelho:         #DC2626;
            --vermelho-claro:   #FEE2E2;
            --roxo:             #7E22CE;
            --roxo-claro:       #F3E8FF;
            --azul:             #002D38;
            --azul-claro:       #D9EEFF;

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

            --sombra-card:      0px 4px 4px rgba(0, 0, 0, 0.25);
            --sombra-header:    0px 4px 3px rgba(248, 96, 17, 0.5);
            --sombra-sm:        0px 2px 4px rgba(0, 0, 0, 0.08);
            --sombra-md:        0px 4px 4px rgba(0, 0, 0, 0.25);

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

        .container {
            max-width: 980px;
            margin: 0 auto;
            padding: 28px 20px 60px;
        }

        /* ---- BREADCRUMB / BOTÃO VOLTAR ---- */
        .nav-topo {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 22px;
            flex-wrap: wrap;
            gap: 10px;
        }

        .breadcrumb {
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Inter', sans-serif;
            font-size: .85rem;
            color: var(--texto-secundario);
        }

        .breadcrumb a {
            color: var(--verde-primario);
            font-weight: 500;
            text-decoration: none;
        }

        .breadcrumb a:hover { text-decoration: underline; }

        .btn-voltar {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 9px 18px;
            background: var(--bg-card);
            color: var(--verde-primario);
            border: 1.5px solid rgba(11, 87, 168, 0.35);
            border-radius: var(--raio-pill);
            font-family: 'Poppins', sans-serif;
            font-size: .85rem;
            font-weight: 600;
            text-decoration: none;
            transition: var(--transicao);
            box-shadow: var(--sombra-sm);
        }

        .btn-voltar:hover {
            background: var(--verde-suave);
            border-color: var(--verde-primario);
            transform: translateX(-2px);
        }

        /* ---- PAGE HEADER ---- */
        .page-header {
            margin-bottom: 16px;
            padding: 20px 24px;
            background: var(--bg-card);
            border-radius: var(--raio-card);
            border: 1px solid var(--borda-card);
            box-shadow: var(--sombra-sm);
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            flex-wrap: wrap;
        }

        .page-header-info {}

        .page-header h1 {
            font-family: 'Poppins', sans-serif;
            font-size: 1.55rem;
            font-weight: 700;
            color: var(--texto-principal);
            margin-bottom: 6px;
        }

        .page-header p {
            font-family: 'Inter', sans-serif;
            font-size: .92rem;
            color: var(--texto-secundario);
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .header-badges {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 10px;
        }

        .header-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 12px;
            border-radius: var(--raio-pill);
            font-family: 'Inter', sans-serif;
            font-size: .75rem;
            font-weight: 600;
        }

        .hb-verde { background: var(--verde-suave); color: var(--verde-primario); }
        .hb-laranja { background: var(--laranja-suave); color: var(--laranja); }

        .page-header-stats {
            display: flex;
            gap: 24px;
            flex-shrink: 0;
        }

        .mini-stat {
            text-align: center;
        }

        .mini-stat-valor {
            font-family: 'Poppins', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--texto-principal);
            line-height: 1;
        }

        .mini-stat-label {
            font-family: 'Inter', sans-serif;
            font-size: .72rem;
            color: var(--texto-secundario);
            margin-top: 4px;
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
            border: 1px solid #cfe8ff;
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

        .filtro-bar input::placeholder { color: var(--texto-secundario); }

        /* SEÇÃO DO ALUNO (Espaçamento generoso entre alunos diferentes) */
        .aluno-secao {
            margin-bottom: 36px;
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
            transition: var(--transicao);
        }

        .aluno-header:hover {
            border-color: rgba(28, 122, 230, 0.4);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }

        .aluno-secao.fechado .aluno-header {
            margin-bottom: 0;
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
            padding-bottom: 8px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: var(--bg-card);
            border-radius: 18px;
            overflow: hidden;
            box-shadow: var(--sombra-card);
            border: 1px solid var(--borda-card);
        }

        thead { background: var(--verde-suave); }

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

        tbody tr:hover { background: rgba(160, 253, 163, 0.12); }

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

        .badge-enviado   { background: #E0F2FE; color: #0284C7; }
        .badge-corrigido { background: var(--verde-suave); color: var(--verde-primario); }
        .badge-pendente  { background: var(--laranja-suave); color: var(--laranja); }
        .badge-ia        { background: var(--roxo-claro); color: var(--roxo); }

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

        .tipo-codigo { background: var(--laranja-suave); color: var(--laranja); }
        .tipo-quiz   { background: var(--verde-suave); color: var(--verde-primario); }
        .tipo-texto  { background: #E0F2FE; color: #0284C7; }

        .nota-atual {
            font-family: 'Poppins', sans-serif;
            font-weight: 700;
            font-size: 1rem;
        }

        .nota-10   { color: var(--verde-primario); }
        .nota-boa  { color: var(--verde-escuro); }
        .nota-ok   { color: var(--laranja); }
        .nota-ruim { color: var(--vermelho); }

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
            box-shadow: 0 0 0 3px rgba(11, 87, 168, 0.15);
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

        .btn-salvar:hover { background: var(--verde-escuro); }
        .btn-salvar:disabled { opacity: .6; cursor: not-allowed; }

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
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        .toast-ok  { background: var(--verde); }
        .toast-err { background: var(--vermelho); }

        .vazio {
            text-align: center;
            padding: 60px 20px;
            color: var(--texto-secundario);
            font-family: 'Inter', sans-serif;
        }

        @media (max-width: 680px) {
            .form-nota { flex-direction: column; align-items: flex-start; }
            .page-header { flex-direction: column; }
            .page-header-stats { justify-content: flex-start; }
        }
        
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
        display: flex;
        align-items: center;
        gap: 6px;
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
        text-align: center !important;
        vertical-align: middle !important;
        min-width: 125px;
        font-size: .82rem;
    }

    .tabela-boletim thead th {
        background: var(--verde-suave);
        vertical-align: middle !important;
        height: 100px;
    }

    .tabela-boletim .coluna-aluno {
        position: sticky;
        left: 0;
        z-index: 2;
        min-width: 220px;
        max-width: 260px;
        text-align: center !important;
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
        margin: 0 auto;
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
    </style>
</head>
<body>

<!-- TOPBAR: Barra de navegação com menu de usuário docente -->
<nav class="topbar">
    <a class="topbar-logo" href="<?= $base ?>/notas/instrutor">🌱 <span>The Farmer</span>Edu</a>
    <div class="topbar-right">
        <!-- Gatilho do menu suspenso -->
        <div class="topbar-user" id="userMenuBtn" tabindex="0">
            <div class="avatar"><?= strtoupper(substr($usuario['nome'] ?? 'IN', 0, 2)) ?></div>
            <span><?= htmlspecialchars($usuario['nome'] ?? 'Instrutor') ?></span>
            <svg class="seta-user" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
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

    <!-- NAVEGAÇÃO TOPO: breadcrumb + botão voltar -->
    <div class="nav-topo">
        <nav class="breadcrumb" aria-label="Navegação">
            <a href="<?= $base ?>/notas/instrutor">Centro de Notas</a>
            <span>›</span>
            <span><?= htmlspecialchars($turma['nome_turma'] ?? 'Turma') ?></span>
        </nav>
        <a class="btn-voltar" href="<?= $base ?>/notas/instrutor">← Voltar às turmas</a>
    </div>

    <!-- PAGE HEADER com métricas e contadores da turma -->
    <?php
    $totalAlunos = count($porAluno);
    $totalAtvs   = 0;
    $totalNotas  = 0;
    foreach ($porAluno as $dados) {
        $totalAtvs += count($dados['atividades']);
        foreach ($dados['atividades'] as $a) {
            if ($a['nota_valor'] !== null) $totalNotas++;
        }
    }
    $turnos     = ['manha' => '☀️ Manhã', 'tarde' => '🌤️ Tarde', 'noite' => '🌙 Noite'];
    $turnoExib  = $turnos[$turma['turno'] ?? ''] ?? ($turma['turno'] ?? '');
    ?>
    <header class="page-header">
        <div class="page-header-info">
            <h1>📊 <?= htmlspecialchars($turma['nome_turma'] ?? 'Turma') ?></h1>
            <p>
                <?= htmlspecialchars($turma['nome_curso'] ?? '') ?>
                <?php if (!empty($turma['turno'])): ?>
                    &nbsp;·&nbsp;<?= $turnoExib ?>
                <?php endif; ?>
            </p>
            <div class="header-badges">
                <span class="header-badge hb-verde">👥 <?= $totalAlunos ?> aluno<?= $totalAlunos !== 1 ? 's' : '' ?></span>
                <span class="header-badge hb-laranja">📋 <?= $totalNotas ?>/<?= $totalAtvs ?> notas lançadas</span>
            </div>
        </div>
        <!-- Estatísticas resumidas de correção -->
        <?php if ($totalAlunos > 0 && $totalAtvs > 0): ?>
        <div class="page-header-stats">
            <?php $pct = round($totalAtvs > 0 ? ($totalNotas / $totalAtvs) * 100 : 0); ?>
            <div class="mini-stat">
                <div class="mini-stat-valor"><?= $pct ?>%</div>
                <div class="mini-stat-label">Corrigidas</div>
            </div>
            <div class="mini-stat">
                <div class="mini-stat-valor"><?= $totalAtvs - $totalNotas ?></div>
                <div class="mini-stat-label">Pendentes</div>
            </div>
        </div>
        <?php endif; ?>
    </header>

    <!-- Alertas informativos de status via query string -->
    <?php if ($msgSucesso): ?>
        <div class="alerta alerta-sucesso" role="alert">✅ <?= $msgSucesso ?></div>
    <?php endif; ?>
    <?php if ($msgErro): ?>
        <div class="alerta alerta-erro" role="alert">❌ <?= $msgErro ?></div>
    <?php endif; ?>

    <!-- BARRA DE FILTRO DINÂMICO (Input de pesquisa em tempo real) -->
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
    
        <!-- ABAS DE NAVEGAÇÃO ENTRE OS MODOS DE VISUALIZAÇÃO -->
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

            <button
                type="button"
                id="btn-por-atividade"
                aria-pressed="false"
                onclick="alternarVisualizacao('atividade')"
            >
                📋 Por atividades
            </button>
        </div>

        <!-- ==================================================================
             VISUALIZAÇÃO 1: POR ALUNO (#view-aluno)
             Agrupa as atividades por estudante em seções colapsáveis (acordeão).
             ================================================================== -->
        <div id="view-aluno">

        <?php if (empty($porAluno)): ?>
            <!-- Estado vazio quando não houver alunos ou atividades -->
            <div class="vazio">
                <p style="font-size:3rem">🌾</p>
                <p>Nenhum aluno ou atividade encontrado nesta turma.</p>
            </div>
        <?php else: ?>
            <!-- Itera sobre cada aluno matriculado -->
            <?php foreach ($porAluno as $idAluno => $dados):
                $nome    = $dados['nome'];
                $atvs    = $dados['atividades'];

                // Calcula a média das notas do aluno
                $notas     = array_filter(array_column($atvs, 'nota_valor'), fn($v) => $v !== null);
                $mediaAluno = count($notas) > 0 ? array_sum($notas) / count($notas) : null;
            ?>
            <div class="aluno-secao" data-nome="<?= htmlspecialchars(strtolower($nome)) ?>">

                <!-- Cabeçalho do aluno (clique para expandir/recolher) -->
                <div class="aluno-header" onclick="toggleAluno(this)">
                    <div class="aluno-avatar"><?= strtoupper(substr($nome, 0, 2)) ?></div>
                    <span class="aluno-nome"><?= htmlspecialchars($nome) ?></span>
                    <div class="aluno-media">
                        Média:
                        <strong>
                            <?php if ($mediaAluno !== null): ?>
                                <?= number_format($mediaAluno, 1, ',', '') ?> / 10
                            <?php else: ?>
                                —
                            <?php endif; ?>
                        </strong>

                        <svg class="chevron-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>

                <!-- Tabela de atividades do aluno -->
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
                                $idSub     = $atv['id_submissao'] ?? null;
                                $notaVal   = $atv['nota_valor']   ?? null;
                                $status    = $atv['status_submissao'] ?? null;
                                $origem    = $atv['origem_nota']  ?? null;
                                $tipo      = $atv['tipo_atividade'] ?? '';
                                $idAtv     = (int) $atv['id_atividade'];

                                $notaFmt   = $notaVal !== null ? number_format((float)$notaVal, 1, ',', '') : null;
                                $classNota = '';
                                if ($notaVal !== null) {
                                    if ($notaVal == 10)     $classNota = 'nota-10';
                                    elseif ($notaVal >= 7)  $classNota = 'nota-boa';
                                    elseif ($notaVal >= 5)  $classNota = 'nota-ok';
                                    else                    $classNota = 'nota-ruim';
                                }

                                // Verificação de pontualidade no envio
                                $dataEntrega = strtotime($atv['data_entrega'] ?? '');
                                $dataEnvio   = !empty($atv['data_envio']) ? strtotime($atv['data_envio']) : null;
                                $comAtraso   = $dataEnvio && $dataEnvio > $dataEntrega;
                                ?>
                                <tr>
                                    <td><?= htmlspecialchars($atv['titulo_atividade']) ?></td>

                                    <!-- Chip com tipo da atividade -->
                                    <td>
                                        <?php $tiposLabel = ['codigo' => '💻 Código', 'quiz' => '📝 Quiz', 'texto' => '📄 Texto']; ?>
                                        <span class="tipo-chip tipo-<?= htmlspecialchars($tipo) ?>">
                                            <?= $tiposLabel[$tipo] ?? ucfirst($tipo) ?>
                                        </span>
                                    </td>

                                    <!-- Data de entrega -->
                                    <td><?= date('d/m/Y', strtotime($atv['data_entrega'])) ?></td>

                                    <!-- Status da submissão -->
                                    <td>
                                        <?php if ($status === 'corrigida'): ?>
                                            <span class="badge badge-corrigido">✔ Corrigida</span>
                                        <?php elseif ($status === 'enviada' || $status === 'processando'): ?>
                                            <span class="badge badge-enviado">📤 Enviada</span>
                                        <?php else: ?>
                                            <span class="badge badge-pendente">⚠ Pendente</span>
                                        <?php endif; ?>

                                        <?php if ($comAtraso): ?>
                                            <div class="substatus-atraso">Concluída com atraso</div>
                                        <?php elseif ($status === 'corrigida' || $status === 'enviada'): ?>
                                            <div class="substatus-prazo">Concluída no prazo</div>
                                        <?php endif; ?>
                                    </td>

                                    <!-- Exibição da nota com badge de IA -->
                                    <td>
                                        <?php if ($notaFmt !== null): ?>
                                            <span class="nota-atual <?= $classNota ?>"><?= $notaFmt ?></span>
                                            <?php if ($origem === 'ia'): ?>
                                                <span class="badge badge-ia" style="margin-left:6px">🤖 IA</span>
                                            <?php endif; ?>
                                        <?php else: ?>
                                            <span class="sem-envio">—</span>
                                        <?php endif; ?>
                                    </td>

                                    <!-- Formulário AJAX de lançamento de nota -->
                                    <td>
                                        <?php if ($idSub): ?>
                                            <form class="form-nota"
                                                  onsubmit="lancarNota(event, this)"
                                                  data-submissao="<?= (int)$idSub ?>"
                                                  data-turma="<?= (int)($turma['id_turma'] ?? 0) ?>">
                                                <input
                                                    id="nota-<?= (int)$idSub ?>"
                                                    class="input-nota"
                                                    type="number"
                                                    name="valor"
                                                    min="0"
                                                    max="10"
                                                    step="0.1"
                                                    placeholder="0–10"
                                                    value="<?= $notaVal !== null ? (float)$notaVal : '' ?>"
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

</div>

<!-- ==================================================================
     VISUALIZAÇÃO 2: BOLETIM GERAL (#view-boletim)
     Grade com matriz Aluno x Atividades para visão panorâmica das notas.
     ================================================================== -->
<div id="view-boletim" style="display: none;">
            <?php if (empty($porAluno) || empty($atividadesUnicas)): ?>

                <div class="vazio">
                    <p style="font-size:3rem">🌾</p>
                    <p>Nenhum dado disponível para o boletim.</p>
                </div>

            <?php else: ?>

                <div class="boletim-wrap">
                    <table class="tabela-boletim" aria-label="Boletim geral da turma">
                        <thead>
                            <tr>
                                <!-- Coluna fixa de alunos -->
                                <th class="coluna-aluno">Aluno</th>
                                <!-- Cabeçalhos dinâmicos com cada atividade -->
                                <?php foreach ($atividadesUnicas as $atv): ?>
                                    <th>
                                        <span class="nome-atividade"><?= htmlspecialchars($atv['titulo']) ?></span>
                                        <span class="prazo-atividade">
                                            <?= !empty($atv['data_entrega']) ? date('d/m/Y', strtotime($atv['data_entrega'])) : 'Sem prazo' ?>
                                        </span>
                                    </th>
                                <?php endforeach; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Linhas com cada aluno e suas respectivas notas -->
                            <?php foreach ($porAluno as $idAluno => $dados): ?>
                                <tr>
                                    <td class="coluna-aluno">
                                        <strong><?= htmlspecialchars($dados['nome']) ?></strong>
                                    </td>

                                    <?php foreach ($atividadesUnicas as $atv): ?>
                                        <?php
                                        $idAtv = (int) $atv['id'];
                                        $sub = $notasPorAlunoAtividade[(int) $idAluno][$idAtv] ?? null;

                                        $notaVal = $sub['nota_valor'] ?? null;
                                        $status = $sub['status_submissao'] ?? null;

                                        $dataEntrega = strtotime($sub['data_entrega'] ?? '');
                                        $dataEnvio = !empty($sub['data_envio']) ? strtotime($sub['data_envio']) : null;
                                        $comAtraso = $dataEnvio && $dataEntrega && $dataEnvio > $dataEntrega;
                                        ?>
                                        <td>
                                            <?php if ($notaVal !== null): ?>
                                                <span class="nota-boletim">
                                                    <?= number_format((float) $notaVal, 1, ',', '') ?>
                                                </span>
                                                <?php if ($comAtraso): ?>
                                                    <span class="status-boletim atraso">Entregue com atraso</span>
                                                <?php else: ?>
                                                    <span class="status-boletim">No prazo</span>
                                                <?php endif; ?>
                                            <?php elseif ($status === 'enviada' || $status === 'processando'): ?>
                                                <span class="status-boletim pendente">Aguardando nota</span>
                                            <?php else: ?>
                                                <span class="sem-nota-boletim">—</span>
                                            <?php endif; ?>
                                        </td>
                                    <?php endforeach; ?>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

            <?php endif; ?>
        </div>

        <!-- ==================================================================
             VISUALIZAÇÃO 3: POR ATIVIDADES (#view-atividade)
             Agrupa alunos por atividade para correção em lote.
             ================================================================== -->
        <div id="view-atividade" style="display: none;">
            <?php if (empty($porAtividade)): ?>

                <div class="vazio">
                    <p style="font-size:3rem">🌾</p>
                    <p>Nenhuma atividade encontrada nesta turma.</p>
                </div>

            <?php else: ?>

                <!-- Itera sobre as atividades da turma -->
                <?php foreach ($porAtividade as $idAtv => $dadosAtv): ?>

                    <?php
                    $tituloAtv = $dadosAtv['titulo'];
                    $tipoAtv = $dadosAtv['tipo'];
                    $prazoAtv = $dadosAtv['data_entrega'];
                    $subsAtv = $dadosAtv['submissoes'];
                    
                    $tiposLabel = [
                        'codigo' => '💻 Código',
                        'quiz' => '📝 Quiz',
                        'texto' => '📄 Texto'
                    ];
                    ?>

                    <div
                        class="aluno-secao"
                        data-nome="<?= htmlspecialchars(strtolower($tituloAtv)) ?>"
                    >

                        <!-- Cabeçalho colapsável da atividade -->
                        <div class="aluno-header" onclick="toggleAluno(this)">

                            <span class="tipo-chip tipo-<?= htmlspecialchars($tipoAtv) ?>">
                                <?= $tiposLabel[$tipoAtv] ?? ucfirst($tipoAtv) ?>
                            </span>

                            <span class="aluno-nome">
                                <?= htmlspecialchars($tituloAtv) ?>
                            </span>

                            <div class="aluno-media">
                                Prazo: <strong><?= !empty($prazoAtv) ? date('d/m/Y', strtotime($prazoAtv)) : 'Sem prazo' ?></strong>

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

                        <!-- Tabela de submissões dos estudantes nesta atividade -->
                        <div class="tabela-wrap">

                            <table aria-label="Alunos da atividade <?= htmlspecialchars($tituloAtv) ?>">

                                <thead>
                                    <tr>
                                        <th>Aluno</th>
                                        <th>Status</th>
                                        <th>Nota atual</th>
                                        <th>Lançar nota</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    <?php foreach ($subsAtv as $atv): ?>

                                        <?php
                                        $idSub = $atv['id_submissao'] ?? null;
                                        $notaVal = $atv['nota_valor'] ?? null;
                                        $status = $atv['status_submissao'] ?? null;
                                        $origem = $atv['origem_nota'] ?? null;

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
                                                <strong><?= htmlspecialchars($atv['nome_aluno']) ?></strong>
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
                                                            id="nota-atv-<?= (int) $idSub ?>"
                                                            class="input-nota"
                                                            type="number"
                                                            name="valor"
                                                            min="0"
                                                            max="10"
                                                            step="0.1"
                                                            placeholder="0–10"
                                                            value="<?= $notaVal !== null ? (float) $notaVal : '' ?>"
                                                            required
                                                            aria-label="Nota para <?= htmlspecialchars($atv['nome_aluno']) ?>"
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
        </div>

    </div>

    <!-- Feedback visual flutuante via Toast -->
    <div id="toast" role="status" aria-live="polite"></div>

<!-- ======================================================================
     SCRIPTS: Lógica de front-end, AJAX e manipulação de abas/filtros
     ====================================================================== -->
<script>
/**
 * Exibe notificação flutuante temporária.
 */
function exibirToast(msg, ok = true) {
    const toast = document.getElementById('toast');
    toast.textContent = (ok ? '✅ ' : '❌ ') + msg;
    toast.className = ok ? 'toast-ok' : 'toast-err';
    toast.style.display = 'flex';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3500);
}

/**
 * Expande ou recolhe a seção do acordeão.
 */
function toggleAluno(headerElement) {
    const secao = headerElement.closest('.aluno-secao');

    secao.classList.toggle('fechado');
    const wrap = secao.querySelector('.tabela-wrap');
        if (wrap) {
            wrap.style.display = secao.classList.contains('fechado') ? 'none' : 'block';
        }
}

/**
 * Filtro em tempo real de alunos ou atividades.
 */
function filtrarAlunos(termo) {
        const secoes = document.querySelectorAll('.aluno-secao');
        const q = termo.toLowerCase().trim();
        secoes.forEach(s => {
            const nome = s.dataset.nome || '';
            s.style.display = (!q || nome.includes(q)) ? '' : 'none';
        });
}

/**
 * Alterna entre os modos de visualização ('aluno', 'boletim', 'atividade').
 */
function alternarVisualizacao(modo) {
        const viewAluno = document.getElementById('view-aluno');
        const viewBoletim = document.getElementById('view-boletim');
        const viewAtividade = document.getElementById('view-atividade');

        const btnAluno = document.getElementById('btn-por-aluno');
        const btnBoletim = document.getElementById('btn-boletim');
        const btnAtividade = document.getElementById('btn-por-atividade');

        const filtroInput = document.getElementById('filtro-aluno');

        if (modo === 'boletim') {
            viewAluno.style.display = 'none';
            viewAtividade.style.display = 'none';
            viewBoletim.style.display = 'block';

            btnAluno.classList.remove('ativo');
            btnAluno.setAttribute('aria-pressed', 'false');
            btnAtividade.classList.remove('ativo');
            btnAtividade.setAttribute('aria-pressed', 'false');

            btnBoletim.classList.add('ativo');
            btnBoletim.setAttribute('aria-pressed', 'true');

            if (filtroInput) filtroInput.parentElement.style.display = 'none';
        } else if (modo === 'atividade') {
            viewAluno.style.display = 'none';
            viewBoletim.style.display = 'none';
            viewAtividade.style.display = 'block';

            btnAluno.classList.remove('ativo');
            btnAluno.setAttribute('aria-pressed', 'false');
            btnBoletim.classList.remove('ativo');
            btnBoletim.setAttribute('aria-pressed', 'false');

            btnAtividade.classList.add('ativo');
            btnAtividade.setAttribute('aria-pressed', 'true');

            if (filtroInput) {
                filtroInput.parentElement.style.display = 'flex';
                filtroInput.placeholder = 'Buscar atividade pelo título...';
                filtrarAlunos(filtroInput.value);
            }
        } else {
            viewBoletim.style.display = 'none';
            viewAtividade.style.display = 'none';
            viewAluno.style.display = 'block';

            btnBoletim.classList.remove('ativo');
            btnBoletim.setAttribute('aria-pressed', 'false');
            btnAtividade.classList.remove('ativo');
            btnAtividade.setAttribute('aria-pressed', 'false');

            btnAluno.classList.add('ativo');
            btnAluno.setAttribute('aria-pressed', 'true');

            if (filtroInput) {
                filtroInput.parentElement.style.display = 'flex';
                filtroInput.placeholder = 'Buscar aluno pelo nome...';
                filtrarAlunos(filtroInput.value);
            }
        }
    }

/**
 * Processa o envio assíncrono (AJAX) da nota lançada pelo instrutor.
 */
function lancarNota(event, form) {
    event.preventDefault();

    const idSubmissao = form.dataset.submissao;
    const idTurma     = form.dataset.turma;
    const inputNota   = form.querySelector('input[name="valor"]');
    const btn         = form.querySelector('button');
    const valor       = parseFloat(inputNota.value);

    if (isNaN(valor) || valor < 0 || valor > 10) {
        mostrarToast('⚠ Nota deve ser entre 0 e 10.', false);
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Salvando...';

    const body = new URLSearchParams({
        id_submissao: idSubmissao,
        valor:        valor,
        id_turma:     idTurma,
    });

    fetch('salvar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: body.toString(),
    })
    .then(res => res.json())
    .then(data => {
        if (data.sucesso) {
            mostrarToast('✅ ' + data.mensagem, true);

            const tr     = form.closest('tr');
            const tdNota = tr.querySelector('td:nth-child(5)');
            if (tdNota) {
                const notaFmt = valor.toFixed(1).replace('.', ',');
                let classe = 'nota-ruim';
                if (valor == 10)     classe = 'nota-10';
                else if (valor >= 7) classe = 'nota-boa';
                else if (valor >= 5) classe = 'nota-ok';

                tdNota.innerHTML = `<span class="nota-atual ${classe}">${notaFmt}</span>`;
            }

            const tdStatus = tr.querySelector('td:nth-child(4)');
            if (tdStatus) {
                tdStatus.innerHTML = '<span class="badge badge-corrigido">✔ Corrigida</span>';
            }

            // Recalcula a média exibida no cabeçalho
            recalcularMedia(form);

        } else {
            mostrarToast('❌ ' + data.mensagem, false);
        }
    })
    .catch(() => mostrarToast('❌ Erro de conexao. Tente novamente.', false))
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = '💾 Salvar';
    });
}

/**
 * Recalcula a média das notas dinamicamente na página.
 */
function recalcularMedia(formElement) {
    const secao = formElement.closest('.aluno-secao');
    if (!secao) return;

    const inputs = secao.querySelectorAll('input.input-nota');
    const valores = [];
    inputs.forEach(inp => {
        const v = parseFloat(inp.value);
        if (!isNaN(v)) valores.push(v);
    });

    if (valores.length === 0) return;

    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const mediaFmt = media.toFixed(1).replace('.', ',');

    const mediaSpan = secao.querySelector('.aluno-media strong');
    if (mediaSpan) {
        mediaSpan.textContent = mediaFmt + ' / 10';
    }
}

/**
 * Exibe mensagem Toast por 3 segundos.
 */
function mostrarToast(msg, sucesso) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className   = sucesso ? 'toast-ok' : 'toast-err';
    toast.style.display = 'flex';

    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// Controle de dropdown do perfil
const userBtn = document.getElementById('userMenuBtn');
if (userBtn) {
    userBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('aberto');
    });
}
document.addEventListener('click', function(e) {
    if (userBtn && !userBtn.contains(e.target)) {
        userBtn.classList.remove('aberto');
    }
});
</script>

</body>
</html>