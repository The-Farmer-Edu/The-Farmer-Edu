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

            
                $titulo = (string) ($n['tipo'] ?? '');
                $mensagem = (string) ($n['mensagem'] ?? '');
                $data = (string) ($n['criado_em'] ?? '');

                $chave = hash(
                    'sha256',
                    $titulo . '|' . $mensagem . '|' . $data
                );
            ?>

            <article
                class="notificacao <?= $status ?>"
                data-status="<?= $status ?>"
                data-id="<?= (int) ($n['id_notificacao'] ?? 0) ?>"
                data-lida="<?= (int) ($n['lida'] ?? 0) ?>"
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

<style>
#avisos-laterais{position:fixed;right:16px;top:18px;z-index:9999;display:grid;gap:10px;width:min(350px,calc(100vw - 32px));pointer-events:none}
.aviso-lateral{pointer-events:auto;background:#fff;border-left:5px solid #2f9e61;border-radius:12px;box-shadow:0 8px 30px #0003;padding:14px;display:flex;gap:10px;align-items:flex-start;animation:entrarAviso .25s ease}
.aviso-lateral strong{display:block;margin-bottom:5px}.aviso-lateral p{margin:0;overflow-wrap:anywhere}.aviso-lateral button{margin-left:auto;padding:4px 8px}
@keyframes entrarAviso{from{transform:translateX(35px);opacity:0}to{transform:translateX(0);opacity:1}}
</style>
<div id="avisos-laterais" role="status" aria-live="polite"></div>
<script>
const API_NOTIFICACOES = '/notificacoes';
let filtroAtual = 'todas';
let primeiraConsulta = true;
let idsConhecidos = new Set();
let consultaEmAndamento = false;
const lista = document.getElementById('lista');

function criarElemento(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = String(texto);
    return el;
}
function statusDaNotificacao(n) {
    if (['entregue','pendente','atrasado'].includes(n.status)) return n.status;
    if (n.tipo === 'atividade_atrasada') return 'atrasado';
    if (['atividade_entregue','nota_atribuida','atividade_publicada'].includes(n.tipo)) return 'entregue';
    return 'pendente';
}
function criarCard(n) {
    const status = statusDaNotificacao(n);
    const card = criarElemento('article', 'notificacao ' + status + (Number(n.lida) ? ' lida' : ''));
    card.dataset.id = String(n.id_notificacao);
    card.dataset.status = status;
    card.dataset.lida = String(Number(n.lida) ? 1 : 0);
    const topo = criarElemento('div','notificacao-topo');
    topo.append(criarElemento('span','status',({entregue:'Entregue',pendente:'Pendente',atrasado:'Atrasado'})[status]));
    topo.append(criarElemento('span','indicador','● Nova'));
    card.append(topo, criarElemento('h3','',n.tipo || 'Notificação'), criarElemento('p','mensagem',n.mensagem || ''), criarElemento('p','data','📅 ' + (n.criado_em || '')));
    const botao = criarElemento('button','botao-leitura');
    botao.type = 'button';
    botao.addEventListener('click', () => alternarLeitura(botao));
    card.append(botao);
    atualizarBotao(card);
    return card;
}
function atualizarBotao(card) {
    const lida = card.classList.contains('lida');
    const botao = card.querySelector('.botao-leitura');
    botao.textContent = lida ? '↩ Marcar como não lida' : '✓ Marcar como lida';
    botao.classList.toggle('btn-verde', !lida);
    botao.classList.toggle('btn-cinza', lida);
}
function atualizarResumo() {
    const cards = [...lista.querySelectorAll('.notificacao')];
    document.getElementById('total').textContent = cards.length;
    document.getElementById('contador').textContent = cards.filter(c => !c.classList.contains('lida')).length;
    document.getElementById('quantidadePendentes').textContent = cards.filter(c => c.dataset.status === 'pendente').length;
}
function aplicarFiltro() {
    const pesquisa = document.getElementById('pesquisa').value.toLowerCase().trim();
    let visiveis = 0;
    lista.querySelectorAll('.notificacao').forEach(card => {
        const texto = (card.querySelector('h3').textContent + ' ' + card.querySelector('.mensagem').textContent).toLowerCase();
        const filtro = filtroAtual === 'todas' || card.dataset.status === filtroAtual || (filtroAtual === 'nao-lidas' && !card.classList.contains('lida'));
        card.hidden = !(filtro && texto.includes(pesquisa));
        if (!card.hidden) visiveis++;
    });
    document.getElementById('vazio').hidden = visiveis > 0;
}
function filtrar(tipo, botao) {
    filtroAtual = tipo;
    document.querySelectorAll('.filtros button').forEach(b => {
        b.classList.toggle('ativo', b === botao);
        b.setAttribute('aria-pressed', String(b === botao));
    });
    aplicarFiltro();
}
function mostrarAviso(n) {
    const aviso = criarElemento('div','aviso-lateral');
    const conteudo = criarElemento('div');
    conteudo.append(criarElemento('strong','','🔔 ' + (n.tipo || 'Nova notificação')), criarElemento('p','',n.mensagem || ''));
    const fechar = criarElemento('button','','×');
    fechar.type = 'button';
    fechar.setAttribute('aria-label','Fechar aviso');
    fechar.addEventListener('click', () => aviso.remove());
    aviso.append(conteudo,fechar);
    document.getElementById('avisos-laterais').prepend(aviso);
    setTimeout(() => aviso.remove(), 8000);
}
async function consultarNotificacoes() {
    if (consultaEmAndamento) return;
    consultaEmAndamento = true;
    try {
        const resposta = await fetch(API_NOTIFICACOES + '/consultar', {credentials:'same-origin',cache:'no-store'});
        if (!resposta.ok) throw new Error('Consulta HTTP ' + resposta.status);
        const dados = await resposta.json();
        const notificacoes = dados.notificacoes || [];
        const novosIds = new Set(notificacoes.map(n => String(n.id_notificacao)));
        if (!primeiraConsulta) notificacoes.filter(n => !idsConhecidos.has(String(n.id_notificacao)) && !Number(n.lida)).slice().reverse().forEach(mostrarAviso);
        idsConhecidos = novosIds;
        primeiraConsulta = false;
        lista.replaceChildren(...notificacoes.map(criarCard));
        atualizarResumo();
        aplicarFiltro();
    } catch (erro) { console.warn('Falha ao consultar notificações:',erro); }
    finally { consultaEmAndamento = false; }
}
async function alterarLeitura(id,lida) {
    const resposta = await fetch(API_NOTIFICACOES + '/marcar-lida', {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({id_notificacao:id,lida:lida ? 1 : 0})});
    const dados = await resposta.json();
    if (!resposta.ok || !dados.sucesso) throw new Error('Não foi possível salvar a leitura');
}
async function alternarLeitura(botao) {
    const card = botao.closest('.notificacao');
    botao.disabled = true;
    try { await alterarLeitura(card.dataset.id, !card.classList.contains('lida')); await consultarNotificacoes(); }
    catch (erro) { alert(erro.message); }
    finally { botao.disabled = false; }
}
async function marcarTodas() {
    try {
        const resposta = await fetch(API_NOTIFICACOES + '/marcar-todas',{method:'POST',credentials:'same-origin'});
        const dados = await resposta.json();
        if (!resposta.ok || !dados.sucesso) throw new Error('Não foi possível marcar todas');
        await consultarNotificacoes();
    } catch (erro) { alert(erro.message); }
}
consultarNotificacoes();
setInterval(consultarNotificacoes, 3000);
</script>

</body>
</html>
