<?php
// View: painel do instrutor — lista as turmas
// Variaveis disponiveis: $usuario, $turmas
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Centro de Notas — Instrutor | The Farmer Edu</title>
    <meta name="description" content="Painel do instrutor para gerenciar notas das turmas no The Farmer Edu.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --verde:      #16a34a;
            --azul:       #2563eb;
            --azul-claro: #dbeafe;
            --cinza-50:   #f8fafc;
            --cinza-100:  #f1f5f9;
            --cinza-200:  #e2e8f0;
            --cinza-400:  #94a3b8;
            --cinza-600:  #475569;
            --cinza-800:  #1e293b;
            --cinza-900:  #0f172a;
            --sombra-sm: 0 1px 3px rgba(0,0,0,.08);
            --sombra-md: 0 4px 12px rgba(0,0,0,.1);
            --raio: 12px;
        }

        body { font-family: 'Inter', sans-serif; background: var(--cinza-50); color: var(--cinza-800); }

        /* TOPBAR */
        .topbar {
            background: var(--cinza-900);
            color: white;
            padding: 0 24px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 8px rgba(0,0,0,.3);
        }
        .topbar-logo { font-weight: 700; font-size: 1.1rem; color: #4ade80; text-decoration: none; display: flex; align-items: center; gap: 8px; }
        .topbar-logo span { color: white; }
        .topbar-user { display: flex; align-items: center; gap: 10px; font-size: .875rem; }
        .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #dc2626); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: .875rem; color: white; }

        /* CONTAINER */
        .container { max-width: 900px; margin: 0 auto; padding: 28px 20px 60px; }

        /* PAGE HEADER */
        .page-header { margin-bottom: 28px; }
        .page-header h1 { font-size: 1.75rem; font-weight: 700; color: var(--cinza-900); margin-bottom: 4px; }
        .page-header p { font-size: .9rem; color: var(--cinza-600); }

        /* BADGE DE PERFIL */
        .badge-perfil { display: inline-block; background: #fef3c7; color: #92400e; padding: 3px 12px; border-radius: 999px; font-size: .75rem; font-weight: 600; margin-bottom: 16px; }

        /* GRID DE TURMAS */
        .turmas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }

        .card-turma {
            background: white;
            border-radius: var(--raio);
            border: 1px solid var(--cinza-200);
            padding: 24px;
            box-shadow: var(--sombra-sm);
            text-decoration: none;
            color: inherit;
            display: block;
            transition: all .2s ease;
            position: relative;
            overflow: hidden;
        }
        .card-turma::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--azul), #4ade80);
        }
        .card-turma:hover { box-shadow: var(--sombra-md); transform: translateY(-3px); border-color: var(--azul); }

        .card-turma .icone-turma { font-size: 2.2rem; margin-bottom: 14px; display: block; }
        .card-turma h2 { font-size: 1rem; font-weight: 700; color: var(--cinza-900); margin-bottom: 6px; }
        .card-turma .curso { font-size: .82rem; color: var(--cinza-600); margin-bottom: 14px; }
        .card-turma .turno-badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 999px;
            font-size: .75rem;
            font-weight: 600;
            background: var(--azul-claro);
            color: var(--azul);
        }
        .card-turma .cta {
            margin-top: 16px;
            font-size: .82rem;
            color: var(--azul);
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        /* ESTADO VAZIO */
        .vazio { text-align: center; padding: 60px 20px; color: var(--cinza-400); }
        .vazio p { margin-top: 12px; font-size: 1rem; }
    </style>
</head>
<body>

<nav class="topbar">
    <a class="topbar-logo" href="/">🌱 <span>The Farmer</span>Edu</a>
    <div class="topbar-user">
        <div class="avatar"><?= strtoupper(substr($usuario['nome'], 0, 2)) ?></div>
        <span><?= htmlspecialchars($usuario['nome']) ?></span>
    </div>
</nav>

<div class="container">

    <header class="page-header">
        <div class="badge-perfil">👨‍🏫 Instrutor</div>
        <h1>🏫 Centro de Controle de Notas</h1>
        <p>Selecione uma turma para visualizar e lançar notas</p>
    </header>

    <?php if (empty($turmas)): ?>
        <div class="vazio">
            <p style="font-size:3rem">🌾</p>
            <p>Nenhuma turma vinculada a você ainda.</p>
        </div>
    <?php else: ?>
        <div class="turmas-grid">
            <?php
            $icones = ['🌱','🚜','🌾','🐄','🌻','🏡'];
            $i = 0;
            foreach ($turmas as $turma):
                $icone = $icones[$i % count($icones)];
                $i++;
                $turnoLabel = ['manha' => '☀️ Manhã', 'tarde' => '🌤️ Tarde', 'noite' => '🌙 Noite'];
                $turnoExib = $turnoLabel[$turma['turno']] ?? $turma['turno'];
            ?>
                <a class="card-turma" href="/notas/turma?id=<?= (int)$turma['id_turma'] ?>">
                    <span class="icone-turma"><?= $icone ?></span>
                    <h2><?= htmlspecialchars($turma['nome_turma']) ?></h2>
                    <p class="curso"><?= htmlspecialchars($turma['nome_curso']) ?></p>
                    <span class="turno-badge"><?= $turnoExib ?></span>
                    <p class="cta">Ver notas →</p>
                </a>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

</div>
</body>
</html>