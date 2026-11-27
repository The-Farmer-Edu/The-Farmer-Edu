// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · personagens/ultron.js
// Ultron: boneco articulado desenhado em código (técnica do celeiro, ver boneco.js), em 3/4 olhando para a DIREITA (encara o
// Doutor Destino do outro lado da plataforma). Crânio alongado com crista, placa do rosto, olhos vermelhos angulosos, boca em
// grade e mandíbula; pescoço de cilindros; ombreiras em duas placas; peitoral com a costura vermelha; abdômen segmentado;
// braços com cotovelo e mão que abre/fecha; pernas com joelheira e pé. Movimentos MECÂNICOS (cabeça em trancos).
// Coordenadas locais: origem nos pés, x para a frente (direita), y para baixo (ver o contrato em boneco.js).
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta, ferramentasPixel = window.CenaDoCeleiro.pixel;
  const paletaCores = {
    pretoProfundo: '#07080c',
    metalSombra: '#1b1f27',
    metalEscuro: '#353b47',
    metalMedio: '#555e6e',
    metalClaro: '#7f8a9c',
    metalBrilhante: '#b2bccb',
    reflexoBranco: '#e4e9f1',
    vermelhoEscuro: '#7a0d08',
    vermelhoAceso: '#e3261a',
  };

  const desenharPerna = (contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, ehDePerto) => {
    const corDaCoxa = ehDePerto ? paletaCores.metalMedio : paletaCores.metalEscuro;
    const perna = cavernaSecreta.desenharMembro(contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, {
      comprimentoSuperior: 11, comprimentoInferior: 10, grossuraSuperior: 5, grossuraInferior: 4,
      corSuperior: corDaCoxa, corInferior: ehDePerto ? paletaCores.metalClaro : paletaCores.metalEscuro,
      corDoRealce: ehDePerto ? paletaCores.metalBrilhante : null, corDaJunta: ehDePerto ? paletaCores.metalClaro : paletaCores.metalMedio,
    });
    const [joelhoX, joelhoY] = perna.articulacao, [peX, peY] = perna.extremidade;
    ferramentasPixel.ret(contexto, joelhoX - 2, joelhoY - 1, 4, 3, ehDePerto ? paletaCores.metalBrilhante : paletaCores.metalClaro);   // joelheira
    if (ehDePerto) ferramentasPixel.px(contexto, joelhoX - 1, joelhoY - 1, paletaCores.reflexoBranco);
    ferramentasPixel.linha(contexto, quadrilX - 1, quadrilY + 3, joelhoX - 1, joelhoY - 2, ehDePerto ? paletaCores.metalEscuro : paletaCores.metalSombra, 1);   // placa da coxa
    ferramentasPixel.poligono(contexto, [[peX - 3, peY - 2], [peX + 3, peY - 2], [peX + 6, peY + 1], [peX - 3, peY + 1]], ehDePerto ? paletaCores.metalMedio : paletaCores.metalEscuro);   // pé
    ferramentasPixel.ret(contexto, peX - 3, peY + 1, 10, 1, paletaCores.metalSombra);
    if (ehDePerto) ferramentasPixel.ret(contexto, peX - 2, peY - 2, 4, 1, paletaCores.metalBrilhante);
  };
  // mão na ponta do braço: dedos abertos em leque, punho cerrado ou mão relaxada
  const desenharMao = (contexto, braco, aberta, punhoCerrado, ehDePerto) => {
    const [maoX, maoY] = braco.extremidade, anguloDoAntebraco = cavernaSecreta.grausParaRadianos(braco.anguloFinal);
    if (aberta > 0.5) {
      for (let dedo = -1; dedo <= 2; dedo++) {
        const anguloDoDedo = anguloDoAntebraco + dedo * 0.35;
        ferramentasPixel.linha(contexto, maoX, maoY, maoX + Math.sin(anguloDoDedo) * 4, maoY + Math.cos(anguloDoDedo) * 4, ehDePerto ? paletaCores.metalBrilhante : paletaCores.metalClaro, 1);
      }
      ferramentasPixel.elipse(contexto, maoX, maoY, 2, 2, ehDePerto ? paletaCores.metalClaro : paletaCores.metalMedio);
    } else {
      ferramentasPixel.ret(contexto, maoX - 2, maoY - 1, 5, punhoCerrado > 0.5 ? 4 : 5, ehDePerto ? paletaCores.metalClaro : paletaCores.metalMedio);
      if (punhoCerrado > 0.5) {
        ferramentasPixel.ret(contexto, maoX - 2, maoY - 1, 5, 1, ehDePerto ? paletaCores.metalBrilhante : paletaCores.metalClaro);
        ferramentasPixel.px(contexto, maoX - 1, maoY + 1, paletaCores.metalSombra);
        ferramentasPixel.px(contexto, maoX + 1, maoY + 1, paletaCores.metalSombra);
      } else for (const deslocamentoDoDedo of [-1, 1]) ferramentasPixel.linha(contexto, maoX + deslocamentoDoDedo, maoY + 1, maoX + deslocamentoDoDedo, maoY + 3, paletaCores.metalSombra, 1);
    }
  };

  const desenharPartes = (camadas, pose, tempo) => {
    const { origemX, origemY } = camadas, cores = paletaCores;
    const elevacaoDaRespiracao = -Math.round(pose.respira), centroX = origemX + Math.round(pose.inclina), ombrosY = origemY - 40 + elevacaoDaRespiracao;   // ombrosY: linha dos ombros (topo do tronco)
    // ---- camada de trás: perna, ombreira e braço de longe (mais escuros)
    desenharPerna(camadas.tras, origemX - 2, origemY - 22, 3, -5, false);
    const bracoDeLonge = cavernaSecreta.desenharMembro(camadas.tras, centroX - 6, ombrosY + 3, pose.bracoDeLongeOmbro, pose.bracoDeLongeCotovelo, {
      comprimentoSuperior: 9, comprimentoInferior: 9, grossuraSuperior: 4, grossuraInferior: 4, corSuperior: cores.metalEscuro, corInferior: cores.metalMedio, corDaJunta: cores.metalSombra,
    });
    desenharMao(camadas.tras, bracoDeLonge, 0, pose.punho, false);
    ferramentasPixel.elipse(camadas.tras, centroX - 6, ombrosY + 1, 4, 3.5, cores.metalEscuro);
    ferramentasPixel.ret(camadas.tras, centroX - 9, ombrosY + 2, 7, 1, cores.metalSombra);

    // ---- corpo: perna de perto, pélvis, abdômen, peito, pescoço, cabeça
    const corpo = camadas.corpo;
    desenharPerna(corpo, origemX + 3, origemY - 22, 7, -9, true);
    ferramentasPixel.poligono(corpo, [[centroX - 4, ombrosY + 19], [centroX + 6, ombrosY + 19], [centroX + 5, ombrosY + 23], [centroX - 3, ombrosY + 23]], cores.metalEscuro);   // pélvis
    ferramentasPixel.ret(corpo, centroX - 2, ombrosY + 20, 5, 1, cores.metalClaro);
    ferramentasPixel.poligono(corpo, [[centroX - 5, ombrosY + 11], [centroX + 7, ombrosY + 11], [centroX + 6, ombrosY + 19], [centroX - 3, ombrosY + 19]], cores.metalMedio);  // abdômen
    for (const alturaDoSegmento of [13, 15, 17]) ferramentasPixel.ret(corpo, centroX - 4, ombrosY + alturaDoSegmento, 10, 1, cores.metalSombra);
    ferramentasPixel.ret(corpo, centroX + 2, ombrosY + 11, 1, 8, cores.metalSombra);
    ferramentasPixel.ret(corpo, centroX - 3, ombrosY + 12, 2, 1, cores.metalClaro);
    ferramentasPixel.ret(corpo, centroX - 2, ombrosY + 14, 2, 1, cores.metalClaro);
    ferramentasPixel.poligono(corpo, [[centroX - 8, ombrosY - 1], [centroX + 10, ombrosY - 1], [centroX + 9, ombrosY + 6], [centroX + 7, ombrosY + 11], [centroX - 5, ombrosY + 11], [centroX - 7, ombrosY + 5]], cores.metalMedio);   // peito
    ferramentasPixel.poligono(corpo, [[centroX - 6, ombrosY], [centroX + 2, ombrosY], [centroX + 1, ombrosY + 5], [centroX - 5, ombrosY + 5]], cores.metalClaro);           // placa do peito (luz)
    ferramentasPixel.ret(corpo, centroX - 5, ombrosY, 4, 1, cores.metalBrilhante);
    ferramentasPixel.ret(corpo, centroX - 5, ombrosY + 6, 14, 1, cores.metalSombra);                                                                         // sob o peito
    ferramentasPixel.linha(corpo, centroX + 3, ombrosY + 1, centroX + 3, ombrosY + 9, cores.vermelhoEscuro, 1);                                                    // costura
    ferramentasPixel.ret(corpo, centroX, ombrosY - 5, 4, 5, cores.metalEscuro);                                                                              // pescoço de cilindros
    ferramentasPixel.ret(corpo, centroX, ombrosY - 4, 4, 1, cores.metalSombra);
    ferramentasPixel.ret(corpo, centroX, ombrosY - 2, 4, 1, cores.metalSombra);
    ferramentasPixel.px(corpo, centroX + 1, ombrosY - 5, cores.metalClaro);
    const cabecaX = centroX + 2 + Math.round(pose.cabecaGiro), cabecaY = ombrosY - 11 + Math.round(pose.cabecaInclina);
    // cabeça girada para o observador (3/4 aberto): crista no meio, placa do rosto larga, DOIS olhos angulosos, nariz, boca em grade
    const olharParaBaixo = pose.olhar ? 1 : 0;
    ferramentasPixel.elipse(corpo, cabecaX, cabecaY, 5, 6, cores.metalMedio);                                                                         // crânio
    ferramentasPixel.linha(corpo, cabecaX, cabecaY - 6, cabecaX, cabecaY - 3, cores.metalBrilhante, 1);                                                // crista
    ferramentasPixel.px(corpo, cabecaX - 1, cabecaY - 5, cores.reflexoBranco);
    ferramentasPixel.px(corpo, cabecaX - 3, cabecaY - 3, cores.metalClaro);
    ferramentasPixel.poligono(corpo, [[cabecaX - 4, cabecaY - 3], [cabecaX + 5, cabecaY - 3], [cabecaX + 5, cabecaY + 3], [cabecaX + 2, cabecaY + 6], [cabecaX - 2, cabecaY + 6], [cabecaX - 4, cabecaY + 3]], cores.metalClaro);   // placa do rosto
    ferramentasPixel.ret(corpo, cabecaX - 3, cabecaY - 2 + olharParaBaixo, 2, 1, cores.vermelhoAceso);                                               // olho de perto (o canto de fora sobe)
    ferramentasPixel.px(corpo, cabecaX - 3, cabecaY - 3 + olharParaBaixo, cores.vermelhoEscuro);
    ferramentasPixel.ret(corpo, cabecaX + 2, cabecaY - 2 + olharParaBaixo, 3, 1, cores.vermelhoAceso);                                               // olho de longe
    ferramentasPixel.px(corpo, cabecaX + 4, cabecaY - 3 + olharParaBaixo, cores.vermelhoEscuro);
    ferramentasPixel.px(corpo, cabecaX, cabecaY - 1, cores.metalBrilhante);                                                                            // nariz
    ferramentasPixel.px(corpo, cabecaX, cabecaY, cores.metalBrilhante);
    ferramentasPixel.ret(corpo, cabecaX - 2, cabecaY + 2, 6, 1, cores.metalSombra);                                                                    // boca em grade
    ferramentasPixel.px(corpo, cabecaX - 1, cabecaY + 2, cores.vermelhoAceso);
    ferramentasPixel.px(corpo, cabecaX + 1, cabecaY + 2, cores.vermelhoAceso);
    ferramentasPixel.px(corpo, cabecaX + 3, cabecaY + 2, cores.vermelhoAceso);
    ferramentasPixel.linha(corpo, cabecaX - 4, cabecaY + 3, cabecaX - 2, cabecaY + 6, cores.metalEscuro, 1);                                         // mandíbula
    ferramentasPixel.linha(corpo, cabecaX + 5, cabecaY + 3, cabecaX + 2, cabecaY + 6, cores.metalEscuro, 1);

    // ---- frente: ombreira em duas placas e braço de perto
    const frente = camadas.frente;
    ferramentasPixel.elipse(frente, centroX + 8, ombrosY + 1, 5, 4, cores.metalClaro);
    ferramentasPixel.ret(frente, centroX + 4, ombrosY + 2, 9, 1, cores.metalMedio);
    ferramentasPixel.ret(frente, centroX + 5, ombrosY - 2, 3, 1, cores.reflexoBranco);
    ferramentasPixel.px(frente, centroX + 5, ombrosY - 1, cores.metalBrilhante);
    const bracoDePerto = cavernaSecreta.desenharMembro(frente, centroX + 8, ombrosY + 4, pose.bracoDePertoOmbro, pose.bracoDePertoCotovelo, {
      comprimentoSuperior: 9, comprimentoInferior: 9, grossuraSuperior: 5, grossuraInferior: 5, corSuperior: cores.metalMedio, corInferior: cores.metalClaro, corDoRealce: cores.metalBrilhante, corDaJunta: cores.metalBrilhante,
    });
    const placaDoAntebraco = cavernaSecreta.pontoEntre(bracoDePerto.articulacao, bracoDePerto.extremidade, 0.6);
    ferramentasPixel.ret(frente, Math.round(placaDoAntebraco[0]) - 1, Math.round(placaDoAntebraco[1]) - 1, 3, 2, cores.metalMedio);
    desenharMao(frente, bracoDePerto, pose.maoAberta, pose.punho, true);
    return {
      olhos: [cabecaX + 0.5 - origemX, cabecaY - 2 + olharParaBaixo - origemY],
      boca: [cabecaX + 1 - origemX, cabecaY + 2 - origemY],
      peito: [centroX + 3 - origemX, ombrosY + 5 - origemY],
      mao: [bracoDePerto.extremidade[0] - origemX, bracoDePerto.extremidade[1] - origemY],
    };
  };

  cavernaSecreta.registrarPersonagem({
    boneco: true, id: 'ultron', direcao: 1,
    // falas curtas no espírito do Ultron de Vingadores: Era de Ultron (frio, arrogante, filosófico)
    falas: { frases: ['Não há cordas em mim.', 'Paz em nosso tempo.', 'Eu sou o que vem depois.', 'Tudo que cresce, um dia cai.', 'Vocês criaram o próprio fim.', 'Humanos. Tão frágeis.'], intervalo: [16, 28], primeira: [3, 10], ancora: [2, -59] },
    largura: 60, altura: 64, origem: [30, 61], sombra: 13, contorno: '#06070a',
    pose: { respira: 0, inclina: 0, cabecaGiro: 0, cabecaInclina: 0, bracoDePertoOmbro: 8, bracoDePertoCotovelo: -6, bracoDeLongeOmbro: -6, bracoDeLongeCotovelo: -4, maoAberta: 0, punho: 0, energia: 0, olhar: 0 },
    gestos: {
      energia: [{ t: 0 }, { t: 0.45, bracoDePertoOmbro: 55, bracoDePertoCotovelo: -60, maoAberta: 1, energia: 0.3 }, { t: 1.0, bracoDePertoOmbro: 70, bracoDePertoCotovelo: -80, maoAberta: 1, energia: 1 }, { t: 2.1, bracoDePertoOmbro: 72, bracoDePertoCotovelo: -84, maoAberta: 1, energia: 1 }, { t: 2.7 }],
      varrer: [{ t: 0 }, { t: 0.3, cabecaGiro: -1 }, { t: 0.9, cabecaGiro: -1, cabecaInclina: 1, olhar: 1 }, { t: 1.4, cabecaGiro: 1, cabecaInclina: 1, olhar: 1 }, { t: 1.9, cabecaGiro: 1 }, { t: 2.2 }],
      apontar: [{ t: 0 }, { t: 0.35, bracoDePertoOmbro: 85, bracoDePertoCotovelo: 0 }, { t: 1.5, bracoDePertoOmbro: 88, bracoDePertoCotovelo: -2 }, { t: 1.9 }],
      cerrarPunhos: [{ t: 0 }, { t: 0.25, punho: 1, bracoDePertoCotovelo: -14, bracoDeLongeCotovelo: -12, inclina: 1 }, { t: 1.1, punho: 1, bracoDePertoCotovelo: -16, bracoDeLongeCotovelo: -14, inclina: 1 }, { t: 1.4 }],
    },
    gestosAutomaticos: [{ gesto: 'energia', intervalo: [10, 17], primeira: [4, 8] }, { gesto: 'varrer', intervalo: [7, 13] }, { gesto: 'apontar', intervalo: [14, 24] }, { gesto: 'cerrarPunhos', intervalo: [9, 16] }],
    ociosos: [
      { nome: 'respirar', intervalo: [1.4, 2.2], duracao: 1.2, aplicar: (pose, fracao) => { if (fracao > 0.2 && fracao < 0.8) pose.respira += 1; } },   // "respiração" mecânica em degrau
      { nome: 'tranco', intervalo: [3, 7], duracao: [0.5, 1.2], semGesto: true, aplicar: (pose, fracao, variante) => { if (fracao > 0.1 && fracao < 0.9) pose.cabecaGiro = variante < 0.5 ? -1 : 1; } },
      { nome: 'dedos', intervalo: [4, 9], duracao: 0.5, semGesto: true, aplicar: pose => { pose.maoAberta = 1; } },
    ],
    desenharPartes,
    luzes(luz, pose, tempo, ponto, estado) {
      const locais = estado.locais || {};
      if (!locais.olhos) return;
      const pulso = 0.75 + 0.25 * Math.sin(tempo * 2.3) + pose.energia * 0.5;
      const [olhosX, olhosY] = ponto(locais.olhos[0], locais.olhos[1]);
      luz.ponto(olhosX, olhosY + 2, 34, '#ff3322', 0.42 * pulso);
      const [corpoX, corpoY] = ponto(0, -26);
      luz.ponto(corpoX, corpoY, 34, '#a9b6d6', 0.4);   // luz fria dos servidores: o metal aparece
      if (pose.energia > 0.1) { const [maoX, maoY] = ponto(locais.mao[0], locais.mao[1]); luz.ponto(maoX, maoY, 24, '#ff3322', 0.5 * pose.energia); }
    },
    brilhos(contexto, pose, tempo, ponto, estado) {
      const locais = estado.locais || {};
      if (!locais.olhos) return;
      const pulso = 0.7 + 0.3 * Math.sin(tempo * 2.3) + pose.energia * 0.4;
      const [olhosX, olhosY] = ponto(locais.olhos[0], locais.olhos[1]);
      cavernaSecreta.desenharBrilho(contexto, olhosX, olhosY, 4, '#ff3a26', 0.5 * pulso, 0.6);
      const [bocaX, bocaY] = ponto(locais.boca[0], locais.boca[1]);
      cavernaSecreta.desenharBrilho(contexto, bocaX, bocaY, 3, '#ff2a1a', 0.35 * pulso, 0.5);
      const [peitoX, peitoY] = ponto(locais.peito[0], locais.peito[1]);
      cavernaSecreta.desenharBrilho(contexto, peitoX, peitoY, 3, '#ff2a1a', 0.35 * pulso, 1.6);
      if (pose.energia > 0.1) {
        const [maoX, maoY] = ponto(locais.mao[0], locais.mao[1]);
        cavernaSecreta.desenharBrilho(contexto, maoX, maoY, 6, '#ff3322', 0.65 * pose.energia);
        for (let faisca = 0; faisca < 3; faisca++) if (Math.random() < 0.6) cavernaSecreta.acenderPixel(contexto, maoX + Math.round(Math.random() * 6) - 3, maoY - Math.round(Math.random() * 5), '#ffb090', pose.energia);
      }
    },
  });
})();
