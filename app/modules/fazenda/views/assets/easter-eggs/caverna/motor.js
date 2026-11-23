// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · motor.js
// O laço da cena: UM requestAnimationFrame só, que existe apenas enquanto a caverna está aberta (suspender() o cancela;
// retomar() nunca cria um segundo). O relógio da cena só anda com ela aberta.
// Ordem de desenho por quadro: fundo → animados do fundo → personagens do fundo (por profundidade) → corrimão → animados do
// chão → personagens da frente → silhuetas da frente → MAPA DE LUZ (multiplica) → brilhos e partículas → névoa e vinheta.
// Interface usada por js/30j-caverna-secreta.js e pelos testes: iniciar, retomar, suspender, ativo, personagens, tempo,
// avancar, ajustarTamanho.
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta, LARGURA = cavernaSecreta.LARGURA, ALTURA = cavernaSecreta.ALTURA;
  const estatisticas = cavernaSecreta.estatisticas = { quadros: 0, lacosAtivos: 0, msPorQuadro: 0 };
  let tela = null, contexto = null, personagens = [], personagensDoFundo = [], personagensDaFrente = [];
  let ativo = false, pedidoDeQuadro = 0, ultimoInstante = 0, tempoDaCena = 0;

  const desenharQuadro = segundosDoQuadro => {
    const inicio = performance.now();
    tempoDaCena += segundosDoQuadro;
    cavernaSecreta.cenario.atualizar(segundosDoQuadro, tempoDaCena);
    for (const personagem of personagens) personagem.atualizar(tempoDaCena);
    if (cavernaSecreta.falas) cavernaSecreta.falas.atualizar(segundosDoQuadro, tempoDaCena);   // falas ocasionais (relógio da cena: só andam com a caverna aberta)
    contexto.globalCompositeOperation = 'source-over';
    contexto.globalAlpha = 1;
    cavernaSecreta.cenario.desenharFundo(contexto);
    cavernaSecreta.cenario.desenharAnimadosDoFundo(contexto, tempoDaCena);
    for (const personagem of personagensDoFundo) { personagem.sombra(contexto); personagem.desenhar(contexto); }
    cavernaSecreta.cenario.desenharMeio(contexto);
    cavernaSecreta.cenario.desenharAnimadosDoChao(contexto, tempoDaCena);
    for (const personagem of personagensDaFrente) { personagem.sombra(contexto); personagem.desenhar(contexto); }
    cavernaSecreta.cenario.desenharFrente(contexto);
    cavernaSecreta.luz.comecar();
    cavernaSecreta.cenario.luzes(cavernaSecreta.luz, tempoDaCena);
    for (const personagem of personagens) personagem.luzes(cavernaSecreta.luz, tempoDaCena);
    cavernaSecreta.luz.aplicar(contexto);
    cavernaSecreta.cenario.brilhos(contexto, tempoDaCena);
    for (const personagem of personagens) personagem.brilhos(contexto, tempoDaCena);
    cavernaSecreta.cenario.desenharAtmosfera(contexto, tempoDaCena);
    estatisticas.quadros++;
    estatisticas.msPorQuadro = estatisticas.msPorQuadro * 0.9 + (performance.now() - inicio) * 0.1;
  };
  const laco = agora => {
    if (!ativo) { pedidoDeQuadro = 0; estatisticas.lacosAtivos = 0; return; }
    const segundosDoQuadro = Math.min(0.05, Math.max(0, (agora - ultimoInstante) / 1000));
    ultimoInstante = agora;
    desenharQuadro(segundosDoQuadro);
    pedidoDeQuadro = requestAnimationFrame(laco);
  };
  const ajustarTamanho = () => {
    if (!tela) return;
    const escala = Math.max(1, Math.floor(Math.min(innerWidth / LARGURA, innerHeight / ALTURA)));
    tela.style.width = LARGURA * escala + 'px';
    tela.style.height = ALTURA * escala + 'px';
    document.documentElement.style.setProperty('--escala-da-caverna', escala);
  };

  cavernaSecreta.motor = {
    iniciar({ tela: elemento }) {
      if (tela) return;
      tela = elemento;
      tela.width = LARGURA;
      tela.height = ALTURA;
      contexto = tela.getContext('2d');
      contexto.imageSmoothingEnabled = false;
      cavernaSecreta.luz.iniciar(LARGURA, ALTURA, '#5d6383');
      cavernaSecreta.cenario.criar();
      personagens = cavernaSecreta.definicoesDePersonagens.map(cavernaSecreta.criarPersonagem);
      const porProfundidade = (primeiro, segundo) => primeiro.estado.y - segundo.estado.y;
      personagensDoFundo = personagens.filter(personagem => personagem.estado.y <= cavernaSecreta.PLATAFORMA.y).sort(porProfundidade);
      personagensDaFrente = personagens.filter(personagem => personagem.estado.y > cavernaSecreta.PLATAFORMA.y).sort(porProfundidade);
      if (cavernaSecreta.falas) cavernaSecreta.falas.iniciar(tela.parentNode, tela, personagens);
      addEventListener('resize', ajustarTamanho);
      desenharQuadro(0);   // primeiro quadro pronto antes da íris abrir
    },
    retomar() {
      ajustarTamanho();
      ativo = true;
      ultimoInstante = performance.now();
      if (!pedidoDeQuadro) { pedidoDeQuadro = requestAnimationFrame(laco); estatisticas.lacosAtivos = 1; }
    },
    suspender() {
      ativo = false;
      if (pedidoDeQuadro) cancelAnimationFrame(pedidoDeQuadro);
      pedidoDeQuadro = 0;
      estatisticas.lacosAtivos = 0;
      if (cavernaSecreta.falas) cavernaSecreta.falas.limpar();
    },
    ativo: () => ativo,
    personagens: () => personagens,
    tempo: () => tempoDaCena,
    // testes: avança a cena alguns segundos sem o laço (passos de 1/60 s) e desenha
    avancar(segundos) { for (let decorrido = 0; decorrido < segundos; decorrido += 1 / 60) desenharQuadro(1 / 60); },
    ajustarTamanho,
  };
})();
