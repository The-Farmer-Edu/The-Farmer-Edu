// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · falas.js
// Falas OCASIONAIS em balões pixelados acima das cabeças (mesmo estilo de balão da cena do celeiro).
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta;
  const MAXIMO_DE_BALOES_VISIVEIS = 2, FOLGA = 3;
  const RESPOSTAS = [
    { de: 'batman', para: 'coringa', chance: 0.55, atraso: [0.9, 1.7] },
    { de: 'hulk', para: 'venom', chance: 0.4, atraso: [1.1, 2.0] },
    { de: 'venom', para: 'hulk', chance: 0.25, atraso: [1.2, 2.2] },
    { de: 'ultron', para: 'destino', chance: 0.3, atraso: [1.3, 2.3] },
  ];
  let camadaDosBaloes = null, tela = null, personagemPorId = {}, proximaFalaPorId = {}, baloesAtivos = [], respostasPendentes = [], tempoAtual = 0;

  const escalaDaTela = () => tela.getBoundingClientRect().width / cavernaSecreta.LARGURA;
  const caixaDoBalao = (ancoraX, ancoraY, largura, altura) => ({ x0: ancoraX - largura / 2, x1: ancoraX + largura / 2, y0: ancoraY - altura, y1: ancoraY });
  const caixasSeCruzam = (primeira, segunda) => primeira.x0 < segunda.x1 + FOLGA && segunda.x0 < primeira.x1 + FOLGA && primeira.y0 < segunda.y1 + FOLGA && segunda.y0 < primeira.y1 + FOLGA;

  const falar = (id, fraseEscolhida) => {
    const personagem = personagemPorId[id];
    if (!personagem || baloesAtivos.length >= MAXIMO_DE_BALOES_VISIVEIS || baloesAtivos.some(balao => balao.id === id)) return false;
    const configuracaoDeFalas = personagem.definicao.falas;
    const texto = fraseEscolhida || configuracaoDeFalas.frases[Math.floor(Math.random() * configuracaoDeFalas.frases.length)];
    const elemento = document.createElement('div');
    elemento.className = 'balao-da-caverna';
    elemento.textContent = texto;
    elemento.dataset.quem = id;
    camadaDosBaloes.appendChild(elemento);
    const escala = escalaDaTela(), largura = elemento.offsetWidth / escala, altura = elemento.offsetHeight / escala;
    let [ancoraX, ancoraY] = personagem.ponto(configuracaoDeFalas.ancora[0], configuracaoDeFalas.ancora[1]);
    ancoraX = Math.max(FOLGA + largura / 2, Math.min(cavernaSecreta.LARGURA - FOLGA - largura / 2, ancoraX));
    if (ancoraY - altura < FOLGA) ancoraY = FOLGA + altura;
    let caixa = caixaDoBalao(ancoraX, ancoraY, largura, altura);
    if (baloesAtivos.some(balao => caixasSeCruzam(balao.caixa, caixa))) { ancoraY -= altura + FOLGA * 2; caixa = caixaDoBalao(ancoraX, ancoraY, largura, altura); }
    if (ancoraY - altura < FOLGA || baloesAtivos.some(balao => caixasSeCruzam(balao.caixa, caixa))) { elemento.remove(); return false; }
    elemento.style.left = (ancoraX * escala) + 'px';
    elemento.style.top = (ancoraY * escala) + 'px';
    requestAnimationFrame(() => elemento.classList.add('visivel'));
    baloesAtivos.push({ id, elemento, caixa, ate: tempoAtual + 2.2 + texto.length * 0.07 });
    if (typeof cavernaSecreta.tocarSomBalao === 'function') cavernaSecreta.tocarSomBalao();
    if (configuracaoDeFalas.gesto && personagem.fazerGesto) personagem.fazerGesto(configuracaoDeFalas.gesto);
    for (const resposta of RESPOSTAS) {
      if (resposta.de === id && personagemPorId[resposta.para] && Math.random() < resposta.chance) respostasPendentes.push({ id: resposta.para, quando: tempoAtual + cavernaSecreta.sortearEntre(resposta.atraso[0], resposta.atraso[1]) });
    }
    return true;
  };
  const apagarBalao = balao => {
    balao.elemento.classList.remove('visivel');
    balao.elemento.classList.add('saindo');
    setTimeout(() => balao.elemento.remove(), 400);
  };

  cavernaSecreta.falas = {
    iniciar(conteiner, elementoDaTela, personagens) {
      tela = elementoDaTela;
      camadaDosBaloes = document.createElement('div');
      camadaDosBaloes.id = 'falas-da-caverna';
      conteiner.appendChild(camadaDosBaloes);
      for (const personagem of personagens) if (personagem.definicao.falas) {
        personagemPorId[personagem.id] = personagem;
        const configuracaoDeFalas = personagem.definicao.falas;
        proximaFalaPorId[personagem.id] = cavernaSecreta.sortearEntre(configuracaoDeFalas.primeira[0], configuracaoDeFalas.primeira[1]);
      }
    },
    atualizar(segundosDoQuadro, tempo) {
      if (!camadaDosBaloes) return;
      tempoAtual = tempo;
      const retanguloDaTela = tela.getBoundingClientRect();
      if (camadaDosBaloes.style.width !== retanguloDaTela.width + 'px' || camadaDosBaloes.style.left !== retanguloDaTela.left + 'px' || camadaDosBaloes.style.top !== retanguloDaTela.top + 'px') {
        Object.assign(camadaDosBaloes.style, { left: retanguloDaTela.left + 'px', top: retanguloDaTela.top + 'px', width: retanguloDaTela.width + 'px', height: retanguloDaTela.height + 'px' });
        cavernaSecreta.falas.ajustar();
      }
      for (let indice = baloesAtivos.length - 1; indice >= 0; indice--) if (tempo >= baloesAtivos[indice].ate) { apagarBalao(baloesAtivos[indice]); baloesAtivos.splice(indice, 1); }
      for (let indice = respostasPendentes.length - 1; indice >= 0; indice--) {
        const resposta = respostasPendentes[indice];
        if (tempo >= resposta.quando && (falar(resposta.id) || tempo > resposta.quando + 2.5)) respostasPendentes.splice(indice, 1);
      }
      if (respostasPendentes.length) return;
      for (const id in proximaFalaPorId) if (tempo >= proximaFalaPorId[id]) {
        const configuracaoDeFalas = personagemPorId[id].definicao.falas;
        proximaFalaPorId[id] = tempo + (falar(id) ? cavernaSecreta.sortearEntre(configuracaoDeFalas.intervalo[0], configuracaoDeFalas.intervalo[1]) : cavernaSecreta.sortearEntre(1.5, 4));
      }
    },
    ajustar() {
      if (!camadaDosBaloes) return;
      const escala = escalaDaTela();
      for (const balao of baloesAtivos) { balao.elemento.style.left = ((balao.caixa.x0 + balao.caixa.x1) / 2 * escala) + 'px'; balao.elemento.style.top = (balao.caixa.y1 * escala) + 'px'; }
    },
    limpar() {
      if (typeof cavernaSecreta.pararSonsBalao === 'function') cavernaSecreta.pararSonsBalao();
      for (const balao of baloesAtivos) balao.elemento.remove();
      baloesAtivos = [];
      respostasPendentes = [];
    },
    visiveis: () => baloesAtivos.map(balao => ({ id: balao.id, texto: balao.elemento.textContent, caixa: balao.caixa })),
    forcar: (id, frase) => falar(id, frase),
    diagnostico: () => ({ tempo: +tempoAtual.toFixed(1), ativos: baloesAtivos.length, pendentes: respostasPendentes.length, proximas: Object.fromEntries(Object.entries(proximaFalaPorId).map(([id, quando]) => [id, +(quando - tempoAtual).toFixed(1)])) }),
  };
})();