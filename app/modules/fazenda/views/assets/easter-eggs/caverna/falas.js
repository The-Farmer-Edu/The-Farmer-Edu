// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · falas.js
// Falas OCASIONAIS em balões pixelados acima das cabeças (mesmo estilo de balão da cena do celeiro).
//  • Cada personagem tem o seu relógio de fala (intervalo com variação aleatória); as frases estão na definição de cada um
//    (campo `falas` em personagens/<id>.js).
//  • Os relógios usam o TEMPO DA CENA (o motor só anda com a caverna aberta): nada é agendado com setTimeout, então não há
//    temporizadores para limpar, acumular ou duplicar. Ao sair, o motor chama limpar() e os balões somem.
//  • No máximo dois balões ao mesmo tempo, nunca sobrepostos e nunca cortados na borda da cena; se não houver lugar, a fala
//    espera um pouco e tenta de novo.
//  • De vez em quando um personagem responde a outro (Batman → risada do Coringa, por exemplo). É raro, de propósito.
// Classes CSS usadas (css/11-caverna-secreta.css): .balao-da-caverna, .visivel, .saindo; camada #falas-da-caverna.
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta;
  const MAXIMO_DE_BALOES_VISIVEIS = 2, FOLGA = 3;   // folga em pixels da cena entre balões e na borda
  const RESPOSTAS = [
    { de: 'batman', para: 'coringa', chance: 0.55, atraso: [0.9, 1.7] },
    { de: 'hulk', para: 'venom', chance: 0.4, atraso: [1.1, 2.0] },
    { de: 'venom', para: 'hulk', chance: 0.25, atraso: [1.2, 2.2] },
    { de: 'ultron', para: 'destino', chance: 0.3, atraso: [1.3, 2.3] },
  ];
  let camadaDosBaloes = null, tela = null, personagemPorId = {}, proximaFalaPorId = {}, baloesAtivos = [], respostasPendentes = [], tempoAtual = 0;

  const escalaDaTela = () => tela.getBoundingClientRect().width / cavernaSecreta.LARGURA;
  // retângulo do balão em pixels da CENA (para conferir bordas e sobreposição sem depender da tela); x0/x1/y0/y1 = bordas
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
    ancoraX = Math.max(FOLGA + largura / 2, Math.min(cavernaSecreta.LARGURA - FOLGA - largura / 2, ancoraX));   // não corta nas laterais
    if (ancoraY - altura < FOLGA) ancoraY = FOLGA + altura;                                                   // nem em cima
    let caixa = caixaDoBalao(ancoraX, ancoraY, largura, altura);
    if (baloesAtivos.some(balao => caixasSeCruzam(balao.caixa, caixa))) { ancoraY -= altura + FOLGA * 2; caixa = caixaDoBalao(ancoraX, ancoraY, largura, altura); }   // tenta mais acima
    if (ancoraY - altura < FOLGA || baloesAtivos.some(balao => caixasSeCruzam(balao.caixa, caixa))) { elemento.remove(); return false; }               // sem lugar: espera
    elemento.style.left = (ancoraX * escala) + 'px';
    elemento.style.top = (ancoraY * escala) + 'px';
    requestAnimationFrame(() => elemento.classList.add('visivel'));
    baloesAtivos.push({ id, elemento, caixa, ate: tempoAtual + 2.2 + texto.length * 0.07 });
    if (configuracaoDeFalas.gesto && personagem.fazerGesto) personagem.fazerGesto(configuracaoDeFalas.gesto);   // fala sem parar a animação (às vezes com um gesto)
    for (const resposta of RESPOSTAS) {
      if (resposta.de === id && personagemPorId[resposta.para] && Math.random() < resposta.chance) respostasPendentes.push({ id: resposta.para, quando: tempoAtual + cavernaSecreta.sortearEntre(resposta.atraso[0], resposta.atraso[1]) });
    }
    return true;
  };
  const apagarBalao = balao => { balao.elemento.classList.remove('visivel'); balao.elemento.classList.add('saindo'); setTimeout(() => balao.elemento.remove(), 400); };

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
      const retanguloDaTela = tela.getBoundingClientRect();   // a camada dos balões cobre exatamente a tela da cena
      if (camadaDosBaloes.style.width !== retanguloDaTela.width + 'px' || camadaDosBaloes.style.left !== retanguloDaTela.left + 'px' || camadaDosBaloes.style.top !== retanguloDaTela.top + 'px') {
        Object.assign(camadaDosBaloes.style, { left: retanguloDaTela.left + 'px', top: retanguloDaTela.top + 'px', width: retanguloDaTela.width + 'px', height: retanguloDaTela.height + 'px' });
        cavernaSecreta.falas.ajustar();
      }
      for (let indice = baloesAtivos.length - 1; indice >= 0; indice--) if (tempo >= baloesAtivos[indice].ate) { apagarBalao(baloesAtivos[indice]); baloesAtivos.splice(indice, 1); }
      // resposta: tem prioridade; se não houver lugar na hora, tenta de novo por até 2,5 s
      for (let indice = respostasPendentes.length - 1; indice >= 0; indice--) {
        const resposta = respostasPendentes[indice];
        if (tempo >= resposta.quando && (falar(resposta.id) || tempo > resposta.quando + 2.5)) respostasPendentes.splice(indice, 1);
      }
      if (respostasPendentes.length) return;   // enquanto uma resposta espera, ninguém começa a falar
      for (const id in proximaFalaPorId) if (tempo >= proximaFalaPorId[id]) {
        const configuracaoDeFalas = personagemPorId[id].definicao.falas;
        proximaFalaPorId[id] = tempo + (falar(id) ? cavernaSecreta.sortearEntre(configuracaoDeFalas.intervalo[0], configuracaoDeFalas.intervalo[1]) : cavernaSecreta.sortearEntre(1.5, 4));
      }
    },
    // reposiciona os balões quando a tela muda de tamanho (a cena fica em escala inteira)
    ajustar() {
      if (!camadaDosBaloes) return;
      const escala = escalaDaTela();
      for (const balao of baloesAtivos) { balao.elemento.style.left = ((balao.caixa.x0 + balao.caixa.x1) / 2 * escala) + 'px'; balao.elemento.style.top = (balao.caixa.y1 * escala) + 'px'; }
    },
    // ao sair da caverna: some com tudo e esquece as respostas pendentes (os relógios ficam parados com o tempo da cena)
    limpar() { for (const balao of baloesAtivos) balao.elemento.remove(); baloesAtivos = []; respostasPendentes = []; },
    visiveis: () => baloesAtivos.map(balao => ({ id: balao.id, texto: balao.elemento.textContent, caixa: balao.caixa })),
    // testes: faz um personagem falar agora; diagnóstico dos relógios
    forcar: (id, frase) => falar(id, frase),
    diagnostico: () => ({ tempo: +tempoAtual.toFixed(1), ativos: baloesAtivos.length, pendentes: respostasPendentes.length, proximas: Object.fromEntries(Object.entries(proximaFalaPorId).map(([id, quando]) => [id, +(quando - tempoAtual).toFixed(1)])) }),
  };
})();
