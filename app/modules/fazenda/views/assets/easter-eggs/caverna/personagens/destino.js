// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · personagens/destino.js
// Doutor Destino: boneco articulado desenhado em código (técnica do celeiro, ver boneco.js), DE LADO em 3/4 olhando para a
// ESQUERDA (encara o Ultron), no padrão do Nick Fury do celeiro: silhueta da túnica centrada, peito, costura e o disco do cinto
// puxados para o lado do olhar, a lateral e a ombreira de longe na sombra; capuz com a parte de trás lisa e a borda iluminada,
// MÁSCARA de metal em 3/4 na frente (olho de perto e de longe, ponte do nariz, fenda da boca, rebites). Saia, braços e pernas
// de armadura, botas verdes; capa PESADA na camada de trás, presa aos ombros e caindo reta pelas costas (só a barra e as dobras
// balançam). Conjuração: o braço sobe pelo ombro e pelo cotovelo e a palma aberta emite energia verde.
// Nomes de coordenada: centroDaSilhuetaX = centro da silhueta; meioDaFrenteX = linha do meio da frente do tronco (puxada
// para o lado do olhar); ombrosY = linha dos ombros.
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta, ferramentasPixel = window.CenaDoCeleiro.pixel;
  const paletaCores = {
    pretoProfundo: '#06080a',
    verdeProfundo: '#0a1e11',
    verdeEscuro: '#163f21',
    verdeTunica: '#22602f',
    verdeIluminado: '#33843f',
    verdeClaro: '#55ad61',
    metalEscuro: '#454c55',
    metalMedio: '#737c87',
    metalClaro: '#aab3bc',
    metalBrilhante: '#e2e8ed',
    couroDoCinto: '#3a2714',
    dourado: '#c49330',
    douradoBrilhante: '#f0cf72',
  };

  const desenharPerna = (contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, ehDePerto) => {
    const perna = cavernaSecreta.desenharMembro(contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, {
      comprimentoSuperior: 10, comprimentoInferior: 9, grossuraSuperior: 4, grossuraInferior: 4,
      corSuperior: ehDePerto ? paletaCores.metalMedio : paletaCores.metalEscuro, corInferior: ehDePerto ? paletaCores.verdeTunica : paletaCores.verdeEscuro,
      corDoRealce: ehDePerto ? paletaCores.metalClaro : null, corDaJunta: ehDePerto ? paletaCores.metalClaro : paletaCores.metalMedio,
    });
    const [peX, peY] = perna.extremidade, [joelhoX, joelhoY] = perna.articulacao;
    ferramentasPixel.ret(contexto, joelhoX - 2, joelhoY, 5, 2, ehDePerto ? paletaCores.verdeIluminado : paletaCores.verdeTunica);   // cano da bota
    ferramentasPixel.poligono(contexto, [[peX - 2, peY - 2], [peX + 3, peY - 2], [peX + 5, peY + 1], [peX - 2, peY + 1]], ehDePerto ? paletaCores.verdeTunica : paletaCores.verdeEscuro);
    ferramentasPixel.ret(contexto, peX - 2, peY + 1, 8, 1, paletaCores.verdeProfundo);
  };

  const desenharPartes = (camadas, pose, tempo) => {
    const { origemX, origemY } = camadas, cores = paletaCores;
    const elevacaoDaRespiracao = -Math.round(pose.respira), centroX = origemX + Math.round(pose.inclina), ombrosY = origemY - 38 + elevacaoDaRespiracao;
    const balancoDaCapa = pose.capa, meioDaFrenteX = centroX + 3, centroDaSilhuetaX = centroX + 1;
    // ---- trás: CAPA pesada (presa aos ombros, cai reta pelas costas), perna e braço de longe
    const tras = camadas.tras;
    ferramentasPixel.poligono(tras, [[centroDaSilhuetaX - 7, ombrosY], [centroDaSilhuetaX + 5, ombrosY], [centroDaSilhuetaX + 5 + balancoDaCapa * 0.4, origemY - 16], [centroDaSilhuetaX + 4 + balancoDaCapa, origemY - 4], [centroDaSilhuetaX - 10 + balancoDaCapa, origemY - 3], [centroDaSilhuetaX - 10 + balancoDaCapa * 0.4, origemY - 16]], cores.verdeEscuro);
    ferramentasPixel.linha(tras, centroDaSilhuetaX - 7, ombrosY + 1, centroDaSilhuetaX - 10 + balancoDaCapa * 0.4, origemY - 16, cores.verdeTunica, 1);                       // borda iluminada
    ferramentasPixel.linha(tras, centroDaSilhuetaX - 10 + balancoDaCapa * 0.4, origemY - 16, centroDaSilhuetaX - 10 + balancoDaCapa, origemY - 4, cores.verdeTunica, 1);
    for (const [deslocamentoNoOmbro, deslocamentoNaBarra] of [[-5, -7], [-2, -3], [2, 1]]) {                                                             // dobras verticais
      ferramentasPixel.linha(tras, centroDaSilhuetaX + deslocamentoNoOmbro, ombrosY + 4, centroDaSilhuetaX + deslocamentoNaBarra + balancoDaCapa, origemY - 5, cores.verdeProfundo, 1);
    }
    ferramentasPixel.ret(tras, centroDaSilhuetaX - 10 + Math.round(balancoDaCapa), origemY - 4, 15, 1, cores.verdeProfundo);
    desenharPerna(tras, origemX - 2, origemY - 21, 2, -3, false);
    const bracoDeLonge = cavernaSecreta.desenharMembro(tras, centroX - 6, ombrosY + 3, pose.bracoDeLongeOmbro, pose.bracoDeLongeCotovelo, {
      comprimentoSuperior: 8, comprimentoInferior: 8, grossuraSuperior: 4, grossuraInferior: 4, corSuperior: cores.verdeTunica, corInferior: cores.metalEscuro, corDaJunta: cores.metalMedio,
    });
    ferramentasPixel.ret(tras, bracoDeLonge.extremidade[0] - 1, bracoDeLonge.extremidade[1] - 1, 3, 3, cores.metalMedio);

    // ---- corpo: perna de perto, saia, túnica, cinto com o disco, ombreira de longe, capuz e máscara
    const corpo = camadas.corpo;
    desenharPerna(corpo, origemX + 2, origemY - 21, 6, -7, true);
    ferramentasPixel.poligono(corpo, [[centroDaSilhuetaX - 6, ombrosY + 14], [centroDaSilhuetaX + 6, ombrosY + 14], [centroDaSilhuetaX + 8, ombrosY + 21], [centroDaSilhuetaX - 6, ombrosY + 21]], cores.verdeTunica);   // saia
    for (const deslocamentoDaPrega of [-2, 1, 4]) ferramentasPixel.linha(corpo, meioDaFrenteX + deslocamentoDaPrega, ombrosY + 15, meioDaFrenteX + deslocamentoDaPrega + 1, ombrosY + 21, cores.verdeEscuro, 1);
    ferramentasPixel.ret(corpo, centroDaSilhuetaX - 5, ombrosY + 15, 2, 5, cores.verdeEscuro);
    ferramentasPixel.poligono(corpo, [[centroDaSilhuetaX - 6, ombrosY - 1], [centroDaSilhuetaX + 6, ombrosY - 1], [centroDaSilhuetaX + 6, ombrosY + 13], [centroDaSilhuetaX - 6, ombrosY + 13]], cores.verdeTunica);       // túnica
    ferramentasPixel.poligono(corpo, [[centroDaSilhuetaX - 6, ombrosY - 1], [meioDaFrenteX - 3, ombrosY - 1], [meioDaFrenteX - 3, ombrosY + 13], [centroDaSilhuetaX - 6, ombrosY + 13]], cores.verdeEscuro);           // lateral de longe na sombra
    ferramentasPixel.poligono(corpo, [[meioDaFrenteX - 2, ombrosY], [meioDaFrenteX + 3, ombrosY], [meioDaFrenteX + 2, ombrosY + 9], [meioDaFrenteX - 1, ombrosY + 9]], cores.verdeIluminado);                      // peito (luz)
    ferramentasPixel.ret(corpo, meioDaFrenteX, ombrosY + 1, 2, 4, cores.verdeClaro);
    ferramentasPixel.linha(corpo, meioDaFrenteX - 2, ombrosY + 2, meioDaFrenteX - 2, ombrosY + 12, cores.verdeTunica, 1);                                                                              // costura
    ferramentasPixel.ret(corpo, centroDaSilhuetaX - 6, ombrosY + 12, 13, 3, cores.couroDoCinto);                                                                                                  // cinto com o disco
    ferramentasPixel.elipse(corpo, meioDaFrenteX + 1, ombrosY + 13, 2, 1.5, cores.dourado);
    ferramentasPixel.px(corpo, meioDaFrenteX, ombrosY + 12, cores.douradoBrilhante);
    ferramentasPixel.elipse(corpo, centroDaSilhuetaX - 6, ombrosY + 1, 3.5, 3, cores.metalEscuro);                                                                                                 // ombreira de longe (na sombra)
    ferramentasPixel.px(corpo, centroDaSilhuetaX - 7, ombrosY, cores.metalMedio);
    ferramentasPixel.ret(corpo, centroDaSilhuetaX - 9, ombrosY + 3, 6, 1, cores.verdeProfundo);
    const cabecaX = meioDaFrenteX - 1 + Math.round(pose.cabecaGiro), cabecaY = ombrosY - 9 + Math.round(pose.cabecaInclina), olharParaBaixo = pose.olhar ? 1 : 0;
    ferramentasPixel.poligono(corpo, [[centroDaSilhuetaX - 7, ombrosY + 1], [cabecaX - 6, cabecaY - 1], [cabecaX - 3, cabecaY - 7], [cabecaX + 3, cabecaY - 7], [cabecaX + 6, cabecaY - 1], [centroDaSilhuetaX + 7, ombrosY + 1]], cores.verdeTunica);   // capuz caindo nos ombros
    // capuz em 3/4 como a cabeça do Fury: a parte de trás do capuz lisa (com a borda iluminada), a máscara na frente
    ferramentasPixel.elipse(corpo, cabecaX, cabecaY - 1, 6, 6.5, cores.verdeTunica);
    ferramentasPixel.linha(corpo, cabecaX - 5, cabecaY - 2, cabecaX - 2, cabecaY - 7, cores.verdeIluminado, 1);
    ferramentasPixel.px(corpo, cabecaX - 3, cabecaY - 6, cores.verdeClaro);
    ferramentasPixel.linha(corpo, cabecaX - 6, cabecaY - 1, cabecaX - 5, cabecaY + 4, cores.verdeIluminado, 1);
    ferramentasPixel.poligono(corpo, [[cabecaX - 2, cabecaY - 5], [cabecaX + 6, cabecaY - 5], [cabecaX + 6, cabecaY + 3], [cabecaX + 4, cabecaY + 6], [cabecaX, cabecaY + 6], [cabecaX - 2, cabecaY + 3]], cores.verdeProfundo);   // boca do capuz (sombra)
    ferramentasPixel.poligono(corpo, [[cabecaX - 1, cabecaY - 4], [cabecaX + 5, cabecaY - 4], [cabecaX + 6, cabecaY + 2], [cabecaX + 4, cabecaY + 5], [cabecaX + 1, cabecaY + 5], [cabecaX - 1, cabecaY + 2]], cores.metalMedio);  // MÁSCARA em 3/4
    ferramentasPixel.ret(corpo, cabecaX, cabecaY - 4, 5, 1, cores.metalClaro);                                                                    // testa (luz)
    ferramentasPixel.linha(corpo, cabecaX - 1, cabecaY - 3, cabecaX - 1, cabecaY + 2, cores.metalEscuro, 1);                                      // lado de perto da máscara curvando
    ferramentasPixel.ret(corpo, cabecaX, cabecaY - 2 + olharParaBaixo, 2, 1, cores.pretoProfundo);                                                // olho de perto e olho de longe
    ferramentasPixel.px(corpo, cabecaX + 4, cabecaY - 2 + olharParaBaixo, cores.pretoProfundo);
    ferramentasPixel.linha(corpo, cabecaX + 3, cabecaY - 2, cabecaX + 4, cabecaY + 1, cores.metalBrilhante, 1);                                   // ponte do nariz
    ferramentasPixel.ret(corpo, cabecaX + 1, cabecaY + 3, 4, 1, cores.pretoProfundo);                                                             // fenda da boca
    ferramentasPixel.px(corpo, cabecaX, cabecaY + 1, cores.metalEscuro);                                                                          // rebites
    ferramentasPixel.px(corpo, cabecaX + 5, cabecaY, cores.metalEscuro);
    ferramentasPixel.px(corpo, cabecaX, cabecaY - 3, cores.metalEscuro);

    // ---- frente: ombreira e braço de perto (manga verde + armadura), manopla e mão
    const frente = camadas.frente;
    ferramentasPixel.elipse(frente, centroX + 6, ombrosY + 1, 3.5, 3, cores.metalMedio);
    ferramentasPixel.px(frente, centroX + 5, ombrosY - 1, cores.metalBrilhante);
    ferramentasPixel.ret(frente, centroX + 3, ombrosY + 3, 7, 1, cores.metalEscuro);
    const bracoDePerto = cavernaSecreta.desenharMembro(frente, centroX + 6, ombrosY + 4, pose.bracoDePertoOmbro, pose.bracoDePertoCotovelo, {
      comprimentoSuperior: 8, comprimentoInferior: 8, grossuraSuperior: 4, grossuraInferior: 4, corSuperior: cores.verdeTunica, corInferior: cores.metalMedio, corDoRealce: cores.metalClaro, corDaJunta: cores.metalClaro,
    });
    const manopla = cavernaSecreta.pontoEntre(bracoDePerto.articulacao, bracoDePerto.extremidade, 0.7);
    ferramentasPixel.elipse(frente, manopla[0], manopla[1], 2, 2, cores.metalMedio);                                                              // manopla larga
    const [maoX, maoY] = bracoDePerto.extremidade, anguloDoAntebraco = cavernaSecreta.grausParaRadianos(bracoDePerto.anguloFinal);
    if (pose.mao > 0.5) {                                                                                                                         // palma aberta (conjurando)
      for (let dedo = -1; dedo <= 2; dedo++) {
        const anguloDoDedo = anguloDoAntebraco + dedo * 0.4;
        ferramentasPixel.linha(frente, maoX, maoY, maoX + Math.sin(anguloDoDedo) * 3.5, maoY + Math.cos(anguloDoDedo) * 3.5, cores.metalClaro, 1);
      }
      ferramentasPixel.elipse(frente, maoX, maoY, 1.5, 1.5, cores.metalBrilhante);
    } else ferramentasPixel.ret(frente, maoX - 2, maoY - 1, 4, 4, cores.metalMedio);
    return {
      olhos: [[cabecaX - origemX, cabecaY - 2 + olharParaBaixo - origemY, 2], [cabecaX + 4 - origemX, cabecaY - 2 + olharParaBaixo - origemY, 1]],   // [x, y, largura em px] de cada olho
      mao: [maoX - origemX, maoY - origemY],
    };
  };

  // Mão na fivela, escrita pelo destino da mão (cavernaSecreta.angulosParaAlcancar): a partir do ombro de perto
  // (centroX + 6, ombrosY + 4) até o disco do cinto (centroX + 4, ombrosY + 13), com o cotovelo para a frente; dobra de
  // referência = a do repouso (−8°). Braço de 8 + 8 px, como em desenharPartes.
  const MAO_NA_FIVELA = cavernaSecreta.angulosParaAlcancar(-1, 8, 8, 8, true, -8);

  cavernaSecreta.registrarPersonagem({
    boneco: true, id: 'destino', direcao: -1,
    falas: { frases: ['Eu sou... Destino!'], intervalo: [20, 34], primeira: [8, 16], ancora: [1, -57], gesto: 'encarar' },
    largura: 56, altura: 64, origem: [28, 61], sombra: 13, contorno: '#040806',
    pose: { respira: 0, inclina: 0, cabecaGiro: 0, cabecaInclina: 0, bracoDePertoOmbro: 6, bracoDePertoCotovelo: -8, bracoDeLongeOmbro: -4, bracoDeLongeCotovelo: -6, mao: 0, magia: 0, capa: 0, olhar: 0, olhos: 0 },
    gestos: {
      // início (o braço sai do corpo), execução (erguido, palma aberta acima do ombro), retorno
      conjurar: [{ t: 0 }, { t: 0.5, bracoDePertoOmbro: 70, bracoDePertoCotovelo: -45, mao: 1, magia: 0.15 }, { t: 1.0, bracoDePertoOmbro: 140, bracoDePertoCotovelo: -25, mao: 1, magia: 1 }, { t: 2.7, bracoDePertoOmbro: 146, bracoDePertoCotovelo: -30, mao: 1, magia: 1 }, { t: 3.2, bracoDePertoOmbro: 70, bracoDePertoCotovelo: -45, mao: 1, magia: 0.2 }, { t: 3.7 }],
      olharLento: [{ t: 0 }, { t: 0.8, cabecaGiro: -1 }, { t: 2.8, cabecaGiro: -1 }, { t: 3.4, cabecaGiro: 1 }, { t: 4.6, cabecaGiro: 1 }, { t: 5.2 }],
      encarar: [{ t: 0 }, { t: 0.4, cabecaInclina: 1, olhar: 1, olhos: 1 }, { t: 1.8, cabecaInclina: 1, olhar: 1, olhos: 1 }, { t: 2.2 }],
      // a manopla DE PERTO pousa na fivela do cinto (antes era o braço de longe, que ficava escondido atrás da túnica)
      maoNoCinto: [{ t: 0 }, { t: 0.5, bracoDePertoOmbro: MAO_NA_FIVELA.anguloDaRaiz, bracoDePertoCotovelo: MAO_NA_FIVELA.anguloDaDobra }, { t: 2.5, bracoDePertoOmbro: MAO_NA_FIVELA.anguloDaRaiz + 2, bracoDePertoCotovelo: MAO_NA_FIVELA.anguloDaDobra - 2, cabecaInclina: 1 }, { t: 3.0 }],
    },
    gestosAutomaticos: [{ gesto: 'conjurar', intervalo: [11, 18], primeira: [3, 7] }, { gesto: 'olharLento', intervalo: [9, 15] }, { gesto: 'encarar', intervalo: [13, 21] }, { gesto: 'maoNoCinto', intervalo: [15, 25] }],
    ociosos: [
      { nome: 'respirar', intervalo: [2.6, 3.4], duracao: 1.8, aplicar: (pose, fracao) => { if (fracao > 0.3 && fracao < 0.8) pose.respira += 1; } },
      { nome: 'olhos', intervalo: [6, 12], duracao: [1.2, 2.2], aplicar: (pose, fracao) => { pose.olhos = Math.max(pose.olhos, cavernaSecreta.vaiEVolta(fracao)); } },
    ],
    sempre: (pose, tempo) => { pose.capa = Math.sin(tempo * 0.9) * 1.2 + Math.sin(tempo * 0.37 + 1) * 0.8; },   // tecido pesado: balanço lento e pequeno
    desenharPartes,
    luzes(luz, pose, tempo, ponto, estado) {
      const locais = estado.locais || {};
      if (pose.magia > 0.05 && locais.mao) { const [maoX, maoY] = ponto(locais.mao[0], locais.mao[1]); luz.ponto(maoX, maoY, 30, '#39ff6a', 0.6 * pose.magia); }
    },
    brilhos(contexto, pose, tempo, ponto, estado) {
      const locais = estado.locais || {};
      if (!locais.olhos) return;
      if (pose.olhos > 0.05) for (const [olhoX, olhoY, larguraDoOlho] of locais.olhos) {   // os dois olhos acendem
        const [centroDoOlhoX, centroDoOlhoY] = ponto(olhoX + (larguraDoOlho - 1) / 2, olhoY);
        cavernaSecreta.desenharBrilho(contexto, centroDoOlhoX, centroDoOlhoY, 2.5, '#4dff7a', 0.6 * pose.olhos, 0.5);
        for (let deslocamento = 0; deslocamento < larguraDoOlho; deslocamento++) {
          const [pixelX, pixelY] = ponto(olhoX + deslocamento, olhoY);
          cavernaSecreta.acenderPixel(contexto, pixelX, pixelY, '#b8ffc8', 0.8 * pose.olhos);
        }
      }
      if (pose.magia > 0.05) {
        const [maoX, maoY] = ponto(locais.mao[0], locais.mao[1]), pulso = 0.8 + 0.2 * Math.sin(tempo * 9);
        cavernaSecreta.desenharBrilho(contexto, maoX, maoY, 7, '#39ff6a', 0.8 * pose.magia * pulso);
        for (let centelha = 0; centelha < 5; centelha++) {   // centelhas girando em volta da palma
          const angulo = tempo * 3 + centelha * 1.26, raio = 4 + Math.round(Math.sin(tempo * 5 + centelha) * 1.5);
          cavernaSecreta.acenderPixel(contexto, maoX + Math.round(Math.cos(angulo) * raio), maoY + Math.round(Math.sin(angulo) * raio * 0.8) - 2, '#c8ffd4', pose.magia);
        }
      }
    },
  });
})();
