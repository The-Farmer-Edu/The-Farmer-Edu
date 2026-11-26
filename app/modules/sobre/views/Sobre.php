<?php
/**
 * ============================================================================
 * The Farmer Edu — Sobre os Desenvolvedores (views/Sobre.php)
 * ============================================================================
 * Variáveis recebidas do SobreController:
 *   $squads, $tema ('aluno' | 'instrutor'), $totalSquads, $totalAlunos
 * Segue o Guia de Design: Poppins/Inter, cards de 25px, botões em pílula,
 * cabeçalho oficial unificado e tema verde (aluno) / azul (instrutor).
 * ============================================================================
 */

$h = fn($valor) => htmlspecialchars((string) $valor, ENT_QUOTES, 'UTF-8');

// URL base da aplicação (mesma regra do cabeçalho oficial)
$scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
$base = ($scriptDir !== '/' && $scriptDir !== '\\') ? rtrim(str_replace('\\', '/', $scriptDir), '/') : '';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="<?= $tema === 'instrutor' ? '#90BDF0' : '#A0FDA3' ?>">
    <title>Sobre os desenvolvedores · The Farmer Edu</title>
    <meta name="description" content="Conheça os <?= (int) $totalSquads ?> squads e os alunos que desenvolveram o The Farmer Edu.">
    <link rel="icon" type="image/x-icon" href="<?= $h($base) ?>/assets/img/ico/logo_icone.ico">
    <link rel="stylesheet" href="<?= $h($base) ?>/sobre/file?type=css&file=sobre.css">
    <noscript><style>.squad-panel{grid-template-rows:1fr;visibility:visible}.squad-chevron{display:none}</style></noscript>
</head>
<body class="sobre" data-tema="<?= $h($tema) ?>">

<?php require __DIR__ . '/../../../core/cabecalho.php'; ?>

<main class="sobre-main">
    <section class="sobre-intro">
        <h1>Sobre os desenvolvedores</h1>
        <p>
            O The Farmer Edu foi construído por 56 alunos de duas turmas de Aprendizagem em Assistente de
            Programação Web do SENAI, organizados em <?= (int) $totalSquads ?> squads. Abra um squad para ver quem
            participou do desenvolvimento e acessar o GitHub de cada aluno.
        </p>
        <div class="sobre-controles">
            <button type="button" class="btn-texto" id="expandirTodos">Expandir todos</button>
            <button type="button" class="btn-texto" id="recolherTodos">Recolher todos</button>
        </div>
    </section>

    <section aria-label="Squads do projeto">
        <ul class="squads">
            <?php foreach ($squads as $squad):
                $n          = (int) $squad['numero'];
                $idPainel   = 'squad-painel-' . $n;
                $qtd        = count($squad['membros']);
                $rotuloQtd  = $qtd === 0 ? 'Em breve' : $qtd . ($qtd === 1 ? ' aluno' : ' alunos');
            ?>
            <li class="squad" id="squad-<?= $n ?>">
                <h2 class="squad-titulo">
                    <button type="button" class="squad-toggle" aria-expanded="false" aria-controls="<?= $idPainel ?>">
                        <span class="squad-etiqueta">Squad <?= $n ?></span>
                        <span class="squad-nome"><?= $h($squad['nome']) ?></span>
                        <span class="squad-qtd"><?= $h($rotuloQtd) ?></span>
                        <svg class="squad-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                </h2>

                <div class="squad-panel" id="<?= $idPainel ?>" role="region" aria-label="Integrantes do squad <?= $n ?>, <?= $h($squad['nome']) ?>">
                    <div class="squad-panel-inner">
                        <?php if ($qtd === 0): ?>
                            <p class="squad-vazio">Os integrantes deste squad ainda não foram cadastrados.</p>
                        <?php else: ?>
                            <ul class="membros">
                                <?php foreach ($squad['membros'] as $membro): ?>
                                <li class="membro">
                                    <span class="membro-avatar" aria-hidden="true"><?= $h($membro['iniciais']) ?></span>
                                    <span class="membro-info">
                                        <span class="membro-nome"><?= $h($membro['nome']) ?></span>
                                        <?php if (!empty($membro['techLead'])): ?>
                                            <span class="membro-tl">Tech Lead</span>
                                        <?php endif; ?>
                                    </span>
                                    <?php if (!empty($membro['githubUrl'])): ?>
                                        <a class="btn-github" href="<?= $h($membro['githubUrl']) ?>" target="_blank" rel="noopener noreferrer"
                                           aria-label="Abrir o GitHub de <?= $h($membro['nome']) ?> (abre em nova aba)">
                                            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                                            <span>GitHub</span>
                                        </a>
                                    <?php else: ?>
                                        <span class="btn-github is-desativado" aria-disabled="true" title="GitHub ainda não informado"
                                              aria-label="GitHub de <?= $h($membro['nome']) ?> ainda não informado">
                                            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                                            <span>GitHub</span>
                                        </span>
                                    <?php endif; ?>
                                </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                    </div>
                </div>
            </li>
            <?php endforeach; ?>
        </ul>
    </section>
</main>
<!-- 
<footer class="sobre-rodape">
    <p>The Farmer Edu — projeto das turmas de Aprendizagem em Assistente de Programação Web do SENAI.</p>
</footer> -->

<script src="<?= $h($base) ?>/sobre/file?type=js&file=sobre.js" defer></script>
</body>
</html>
