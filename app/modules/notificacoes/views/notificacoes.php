<?php
$notificacoes = $notificacoes ?? [];

// Endereços gerados pelo PHP (funcionam em qualquer pasta do servidor):
//   modo rota:   /pasta/index.php?rota=/notificacoes
//   URL limpa:   /pasta/notificacoes
$nomeScript  = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
$diretorio   = rtrim(str_replace('\\', '/', dirname($nomeScript)), '/');
$modoRota    = isset($_GET['rota']);
$urlManifest = $modoRota
    ? $nomeScript . '?rota=/notificacoes/manifest.json'
    : $diretorio . '/notificacoes/manifest.json';

// Títulos e status por tipo: edite em tipos.php.
$tipos = require __DIR__ . '/../tipos.php';

$titulosPorTipo = [];
$statusPorTipo  = [];

foreach ($tipos as $chaveTipo => $infoTipo) {
    $titulosPorTipo[$chaveTipo] = $infoTipo['titulo'];
    $statusPorTipo[$chaveTipo]  = $infoTipo['status'];
}
?><!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Notificações - Farmer Edu</title>
<meta name="theme-color" content="#22c55e">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="manifest" href="<?= htmlspecialchars($urlManifest, ENT_QUOTES, 'UTF-8') ?>">

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
[hidden] {
    display: none !important;
}

.push-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    margin: 20px 0;
    padding: 16px 20px;
    background: #ffffff;
    border-left: 5px solid #22c55e;
    border-radius: 14px;
    box-shadow: 0 2px 10px #0001;
}

.push-box strong {
    display: block;
    margin-bottom: 4px;
    color: #24344a;
}

.push-box p {
    margin: 0;
    font-size: 14px;
    color: #51627a;
}

/* BALÃO DE NOTIFICAÇÃO (estilo toast do Windows) */
.phone-notification {
    position: fixed;
    bottom: 20px;
    right: -420px;
    width: calc(100% - 32px);
    max-width: 360px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 40px 14px 16px;
    background: rgba(30, 41, 59, 0.96);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    user-select: none;
    z-index: 9999;
    opacity: 0;
    pointer-events: none;
    transition: right 0.3s ease-out, opacity 0.3s ease-out;
}

.phone-notification.show {
    right: 20px;
    opacity: 1;
    pointer-events: auto;
}

.phone-notification .app-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 6px;
    background: linear-gradient(135deg, #22c55e, #15803d);
    font-size: 18px;
    color: #ffffff;
}

.phone-notification .notification-content {
    flex: 1;
    min-width: 0;
}

.phone-notification .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
}

.phone-notification .app-name {
    font-size: 0.75rem;
    font-weight: 600;
    color: #a1a1aa;
}

.phone-notification .time-stamp {
    font-size: 0.7rem;
    color: #71717a;
}

.phone-notification .sender-name {
    margin-bottom: 2px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.phone-notification .message-text {
    font-size: 0.825rem;
    line-height: 1.35;
    color: #d4d4d8;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.phone-notification .close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border-radius: 4px;
    background: transparent;
    font-size: 14px;
    font-weight: normal;
    color: #a1a1aa;
}

.phone-notification .close-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    transform: none;
    opacity: 1;
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

        <button class="btn-verde" id="btn-marcar-todas" onclick="marcarTodas()">
            ✓ Marcar todas como lidas
        </button>
    </header>

    <section class="push-box" id="push-box" hidden>
        <div>
            <strong>🔔 Alertas no celular e no PC</strong>
            <p id="push-texto"></p>
        </div>

        <button type="button" class="btn-verde" id="push-botao" hidden></button>
    </section>

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
                $titulosStatus = [
                    'entregue' => 'Entregue',
                    'pendente' => 'Pendente',
                    'atrasado' => 'Atrasado'
                ];

                $tipo = (string) ($n['tipo'] ?? '');

                // Usa o status da tabela se existir e for válido; senão deriva do tipo.
                $status = $n['status'] ?? ($statusPorTipo[$tipo] ?? 'pendente');
                if (!isset($titulosStatus[$status])) {
                    $status = $statusPorTipo[$tipo] ?? 'pendente';
                }

                $titulo = $titulosPorTipo[$tipo]
                    ?? ucfirst(str_replace('_', ' ', $tipo));
                $mensagem = (string) ($n['mensagem'] ?? '');
                $data = (string) ($n['criado_em'] ?? '');
            ?>

            <article
                class="notificacao <?= $status ?>"
                data-status="<?= $status ?>"
                data-id="<?= (int) ($n['id_notificacao'] ?? 0) ?>"
                data-lida="<?= (int) ($n['lida'] ?? 0) ?>"
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

<div class="phone-notification" id="balao" role="status" aria-live="polite">
    <div class="app-icon" aria-hidden="true">🔔</div>

    <div class="notification-content">
        <div class="notification-header">
            <span class="app-name">The Farmer Edu</span>
            <span class="time-stamp">Agora</span>
        </div>
        <div class="sender-name" id="balao-titulo"></div>
        <div class="message-text" id="balao-texto"></div>
    </div>

    <button type="button" class="close-btn" id="balao-fechar" aria-label="Fechar notificação">✕</button>
</div>

<script>
let filtroAtual = 'todas';
const URL_SCRIPT = <?= json_encode($nomeScript) ?>;
const URL_DIRETORIO = <?= json_encode($diretorio) ?>;
const MODO_ROTA = <?= $modoRota ? 'true' : 'false' ?>;
const ESCOPO_SW = URL_DIRETORIO + '/';

// Monta o endereço de uma rota no mesmo formato em que o sistema está sendo acessado.
function urlRota(caminho, parametros) {
    let url = MODO_ROTA
        ? URL_SCRIPT + '?rota=' + caminho
        : URL_DIRETORIO + caminho;

    if (parametros) {
        url += (url.includes('?') ? '&' : '?') + new URLSearchParams(parametros).toString();
    }

    return url;
}

const URL_MARCAR_LIDA = urlRota('/notificacoes/marcar-lida');
const URL_MARCAR_TODAS = urlRota('/notificacoes/marcar-todas');
const URL_SW = urlRota('/notificacoes/sw.js');
const URL_PUSH_CHAVE = urlRota('/notificacoes/push-chave');
const URL_PUSH_INSCREVER = urlRota('/notificacoes/push-inscrever');
const URL_PUSH_CANCELAR = urlRota('/notificacoes/push-cancelar');

const TITULOS_POR_TIPO = <?= json_encode($titulosPorTipo, JSON_UNESCAPED_UNICODE) ?>;
const STATUS_POR_TIPO = <?= json_encode($statusPorTipo) ?>;
const NOMES_STATUS = { entregue: 'Entregue', pendente: 'Pendente', atrasado: 'Atrasado' };

function atualizarResumo() {
    const cards = document.querySelectorAll('.notificacao');

    document.getElementById('total').textContent =
        cards.length;

    document.getElementById('contador').textContent =
        document.querySelectorAll('.notificacao:not(.lida)').length;

    document.getElementById('quantidadePendentes').textContent =
        document.querySelectorAll('.notificacao.pendente:not(.lida)').length;
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

// Lê a resposta como JSON; se vier outra coisa (HTML de erro, aviso do PHP), mostra no Console.
async function lerJson(resposta) {
    const texto = await resposta.text();

    try {
        return JSON.parse(texto);
    } catch (e) {
        console.error('Resposta não é JSON (status ' + resposta.status + '):', texto);
        throw new Error('Resposta inválida do servidor');
    }
}

async function alternarLeitura(botao) {
    const card = botao.closest('.notificacao');
    if (!card) return;

    const id = Number(card.dataset.id);
    const lida = card.classList.contains('lida') ? 0 : 1;

    if (!Number.isInteger(id) || id <= 0) {
        console.error('Notificação sem id válido (data-id):', card.dataset.id);
        alert('Esta notificação não tem um identificador válido.');
        return;
    }

    botao.disabled = true;

    try {
        const resposta = await fetch(URL_MARCAR_LIDA, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                id_notificacao: id,
                lida: lida
            })
        });

        const dados = await lerJson(resposta);

        if (!resposta.ok || !dados.sucesso) {
            console.error('Falha ao salvar:', resposta.status, dados);
            throw new Error(dados.erro || 'Erro ao salvar no banco');
        }

        card.classList.toggle('lida', lida === 1);
        card.dataset.lida = String(lida);

        atualizarBotao(card);
        atualizarResumo();
        aplicarFiltro();

    } catch (erro) {
        console.error(erro);
        alert('Não foi possível salvar a notificação.');
    } finally {
        botao.disabled = false;
    }
}

async function marcarTodas() {
    const cards = document.querySelectorAll('.notificacao:not(.lida)');

    if (cards.length === 0) return;

    const botao = document.getElementById('btn-marcar-todas');
    botao.disabled = true;

    try {
        const resposta = await fetch(URL_MARCAR_TODAS, {
            method: 'POST',
            credentials: 'same-origin'
        });

        const dados = await lerJson(resposta);

        if (!resposta.ok || !dados.sucesso) {
            console.error('Falha ao marcar todas:', resposta.status, dados);
            throw new Error(dados.erro || 'Erro ao salvar no banco');
        }

        cards.forEach(card => {
            card.classList.add('lida');
            card.dataset.lida = '1';
            atualizarBotao(card);
        });

        atualizarResumo();
        aplicarFiltro();
    } catch (erro) {
        console.error(erro);
        alert('Não foi possível marcar todas como lidas.');
    } finally {
        botao.disabled = false;
    }
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
    document.querySelectorAll('.notificacao').forEach(card => {
        if (card.dataset.lida === '1') {
            card.classList.add('lida');
        }

        atualizarBotao(card);
    });

    atualizarResumo();
    aplicarFiltro();
}

iniciar();
let balaoTimeout;

function tituloDoTipo(tipo) {
    const chave = String(tipo || '');

    return TITULOS_POR_TIPO[chave]
        || (chave.charAt(0).toUpperCase() + chave.slice(1).replace(/_/g, ' '))
        || 'Nova notificação';
}

function mostrarBalao(titulo, mensagem) {
    const balao = document.getElementById('balao');

    if (!balao) return;

    document.getElementById('balao-titulo').textContent = titulo;
    document.getElementById('balao-texto').textContent = mensagem;

    clearTimeout(balaoTimeout);
    balao.classList.add('show');

    // Esconde automaticamente após 5 segundos
    balaoTimeout = setTimeout(esconderBalao, 5000);
}

function esconderBalao() {
    const balao = document.getElementById('balao');

    if (balao) {
        balao.classList.remove('show');
    }
}

document.getElementById('balao').addEventListener('click', esconderBalao);

document.getElementById('balao-fechar').addEventListener('click', evento => {
    evento.stopPropagation();
    esconderBalao();
});

// Maior id já exibido na tela (0 quando a lista está vazia).
let maiorIdConhecido = Math.max(
    0,
    ...Array.from(document.querySelectorAll('.notificacao'))
        .map(card => Number(card.dataset.id) || 0)
);

function criarCard(n) {
    const tipo = String(n.tipo || '');
    const status = NOMES_STATUS[n.status] ? n.status : (STATUS_POR_TIPO[tipo] || 'pendente');
    const titulo = tituloDoTipo(tipo);

    const card = document.createElement('article');
    card.className = 'notificacao ' + status;
    card.dataset.status = status;
    card.dataset.id = String(Number(n.id_notificacao) || 0);
    card.dataset.lida = Number(n.lida) === 1 ? '1' : '0';

    const topo = document.createElement('div');
    topo.className = 'notificacao-topo';

    const spanStatus = document.createElement('span');
    spanStatus.className = 'status';
    spanStatus.textContent = NOMES_STATUS[status];

    const indicador = document.createElement('span');
    indicador.className = 'indicador';
    indicador.textContent = '● Nova';

    topo.append(spanStatus, indicador);

    const h3 = document.createElement('h3');
    h3.textContent = titulo;

    const mensagem = document.createElement('p');
    mensagem.className = 'mensagem';
    mensagem.textContent = n.mensagem || '';

    const data = document.createElement('p');
    data.className = 'data';
    data.textContent = '📅 ' + (n.criado_em || '');

    const botao = document.createElement('button');
    botao.className = 'btn-verde botao-leitura';
    botao.textContent = '✓ Marcar como lida';
    botao.addEventListener('click', () => alternarLeitura(botao));

    card.append(topo, h3, mensagem, data, botao);

    if (card.dataset.lida === '1') {
        card.classList.add('lida');
    }

    atualizarBotao(card);
    return card;
}

async function verificarNovas(opcoes) {
    const silencioso = !!(opcoes && opcoes.silencioso);

    if (document.hidden && !silencioso) return;

    try {
        const resposta = await fetch(
            urlRota('/notificacoes/verificar-novas', { depois: maiorIdConhecido }),
            { credentials: 'same-origin' }
        );

        // Sessão expirada ou erro: não tenta processar.
        if (!resposta.ok) return;

        const dados = await resposta.json();

        const novas = (dados.notificacoes || [])
            .filter(n => Number(n.id_notificacao) > maiorIdConhecido)
            .sort((a, b) => Number(a.id_notificacao) - Number(b.id_notificacao));

        if (novas.length === 0) return;

        const lista = document.getElementById('lista');

        // Das mais antigas para as mais novas: a mais nova fica no topo.
        novas.forEach(n => {
            lista.prepend(criarCard(n));
            maiorIdConhecido = Math.max(maiorIdConhecido, Number(n.id_notificacao));
        });

        atualizarResumo();
        aplicarFiltro();

        // Vindo de um push, quem avisa é a notificação do sistema (evita balão duplicado).
        if (silencioso) return;

        const naoLidas = novas.filter(n => Number(n.lida) !== 1);

        if (naoLidas.length === 1) {
            mostrarBalao(tituloDoTipo(naoLidas[0].tipo), naoLidas[0].mensagem);
        } else if (naoLidas.length > 1) {
            mostrarBalao('Novas notificações', 'Você recebeu ' + naoLidas.length + ' novas notificações.');
        }
    } catch (erro) {
        console.error('Erro ao verificar notificações:', erro);
    }
}

verificarNovas();
setInterval(verificarNovas, 5000);

// ---------------------------------------------------------------
// Alertas no celular e no PC (Web Push)
// ---------------------------------------------------------------

function urlBase64ParaUint8Array(base64) {
    const preenchimento = '='.repeat((4 - (base64.length % 4)) % 4);
    const normalizado = (base64 + preenchimento).replace(/-/g, '+').replace(/_/g, '/');
    const bruto = atob(normalizado);

    return Uint8Array.from(bruto, caractere => caractere.charCodeAt(0));
}

async function enviarAssinatura(assinatura) {
    const resposta = await fetch(URL_PUSH_INSCREVER, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assinatura.toJSON())
    });

    if (!resposta.ok) {
        throw new Error('Servidor recusou a assinatura (' + resposta.status + ')');
    }
}

function mostrarBoxPush(texto, botao) {
    const box = document.getElementById('push-box');
    const textoEl = document.getElementById('push-texto');
    const botaoEl = document.getElementById('push-botao');

    textoEl.textContent = texto;
    box.hidden = false;

    if (!botao) {
        botaoEl.hidden = true;
        botaoEl.onclick = null;
        return;
    }

    botaoEl.hidden = false;
    botaoEl.disabled = false;
    botaoEl.textContent = botao.rotulo;
    botaoEl.classList.toggle('btn-verde', !botao.cinza);
    botaoEl.classList.toggle('btn-cinza', !!botao.cinza);
    botaoEl.onclick = botao.acao;
}

async function atualizarBoxPush() {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const instalado = window.matchMedia('(display-mode: standalone)').matches
        || navigator.standalone === true;

    if (!window.isSecureContext) {
        mostrarBoxPush('Os alertas só funcionam em conexão segura (HTTPS).', null);
        return;
    }

    if (ios && !instalado) {
        mostrarBoxPush(
            'No iPhone: toque em Compartilhar → "Adicionar à Tela de Início" e abra o Farmer Edu pelo ícone para ativar os alertas.',
            null
        );
        return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        mostrarBoxPush('Este navegador não suporta alertas. Tente o Chrome, Edge, Firefox ou Safari atualizado.', null);
        return;
    }

    if (Notification.permission === 'denied') {
        mostrarBoxPush('Os alertas estão bloqueados. Libere as notificações deste site nas configurações do navegador.', null);
        return;
    }

    let assinatura = null;

    try {
        const registro = await navigator.serviceWorker.getRegistration();
        assinatura = registro ? await registro.pushManager.getSubscription() : null;
    } catch (erro) {
        console.error(erro);
    }

    if (assinatura && Notification.permission === 'granted') {
        // Garante que este aparelho está ligado ao usuário logado agora.
        enviarAssinatura(assinatura).catch(console.error);

        mostrarBoxPush('Alertas ativados neste aparelho ✓ Você será avisado mesmo com o site fechado.', {
            rotulo: 'Desativar',
            cinza: true,
            acao: desativarPush
        });
        return;
    }

    mostrarBoxPush('Receba cada notificação no celular e no PC, mesmo com o site fechado.', {
        rotulo: '🔔 Ativar alertas',
        cinza: false,
        acao: ativarPush
    });
}

async function ativarPush() {
    const botaoEl = document.getElementById('push-botao');
    botaoEl.disabled = true;

    try {
        const permissao = await Notification.requestPermission();

        if (permissao !== 'granted') {
            throw new Error('Permissão de notificação não concedida');
        }

        const registro = await navigator.serviceWorker.register(URL_SW, { scope: ESCOPO_SW });
        await navigator.serviceWorker.ready;

        const respostaChave = await fetch(URL_PUSH_CHAVE, { credentials: 'same-origin' });
        const dadosChave = await respostaChave.json();

        if (!respostaChave.ok || !dadosChave.chave) {
            throw new Error(dadosChave.erro || 'Push não configurado no servidor');
        }

        // Remove uma assinatura antiga (chaves diferentes) antes de criar a nova.
        const antiga = await registro.pushManager.getSubscription();
        if (antiga) {
            await antiga.unsubscribe();
        }

        const assinatura = await registro.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ParaUint8Array(dadosChave.chave)
        });

        await enviarAssinatura(assinatura);
    } catch (erro) {
        console.error(erro);
        alert('Não foi possível ativar os alertas: ' + erro.message);
    }

    atualizarBoxPush();
}

async function desativarPush() {
    const botaoEl = document.getElementById('push-botao');
    botaoEl.disabled = true;

    try {
        const registro = await navigator.serviceWorker.getRegistration();
        const assinatura = registro ? await registro.pushManager.getSubscription() : null;

        if (assinatura) {
            await fetch(URL_PUSH_CANCELAR, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpoint: assinatura.endpoint })
            });

            await assinatura.unsubscribe();
        }
    } catch (erro) {
        console.error(erro);
    }

    atualizarBoxPush();
}

// Quando o push chega com a tela aberta, atualiza a lista na hora.
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', evento => {
        if (evento.data && evento.data.tipo === 'nova-notificacao') {
            verificarNovas({ silencioso: true });
        }
    });
}

atualizarBoxPush();

</script>

</body>
</html>
