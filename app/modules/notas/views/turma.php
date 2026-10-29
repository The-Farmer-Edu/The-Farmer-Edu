<?php
// View: submissoes de uma turma — instrutor lanca notas
// Variaveis disponiveis: $usuario, $turma, $submissoes

// Agrupa submissoes por aluno
$porAluno = [];
foreach ($submissoes as $sub) {
    $porAluno[$sub['id_aluno']]['nome'] = $sub['nome_aluno'];
    $porAluno[$sub['id_aluno']]['atividades'][] = $sub;
}

// Captura mensagens de feedback na URL
$msgSucesso = htmlspecialchars($_GET['sucesso'] ?? '');
$msgErro    = htmlspecialchars($_GET['erro']    ?? '');
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
            --roxo:             #7E22CE;
            --roxo-claro:       #F3E8FF;
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
            max-width: 980px;
            margin: 0 auto;
            padding: 28px 20px 60px;
        }

        /* BREADCRUMB */
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

        /* PAGE HEADER */
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

        /* ALERTAS */
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

        /* BUSCA / FILTRO */
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

        /* SECAO DE ALUNO */
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
        }

        .aluno-media strong {
            font-family: 'Poppins', sans-serif;
            color: var(--texto-principal);
        }

        /* TABELA DE ATIVIDADES */
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

        /* BADGES (Formato pílula: 20px) */
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

        .badge-enviado   { background: #E0F2FE;               color: #0284C7; }
        .badge-corrigido { background: var(--verde-suave);    color: var(--verde-primario); }
        .badge-pendente  { background: var(--laranja-suave);  color: var(--laranja); }
        .badge-ia        { background: var(--roxo-claro);     color: var(--roxo); }

        /* TIPO ATIVIDADE */
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
        .tipo-quiz   { background: var(--verde-suave);   color: var(--verde-primario); }
        .tipo-texto  { background: #E0F2FE;              color: #0284C7; }

        /* NOTA ATUAL */
        .nota-atual {
            font-family: 'Poppins', sans-serif;
            font-weight: 700;
            font-size: 1rem;
        }

        .nota-10   { color: var(--verde-primario); }
        .nota-boa  { color: var(--verde-escuro); }
        .nota-ok   { color: var(--laranja); }
        .nota-ruim { color: var(--vermelho); }

        /* FORM DE LANCAMENTO */
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

        /* Linha sem submissao */
        .sem-envio {
            color: var(--texto-secundario);
            font-size: .82rem;
            font-style: italic;
        }

        /* TOAST */
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

        /* VAZIO */
        .vazio {
            text-align: center;
            padding: 60px 20px;
            color: var(--texto-secundario);
            font-family: 'Inter', sans-serif;
        }

        /* RESPONSIVO */
        @media (max-width: 680px) {
            .form-nota { flex-direction: column; align-items: flex-start; }
        }
    </style>
</head>
<body>

<!-- TOPBAR -->
<nav class="topbar">
    <a class="topbar-logo" href="/">🌱 <span>The Farmer</span>Edu</a>
    <div class="topbar-user">
        <div class="avatar"><?= strtoupper(substr($usuario['nome'], 0, 2)) ?></div>
        <span><?= htmlspecialchars($usuario['nome']) ?></span>
    </div>
</nav>

<div class="container">

    <!-- BREADCRUMB -->
    <nav class="breadcrumb" aria-label="Navegação">
        <a href="/notas/instrutor">Centro de Notas</a>
        <span>›</span>
        <span><?= htmlspecialchars($turma['nome_turma'] ?? 'Turma') ?></span>
    </nav>

    <!-- HEADER -->
    <header class="page-header">
        <h1>📊 <?= htmlspecialchars($turma['nome_turma'] ?? 'Turma') ?></h1>
        <p>
            <?= htmlspecialchars($turma['nome_curso'] ?? '') ?>
            <?php if (!empty($turma['turno'])): ?>
                &nbsp;·&nbsp;
                <?php
                $turnos = ['manha' => '☀️ Manhã', 'tarde' => '🌤️ Tarde', 'noite' => '🌙 Noite'];
                echo $turnos[$turma['turno']] ?? $turma['turno'];
                ?>
            <?php endif; ?>
        </p>
    </header>

    <!-- ALERTAS -->
    <?php if ($msgSucesso): ?>
        <div class="alerta alerta-sucesso" role="alert">✅ <?= $msgSucesso ?></div>
    <?php endif; ?>
    <?php if ($msgErro): ?>
        <div class="alerta alerta-erro" role="alert">❌ <?= $msgErro ?></div>
    <?php endif; ?>

    <!-- FILTRO DE ALUNO -->
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

    <!-- LISTA DE ALUNOS E NOTAS -->
    <?php if (empty($porAluno)): ?>
        <div class="vazio">
            <p style="font-size:3rem">🌾</p>
            <p>Nenhum aluno ou atividade encontrado nesta turma.</p>
        </div>
    <?php else: ?>
        <?php foreach ($porAluno as $idAluno => $dados):
            $nome    = $dados['nome'];
            $atvs    = $dados['atividades'];

            // Calcula media do aluno (apenas notas existentes)
            $notas     = array_filter(array_column($atvs, 'nota_valor'), fn($v) => $v !== null);
            $mediaAluno = count($notas) > 0 ? array_sum($notas) / count($notas) : null;
        ?>
            <div class="aluno-secao" data-nome="<?= htmlspecialchars(strtolower($nome)) ?>">

                <!-- CABECALHO DO ALUNO -->
                <div class="aluno-header">
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
                    </div>
                </div>

                <!-- TABELA DE ATIVIDADES -->
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
                                ?>
                                <tr>
                                    <!-- NOME DA ATIVIDADE -->
                                    <td><?= htmlspecialchars($atv['titulo_atividade']) ?></td>

                                    <!-- TIPO -->
                                    <td>
                                        <?php $tiposLabel = ['codigo' => '💻 Código', 'quiz' => '📝 Quiz', 'texto' => '📄 Texto']; ?>
                                        <span class="tipo-chip tipo-<?= htmlspecialchars($tipo) ?>">
                                            <?= $tiposLabel[$tipo] ?? ucfirst($tipo) ?>
                                        </span>
                                    </td>

                                    <!-- PRAZO -->
                                    <td><?= date('d/m/Y', strtotime($atv['data_entrega'])) ?></td>

                                    <!-- STATUS -->
                                    <td>
                                        <?php if ($status === 'corrigida'): ?>
                                            <span class="badge badge-corrigido">✔ Corrigida</span>
                                        <?php elseif ($status === 'enviada' || $status === 'processando'): ?>
                                            <span class="badge badge-enviado">📤 Enviada</span>
                                        <?php else: ?>
                                            <span class="badge badge-pendente">⚠ Pendente</span>
                                        <?php endif; ?>
                                    </td>

                                    <!-- NOTA ATUAL -->
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

                                    <!-- FORM LANCAMENTO -->
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
                </div><!-- /tabela-wrap -->

            </div><!-- /aluno-secao -->
        <?php endforeach; ?>
    <?php endif; ?>

</div><!-- /container -->

<!-- TOAST DE FEEDBACK -->
<div id="toast" role="status" aria-live="polite"></div>

<script>
// ============================================================
// Filtra alunos pelo nome ao digitar
// ============================================================
function filtrarAlunos(termo) {
    const secoes = document.querySelectorAll('.aluno-secao');
    const q = termo.toLowerCase().trim();
    secoes.forEach(s => {
        const nome = s.dataset.nome || '';
        s.style.display = (!q || nome.includes(q)) ? '' : 'none';
    });
}

// ============================================================
// Lança nota via fetch (AJAX) sem recarregar a pagina
// ============================================================
function lancarNota(event, form) {
    event.preventDefault();

    const idSubmissao = form.dataset.submissao;
    const idTurma     = form.dataset.turma;
    const inputNota   = form.querySelector('input[name="valor"]');
    const btn         = form.querySelector('button');
    const valor       = parseFloat(inputNota.value);

    // Validacao no front
    if (isNaN(valor) || valor < 0 || valor > 10) {
        mostrarToast('⚠ Nota deve ser entre 0 e 10.', false);
        return;
    }

    // Desabilita o botao enquanto salva
    btn.disabled = true;
    btn.textContent = '⏳ Salvando...';

    const body = new URLSearchParams({
        id_submissao: idSubmissao,
        valor:        valor,
        id_turma:     idTurma,
    });

    fetch('/notas/salvar', {
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

            // Atualiza a nota exibida na celula ao lado
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

            // Atualiza o badge de status
            const tdStatus = tr.querySelector('td:nth-child(4)');
            if (tdStatus) {
                tdStatus.innerHTML = '<span class="badge badge-corrigido">✔ Corrigida</span>';
            }

            // Recalcula a media do aluno
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

// ============================================================
// Recalcula a media do aluno na mesma secao
// ============================================================
function recalcularMedia(formElement) {
    const secao = formElement.closest('.aluno-secao');
    if (!secao) return;

    // Pega todos os inputs de nota dentro desta secao
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

// ============================================================
// Exibe o toast de feedback
// ============================================================
function mostrarToast(msg, sucesso) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className   = sucesso ? 'toast-ok' : 'toast-err';
    toast.style.display = 'flex';

    // Esconde apos 3 segundos
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}
</script>

</body>
</html>