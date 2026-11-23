// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · personagens/venom.js
// Venom: boneco articulado desenhado em código (técnica do celeiro, ver boneco.js), DE LADO em 3/4 olhando para a ESQUERDA
// (encara o Hulk), no padrão do Nick Fury do celeiro, em postura PREDATÓRIA: os dois joelhos dobrados para a frente, tronco
// inclinado com os ombros erguidos, pescoço grosso levando a CABEÇA PROJETADA à frente e acima dos ombros; nuca lisa com
// reflexo atrás, olhos brancos angulosos (o de perto grande) e a bocarra com gengiva, dentes, mandíbula móvel e a LÍNGUA, que
// sai da boca para a frente; aranha branca no peito em perspectiva. Em 3/4 de verdade o braço DE PERTO fica preso ao ombro no
// meio da silhueta (camada da frente) e o braço DE LONGE aparece na frente, atrás do peito (camada de trás), com as garras
// bem abaixo da cabeça. Preto dominante com reflexos azulados.
// Nomes de coordenada: centroDosOmbrosX = centro da silhueta dos ombros (à frente da cintura: o tronco inclina para a frente);
// meioDaFrenteX = meio da frente do tronco; cinturaX/cinturaY = cintura; ombrosY = linha dos ombros.
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta, ferramentasPixel = window.CenaDoCeleiro.pixel;
  const paletaCores = {
    simbionteSombra: '#07080f',
    simbionte: '#11152a',
    simbionteMedio: '#1f2745',
    reflexoAzul: '#354278',
    reflexoAzulClaro: '#5868b0',
    brilhoDaNuca: '#a9b6e8',
    branco: '#f6f6f2',
    brancoSombra: '#c4c8d8',
    dentes: '#f0ead6',
    bocaInterna: '#3a0510',
    gengiva: '#c41c46',
    lingua: '#ff5a7e',
    linguaSombra: '#b0224a',
  };

  const desenharPerna = (contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, ehDePerto) => {
    const cores = paletaCores;
    const perna = cavernaSecreta.desenharMembro(contexto, quadrilX, quadrilY, anguloDoQuadril, anguloDoJoelho, {
      comprimentoSuperior: 11, comprimentoInferior: 11, grossuraSuperior: ehDePerto ? 7 : 6, grossuraInferior: ehDePerto ? 6 : 5,
      corSuperior: ehDePerto ? cores.simbionteMedio : cores.simbionte, corInferior: ehDePerto ? cores.simbionte : cores.simbionteSombra, corDoRealce: ehDePerto ? cores.reflexoAzul : null,
    });
    const [joelhoX, joelhoY] = perna.articulacao, [peX, peY] = perna.extremidade;
    if (ehDePerto) { ferramentasPixel.elipse(contexto, joelhoX + 1, joelhoY - 1, 2.5, 2, cores.reflexoAzul); ferramentasPixel.px(contexto, joelhoX, joelhoY - 2, cores.reflexoAzulClaro); }   // joelho
    ferramentasPixel.poligono(contexto, [[peX - 3, peY - 2], [peX + 4, peY - 2], [peX + 7, peY + 1], [peX - 3, peY + 1]], ehDePerto ? cores.simbionte : cores.simbionteSombra);
    for (const garraX of [4, 6, 8]) ferramentasPixel.px(contexto, peX + garraX, peY + 1, ehDePerto ? cores.brancoSombra : cores.simbionte);   // garras do pé
  };
  // Mão com três garras na direção do antebraço (mais abertas no ataque). As garras precisam de ESPAÇO entre si: com 1 px de
  // largura e pouca abertura, o contorno de cada camada preenchia os vãos e a mão virava um xadrez branco e preto. Com
  // ABERTURA_FECHADA/ABERTA as pontas ficam ≥ 2 px separadas; cada garra termina em gancho (a ponta curva para dentro).
  const ABERTURA_DAS_GARRAS_FECHADAS = 0.45, ABERTURA_DAS_GARRAS_ABERTAS = 0.75, CURVA_DO_GANCHO = 0.6;
  const desenharGarras = (contexto, braco, abertas, ehDePerto) => {
    const cores = paletaCores, [maoX, maoY] = braco.extremidade, anguloDoAntebraco = cavernaSecreta.grausParaRadianos(braco.anguloFinal);
    const corDoDedo = ehDePerto ? cores.simbionte : cores.simbionteSombra, corDaGarra = ehDePerto ? cores.branco : cores.brancoSombra;
    ferramentasPixel.elipse(contexto, maoX, maoY, 2.5, 2, ehDePerto ? cores.simbionteMedio : cores.simbionte);
    for (let garra = -1; garra <= 1; garra++) {
      const anguloDaGarra = anguloDoAntebraco + garra * (abertas ? ABERTURA_DAS_GARRAS_ABERTAS : ABERTURA_DAS_GARRAS_FECHADAS);
      const pontoNaGarra = distancia => [maoX + Math.sin(anguloDaGarra) * distancia, maoY + Math.cos(anguloDaGarra) * distancia];
      const [dedoX, dedoY] = pontoNaGarra(3), [garraX, garraY] = pontoNaGarra(5.5);
      ferramentasPixel.linha(contexto, maoX, maoY, dedoX, dedoY, corDoDedo, 1);
      ferramentasPixel.linha(contexto, dedoX, dedoY, garraX, garraY, corDaGarra, 1);
      // gancho: a ponta vira para o meio da mão (a garra do meio curva para a frente do corpo)
      const anguloDoGancho = anguloDaGarra - (garra === 0 ? 1 : garra) * CURVA_DO_GANCHO;
      ferramentasPixel.px(contexto, Math.round(garraX + Math.sin(anguloDoGancho) * 1.5), Math.round(garraY + Math.cos(anguloDoGancho) * 1.5), corDaGarra);
    }
  };

  const desenharPartes = (camadas, pose, tempo) => {
    const { origemX, origemY } = camadas, cores = paletaCores;
    const elevacaoDaRespiracao = -Math.round(pose.respira), inclinacao = Math.round(pose.inclina), ombrosY = origemY - 40 + elevacaoDaRespiracao;
    const cinturaX = origemX + 2 + inclinacao, centroDosOmbrosX = origemX + 6 + inclinacao, meioDaFrenteX = centroDosOmbrosX + 5, cinturaY = origemY - 23;
    // ---- trás: perna, ombro e braço de longe (na frente do tronco, atrás do peito)
    const tras = camadas.tras;
    desenharPerna(tras, origemX - 4, origemY - 24, 16, -38, false);                                                                       // agachado de lado: os dois joelhos para a frente
    ferramentasPixel.elipse(tras, centroDosOmbrosX + 8, ombrosY + 1, 4, 3.5, cores.simbionte);
    ferramentasPixel.px(tras, centroDosOmbrosX + 8, ombrosY - 2, cores.simbionteMedio);
    const bracoDeLonge = cavernaSecreta.desenharMembro(tras, centroDosOmbrosX + 8, ombrosY + 2, pose.bracoDeLongeOmbro, pose.bracoDeLongeCotovelo, {
      comprimentoSuperior: 10, comprimentoInferior: 11, grossuraSuperior: 5, grossuraInferior: 4, corSuperior: cores.simbionte, corInferior: cores.simbionte, corDoRealce: cores.simbionteMedio, corDaJunta: cores.simbionteMedio,
    });
    desenharGarras(tras, bracoDeLonge, pose.garras > 0.5, false);

    // ---- corpo: perna de perto, tronco inclinado, peito com a aranha (em perspectiva), abdômen
    const corpo = camadas.corpo;
    desenharPerna(corpo, origemX + 2, origemY - 24, 24, -46, true);
    ferramentasPixel.poligono(corpo, [[centroDosOmbrosX - 10, ombrosY - 1], [centroDosOmbrosX + 11, ombrosY - 1], [centroDosOmbrosX + 12, ombrosY + 5], [cinturaX + 7, cinturaY], [cinturaX - 6, cinturaY], [centroDosOmbrosX - 10, ombrosY + 6]], cores.simbionte);   // tronco
    ferramentasPixel.poligono(corpo, [[centroDosOmbrosX - 10, ombrosY - 1], [centroDosOmbrosX - 5, ombrosY - 1], [centroDosOmbrosX - 5, ombrosY + 8], [cinturaX - 3, cinturaY], [cinturaX - 6, cinturaY], [centroDosOmbrosX - 10, ombrosY + 6]], cores.simbionteSombra);   // costas na sombra
    ferramentasPixel.linha(corpo, centroDosOmbrosX - 10, ombrosY, centroDosOmbrosX - 9, ombrosY + 8, cores.reflexoAzul, 1);                                // reflexo nas costas
    ferramentasPixel.elipse(corpo, meioDaFrenteX - 4, ombrosY + 4, 4.5, 4, cores.simbionteMedio);                                              // peitorais: o de perto largo, o de longe encurtado
    ferramentasPixel.elipse(corpo, meioDaFrenteX + 4, ombrosY + 4, 3, 3.5, cores.simbionteMedio);
    ferramentasPixel.elipse(corpo, meioDaFrenteX - 4, ombrosY + 3, 2.5, 1.5, cores.reflexoAzul);                                               // reflexos azulados
    ferramentasPixel.px(corpo, meioDaFrenteX - 5, ombrosY + 2, cores.reflexoAzulClaro);
    ferramentasPixel.px(corpo, meioDaFrenteX + 5, ombrosY + 2, cores.reflexoAzul);
    for (const alturaDoGomo of [10, 13]) ferramentasPixel.ret(corpo, meioDaFrenteX - 6, ombrosY + alturaDoGomo, 9, 1, cores.simbionteSombra);   // abdômen
    ferramentasPixel.linha(corpo, meioDaFrenteX, ombrosY + 9, cinturaX + 3, cinturaY, cores.simbionteSombra, 1);
    // ARANHA: corpo no meio do peito; as patas do lado de longe (à direita no desenho) encurtadas pela perspectiva
    const aranhaX = meioDaFrenteX, aranhaY = ombrosY + 5;
    for (const [pataX, pataY] of [[-5, -4], [5, -4], [-4, -6], [4, -6], [-5, 5], [5, 5], [-3, 7], [3, 7]]) {
      ferramentasPixel.linha(corpo, aranhaX, aranhaY, aranhaX + (pataX > 0 ? Math.round(pataX * 0.6) : pataX), aranhaY + pataY, cores.branco, 1);
    }
    ferramentasPixel.elipse(corpo, aranhaX, aranhaY, 1.5, 2.5, cores.branco);
    ferramentasPixel.px(corpo, aranhaX, aranhaY - 3, cores.branco);
    ferramentasPixel.poligono(corpo, [[centroDosOmbrosX - 9, ombrosY], [centroDosOmbrosX - 2, ombrosY - 5], [centroDosOmbrosX + 6, ombrosY - 5], [centroDosOmbrosX + 11, ombrosY]], cores.simbionteMedio);   // ombros erguidos
    ferramentasPixel.linha(corpo, centroDosOmbrosX - 2, ombrosY - 4, centroDosOmbrosX - 9, ombrosY - 1, cores.reflexoAzul, 1);
    // ---- cabeça projetada à frente e ACIMA dos ombros, em 3/4 como a do Fury: nuca lisa com reflexo atrás; olhos e bocarra na frente
    const cabecaX = centroDosOmbrosX + 13 + Math.round(pose.cabecaGiro), cabecaY = ombrosY - 8 + Math.round(pose.cabecaInclina), aberturaDaMandibula = Math.round(pose.mandibula);
    const queixoY = cabecaY + aberturaDaMandibula;   // tudo o que pertence à mandíbula desce junto com ela
    ferramentasPixel.poligono(corpo, [[centroDosOmbrosX + 1, ombrosY - 5], [cabecaX - 5, cabecaY - 3], [cabecaX - 1, cabecaY + 5], [centroDosOmbrosX + 11, ombrosY]], cores.simbionteMedio);   // PESCOÇO grosso, subindo para a frente
    ferramentasPixel.linha(corpo, centroDosOmbrosX + 1, ombrosY - 5, cabecaX - 5, cabecaY - 4, cores.reflexoAzul, 1);
    ferramentasPixel.linha(corpo, cabecaX - 3, cabecaY + 6, centroDosOmbrosX + 11, ombrosY, cores.simbionteSombra, 1);                           // sombra sob a mandíbula, separando cabeça e peito
    ferramentasPixel.elipse(corpo, cabecaX, cabecaY, 6.5, 6, cores.simbionte);                                                            // crânio e focinho
    ferramentasPixel.poligono(corpo, [[cabecaX + 2, cabecaY - 4], [cabecaX + 7, cabecaY - 2], [cabecaX + 9, cabecaY + 1], [cabecaX + 8, queixoY + 6], [cabecaX + 1, queixoY + 6]], cores.simbionte);
    ferramentasPixel.elipse(corpo, cabecaX - 3, cabecaY - 3, 2.5, 1.5, cores.reflexoAzul);                                               // reflexo na nuca
    ferramentasPixel.px(corpo, cabecaX - 4, cabecaY - 4, cores.brilhoDaNuca);
    ferramentasPixel.poligono(corpo, [[cabecaX - 3, cabecaY - 5], [cabecaX + 2, cabecaY - 2], [cabecaX + 2, cabecaY], [cabecaX - 2, cabecaY - 1]], cores.branco);   // olho de perto (grande)
    ferramentasPixel.px(corpo, cabecaX - 2, cabecaY - 1, cores.brancoSombra);
    ferramentasPixel.poligono(corpo, [[cabecaX + 8, cabecaY - 5], [cabecaX + 4, cabecaY - 2], [cabecaX + 4, cabecaY], [cabecaX + 7, cabecaY - 1]], cores.branco);   // olho de longe
    ferramentasPixel.px(corpo, cabecaX + 4, cabecaY, cores.brancoSombra);
    // BOCARRA: interior, gengiva, dentes de cima, dentes de baixo (descem com a mandíbula) e o queixo
    ferramentasPixel.poligono(corpo, [[cabecaX - 3, cabecaY + 1], [cabecaX + 9, cabecaY + 1], [cabecaX + 8, queixoY + 4], [cabecaX - 1, queixoY + 5]], cores.bocaInterna);
    ferramentasPixel.ret(corpo, cabecaX - 2, cabecaY + 1, 11, 1, cores.gengiva);
    for (let denteX = cabecaX - 2; denteX <= cabecaX + 8; denteX += 2) {
      ferramentasPixel.px(corpo, denteX, cabecaY + 2, cores.dentes);
      if ((denteX - cabecaX) % 4 === 0) ferramentasPixel.px(corpo, denteX, cabecaY + 3, cores.dentes);   // presas mais compridas, alternadas
    }
    for (let denteX = cabecaX - 1; denteX <= cabecaX + 7; denteX += 2) ferramentasPixel.px(corpo, denteX, queixoY + 4, cores.dentes);
    ferramentasPixel.linha(corpo, cabecaX - 1, queixoY + 6, cabecaX + 8, queixoY + 5, cores.simbionte, 2);                              // mandíbula
    if (pose.lingua > 0.05) {                                                                                                            // LÍNGUA: sai da bocarra e vai para a FRENTE, ondulando, longe dos braços
      let pontaX = cabecaX + 7, pontaY = queixoY + 3;
      const quantidadeDeSegmentos = Math.round(3 + pose.lingua * 9);
      for (let segmento = 0; segmento < quantidadeDeSegmentos; segmento++) {
        const proximoX = pontaX + 1.1, proximoY = pontaY + 0.45 + Math.sin(tempo * 6 + segmento * 0.9) * 0.9;
        ferramentasPixel.linha(corpo, pontaX, pontaY, proximoX, proximoY, segmento % 3 === 0 ? cores.linguaSombra : cores.lingua, 2);
        pontaX = proximoX; pontaY = proximoY;
      }
      ferramentasPixel.px(corpo, Math.round(pontaX), Math.round(pontaY) + 1, cores.lingua);
      ferramentasPixel.px(corpo, cabecaX + 7, queixoY + 3, '#ffb0c0');   // brilho úmido na raiz da língua
    }

    // ---- frente: ombro e braço longo de perto com garras (preso ao ombro no meio da silhueta, descendo ao lado do tronco)
    const frente = camadas.frente;
    ferramentasPixel.elipse(frente, centroDosOmbrosX - 3, ombrosY + 1, 4, 3.5, cores.simbionteMedio);
    ferramentasPixel.px(frente, centroDosOmbrosX - 4, ombrosY - 1, cores.reflexoAzulClaro);
    ferramentasPixel.px(frente, centroDosOmbrosX - 2, ombrosY - 1, cores.reflexoAzul);
    const bracoDePerto = cavernaSecreta.desenharMembro(frente, centroDosOmbrosX - 3, ombrosY + 3, pose.bracoDePertoOmbro, pose.bracoDePertoCotovelo, {
      comprimentoSuperior: 10, comprimentoInferior: 11, grossuraSuperior: 5, grossuraInferior: 4, corSuperior: cores.simbionteMedio, corInferior: cores.simbionteMedio, corDoRealce: cores.reflexoAzul, corDaJunta: cores.reflexoAzulClaro,
    });
    desenharGarras(frente, bracoDePerto, pose.garras > 0.5, true);
    return { boca: [cabecaX + 4 - origemX, queixoY + 4 - origemY] };
  };

  cavernaSecreta.registrarPersonagem({
    boneco: true, id: 'venom', direcao: -1,
    falas: { frases: ['QUERO GALINHAS!'], intervalo: [16, 27], primeira: [7, 14], ancora: [13, -54], gesto: 'ameaca' },
    largura: 74, altura: 64, origem: [30, 61], sombra: 16, contorno: '#010103',
    pose: { respira: 0, inclina: 0, cabecaGiro: 0, cabecaInclina: 0, mandibula: 0, lingua: 0, bracoDePertoOmbro: 12, bracoDePertoCotovelo: 26, bracoDeLongeOmbro: 34, bracoDeLongeCotovelo: 10, garras: 0 },
    gestos: {
      lingua: [{ t: 0 }, { t: 0.4, mandibula: 2, lingua: 0.4 }, { t: 1.0, mandibula: 2, lingua: 1 }, { t: 2.6, mandibula: 2, lingua: 1, cabecaInclina: 1 }, { t: 3.1, mandibula: 1, lingua: 0.2 }, { t: 3.4 }],
      ataque: [{ t: 0 }, { t: 0.3, bracoDePertoOmbro: 70, bracoDePertoCotovelo: -10, garras: 1, mandibula: 2, inclina: 1 }, { t: 0.55, bracoDePertoOmbro: 15, bracoDePertoCotovelo: 35, garras: 1, mandibula: 2, inclina: 1 }, { t: 0.8, bracoDePertoOmbro: 30, bracoDePertoCotovelo: 10, garras: 1, mandibula: 1 }, { t: 1.3 }],
      farejar: [{ t: 0 }, { t: 0.3, cabecaGiro: 1, cabecaInclina: 1 }, { t: 0.7, cabecaGiro: -1, cabecaInclina: 1 }, { t: 1.1, cabecaGiro: 1 }, { t: 1.5 }],
      ameaca: [{ t: 0 }, { t: 0.4, bracoDePertoOmbro: 45, bracoDePertoCotovelo: -30, bracoDeLongeOmbro: 50, bracoDeLongeCotovelo: -20, garras: 1, mandibula: 2, inclina: 1 }, { t: 1.6, bracoDePertoOmbro: 48, bracoDePertoCotovelo: -32, bracoDeLongeOmbro: 52, bracoDeLongeCotovelo: -22, garras: 1, mandibula: 2, inclina: 1 }, { t: 2.0 }],
    },
    gestosAutomaticos: [{ gesto: 'lingua', intervalo: [7, 13], primeira: [2, 5] }, { gesto: 'ataque', intervalo: [11, 19] }, { gesto: 'farejar', intervalo: [5, 9] }, { gesto: 'ameaca', intervalo: [14, 23] }],
    ociosos: [
      { nome: 'respirar', intervalo: [0.3, 0.6], duracao: 2.4, aplicar: (pose, fracao) => { if (fracao > 0.35 && fracao < 0.85) pose.respira += 1; } },
      { nome: 'mastigar', intervalo: [3, 6], duracao: [0.6, 1.1], semGesto: true, aplicar: (pose, fracao, variante, tempo) => { pose.mandibula += Math.floor(tempo * 6) % 2; } },
      { nome: 'garras', intervalo: [3, 7], duracao: [0.5, 1.0], semGesto: true, aplicar: pose => { pose.garras = 1; } },
    ],
    desenharPartes,
    luzes(luz, pose, tempo, ponto) {
      const [peitoX, peitoY] = ponto(4, -40);
      luz.ponto(peitoX, peitoY, 30, '#b9c2e6', 0.4);
      const [costasX, costasY] = ponto(-14, -38);
      luz.ponto(costasX, costasY, 26, '#3a6cff', 0.22);
    },
    // baba escorrendo da boca enquanto a língua está para fora
    brilhos(contexto, pose, tempo, ponto, estado) {
      if (pose.lingua < 0.3 || !estado.locais || !estado.locais.boca) return;
      const fase = (tempo * 1.7) % 1, [babaX, babaY] = ponto(estado.locais.boca[0], estado.locais.boca[1] + 3 + Math.round(fase * 5));
      contexto.fillStyle = '#b9c2e0';
      contexto.fillRect(babaX, babaY, 1, 1 + (fase < 0.3 ? 1 : 0));
    },
  });
})();
