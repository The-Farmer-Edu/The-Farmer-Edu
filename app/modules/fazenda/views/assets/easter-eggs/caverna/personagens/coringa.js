// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · personagens/coringa.js
// Coringa: boneco articulado desenhado em código (técnica do celeiro, ver boneco.js), DE LADO em 3/4 olhando para a DIREITA
// (provoca o Batman lá em cima), no padrão do Nick Fury do celeiro, com a postura torta (quadril para um lado, ombros para o
// outro): silhueta do paletó centrada, colete, gravata e lapelas puxados para o lado do olhar, costas na sombra; CABEÇA
// desenhada pixel a pixel e encaixada sobre o pescoço (cabelo verde penteado para trás, olhos fundos, nariz comprido e o sorriso
// vermelho até a bochecha). Em 3/4 de verdade o braço DE LONGE sai do ombro na frente do corpo, atrás do paletó (camada de
// trás), e o braço DE PERTO fica no meio da silhueta (camada da frente). Terno roxo com abas, camisa verde, calça listrada, mãos
// brancas. Gargalha (cabeça para trás, ombros sacudindo, mão na barriga), faz a carta aparecer, reverência teatral, tiques.
// Nomes de coordenada: centroDaSilhuetaX = centro da silhueta do paletó; meioDaFrenteX = linha do meio da frente (gravata);
// ombrosY = linha dos ombros; deslocamentoDoQuadril = quadril torto.
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta, ferramentasPixel = window.CenaDoCeleiro.pixel;
  const paletaCores = {
    pretoArroxeado: '#0a0610',
    pelePalida: '#f1f0ea',
    peleSombra: '#c4c2ba',
    cabeloVerde: '#2f8a2e',
    cabeloVerdeClaro: '#5cc23d',
    vermelhoDoSorriso: '#d8202a',
    vermelhoEscuro: '#8c0f17',
    dentes: '#fff8e8',
    roxoEscuro: '#3b1757',
    ternoRoxo: '#6f2fa0',
    roxoClaro: '#9a5bd0',
    coleteLaranja: '#e07a1c',
    coleteSombra: '#a8520f',
    camisaVerde: '#3f9a46',
    sapatoEOlhosFundos: '#2a2433',
    cartaBranca: '#f7f4ec',
  };
  // Cabeça em grade (11 colunas), olhando para a direita. Parte de cima (cabelo, olhos, nariz) e duas versões da parte de baixo
  // (sorriso fechado e gargalhada). Legenda de cada caractere:
  //   g = cabelo verde, G = reflexo do cabelo, w = pele pálida, W = pele na sombra (orelha, nuca, queixo), E = olho fundo,
  //   r = vermelho do sorriso, R = vermelho escuro, t = dentes, . = transparente
  const GRADE_DA_CABECA_EM_CIMA = ['...gGGg....', '.ggGgggGg..', 'gggggggwww.', 'gGgggwwwww.', 'gggWwEwwEw.', '.ggWwEEwwww', '.gWwwwwwWw.'];
  const GRADE_DO_SORRISO = ['.gWrwwwwwR.', '..Wwrttttr.', '..Wwwrrrr..', '...wwwwww..', '....WWww...'];
  const GRADE_DA_GARGALHADA = ['.gWrwwwwww.', '..WrtttttR.', '..WwRRRRR..', '...wwRRw...', '....WWw....'];
  const CORES_DA_GRADE = {
    g: paletaCores.cabeloVerde, G: paletaCores.cabeloVerdeClaro, w: paletaCores.pelePalida, W: paletaCores.peleSombra, E: paletaCores.sapatoEOlhosFundos,
    r: paletaCores.vermelhoDoSorriso, R: paletaCores.vermelhoEscuro, t: paletaCores.dentes,
  };

  const desenharPerna = (contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, ehDePerto) => {
    const corDaCalca = ehDePerto ? paletaCores.ternoRoxo : paletaCores.roxoEscuro;
    const perna = cavernaSecreta.desenharMembro(contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, {
      comprimentoSuperior: 9, comprimentoInferior: 9, grossuraSuperior: 3, grossuraInferior: 3, corSuperior: corDaCalca, corInferior: corDaCalca, corDoRealce: ehDePerto ? paletaCores.roxoClaro : null,
    });
    const [peX, peY] = perna.extremidade;
    ferramentasPixel.poligono(contexto, [[peX - 2, peY - 1], [peX + 3, peY - 1], [peX + 5, peY + 1], [peX - 2, peY + 1]], paletaCores.sapatoEOlhosFundos);   // sapato
  };

  const desenharPartes = (camadas, pose, tempo) => {
    const { origemX, origemY } = camadas, cores = paletaCores;
    const elevacaoDaRespiracao = -Math.round(pose.respira), deslocamentoDoQuadril = Math.round(pose.quadril), centroX = origemX + Math.round(pose.inclina);
    const ombrosY = origemY - 33 + elevacaoDaRespiracao + Math.round(pose.curva), meioDaFrenteX = centroX + 3, centroDaSilhuetaX = centroX + 1;
    // ---- trás: perna e braço de longe (o braço sai do ombro na frente do corpo, atrás do paletó)
    desenharPerna(camadas.tras, origemX - 1 + deslocamentoDoQuadril, origemY - 19, -3 + pose.passo, 2, false);
    const bracoDeLonge = cavernaSecreta.desenharMembro(camadas.tras, centroX + 5, ombrosY + 2, pose.bracoDeLongeOmbro, pose.bracoDeLongeCotovelo, {
      comprimentoSuperior: 7, comprimentoInferior: 7, grossuraSuperior: 3, grossuraInferior: 3, corSuperior: cores.roxoEscuro, corInferior: cores.roxoEscuro,
    });
    ferramentasPixel.ret(camadas.tras, bracoDeLonge.extremidade[0] - 1, bracoDeLonge.extremidade[1] - 1, 3, 3, cores.peleSombra);

    // ---- corpo: perna de perto, paletó ABERTO na frente, colete, camisa, gravata, pescoço e cabeça
    const corpo = camadas.corpo;
    desenharPerna(corpo, origemX + 2 + deslocamentoDoQuadril, origemY - 19, 6, -4, true);
    ferramentasPixel.poligono(corpo, [[centroDaSilhuetaX - 5, ombrosY - 1], [centroDaSilhuetaX + 5, ombrosY - 1], [centroDaSilhuetaX + 5, ombrosY + 12], [centroDaSilhuetaX + 6 + deslocamentoDoQuadril, ombrosY + 19], [centroDaSilhuetaX - 5 + deslocamentoDoQuadril, ombrosY + 19], [centroDaSilhuetaX - 5, ombrosY + 11]], cores.ternoRoxo);   // paletó com abas
    ferramentasPixel.poligono(corpo, [[centroDaSilhuetaX - 5, ombrosY - 1], [centroDaSilhuetaX - 3, ombrosY - 1], [centroDaSilhuetaX - 3, ombrosY + 18 + deslocamentoDoQuadril], [centroDaSilhuetaX - 5 + deslocamentoDoQuadril, ombrosY + 19], [centroDaSilhuetaX - 5, ombrosY + 11]], cores.roxoEscuro);   // costas na sombra
    ferramentasPixel.linha(corpo, centroDaSilhuetaX - 5, ombrosY, centroDaSilhuetaX - 5, ombrosY + 10, cores.roxoClaro, 1);                                     // filete de luz na borda
    ferramentasPixel.poligono(corpo, [[meioDaFrenteX - 2, ombrosY], [meioDaFrenteX + 2, ombrosY], [meioDaFrenteX + 2, ombrosY + 11], [meioDaFrenteX - 2, ombrosY + 11]], cores.coleteLaranja);   // colete
    ferramentasPixel.linha(corpo, meioDaFrenteX - 2, ombrosY + 2, meioDaFrenteX - 2, ombrosY + 10, cores.coleteSombra, 1);
    ferramentasPixel.px(corpo, meioDaFrenteX + 1, ombrosY + 7, cores.coleteSombra);                                                                   // botões
    ferramentasPixel.px(corpo, meioDaFrenteX + 1, ombrosY + 9, cores.coleteSombra);
    ferramentasPixel.ret(corpo, meioDaFrenteX - 1, ombrosY, 3, 2, cores.camisaVerde);                                                                 // camisa e gravata
    ferramentasPixel.ret(corpo, meioDaFrenteX, ombrosY + 1, 1, 5, cores.roxoEscuro);
    ferramentasPixel.linha(corpo, meioDaFrenteX - 3, ombrosY, meioDaFrenteX - 1, ombrosY + 8, cores.roxoClaro, 1);                                       // lapelas
    ferramentasPixel.linha(corpo, meioDaFrenteX + 3, ombrosY, meioDaFrenteX + 2, ombrosY + 7, cores.roxoClaro, 1);
    ferramentasPixel.linha(corpo, meioDaFrenteX, ombrosY + 12, meioDaFrenteX + deslocamentoDoQuadril, ombrosY + 19, cores.roxoEscuro, 1);                              // abertura das abas
    // CABEÇA desenhada pixel a pixel (grade) e encaixada sobre o pescoço, virada para o mesmo lado do tronco (para o Batman)
    const cantoDaGradeX = meioDaFrenteX - 4 + Math.round(pose.cabecaGiro), cantoDaGradeY = ombrosY - 13 + Math.round(pose.cabecaInclina);
    ferramentasPixel.ret(corpo, meioDaFrenteX - 1, ombrosY - 3, 3, 3, cores.peleSombra);                                                            // pescoço
    ferramentasPixel.px(corpo, meioDaFrenteX + 1, ombrosY - 3, cores.pelePalida);
    const gradeDaCabeca = GRADE_DA_CABECA_EM_CIMA.concat(pose.riso > 0.5 ? GRADE_DA_GARGALHADA : GRADE_DO_SORRISO);
    gradeDaCabeca.forEach((linhaDaGrade, linha) => {
      for (let coluna = 0; coluna < linhaDaGrade.length; coluna++) {
        const cor = CORES_DA_GRADE[linhaDaGrade[coluna]];
        if (cor) ferramentasPixel.px(corpo, cantoDaGradeX + coluna, cantoDaGradeY + linha, cor);
      }
    });

    // ---- frente: braço de perto (mão branca, carta), preso ao ombro no meio da silhueta
    const frente = camadas.frente;
    const bracoDePerto = cavernaSecreta.desenharMembro(frente, centroX - 1, ombrosY + 2, pose.bracoDePertoOmbro, pose.bracoDePertoCotovelo, {
      comprimentoSuperior: 7, comprimentoInferior: 7, grossuraSuperior: 3, grossuraInferior: 3, corSuperior: cores.ternoRoxo, corInferior: cores.ternoRoxo, corDoRealce: cores.roxoClaro, corDaJunta: cores.roxoEscuro,
    });
    const [maoX, maoY] = bracoDePerto.extremidade;
    ferramentasPixel.ret(frente, maoX - 1, maoY - 1, 3, 3, cores.pelePalida);
    if (pose.carta > 0.5) {                                                                                                                     // a carta gira na mão (frente e verso)
      const mostraAFrente = Math.floor(tempo * 6) % 2;
      ferramentasPixel.ret(frente, maoX - 1, maoY - 6, 3, 5, mostraAFrente ? cores.cartaBranca : cores.peleSombra);
      ferramentasPixel.px(frente, maoX, maoY - 4, mostraAFrente ? cores.vermelhoDoSorriso : cores.pretoArroxeado);
    }
    return { rosto: [cantoDaGradeX + 5 - origemX, cantoDaGradeY + 6 - origemY] };
  };

  cavernaSecreta.registrarPersonagem({
    boneco: true, id: 'coringa', direcao: 1,
    falas: { frases: ['HAHAHAHA!', 'Hehehehe!', 'HAHAHA... hehe!'], intervalo: [14, 24], primeira: [6, 13], ancora: [2, -49], gesto: 'gargalhar' },
    largura: 48, altura: 60, origem: [24, 57], sombra: 10, contorno: '#06030a',
    pose: { respira: 0, inclina: 1, quadril: -1, curva: 0, passo: 0, cabecaGiro: 0, cabecaInclina: -1, bracoDePertoOmbro: 10, bracoDePertoCotovelo: -12, bracoDeLongeOmbro: -20, bracoDeLongeCotovelo: 60, riso: 0, carta: 0 },   // cabeça erguida, provocando o Batman lá em cima
    gestos: {
      // gargalhada: cabeça para trás, ombros sacudindo (curva) e a mão de perto na barriga
      gargalhar: [{ t: 0 }, { t: 0.3, cabecaInclina: -2, riso: 1, bracoDePertoOmbro: 12, bracoDePertoCotovelo: 72, curva: 0 }, { t: 0.45, curva: 1, cabecaInclina: -1, riso: 1, bracoDePertoOmbro: 12, bracoDePertoCotovelo: 72 }, { t: 0.6, curva: 0, cabecaInclina: -2, riso: 1, bracoDePertoOmbro: 12, bracoDePertoCotovelo: 72 }, { t: 0.75, curva: 1, cabecaInclina: -1, riso: 1, bracoDePertoOmbro: 12, bracoDePertoCotovelo: 72 }, { t: 0.9, curva: 0, cabecaInclina: -2, riso: 1, bracoDePertoOmbro: 12, bracoDePertoCotovelo: 72 }, { t: 1.05, curva: 1, cabecaInclina: -1, riso: 1, bracoDePertoOmbro: 12, bracoDePertoCotovelo: 72 }, { t: 1.5 }],
      carta: [{ t: 0 }, { t: 0.4, bracoDePertoOmbro: 80, bracoDePertoCotovelo: -70, carta: 1, cabecaGiro: 1 }, { t: 2.0, bracoDePertoOmbro: 84, bracoDePertoCotovelo: -74, carta: 1, cabecaGiro: 1 }, { t: 2.4 }],
      reverencia: [{ t: 0 }, { t: 0.5, inclina: 3, curva: 2, cabecaInclina: 2, bracoDePertoOmbro: 100, bracoDePertoCotovelo: -20, bracoDeLongeOmbro: -60, bracoDeLongeCotovelo: 10 }, { t: 1.5, inclina: 3, curva: 2, cabecaInclina: 2, bracoDePertoOmbro: 100, bracoDePertoCotovelo: -20, bracoDeLongeOmbro: -60, bracoDeLongeCotovelo: 10 }, { t: 2.0 }],
      apontar: [{ t: 0 }, { t: 0.3, bracoDePertoOmbro: 90, bracoDePertoCotovelo: -5, riso: 1, cabecaInclina: 0 }, { t: 1.3, bracoDePertoOmbro: 92, bracoDePertoCotovelo: -5, riso: 1 }, { t: 1.6 }],
    },
    gestosAutomaticos: [{ gesto: 'gargalhar', intervalo: [8, 14], primeira: [2, 5] }, { gesto: 'carta', intervalo: [9, 16] }, { gesto: 'reverencia', intervalo: [15, 25] }, { gesto: 'apontar', intervalo: [11, 18] }],
    ociosos: [
      { nome: 'respirar', intervalo: [1.8, 2.6], duracao: 1.4, aplicar: (pose, fracao) => { if (fracao > 0.3 && fracao < 0.8) pose.respira += 1; } },
      { nome: 'tique', intervalo: [2, 6], duracao: [0.15, 0.35], aplicar: (pose, fracao, variante) => { pose.cabecaGiro += variante < 0.5 ? -1 : 1; } },
      { nome: 'peso', intervalo: [4, 8], duracao: [1.2, 2.4], semGesto: true, aplicar: (pose, fracao) => { if (fracao > 0.15 && fracao < 0.85) { pose.quadril = 1; pose.passo = 4; } } },
    ],
    desenharPartes,
    luzes(luz, pose, tempo, ponto) { const [neonX, neonY] = ponto(-22, -40); luz.ponto(neonX, neonY, 26, '#9b3dff', 0.35); },   // reflexo do néon roxo atrás dele
  });
})();
