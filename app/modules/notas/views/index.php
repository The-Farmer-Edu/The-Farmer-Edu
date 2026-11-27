<?php
/**
 * ============================================================================
 * VIEW: MINHAS NOTAS - PERFIL DO ALUNO (index.php)
 * ============================================================================
 * Esta view é renderizada pelo método NotasController::verNotasAluno().
 * Permite ao estudante visualizar:
 * - Cartões de resumo com métricas consolidadas (total de tarefas, corrigidas, pendentes e média geral).
 * - Lista de atividades agrupadas por turma/curso com indicação de prazos e tentativas.
 * - Notas individuais com código de cores e identificação de correção via Inteligência Artificial.
 *
 * Variáveis recebidas do Controller:
 * - $usuario    : Array com informações da sessão do aluno autenticado.
 * - $atividades : Array com as atividades matriculadas, submissões e notas.
 * - $resumo     : Array associativo com totais agregados e média calculada.
 * ============================================================================
 */

// Esta view e carregada pelo NotasController::verNotasAluno()
// Variaveis disponiveis: $usuario, $atividades, $resumo

// Agrupa atividades por turma/curso para exibicao em secoes
$grupos = [];
$somaNotas = 0.0;
foreach ($atividades as $atv) {
    // Chave composta para separar visualmente as disciplinas/turmas
    $chave = $atv['nome_curso'] . ' — ' . $atv['nome_turma'];
    $grupos[$chave][] = $atv;
    if (isset($atv['nota_valor']) && $atv['nota_valor'] !== null) {
        $somaNotas += (float) $atv['nota_valor'];
    }
}

$notaTotal = isset($resumo['nota_total']) ? (float) $resumo['nota_total'] : $somaNotas;
$notaMaximaTotal = (int) ($resumo['total_atividades'] ?? count($atividades)) * 10;

// Calcula cor da media para o card de resumo
// Verde para média >= 7, Laranja para média >= 5 e Vermelho para notas abaixo de 5
$media = (float) ($resumo['media_geral'] ?? 0);
$corMedia = $media >= 7 ? '#1B5E20' : ($media >= 5 ? '#FF8D28' : '#dc2626');
$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minhas Notas — The Farmer Edu</title>
    <meta name="description" content="Veja todas as suas notas e atividades na plataforma The Farmer Edu.">
    <!-- Fontes Google (Inter e Poppins) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?= $base ?>/notas/file?type=css&amp;file=index.css">
    <link rel="stylesheet" href="<?= $base ?>/atividades/file?type=fazenda&amp;file=botao-acesso-fazenda.css">

</head>
<body>

<?php require_once __DIR__ . '/../../../core/cabecalho.php'; ?>

<div class="container">

    <!-- CABECALHO: Título da página -->
    <header class="page-header">
        <h1>📋 Minhas Notas</h1>
        <p>Acompanhe seu desempenho em todas as atividades</p>
    </header>

    <!-- CARDS DE RESUMO: Indicadores consolidados de progresso -->
    <section class="resumo-grid" aria-label="Resumo das notas">

        <!-- Total de atividades vinculadas -->
        <div class="card-resumo">
            <span class="icone">📚</span>
            <span class="valor" style="color: var(--azul)">
                <?= (int) ($resumo['total_atividades'] ?? 0) ?>
            </span>
            <span class="label">Total de atividades</span>
        </div>

        <!-- Atividades já corrigidas/avaliadas -->
        <div class="card-resumo">
            <span class="icone">✅</span>
            <span class="valor" style="color: var(--verde)">
                <?= (int) ($resumo['total_avaliadas'] ?? 0) ?>
            </span>
            <span class="label">Avaliadas</span>
        </div>

        <!-- Atividades pendentes de entrega -->
        <div class="card-resumo">
            <span class="icone">⏳</span>
            <span class="valor" style="color: var(--amarelo)">
                <?= (int) ($resumo['pendentes'] ?? 0) ?>
            </span>
            <span class="label">Pendentes</span>
        </div>

        <!-- Nota total acumulada -->
        <div class="card-resumo">
            <span class="icone">🏆</span>
            <span class="valor" style="color: var(--verde-primario)">
                <?= number_format($notaTotal, 1, ',', '') ?><span style="font-size: 1rem; font-weight: 500; color: var(--texto-secundario);">/<?= $notaMaximaTotal ?></span>
            </span>
            <span class="label">Nota total</span>
        </div>

        <!-- Média geral com cor dinâmica -->
        <div class="card-resumo">
            <span class="icone">🎯</span>
            <span class="valor" style="color: <?= $corMedia ?>">
                <?= number_format($media, 1, ',', '') ?>
            </span>
            <span class="label">Média geral</span>
        </div>

    </section>

    <?php if (!empty($atividades)): ?>
        <div class="filtro-bar">
            <span>🔍</span>
            <input
                type="text"
                id="filtro-atividade"
                placeholder="Buscar atividade pelo nome..."
                oninput="filtrarAtividades(this.value)"
                aria-label="Filtrar atividades"
            >
        </div>
    <?php endif; ?>

    <!-- LISTA DE ATIVIDADES AGRUPADAS POR TURMA -->
    <?php if (empty($atividades)): ?>
        <!-- Mensagem de estado vazio caso não haja atividades -->
        <div class="vazio">
            <p style="font-size:3rem">🌾</p>
            <p>Nenhuma atividade encontrada para a sua turma ainda.</p>
        </div>
    <?php else: ?>

        <!-- Itera sobre cada grupo de curso / turma -->
        <?php foreach ($grupos as $nomeTurma => $itens): ?>
            <section class="secao">
                <h2 class="secao-titulo">
                    📖 <?= htmlspecialchars($nomeTurma) ?>
                </h2>

                <div class="lista-atividades">
                    <?php foreach ($itens as $atv): ?>
                        <?php
                        // Determina ícone visual conforme o tipo de atividade (código, quiz, texto)
                        $iconesTipo = ['codigo' => '💻', 'quiz' => '📝', 'texto' => '📄'];
                        $icone = $iconesTipo[$atv['tipo_atividade']] ?? '📋';
                        $classTipo = 'tipo-' . ($atv['tipo_atividade'] ?? 'texto');

                        // Formatação numérica da nota obtida e definição da classe CSS
                        $notaVal  = $atv['nota_valor'];
                        $notaFmt  = $notaVal !== null ? number_format((float)$notaVal, 1, ',', '') : null;
                        $classNota = '';
                        if ($notaVal !== null) {
                            if ($notaVal == 10)     $classNota = 'nota-10';
                            elseif ($notaVal >= 7)  $classNota = 'nota-boa';
                            elseif ($notaVal >= 5)  $classNota = 'nota-ok';
                            else                    $classNota = 'nota-ruim';
                        }

                        // Status da submissão e origem da nota
                        $status = $atv['status_submissao'] ?? null;
                        $origem = $atv['origem_nota'] ?? null;
                        ?>
                        <!-- Card individual da atividade -->
                        <article class="card-atividade" data-titulo="<?= htmlspecialchars(strtolower($atv['titulo'])) ?>">
                            <div class="atividade-esq">
                                <!-- Ícone do tipo -->
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

                            <!-- Lado direito com nota ou badge de status -->
                            <div class="atividade-dir">
                                <?php if ($notaVal !== null): ?>
                                    <!-- Nota numerica sobre 10 -->
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

<a class="btn-acessar-fazenda" href="<?= htmlspecialchars($base, ENT_QUOTES, 'UTF-8') ?>/fazenda" aria-label="Acessar a fazenda" title="Acessar a fazenda">
    <img src="<?= htmlspecialchars($base, ENT_QUOTES, 'UTF-8') ?>/atividades/file?type=fazenda&amp;file=icone-acesso-fazenda.png" alt="">
</a>

<script src="<?= $base ?>/notas/file?type=js&amp;file=index.js"></script>

</body>
</html>