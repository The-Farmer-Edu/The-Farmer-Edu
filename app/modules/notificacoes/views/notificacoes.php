
<?php
$notificacoes = $notificacoes ?? [];
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Notificações - Farmer Edu</title>

<style>
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    background: #f4f6fa;
    color: #24344a;
    font-family: Arial, sans-serif;
}

.container {
    max-width: 900px;
    margin: 45px auto;
    padding: 20px;
}

.topo {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
}

h1 {
    font-size: 30px;
    margin: 0 0 10px;
}

.subtitulo {
    color: #718096;
    margin: 0;
}

button {
    border: none;
    border-radius: 9px;
    padding: 11px 16px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.2s;
}

button:hover:not(:disabled) {
    transform: translateY(-2px);
    opacity: 0.9;
}

button:focus-visible,
input:focus-visible {
    outline: 3px solid #78a9f8;
    outline-offset: 2px;
}

.btn-verde {
    background: #239447;
    color: white;
}

.btn-cinza {
    background: #e7edf3;
    color: #35465b;
}

.resumo {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin: 30px 0;
}

.resumo-card {
    flex: 1;
    min-width: 150px;
    background: white;
    padding: 20px;
    border-radius: 13px;
    box-shadow: 0 3px 12px #0000000a;
}

.resumo-card strong {
    display: block;
    font-size: 27px;
    margin-bottom: 7px;
}

.resumo-card span {
    font-size: 13px;
    color: #718096;
}

.pesquisa {
    margin-bottom: 20px;
}

.pesquisa input {
    width: 100%;
    padding: 15px;
    border: 1px solid #dce2eb;
    border-radius: 10px;
    font-size: 15px;
    background: white;
}

.pesquisa input:focus {
    outline: none;
    border-color: #258b45;
    box-shadow: 0 0 0 3px #258b4520;
}

.filtros {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 25px;
}

.filtros button {
    background: white;
    color: #43536b;
    border: 1px solid #e1e5ed;
}

.filtros button.ativo {
    background: #253c58;
    color: white;
    border-color: #253c58;
}

.notificacao {
    background: white;
    border-radius: 13px;
    padding: 24px;
    margin-bottom: 16px;
    border-left: 6px solid;
    box-shadow: 0 3px 12px #0000000a;
    transition: 0.2s;
}

.notificacao:hover {
    box-shadow: 0 6px 20px #00000014;
}

.entregue {
    border-color: #25a84d;
}

.pendente {
    border-color: #f0b400;
}

.atrasado {
    border-color: #e34e59;
}

.notificacao-topo {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.status {
    display: inline-block;
    padding: 7px 13px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
}

.entregue .status {
    background: #dcf7e4;
    color: #168038;
}

.pendente .status {
    background: #fff1bd;
    color: #916800;
}

.atrasado .status {
    background: #ffe2e5;
    color: #b72d3c;
}

.indicador {
    background: #e8f0ff;
    color: #2760bb;
    border-radius: 20px;
    padding: 6px 10px;
    font-size: 12px;
}

.notificacao h3 {
    margin: 18px 0 10px;
    font-size: 19px;
}

.mensagem {
    color: #64748b;
    line-height: 1.6;
}

.data {
    font-size: 13px;
    color: #8994a5;
    margin: 15px 0;
}

.lida {
    opacity: 0.65;
}

.lida .indicador {
    display: none;
}

.vazio {
    text-align: center;
    background: white;
    padding: 45px 20px;
    border-radius: 13px;
    color: #718096;
}

[hidden] {
    display: none !important;
}

@media (max-width: 600px) {
    .container {
        margin: 15px auto;
        padding: 15px;
    }

    h1 {
        font-size: 25px;
    }

    .resumo-card {
        min-width: 120px;
    }

    .topo .btn-verde {
        width: 100%;
    }
}
</style>
</head>

<body>

<main class="container">

    <header class="topo">
        <div>
            <h1>🔔 Minhas Notificações</h1>
            <p class="subtitulo">
                Acompanhe suas atividades no Farmer Edu.
            </p>
        </div>

        <button class="btn-verde" onclick="marcarTodas()">
            ✓ Marcar todas como lidas
        </button>
    </header>

    <section class="resumo">
        <div class="resumo-card">
            <strong id="total">0</strong>
            <span>Total de notificações</span>
        </div>

        <div class="resumo-card">
            <strong id="contador">0</strong>
            <span>Não lidas</span>
        </div>

        <div class="resumo-card">
            <strong id="quantidadePendentes">0</strong>
            <span>Atividades pendentes</span>
        </div>
    </section>

    <div class="pesquisa">
        <input
            type="search"
            id="pesquisa"
            placeholder="🔎 Pesquisar notificações..."
            oninput="aplicarFiltro()"
            aria-label="Pesquisar notificações"
        >
    </div>

    <nav class="filtros" aria-label="Filtros de notificações">
        <button class="ativo" onclick="filtrar('todas', this)" aria-pressed="true">Todas</button>
        <button onclick="filtrar('entregue', this)" aria-pressed="false">🟢 Entregues</button>
        <button onclick="filtrar('pendente', this)" aria-pressed="false">🟡 Pendentes</button>
        <button onclick="filtrar('atrasado', this)" aria-pressed="false">🔴 Atrasadas</button>
        <button onclick="filtrar('nao-lidas', this)" aria-pressed="false">🔔 Não lidas</button>
    </nav>

    <section id="lista" aria-label="Lista de notificações">

        <?php foreach ($notificacoes as $n): ?>
            <?php
                $status = $n['status'] ?? 'pendente';

                $titulosStatus = [
                    'entregue' => 'Entregue',
                    'pendente' => 'Pendente',
                    'atrasado' => 'Atrasado'
                ];

                if (!isset($titulosStatus[$status])) {
                    $status = 'pendente';
                }

                $titulo = (string) ($n['titulo'] ?? '');
                $mensagem = (string) ($n['mensagem'] ?? '');
                $data = (string) ($n['data'] ?? '');

                $chave = hash(
                    'sha256',
                    $titulo . '|' . $mensagem . '|' . $data
                );
            ?>

            <article
                class="notificacao <?= $status ?>"
                data-status="<?= $status ?>"
                data-chave="<?= htmlspecialchars($chave, ENT_QUOTES, 'UTF-8') ?>"
            >

                <div class="notificacao-topo">
                    <span class="status">
                        <?= $titulosStatus[$status] ?>
                    </span>

                    <span class="indicador">● Nova</span>
                </div>

                <h3>
                    <?= htmlspecialchars($titulo, ENT_QUOTES, 'UTF-8') ?>
                </h3>

                <p class="mensagem">
                    <?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?>
                </p>

                <p class="data">
                    📅 <?= htmlspecialchars($data, ENT_QUOTES, 'UTF-8') ?>
                </p>

                <button class="btn-verde botao-leitura"
                        onclick="alternarLeitura(this)">
                    ✓ Marcar como lida
                </button>

            </article>

        <?php endforeach; ?>

    </section>

    <p id="vazio" class="vazio" hidden>
        🔔 Nenhuma notificação encontrada.
    </p>

</main>

<script>
let filtroAtual = 'todas';
const chaveArmazenamento = 'farmerEduNotificacoesLidas';

function obterLidas() {
    try {
        const dados = JSON.parse(
            localStorage.getItem(chaveArmazenamento) || '[]'
        );

        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        return [];
    }
}

function salvarLidas(lidas) {
    try {
        localStorage.setItem(
            chaveArmazenamento,
            JSON.stringify(lidas)
        );
    } catch (erro) {
        console.warn('Não foi possível salvar as notificações.');
    }
}

function atualizarResumo() {
    const cards = document.querySelectorAll('.notificacao');

    document.getElementById('total').textContent =
        cards.length;

    document.getElementById('contador').textContent =
        document.querySelectorAll('.notificacao:not(.lida)').length;

    document.getElementById('quantidadePendentes').textContent =
        document.querySelectorAll('.notificacao.pendente').length;
}

function atualizarBotao(card) {
    const botao = card.querySelector('.botao-leitura');
    const lida = card.classList.contains('lida');

    botao.textContent = lida
        ? '↩ Marcar como não lida'
        : '✓ Marcar como lida';

    botao.classList.toggle('btn-verde', !lida);
    botao.classList.toggle('btn-cinza', lida);
}

function alternarLeitura(botao) {
    const card = botao.closest('.notificacao');

    if (!card) return;

    card.classList.toggle('lida');

    const chave = card.dataset.chave;
    let lidas = obterLidas();

    if (card.classList.contains('lida')) {
        if (!lidas.includes(chave)) {
            lidas.push(chave);
        }
    } else {
        lidas = lidas.filter(item => item !== chave);
    }

    salvarLidas(lidas);
    atualizarBotao(card);
    atualizarResumo();
    aplicarFiltro();
}

function marcarTodas() {
    const lidas = obterLidas();

    document.querySelectorAll('.notificacao').forEach(card => {
        card.classList.add('lida');

        const chave = card.dataset.chave;

        if (!lidas.includes(chave)) {
            lidas.push(chave);
        }

        atualizarBotao(card);
    });

    salvarLidas(lidas);
    atualizarResumo();
    aplicarFiltro();
}

function aplicarFiltro() {
    let visiveis = 0;

    const pesquisa = document.getElementById('pesquisa')
        .value.toLowerCase().trim();

    document.querySelectorAll('.notificacao').forEach(card => {
        const correspondeFiltro =
            filtroAtual === 'todas' ||
            card.dataset.status === filtroAtual ||
            (filtroAtual === 'nao-lidas' &&
                !card.classList.contains('lida'));

        const titulo = card.querySelector('h3')
            .textContent.toLowerCase();

        const mensagem = card.querySelector('.mensagem')
            .textContent.toLowerCase();

        const correspondePesquisa =
            titulo.includes(pesquisa) ||
            mensagem.includes(pesquisa);

        const mostrar = correspondeFiltro && correspondePesquisa;

        card.hidden = !mostrar;

        if (mostrar) visiveis++;
    });

    document.getElementById('vazio').hidden = visiveis > 0;
}

function filtrar(tipo, botao) {
    filtroAtual = tipo;

    document.querySelectorAll('.filtros button')
        .forEach(item => {
            const ativo = item === botao;

            item.classList.toggle('ativo', ativo);
            item.setAttribute('aria-pressed', String(ativo));
        });

    aplicarFiltro();
}

function iniciar() {
    const lidas = obterLidas();

    document.querySelectorAll('.notificacao').forEach(card => {
        if (lidas.includes(card.dataset.chave)) {
            card.classList.add('lida');
        }

        atualizarBotao(card);
    });

    atualizarResumo();
    aplicarFiltro();
}

iniciar();
</script>

</body>
</html>
