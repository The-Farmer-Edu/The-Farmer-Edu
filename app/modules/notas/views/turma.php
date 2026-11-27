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

// Organiza submissões agrupando por Atividade (Aba "Por atividades")
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
$msgErro    = htmlspecialchars($_GET['erro']    ?? '');
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
    <link rel="stylesheet" href="<?= $base ?>/notas/file?type=css&amp;file=turma.css">

</head>
<body>

<?php require_once __DIR__ . '/../../../core/cabecalho.php'; ?>

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

    <div id="view-aluno">
        <?php if (empty($porAluno)): ?>
            <div class="vazio">
                <p style="font-size:3rem">🌾</p>
                <p>Nenhum aluno ou atividade encontrado nesta turma.</p>
            </div>
        <?php else: ?>
            <?php foreach ($porAluno as $idAluno => $dados):
                $nome    = $dados['nome'];
                $atvs    = $dados['atividades'];

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
                                $comAtraso   = $dataEnvio && $dataEntrega && $dataEnvio > $dataEntrega;
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
                                                <button class="btn-historico" type="button" onclick="abrirHistorico(<?= (int)$idSub ?>)" title="Ver histórico de notas">
                                                    ⏱️
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
                            <th class="coluna-aluno">Aluno</th>
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
                        <?php foreach ($porAluno as $idAluno => $dados): ?>
                            <tr>
                                <td class="coluna-aluno">
                                    <strong><?= htmlspecialchars($dados['nome']) ?></strong>
                                </td>

                                <?php foreach ($atividadesUnicas as $atv): ?>
                                    <?php
                                    $idAtv = (int) $atv['id'];
                                    $sub = $notasPorAlunoAtividade[(int) $idAluno][$idAtv] ?? null;
                                    $idSubBoletim = $sub['id_submissao'] ?? null;

                                    $notaVal = $sub['nota_valor'] ?? null;
                                    $status = $sub['status_submissao'] ?? null;

                                    $dataEntrega = strtotime($sub['data_entrega'] ?? '');
                                    $dataEnvio = !empty($sub['data_envio']) ? strtotime($sub['data_envio']) : null;
                                    $comAtraso = $dataEnvio && $dataEntrega && $dataEnvio > $dataEntrega;
                                    ?>
                                    <td <?= $idSubBoletim ? 'data-boletim-submissao="' . (int)$idSubBoletim . '"' : '' ?>>
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

    <div id="view-atividade" style="display: none;">
        <?php if (empty($porAtividade)): ?>
            <div class="vazio">
                <p style="font-size:3rem">🌾</p>
                <p>Nenhuma atividade encontrada nesta turma.</p>
            </div>
        <?php else: ?>
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
                                                    <button class="btn-historico" type="button" onclick="abrirHistorico(<?= (int)$idSub ?>)" title="Ver histórico de notas">
                                                        ⏱️
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

<!-- MODAL DE HISTÓRICO DAS NOTAS -->
<div id="modalHistorico" class="modal-overlay" onclick="if(event.target === this) fecharHistorico()">
    <div class="modal-content">
        <div class="modal-header">
            <h3>⏱️ Histórico de Alterações</h3>
            <button class="modal-close" onclick="fecharHistorico()">✕</button>
        </div>
        <ul id="historicoConteudo" class="historico-lista">
            <!-- Preenchido via MySQL -->
        </ul>
    </div>
</div>

<div id="toast" role="status" aria-live="polite"></div>

<!-- ======================================================================
     SCRIPTS: Lógica de front-end, AJAX e manipulação de abas/filtros
     ====================================================================== -->
<script src="<?= $base ?>/notas/file?type=js&amp;file=turma.js"></script>

</body>
</html>