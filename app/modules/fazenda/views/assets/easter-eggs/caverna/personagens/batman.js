// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · personagens/batman.js
// Batman: boneco articulado desenhado em código (técnica do celeiro, ver boneco.js), de vigia na passarela, DE LADO em 3/4
// olhando para a ESQUERDA (o salão e o Coringa lá embaixo), no padrão do Nick Fury do celeiro: silhueta do tronco centrada, peito,
// morcego e fivela puxados para o lado do olhar, a lateral de longe na sombra; CABEÇA desenhada pixel a pixel (capuz simétrico
// com as duas orelhas, fendas brancas, nariz do capuz, mandíbula e queixo). Cinto de utilidades, luvas com aletas, botas; capa
// PESADA na camada de trás, caindo pelas costas, com barra recortada e balanço próprio. Vigia girando a cabeça, olha para baixo,
// toca o comunicador, abre a capa com o vento.
// Nomes de coordenada: centroDaSilhuetaX = centro da silhueta; meioDaFrenteX = linha do meio da frente do tronco (puxada
// para o lado do olhar); ombrosY = linha dos ombros.
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta, ferramentasPixel = window.CenaDoCeleiro.pixel;
  const paletaCores = {
    capa: '#1a1d2b',
    bordaDaCapa: '#2d3346',
    dobraDaCapa: '#0f1220',
    cinzaEscuro: '#4a505f',
    cinzaArmadura: '#6a7183',
    cinzaClaro: '#949bad',
    pele: '#d8a984',
    peleSombra: '#a87656',
    dourado: '#e3b532',
    douradoSombra: '#a87d17',
    brancoDasFendas: '#f4f4f0',
    pretoDoCapuz: '#13141c',
    brilhoDoCapuz: '#2a2d3b',
  };
  // Cabeça em grade (11 colunas × 12 linhas), olhando para a direita antes do espelhamento. Legenda de cada caractere:
  //   b = capuz preto, B = brilho do capuz, s = pele, S = pele na sombra (boca e queixo), . = transparente
  const GRADE_DA_CABECA = [
    '..b....b...',
    '..bb..bb...',
    '..bb..bb...',
    '.bbbbbbbb..',
    '.Bbbbbbbbb.',
    '.Bbbbbbbbb.',
    '.bbbbbbbbb.',
    '.bbbbbbbbbb',
    '.bbbbbssss.',
    '.bbbbsssss.',
    '..bbbsSSs..',
    '...bbssS...',
  ];
  const CORES_DA_GRADE = { b: paletaCores.pretoDoCapuz, B: paletaCores.brilhoDoCapuz, s: paletaCores.pele, S: paletaCores.peleSombra };

  const desenharPerna = (contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, ehDePerto) => {
    const cores = paletaCores;
    const perna = cavernaSecreta.desenharMembro(contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, {
      comprimentoSuperior: 9, comprimentoInferior: 9, grossuraSuperior: 4, grossuraInferior: 4,
      corSuperior: ehDePerto ? cores.cinzaArmadura : cores.cinzaEscuro, corInferior: ehDePerto ? cores.pretoDoCapuz : cores.dobraDaCapa, corDoRealce: ehDePerto ? cores.cinzaClaro : null,
    });
    const [peX, peY] = perna.extremidade;
    ferramentasPixel.poligono(contexto, [[peX - 2, peY - 2], [peX + 3, peY - 2], [peX + 5, peY + 1], [peX - 2, peY + 1]], ehDePerto ? cores.pretoDoCapuz : cores.dobraDaCapa);   // bota
    if (ehDePerto) ferramentasPixel.px(contexto, peX, peY - 2, cores.brilhoDoCapuz);
  };

  const desenharPartes = (camadas, pose, tempo) => {
    const { origemX, origemY } = camadas, cores = paletaCores;
    const elevacaoDaRespiracao = -Math.round(pose.respira), centroX = origemX + Math.round(pose.inclina), ombrosY = origemY - 33 + elevacaoDaRespiracao + Math.round(pose.agacha);
    const balancoDaCapa = pose.capa, meioDaFrenteX = centroX + 3, centroDaSilhuetaX = centroX + 1;
    // ---- trás: CAPA pesada (presa aos ombros, cai pelas costas), perna e braço de longe
    const tras = camadas.tras, barraDaCapaY = origemY - 2;
    ferramentasPixel.poligono(tras, [[centroDaSilhuetaX - 7, ombrosY - 1], [centroDaSilhuetaX + 6, ombrosY - 1], [centroDaSilhuetaX + 7 + balancoDaCapa * 0.5, ombrosY + 14], [centroDaSilhuetaX + 6 + balancoDaCapa, barraDaCapaY], [centroDaSilhuetaX - 11 + balancoDaCapa * 1.4, barraDaCapaY], [centroDaSilhuetaX - 10 + balancoDaCapa * 0.7, ombrosY + 14]], cores.capa);
    ferramentasPixel.linha(tras, centroDaSilhuetaX - 7, ombrosY, centroDaSilhuetaX - 10 + balancoDaCapa * 0.7, ombrosY + 14, cores.bordaDaCapa, 1);
    ferramentasPixel.linha(tras, centroDaSilhuetaX - 10 + balancoDaCapa * 0.7, ombrosY + 14, centroDaSilhuetaX - 11 + balancoDaCapa * 1.4, barraDaCapaY, cores.bordaDaCapa, 1);
    for (const inicioDaDobra of [-8, -4, 5]) ferramentasPixel.linha(tras, centroDaSilhuetaX + inicioDaDobra, ombrosY + 4, centroDaSilhuetaX + inicioDaDobra - 1 + balancoDaCapa, barraDaCapaY - 1, cores.dobraDaCapa, 1);   // dobras
    for (let recorteX = Math.round(centroDaSilhuetaX - 10 + balancoDaCapa * 1.4); recorteX < centroDaSilhuetaX + 6 + balancoDaCapa; recorteX += 3) ferramentasPixel.px(tras, recorteX, barraDaCapaY + 1, cores.capa);   // barra recortada
    desenharPerna(tras, origemX - 2, origemY - 19, 3, -4, false);
    const bracoDeLonge = cavernaSecreta.desenharMembro(tras, centroX - 5, ombrosY + 3, pose.bracoDeLongeOmbro, pose.bracoDeLongeCotovelo, {
      comprimentoSuperior: 7, comprimentoInferior: 7, grossuraSuperior: 3, grossuraInferior: 3, corSuperior: cores.cinzaArmadura, corInferior: cores.pretoDoCapuz,
    });
    ferramentasPixel.ret(tras, bracoDeLonge.extremidade[0] - 1, bracoDeLonge.extremidade[1] - 1, 3, 3, cores.pretoDoCapuz);

    // ---- corpo: perna de perto, tronco em 3/4 com o morcego, cinto, pescoço e cabeça
    const corpo = camadas.corpo;
    desenharPerna(corpo, origemX + 2, origemY - 19, 7, -8 + pose.agacha * 6, true);
    ferramentasPixel.poligono(corpo, [[centroDaSilhuetaX - 6, ombrosY - 1], [centroDaSilhuetaX + 6, ombrosY - 1], [centroDaSilhuetaX + 5, ombrosY + 12], [centroDaSilhuetaX - 5, ombrosY + 12]], cores.cinzaArmadura);   // tronco
    ferramentasPixel.poligono(corpo, [[centroDaSilhuetaX - 6, ombrosY - 1], [meioDaFrenteX - 3, ombrosY - 1], [meioDaFrenteX - 3, ombrosY + 12], [centroDaSilhuetaX - 5, ombrosY + 12]], cores.cinzaEscuro);   // lateral de longe na sombra
    ferramentasPixel.ret(corpo, meioDaFrenteX, ombrosY, 3, 5, cores.cinzaClaro);                                                                // luz no peito
    ferramentasPixel.linha(corpo, meioDaFrenteX, ombrosY + 7, meioDaFrenteX, ombrosY + 11, cores.cinzaEscuro, 1);                              // abdômen
    ferramentasPixel.ret(corpo, meioDaFrenteX - 2, ombrosY + 7, 6, 1, cores.cinzaEscuro);
    // MORCEGO no peito (a asa de longe encurtada pela perspectiva)
    ferramentasPixel.ret(corpo, meioDaFrenteX - 1, ombrosY + 3, 4, 1, cores.pretoDoCapuz);
    for (const [morcegoX, morcegoY] of [[-2, 2], [3, 2], [0, 2], [1, 2], [-1, 4], [1, 4]]) ferramentasPixel.px(corpo, meioDaFrenteX + morcegoX, ombrosY + morcegoY, cores.pretoDoCapuz);
    ferramentasPixel.ret(corpo, centroDaSilhuetaX - 6, ombrosY + 12, 12, 2, cores.dourado);                                                     // cinto e fivela
    for (const bolsoX of [-4, 3]) ferramentasPixel.ret(corpo, meioDaFrenteX + bolsoX, ombrosY + 12, 1, 2, cores.douradoSombra);
    ferramentasPixel.ret(corpo, meioDaFrenteX, ombrosY + 12, 2, 2, cores.douradoSombra);
    // CABEÇA desenhada pixel a pixel (grade), encaixada sobre o pescoço: capuz simétrico com as duas orelhas pontudas iguais,
    // brilho na nuca, fendas brancas na altura certa, nariz do capuz saindo do contorno, e a parte de baixo do rosto (boca,
    // mandíbula, queixo) aparecendo na frente, em 3/4, separada do pescoço preto.
    const cantoDaGradeX = meioDaFrenteX - 4 + Math.round(pose.cabecaGiro), cantoDaGradeY = ombrosY - 15 + Math.round(pose.cabecaInclina), olharParaBaixo = pose.olhar ? 1 : 0;
    ferramentasPixel.ret(corpo, meioDaFrenteX - 2, ombrosY - 4, 4, 4, cores.pretoDoCapuz);                                                    // pescoço
    ferramentasPixel.px(corpo, meioDaFrenteX - 2, ombrosY - 3, cores.brilhoDoCapuz);
    GRADE_DA_CABECA.forEach((linhaDaGrade, linha) => {
      for (let coluna = 0; coluna < linhaDaGrade.length; coluna++) {
        const cor = CORES_DA_GRADE[linhaDaGrade[coluna]];
        if (cor) ferramentasPixel.px(corpo, cantoDaGradeX + coluna, cantoDaGradeY + linha, cor);
      }
    });
    ferramentasPixel.ret(corpo, cantoDaGradeX + 4, cantoDaGradeY + 6 + olharParaBaixo, 2, 1, cores.brancoDasFendas);                          // fenda de perto
    ferramentasPixel.px(corpo, cantoDaGradeX + 8, cantoDaGradeY + 6 + olharParaBaixo, cores.brancoDasFendas);                                  // fenda de longe

    // ---- frente: ombro (capa por cima), braço de perto com luva de aletas
    const frente = camadas.frente;
    ferramentasPixel.elipse(frente, centroX + 6, ombrosY, 3, 2.5, cores.capa);
    ferramentasPixel.px(frente, centroX + 5, ombrosY - 1, cores.bordaDaCapa);
    const bracoDePerto = cavernaSecreta.desenharMembro(frente, centroX + 6, ombrosY + 2, pose.bracoDePertoOmbro, pose.bracoDePertoCotovelo, {
      comprimentoSuperior: 7, comprimentoInferior: 7, grossuraSuperior: 4, grossuraInferior: 3, corSuperior: cores.cinzaArmadura, corInferior: cores.pretoDoCapuz, corDoRealce: cores.cinzaClaro, corDaJunta: cores.cinzaEscuro,
    });
    const aletasDaLuva = cavernaSecreta.pontoEntre(bracoDePerto.articulacao, bracoDePerto.extremidade, 0.4);
    ferramentasPixel.px(frente, aletasDaLuva[0] - 2, aletasDaLuva[1], cores.pretoDoCapuz);
    ferramentasPixel.px(frente, aletasDaLuva[0] - 2, aletasDaLuva[1] + 2, cores.pretoDoCapuz);
    ferramentasPixel.ret(frente, bracoDePerto.extremidade[0] - 1, bracoDePerto.extremidade[1] - 1, 3, 3, cores.pretoDoCapuz);
    return {
      olhos: [[cantoDaGradeX + 4 - origemX, cantoDaGradeY + 6 + olharParaBaixo - origemY, 2], [cantoDaGradeX + 8 - origemX, cantoDaGradeY + 6 + olharParaBaixo - origemY, 1]],   // [x, y, largura em px] de cada fenda
    };
  };

  cavernaSecreta.registrarPersonagem({
    boneco: true, id: 'batman', direcao: -1,
    falas: { frases: ['Eu sou rico.'], intervalo: [18, 30], primeira: [4, 11], ancora: [2, -51] },
    largura: 52, altura: 60, origem: [26, 57], sombra: 11, contorno: '#030306',
    pose: { respira: 0, inclina: 0, agacha: 0, cabecaGiro: 0, cabecaInclina: 1, bracoDePertoOmbro: 4, bracoDePertoCotovelo: -4, bracoDeLongeOmbro: -4, bracoDeLongeCotovelo: -2, capa: 0, olhar: 1 },   // olhando para baixo, para o Coringa
    gestos: {
      vigiar: [{ t: 0 }, { t: 0.6, cabecaGiro: -1 }, { t: 2.2, cabecaGiro: -1 }, { t: 2.8, cabecaGiro: 1 }, { t: 4.2, cabecaGiro: 1 }, { t: 4.8 }],
      olharParaBaixo: [{ t: 0 }, { t: 0.5, cabecaInclina: 1, olhar: 1, agacha: 1, inclina: 1 }, { t: 2.4, cabecaInclina: 1, olhar: 1, agacha: 1, inclina: 1 }, { t: 2.9 }],
      comunicador: [{ t: 0 }, { t: 0.4, bracoDePertoOmbro: 150, bracoDePertoCotovelo: -150 }, { t: 1.8, bracoDePertoOmbro: 152, bracoDePertoCotovelo: -152, cabecaInclina: 1 }, { t: 2.3 }],
      capaAoVento: [{ t: 0 }, { t: 0.5, capa: -4 }, { t: 1.4, capa: -5 }, { t: 2.2, capa: -1 }, { t: 2.8 }],
    },
    gestosAutomaticos: [{ gesto: 'vigiar', intervalo: [8, 13], primeira: [1, 4] }, { gesto: 'olharParaBaixo', intervalo: [11, 18] }, { gesto: 'comunicador', intervalo: [16, 26] }, { gesto: 'capaAoVento', intervalo: [9, 15] }],
    ociosos: [{ nome: 'respirar', intervalo: [2.2, 3.2], duracao: 1.6, aplicar: (pose, fracao) => { if (fracao > 0.3 && fracao < 0.8) pose.respira += 1; } }],
    sempre: (pose, tempo) => { pose.capa += Math.sin(tempo * 0.7) * 0.8 + Math.sin(tempo * 1.9 + 1) * 0.4; },   // a capa balança sozinha
    desenharPartes,
    luzes(luz, pose, tempo, ponto) { const [computadorX, computadorY] = ponto(-14, -22); luz.ponto(computadorX, computadorY, 26, '#5fb4ff', 0.36 + 0.05 * Math.sin(tempo * 7)); },
    brilhos(contexto, pose, tempo, ponto, estado) {
      const locais = estado.locais || {};
      if (!locais.olhos) return;
      for (const [fendaX, fendaY, larguraDaFenda] of locais.olhos) for (let deslocamento = 0; deslocamento < larguraDaFenda; deslocamento++) {   // as duas fendas
        const [pixelX, pixelY] = ponto(fendaX + deslocamento, fendaY);
        cavernaSecreta.acenderPixel(contexto, pixelX, pixelY, '#cfe8ff', 0.3 + 0.1 * Math.sin(tempo * 7));
      }
    },
  });
})();
