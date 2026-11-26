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

  // Gesto executado quando o jogador clica em cada boneco
  const GESTO_AO_CLICAR = {
    batman: 'comunicador',
    coringa: 'gargalhar',
    destino: 'conjurar',
    freddy: 'cantar',
    hulk: 'rugir',
    slenderman: 'tentaculos',
    ultron: 'energia',
    venom: 'lingua',
  };

  // Caixa de clique em coordenadas da cena (LARGURA x ALTURA) a partir de posição e origem do boneco
  const caixaDoPersonagem = personagem => {
    const def = personagem.definicao || {};
    const largura = def.largura || 48;
    const altura = def.altura || 60;
    const origem = def.origem || [Math.round(largura / 2), altura];
    const direcao = def.direcao || 1;
    const cantoX = personagem.estado.x - (direcao < 0 ? largura - origem[0] : origem[0]);
    const cantoY = personagem.estado.y - origem[1];
    // Recorta as margens vazias laterais do canvas individual para o clique ser justo ao corpo
    const folgaLateral = Math.round(largura * 0.22);
    return {
      x0: cantoX + folgaLateral,
      x1: cantoX + largura - folgaLateral,
      y0: cantoY + 4,
      y1: cantoY + altura,
    };
  };

  // Converte coordenadas da janela (clientX, clientY) para coordenadas internas da cena (0..LARGURA, 0..ALTURA)
  const pontoNaCena = (clientX, clientY) => {
    const ret = tela.getBoundingClientRect();
    if (!ret.width || !ret.height) return null;
    return [
      ((clientX - ret.left) / ret.width) * LARGURA,
      ((clientY - ret.top) / ret.height) * ALTURA,
    ];
  };

  // Encontra o boneco mais à frente (maior Y) sob o cursor/toque
  const personagemNoPonto = (cenaX, cenaY) => {
    const ordenados = personagens.slice().sort((a, b) => b.estado.y - a.estado.y);
    for (const p of ordenados) {
      if (p.estado && p.estado.alfa !== undefined && p.estado.alfa < 0.15) continue;
      const caixa = caixaDoPersonagem(p);
      if (cenaX >= caixa.x0 && cenaX <= caixa.x1 && cenaY >= caixa.y0 && cenaY <= caixa.y1) {
        return p;
      }
    }
    return null;
  };

  const configurarInteracaoNosBonecos = () => {
    tela.addEventListener('pointermove', evento => {
      if (!ativo) return;
      const pt = pontoNaCena(evento.clientX, evento.clientY);
      const alvo = pt ? personagemNoPonto(pt[0], pt[1]) : null;
      tela.style.cursor = alvo ? 'pointer' : '';
    });

    tela.addEventListener('pointerdown', evento => {
      if (!ativo || !evento.isPrimary) return;
      const pt = pontoNaCena(evento.clientX, evento.clientY);
      if (!pt) return;
      const alvo = personagemNoPonto(pt[0], pt[1]);
      if (!alvo) return;

      evento.stopPropagation();
      if (typeof cavernaSecreta.tocarVozBoneco === 'function') {
        cavernaSecreta.tocarVozBoneco(alvo.id);
      }
      const gesto = GESTO_AO_CLICAR[alvo.id];
      if (gesto && typeof alvo.fazerGesto === 'function') {
        alvo.fazerGesto(gesto);
      }
    });
  };

  const desenharQuadro = segundosDoQuadro => {
    const inicio = performance.now();
    tempoDaCena += segundosDoQuadro;
    cavernaSecreta.cenario.atualizar(segundosDoQuadro, tempoDaCena);
    for (const personagem of personagens) personagem.atualizar(tempoDaCena);
    if (cavernaSecreta.falas) cavernaSecreta.falas.atualizar(segundosDoQuadro, tempoDaCena);
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
      configurarInteracaoNosBonecos();
      addEventListener('resize', ajustarTamanho);
      desenharQuadro(0);
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
      if (tela) tela.style.cursor = '';
      if (cavernaSecreta.falas) cavernaSecreta.falas.limpar();
    },
    ativo: () => ativo,
    personagens: () => personagens,
    tempo: () => tempoDaCena,
    avancar(segundos) { for (let decorrido = 0; decorrido < segundos; decorrido += 1 / 60) desenharQuadro(1 / 60); },
    ajustarTamanho,
  };
})();