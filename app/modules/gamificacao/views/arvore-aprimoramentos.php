0<?php
$xpAcumulado = 1480;
$pontosDisponiveis = intdiv($xpAcumulado, 80);

$categorias = [
    'animais' => [
        'titulo' => 'Animais',
        'icone' => '🐄',
        'itens' => [
            [
                'nome' => 'Galinha Poedeira',
                'descricao' => 'Aumenta a produção de ovos e melhora a rotina da granja.',
                'custo' => [40, 110, 200],
                'nivel' => 2,
                'beneficio' => 'Produção +20%'
            ],
            [
                'nome' => 'Vaca Leiteira',
                'descricao' => 'Melhora a qualidade do leite e aumenta a quantidade por dia.',
                'custo' => [60, 130, 220],
                'nivel' => 1,
                'beneficio' => 'Leite +25%'
            ],
            [
                'nome' => 'Pasto Premium',
                'descricao' => 'Cria uma área de alimentação mais rica para os animais.',
                'custo' => [80, 160, 260],
                'nivel' => 0,
                'beneficio' => 'Saúde +15%'
            ]
        ]
    ],
    'plantacao' => [
        'titulo' => 'Plantação',
        'icone' => '🌾',
        'itens' => [
            [
                'nome' => 'Irrigação Inteligente',
                'descricao' => 'A água é usada com mais eficiência e reduz desperdícios.',
                'custo' => [50, 120, 210],
                'nivel' => 1,
                'beneficio' => 'Água -20%'
            ],
            [
                'nome' => 'Semeador Automatizado',
                'descricao' => 'A semeadura se torna mais rápida e precisa.',
                'custo' => [70, 150, 240],
                'nivel' => 0,
                'beneficio' => 'Colheita +30%'
            ],
            [
                'nome' => 'Solo Nutritivo',
                'descricao' => 'Trata o solo para garantir plantas mais fortes e resistentes.',
                'custo' => [90, 180, 290],
                'nivel' => 0,
                'beneficio' => 'Crescimento +25%'
            ]
        ]
    ],
    'maquinario' => [
        'titulo' => 'Maquinário',
        'icone' => '🚜',
        'itens' => [
            [
                'nome' => 'Trator Elétrico',
                'descricao' => 'Reduz o tempo das tarefas de plantio e manutenção.',
                'custo' => [70, 140, 250],
                'nivel' => 2,
                'beneficio' => 'Tempo -25%'
            ],
            [
                'nome' => 'Colheitadeira Turbo',
                'descricao' => 'Melhora a velocidade de colheita e reduz perdas.',
                'custo' => [90, 170, 270],
                'nivel' => 0,
                'beneficio' => 'Colheita +35%'
            ],
            [
                'nome' => 'Bomba de Rega',
                'descricao' => 'Aumenta a capacidade de irrigação para grandes áreas.',
                'custo' => [60, 130, 220],
                'nivel' => 1,
                'beneficio' => 'Rega +20%'
            ]
        ]
    ],
    'casa' => [
        'titulo' => 'Casa Principal',
        'icone' => '🏡',
        'itens' => [
            [
                'nome' => 'Sala de Refeição',
                'descricao' => 'Cria um ambiente mais confortável para a família.',
                'custo' => [50, 100, 180],
                'nivel' => 1,
                'beneficio' => 'Conforto +15%'
            ],
            [
                'nome' => 'Quarto Familiar',
                'descricao' => 'Expande a área residencial e melhora o descanso.',
                'custo' => [80, 140, 230],
                'nivel' => 0,
                'beneficio' => 'Moradia +20%'
            ],
            [
                'nome' => 'Cozinha Moderna',
                'descricao' => 'Aumenta a eficiência de preparo de alimentos e recursos.',
                'custo' => [60, 130, 220],
                'nivel' => 0,
                'beneficio' => 'Produção +18%'
            ]
        ]
    ],
    'celeiro' => [
        'titulo' => 'Celeiro',
        'icone' => '🏠',
        'itens' => [
            [
                'nome' => 'Armazenamento de Grãos',
                'descricao' => 'Mais espaço para armazenar a colheita e reduzir perdas.',
                'custo' => [70, 150, 240],
                'nivel' => 1,
                'beneficio' => 'Capacidade +30%'
            ],
            [
                'nome' => 'Ferramentas Premium',
                'descricao' => 'Melhora o uso de ferramentas para tarefas do dia a dia.',
                'custo' => [80, 160, 260],
                'nivel' => 0,
                'beneficio' => 'Eficiência +25%'
            ],
            [
                'nome' => 'Área de Manutenção',
                'descricao' => 'Cria um espaço para consertos e melhorias dos equipamentos.',
                'custo' => [90, 180, 300],
                'nivel' => 0,
                'beneficio' => 'Manutenção +20%'
            ]
        ]
    ]
];

$contadorTotal = 0;
$contadorDesbloqueados = 0;
foreach ($categorias as $categoria) {
    $contadorTotal += count($categoria['itens']);
    $contadorDesbloqueados += count(array_filter($categoria['itens'], fn ($item) => (int) $item['nivel'] > 0));
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Árvore de Aprimoramentos</title>
    <style>
        :root {
            --bg: #f5f7f0;
            --panel: #ffffff;
            --panel-soft: #edf7ee;
            --primary: #34c759;
            --primary-dark: #1e8a44;
            --primary-strong: #0d5c34;
            --ink: #002d38;
            --muted: #727272;
            --line: #dfeadf;
            --warning: #f9d767;
            --danger: #d95d5d;
            --shadow: 0 18px 40px rgba(0, 45, 56, 0.12);
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: linear-gradient(180deg, #eef7ef 0%, #f5f7f0 100%);
            color: var(--ink);
        }

        .tree-page {
            min-height: 100vh;
            padding: 32px 24px 56px;
        }

        .tree-shell {
            max-width: 100%;
            margin: 0 auto;
        }

        .topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 24px 28px;
            border-radius: 24px;
            background: rgba(255,255,255,0.82);
            box-shadow: var(--shadow);
            backdrop-filter: blur(4px);
            border: 1px solid rgba(52, 199, 89, 0.14);
            margin-bottom: 28px;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 14px;
            font-weight: 700;
            font-size: 1.15rem;
        }

        .brand-mark {
            width: 52px;
            height: 52px;
            border-radius: 16px;
            display: grid;
            place-items: center;
            background: linear-gradient(180deg, var(--primary), var(--primary-dark));
            color: white;
            font-size: 1.6rem;
            box-shadow: 0 10px 20px rgba(30, 138, 68, 0.25);
        }

        .points-panel {
            display: flex;
            align-items: center;
            gap: 18px;
            background: linear-gradient(135deg, rgba(52, 199, 89, 0.12), rgba(0, 45, 56, 0.06));
            border: 1px solid rgba(52, 199, 89, 0.18);
            border-radius: 18px;
            padding: 14px 18px;
            min-width: 240px;
            justify-content: center;
        }

        .points-label {
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--muted);
        }

        .points-value {
            font-size: 2rem;
            font-weight: 800;
            color: var(--primary-strong);
            line-height: 1;
        }

        .points-unit {
            font-size: 0.75rem;
            color: var(--muted);
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
        }

        .tree-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 18px;
        }

        h1 {
            margin: 0;
            font-size: clamp(2rem, 3vw, 3rem);
            color: var(--ink);
        }

        .tree-legend {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 0.82rem;
            color: var(--muted);
            flex-wrap: wrap;
        }

        .legend-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            background: var(--panel);
            border: 1px solid var(--line);
            font-weight: 700;
        }

        .legend-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
        }

        .legend-dot.ready { background: var(--primary); }
        .legend-dot.blocked { background: #cfd7cf; }
        .legend-dot.max { background: var(--warning); }

        .tree-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
        }

        .category-card {
            position: relative;
            background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(237,247,238,0.95));
            border: 1px solid var(--line);
            border-radius: 26px;
            box-shadow: var(--shadow);
            padding: 18px 16px 16px;
            overflow: hidden;
        }

        .category-card::before {
            content: "";
            position: absolute;
            inset: 0 auto auto 0;
            width: 100%;
            height: 8px;
            background: linear-gradient(90deg, var(--primary), var(--primary-dark));
        }

        .category-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            padding-top: 8px;
        }

        .category-icon {
            width: 48px;
            height: 48px;
            border-radius: 16px;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, var(--primary-soft, #eafaf0), rgba(52, 199, 89, 0.14));
            font-size: 1.45rem;
            box-shadow: inset 0 0 0 1px rgba(52, 199, 89, 0.15);
        }

        .category-header h2 {
            margin: 0;
            font-size: 1.2rem;
        }

        .counter {
            margin-top: 3px;
            font-size: 0.75rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--muted);
        }

        .branch {
            display: flex;
            flex-direction: column;
            gap: 14px;
            position: relative;
        }

        .branch::before {
            content: "";
            position: absolute;
            left: 20px;
            top: 10px;
            bottom: 14px;
            width: 2px;
            background: linear-gradient(180deg, rgba(52,199,89,0.8), rgba(0,45,56,0.1));
            border-radius: 10px;
        }

        .upgrade-node {
            position: relative;
            margin-left: 34px;
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 14px 14px 12px 18px;
            box-shadow: 0 8px 18px rgba(0, 45, 56, 0.05);
        }

        .upgrade-node::before {
            content: "";
            position: absolute;
            left: -18px;
            top: 18px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--primary);
            box-shadow: 0 0 0 5px rgba(52, 199, 89, 0.12);
        }

        .upgrade-node.locked {
            opacity: 0.75;
            border-style: dashed;
        }

        .upgrade-node.locked::before {
            background: #d9dfd9;
            box-shadow: 0 0 0 5px rgba(114, 114, 114, 0.08);
        }

        .upgrade-node.maxed::before {
            background: var(--warning);
            box-shadow: 0 0 0 5px rgba(249, 215, 103, 0.12);
        }

        .upgrade-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(52, 199, 89, 0.12);
            color: var(--primary-strong);
            border: 1px solid rgba(52, 199, 89, 0.2);
            border-radius: 999px;
            padding: 5px 10px;
            font-size: 0.72rem;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            margin-bottom: 10px;
        }

        .upgrade-arrow {
            font-size: 1.05rem;
            color: var(--primary-dark);
            margin-left: 6px;
        }

        .upgrade-head {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            align-items: center;
            margin-bottom: 8px;
        }

        .upgrade-head h3 {
            margin: 0;
            font-size: 1.02rem;
        }

        .level-pill {
            background: rgba(0, 45, 56, 0.05);
            color: var(--ink);
            border-radius: 999px;
            padding: 6px 10px;
            font-size: 0.7rem;
            font-weight: 800;
            border: 1px solid rgba(0, 45, 56, 0.08);
        }

        .upgrade-description {
            margin: 0 0 12px;
            color: var(--muted);
            font-size: 0.82rem;
            line-height: 1.5;
            min-height: 58px;
        }

        .upgrade-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .xp-cost {
            font-size: 0.76rem;
            color: var(--ink);
            font-weight: 800;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }

        .xp-cost strong {
            color: var(--primary-dark);
        }

        .upgrade-btn {
            appearance: none;
            border: none;
            background: linear-gradient(135deg, var(--primary), var(--primary-dark));
            color: white;
            font-weight: 800;
            padding: 9px 12px;
            border-radius: 12px;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
            box-shadow: 0 12px 18px rgba(30, 138, 68, 0.2);
        }

        .upgrade-btn:hover:not(:disabled) {
            transform: translateY(-1px);
        }

        .upgrade-btn:disabled {
            cursor: not-allowed;
            opacity: 0.6;
            background: linear-gradient(135deg, #c9d8cd, #aab7ac);
            box-shadow: none;
        }

        @media (max-width: 840px) {
            .topbar,
            .tree-header {
                flex-direction: column;
                align-items: flex-start;
            }
        }
    </style>
</head>
<body>
    <div class="tree-page">
        <div class="tree-shell">
            <header class="topbar">
                <div class="brand">
                    <div class="brand-mark">🌱</div>
                    <span>Árvore de Aprimoramentos</span>
                </div>

                <div class="points-panel" aria-label="Pontos disponíveis">
                    <div>
                        <div class="points-label">Pontos disponíveis</div>
                    </div>
                    <div>
                        <span class="points-value" id="available-points"><?= htmlspecialchars((string) $pontosDisponiveis) ?></span>
                        <span class="points-unit">pts</span>
                    </div>
                </div>
            </header>

            <div class="tree-header">
                <h1>Melhorias da Fazenda</h1>

                <div class="tree-legend" aria-label="Legenda da árvore">
                    <span class="legend-pill"><span class="legend-dot ready"></span> Disponível</span>
                    <span class="legend-pill"><span class="legend-dot blocked"></span> Bloqueado</span>
                    <span class="legend-pill"><span class="legend-dot max"></span> Nível máximo</span>
                </div>
            </div>

            <main class="tree-grid" aria-label="Árvore de aprimoramentos por categoria">
                <?php foreach ($categorias as $key => $categoria):
                    $desbloqueados = count(array_filter($categoria['itens'], fn ($item) => (int) $item['nivel'] > 0));
                    $total = count($categoria['itens']);
                ?>
                    <section class="category-card" data-category="<?= htmlspecialchars($key) ?>">
                        <div class="category-header">
                            <div class="category-icon" aria-hidden="true"><?= htmlspecialchars($categoria['icone']) ?></div>
                            <div>
                                <h2><?= htmlspecialchars($categoria['titulo']) ?></h2>
                                <div class="counter"><?= htmlspecialchars((string) $desbloqueados) ?> / <?= htmlspecialchars((string) $total) ?> desbloqueados</div>
                            </div>
                        </div>

                        <div class="branch">
                            <?php foreach ($categoria['itens'] as $index => $item):
                                $nivelAtual = min((int) $item['nivel'], 3);
                                $proximoNivel = $nivelAtual >= 3 ? 3 : $nivelAtual + 1;
                                $custoAtual = $item['custo'][$nivelAtual] ?? $item['custo'][count($item['custo']) - 1];
                                $estadoClasse = $nivelAtual >= 3 ? 'maxed' : ($nivelAtual > 0 ? 'active' : 'locked');
                                $labelUpgrade = $nivelAtual >= 3 ? 'NÍVEL MÁXIMO' : 'UPGRADE: LEVEL ' . $proximoNivel;
                                $buttonText = $nivelAtual >= 3 ? 'Máximo' : 'Desbloquear';
                            ?>
                                <article class="upgrade-node <?= htmlspecialchars($estadoClasse) ?>" data-identifier="<?= htmlspecialchars($key . '-' . $index) ?>" data-xp-cost="<?= htmlspecialchars((string) $custoAtual) ?>" data-level="<?= htmlspecialchars((string) $nivelAtual) ?>">
                                    <div class="upgrade-badge">
                                        <span><?= htmlspecialchars($labelUpgrade) ?></span>
                                        <span class="upgrade-arrow" aria-hidden="true">→</span>
                                    </div>

                                    <div class="upgrade-head">
                                        <h3><?= htmlspecialchars($item['nome']) ?></h3>
                                        <span class="level-pill">Nível <?= htmlspecialchars((string) $nivelAtual) ?>/3</span>
                                    </div>

                                    <p class="upgrade-description"><?= htmlspecialchars($item['descricao']) ?> <strong><?= htmlspecialchars($item['beneficio']) ?></strong></p>

                                    <div class="upgrade-footer">
                                        <div class="xp-cost">
                                            XP necessário: <strong><?= htmlspecialchars((string) $custoAtual) ?></strong>
                                        </div>
                                        <button class="upgrade-btn" type="button" data-xp-cost="<?= htmlspecialchars((string) $custoAtual) ?>" data-level="<?= htmlspecialchars((string) $nivelAtual) ?>" data-category="<?= htmlspecialchars($key) ?>" <?= $nivelAtual >= 3 ? 'disabled' : '' ?>><?= htmlspecialchars($buttonText) ?></button>
                                    </div>
                                </article>
                            <?php endforeach; ?>
                        </div>
                    </section>
                <?php endforeach; ?>
            </main>
        </div>
    </div>

    <script>
        const availablePointsEl = document.getElementById('available-points');
        let availablePoints = Number(availablePointsEl.textContent.trim());

        const updatePoints = (nextValue) => {
            availablePoints = Math.max(0, nextValue);
            availablePointsEl.textContent = availablePoints;
        };

        document.querySelectorAll('.upgrade-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const cost = Number(button.dataset.xpCost || 0);
                const currentLevel = Number(button.dataset.level || 0);
                const card = button.closest('.upgrade-node');

                if (currentLevel >= 3) {
                    return;
                }

                if (availablePoints < cost) {
                    button.disabled = true;
                    card.classList.add('locked');
                    button.textContent = 'XP insuficiente';
                    return;
                }

                updatePoints(availablePoints - cost);

                const nextLevel = currentLevel + 1;
                const badge = card.querySelector('.upgrade-badge');
                const levelPill = card.querySelector('.level-pill');
                const xpCost = card.querySelector('.xp-cost strong');

                const nextCost = Number(card.dataset.xpCost || 0);
                const nextLevelCost = nextCost + Math.round(nextCost * 0.8);

                card.dataset.level = String(nextLevel);
                button.dataset.level = String(nextLevel);
                card.classList.remove('locked');
                card.classList.toggle('maxed', nextLevel >= 3);

                const nextLabel = nextLevel >= 3 ? 'NÍVEL MÁXIMO' : `UPGRADE: LEVEL ${nextLevel + 1}`;
                badge.innerHTML = `<span>${nextLabel}</span><span class="upgrade-arrow" aria-hidden="true">→</span>`;

                levelPill.textContent = `Nível ${nextLevel}/3`;
                xpCost.textContent = nextLevel >= 3 ? '0' : String(nextCost);
                button.textContent = nextLevel >= 3 ? 'Máximo' : 'Desbloquear';
                button.disabled = nextLevel >= 3;

                if (nextLevel >= 3) {
                    card.classList.add('maxed');
                    button.dataset.xpCost = '0';
                    card.dataset.xpCost = '0';
                } else {
                    button.dataset.xpCost = String(nextLevelCost);
                    card.dataset.xpCost = String(nextLevelCost);
                }
            });
        });
    </script>
</body>
</html>
