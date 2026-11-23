// ====================================================================================================
// EDIÇÃO PESSOAL — CENA DO CELEIRO · personagens/nick-fury.js
// Nick Fury: pixel art original desenhada em código (44 px de altura). Sobretudo preto longo com gola alta e lapelas, camisa
// escura, calça e botas pretas, cabeça raspada com brilho, cavanhaque, sobrancelha franzida e o TAPA-OLHO no olho ESQUERDO.
// Atenção ao espelhamento: o boneco é desenhado olhando para a direita e espelhado para olhar para a esquerda; o tapa-olho NÃO
// pode trocar de olho com o espelho. Olhando para a esquerda (para o Tony), o olho esquerdo fica do lado mais próximo de quem
// assiste; olhando para a direita, fica do lado mais distante. "tapaOlhoNoOlhoDePerto" decide isso antes do espelhamento.
// Nomes de coordenada: origemX/origemY = pés; centroX = meio do corpo; ombrosY = linha dos ombros.
// ====================================================================================================
(() => {
  const cenaDoCeleiro = window.CenaDoCeleiro, ferramentasPixel = cenaDoCeleiro.pixel;
  const CORES_DO_NICK_FURY = {
    casaco: '#1b1c22', casacoClaro: '#3a3d48', casacoEscuro: '#0d0e12', camisa: '#2e313b', camisaClara: '#3d414d',
    pele: '#6b4532', peleClara: '#8d5c43', peleEscura: '#4a2f22', barba: '#22160f', tapaOlho: '#040405', alcaDoTapaOlho: '#121214',
    olhoBranco: '#d9d2c8', pupila: '#1a1110', calca: '#15161b', bota: '#0b0b0e', botaClara: '#2a2b33', contorno: '#040406',
    mangaDaFrente: '#24262e', luzDaManga: '#4a4e5c',   // a manga da frente é um tom acima do casaco: o gesto aparece por cima do sobretudo preto
  };
  const cores = CORES_DO_NICK_FURY;

  // perna e bota; ehDeTras = perna de trás (mais escura, coberta pelo casaco)
  const desenharPerna = (contexto, origemX, origemY, deslocamentoDoQuadril, elevacaoDoPe, ehDeTras) => {
    const afastamentoDoPe = ehDeTras ? -2 : 2;
    ferramentasPixel.ret(contexto, origemX + deslocamentoDoQuadril + afastamentoDoPe - 1, origemY - 12, 3, 9, ehDeTras ? cores.casacoEscuro : cores.calca);
    ferramentasPixel.ret(contexto, origemX + deslocamentoDoQuadril + afastamentoDoPe - 2, origemY - 3 - elevacaoDoPe, 6, 3, cores.bota);
    ferramentasPixel.ret(contexto, origemX + deslocamentoDoQuadril + afastamentoDoPe - 1, origemY - 3 - elevacaoDoPe, 3, 1, cores.botaClara);
  };

  // cabeça: giro = +1 (3/4 para a frente), 0 (de frente), −1 (3/4 olhando para trás);
  // tapaOlhoNoOlhoDePerto: o tapa-olho fica no olho mais próximo de quem assiste
  const desenharCabeca = (contexto, centroX, centroY, giro, tapaOlhoNoOlhoDePerto, falando, tempo) => {
    ferramentasPixel.elipse(contexto, centroX, centroY, 3.5, 4.5, cores.pele);
    ferramentasPixel.px(contexto, centroX - 1, centroY - 4, cores.peleClara); ferramentasPixel.px(contexto, centroX - 2, centroY - 3, cores.peleClara); ferramentasPixel.px(contexto, centroX, centroY - 4, cores.peleClara);   // brilho da careca
    if (giro === 0) {
      // de frente: o olho esquerdo DELE fica à direita de quem assiste. Aqui "tapaOlhoNoOlhoDePerto" indica que a figura ainda
      // vai ser espelhada (meio de uma virada): o tapa-olho é desenhado do outro lado para cair no lugar certo depois do espelho.
      const sentido = tapaOlhoNoOlhoDePerto ? -1 : 1, colunaNoRosto = deslocamento => centroX + deslocamento * sentido;
      ferramentasPixel.ret(contexto, Math.min(colunaNoRosto(-3), colunaNoRosto(-2)), centroY - 2, 2, 1, cores.peleEscura);                     // sobrancelha franzida
      ferramentasPixel.px(contexto, colunaNoRosto(-2), centroY - 1, cores.olhoBranco); ferramentasPixel.px(contexto, colunaNoRosto(-1), centroY - 1, cores.pupila);
      ferramentasPixel.ret(contexto, sentido > 0 ? colunaNoRosto(1) : colunaNoRosto(3), centroY - 2, 3, 3, cores.tapaOlho);
      ferramentasPixel.linha(contexto, colunaNoRosto(1), centroY - 2, colunaNoRosto(-3), centroY - 4, cores.alcaDoTapaOlho, 1);
      ferramentasPixel.px(contexto, centroX, centroY + 1, cores.peleEscura);                                                                  // nariz
      ferramentasPixel.ret(contexto, centroX - 1, centroY + 3, 3, 1, cores.barba); ferramentasPixel.ret(contexto, centroX - 1, centroY + 4, 3, 1, cores.barba);
      ferramentasPixel.px(contexto, centroX, centroY + 2, falando ? cores.peleEscura : cores.barba);
      ferramentasPixel.px(contexto, centroX - 4, centroY, cores.peleEscura); ferramentasPixel.px(contexto, centroX + 4, centroY, cores.peleEscura);
      return;
    }
    const colunaNoRosto = deslocamento => centroX + deslocamento * giro;
    // olho de perto (lado de trás do rosto, deslocamento ≈ 0) e olho de longe (lado da frente, deslocamento ≈ +2)
    const olhoDePertoX = colunaNoRosto(0), olhoDeLongeX = colunaNoRosto(2), olhosY = centroY - 1;
    const desenharOlho = (olhoX, tapado) => {
      if (tapado) { ferramentasPixel.ret(contexto, olhoX - 1, olhosY - 1, 3, 3, cores.tapaOlho); }
      else {
        ferramentasPixel.px(contexto, olhoX, olhosY, cores.olhoBranco); ferramentasPixel.px(contexto, olhoX + giro, olhosY, cores.pupila);
        ferramentasPixel.ret(contexto, olhoX - 1, olhosY - 1, 3, 1, cores.peleEscura);                                                       // sobrancelha franzida
      }
    };
    desenharOlho(olhoDePertoX, tapaOlhoNoOlhoDePerto); desenharOlho(olhoDeLongeX, !tapaOlhoNoOlhoDePerto);
    // alça do tapa-olho contornando a cabeça até a nuca
    const tapaOlhoX = tapaOlhoNoOlhoDePerto ? olhoDePertoX : olhoDeLongeX;
    ferramentasPixel.linha(contexto, tapaOlhoX, olhosY - 1, colunaNoRosto(-3), centroY - 3, cores.alcaDoTapaOlho, 1);
    ferramentasPixel.px(contexto, colunaNoRosto(3.5), centroY + 1, cores.peleClara); ferramentasPixel.px(contexto, colunaNoRosto(3), centroY + 1, cores.peleEscura);   // nariz
    ferramentasPixel.ret(contexto, giro > 0 ? colunaNoRosto(1) : colunaNoRosto(3), centroY + 2, 3, 1, cores.barba);                           // bigode
    ferramentasPixel.px(contexto, colunaNoRosto(2), centroY + 3, falando && Math.floor(tempo * 8) % 2 ? cores.peleEscura : cores.barba);      // boca
    ferramentasPixel.ret(contexto, giro > 0 ? colunaNoRosto(1) : colunaNoRosto(3), centroY + 4, 3, 1, cores.barba);                           // cavanhaque
    ferramentasPixel.px(contexto, colunaNoRosto(-2.5), centroY, cores.peleEscura); ferramentasPixel.px(contexto, colunaNoRosto(-2.5), centroY + 1, cores.peleEscura);   // orelha
  };

  const desenharCasaco = (contexto, centroX, origemY, ombrosY, vista) => {
    // corpo do sobretudo até os joelhos, com leve abertura na barra
    ferramentasPixel.poligono(contexto, [[centroX - 7, ombrosY - 1], [centroX + 7, ombrosY - 1], [centroX + 7, ombrosY + 12], [centroX + 9, origemY - 8], [centroX - 8, origemY - 8], [centroX - 6, ombrosY + 12]], cores.casaco);
    ferramentasPixel.ret(contexto, centroX - 7, ombrosY, 1, 20, cores.casacoClaro);                                                           // luz na borda
    ferramentasPixel.linha(contexto, centroX - 3, ombrosY + 14, centroX - 4, origemY - 9, cores.casacoEscuro, 1);                              // dobras
    ferramentasPixel.linha(contexto, centroX + 5, ombrosY + 14, centroX + 6, origemY - 9, cores.casacoEscuro, 1);
    ferramentasPixel.ret(contexto, centroX - 7, origemY - 9, 16, 1, cores.casacoEscuro);
    const meioDaFrenteX = vista === 'frente' ? centroX : centroX + 2;
    ferramentasPixel.ret(contexto, meioDaFrenteX - 1, ombrosY, 3, 13, cores.camisa); ferramentasPixel.ret(contexto, meioDaFrenteX - 1, ombrosY, 1, 13, cores.camisaClara);   // camisa escura
    ferramentasPixel.linha(contexto, meioDaFrenteX - 2, ombrosY - 1, meioDaFrenteX - 3, ombrosY + 9, cores.casacoClaro, 1);                    // lapelas
    ferramentasPixel.linha(contexto, meioDaFrenteX + 2, ombrosY - 1, meioDaFrenteX + 3, ombrosY + 9, cores.casacoClaro, 1);
    ferramentasPixel.ret(contexto, centroX - 4, ombrosY - 3, 9, 2, cores.casaco); ferramentasPixel.ret(contexto, centroX - 4, ombrosY - 3, 9, 1, cores.casacoClaro);   // gola alta
    ferramentasPixel.ret(contexto, centroX - 1, ombrosY - 4, 3, 2, cores.pele);                                                                // pescoço
  };

  // braço articulado (ehDeTras = braço de trás, todo escuro) com a mão de pele
  const desenharBracoArticulado = (contexto, ombroX, ombroY, anguloDoOmbro, anguloDoCotovelo, ehDeTras) => {
    const braco = cenaDoCeleiro.desenharBraco(contexto, ombroX, ombroY, anguloDoOmbro, anguloDoCotovelo, {
      comprimentoDoBraco: 6, comprimentoDoAntebraco: 6, grossuraDoBraco: 3, grossuraDoAntebraco: 3,
      corDoBraco: ehDeTras ? cores.casacoEscuro : cores.mangaDaFrente, corDoAntebraco: ehDeTras ? cores.casacoEscuro : cores.mangaDaFrente, corDaLuz: ehDeTras ? null : cores.luzDaManga,
    });
    const [maoX, maoY] = braco.mao;
    ferramentasPixel.ret(contexto, maoX - 1, maoY - 1, 2, 3, ehDeTras ? cores.peleEscura : cores.pele);
    if (!ehDeTras) ferramentasPixel.px(contexto, maoX - 1, maoY - 1, cores.peleClara);
    return braco;
  };

  // braços cruzados: braços descem dos ombros até os cotovelos; o antebraço de BAIXO atravessa primeiro e o de CIMA passa por
  // cima dele, com a mão de cima apoiada no braço oposto e a ponta dos dedos da outra aparecendo por baixo
  const desenharBracosCruzados = (contexto, centroX, ombrosY) => {
    ferramentasPixel.ret(contexto, centroX - 9, ombrosY, 3, 9, cores.casaco); ferramentasPixel.ret(contexto, centroX - 9, ombrosY, 1, 9, cores.casacoClaro);          // braço de trás (lado esquerdo)
    ferramentasPixel.ret(contexto, centroX + 7, ombrosY, 3, 9, cores.casaco); ferramentasPixel.ret(contexto, centroX + 9, ombrosY + 1, 1, 8, cores.casacoEscuro);    // braço da frente
    ferramentasPixel.ret(contexto, centroX - 8, ombrosY + 9, 3, 2, cores.casacoEscuro); ferramentasPixel.ret(contexto, centroX + 7, ombrosY + 9, 3, 2, cores.casacoEscuro);   // cotovelos
    ferramentasPixel.ret(contexto, centroX - 6, ombrosY + 8, 14, 3, cores.casacoEscuro);                                                                      // antebraço de baixo
    ferramentasPixel.px(contexto, centroX + 8, ombrosY + 7, cores.peleEscura); ferramentasPixel.px(contexto, centroX + 8, ombrosY + 8, cores.pele);                // dedos por baixo
    ferramentasPixel.ret(contexto, centroX - 7, ombrosY + 5, 13, 3, cores.casaco); ferramentasPixel.ret(contexto, centroX - 7, ombrosY + 5, 13, 1, cores.casacoClaro);   // antebraço de cima
    ferramentasPixel.px(contexto, centroX - 1, ombrosY + 7, cores.casacoEscuro); ferramentasPixel.px(contexto, centroX + 3, ombrosY + 7, cores.casacoEscuro);      // dobras da manga
    ferramentasPixel.ret(contexto, centroX + 6, ombrosY + 4, 2, 3, cores.pele); ferramentasPixel.px(contexto, centroX + 6, ombrosY + 4, cores.peleClara);         // mão de cima sobre o braço
  };

  const desenharPartes = (camadas, pose, tempo) => {
    const { origemX, origemY } = camadas, tapaOlhoNoOlhoDePerto = pose.direcao < 0;   // olhando para a esquerda: o olho esquerdo é o de perto
    const elevacaoDaRespiracao = -Math.round(pose.respira), inclinacao = Math.round(pose.inclina), deslocamentoDoQuadril = Math.round(pose.quadril);
    const ombrosY = origemY - 33 + elevacaoDaRespiracao, centroX = origemX + inclinacao + deslocamentoDoQuadril;
    const deFrente = pose.vista === 'frente';
    desenharPerna(camadas.tras, origemX, origemY, deslocamentoDoQuadril, 0, true);
    desenharPerna(camadas.corpo, origemX, origemY, deslocamentoDoQuadril, Math.round(pose.elevacaoDoPe), false);
    if (!pose.comBracosCruzados && !deFrente) desenharBracoArticulado(camadas.tras, centroX - 6, ombrosY + 1, pose.bracoDeTrasOmbro, pose.bracoDeTrasCotovelo, true);
    desenharCasaco(camadas.corpo, centroX, origemY, ombrosY, deFrente ? 'frente' : 'lado');
    const giroDaCabeca = deFrente ? 0 : pose.giroDaCabeca;
    const tapaOlhoNaCabeca = giroDaCabeca === 0 ? pose.direcao < 0 : (giroDaCabeca > 0 ? tapaOlhoNoOlhoDePerto : !tapaOlhoNoOlhoDePerto);
    desenharCabeca(camadas.corpo, centroX + (deFrente ? 0 : 1), ombrosY - 8 + Math.round(pose.cabecaInclina), giroDaCabeca, tapaOlhoNaCabeca, pose.falando, tempo);
    if (pose.comBracosCruzados) desenharBracosCruzados(camadas.frente, centroX, ombrosY);
    else if (deFrente) { desenharBracoArticulado(camadas.frente, centroX + 7, ombrosY + 1, -4, -4, false); desenharBracoArticulado(camadas.frente, centroX - 7, ombrosY + 1, 4, 4, false); }
    else desenharBracoArticulado(camadas.frente, centroX + 6, ombrosY + 1, pose.bracoDaFrenteOmbro, pose.bracoDaFrenteCotovelo, false);
  };

  const poses = {
    bracosCruzados: { direcao: -1, vista: 'lado', giroDaCabeca: 1, comBracosCruzados: true, bracoDaFrenteOmbro: 0, bracoDaFrenteCotovelo: 0, bracoDeTrasOmbro: 0, bracoDeTrasCotovelo: 0, inclina: 0, quadril: 0 },
    conversando: { direcao: -1, vista: 'lado', giroDaCabeca: 1, comBracosCruzados: false, bracoDaFrenteOmbro: 6, bracoDaFrenteCotovelo: 8, bracoDeTrasOmbro: -4, bracoDeTrasCotovelo: 6, inclina: 0, quadril: 0 },
    // de costas para o Tony, olhando os monitores (impaciente, analisando)
    analisando: { direcao: 1, vista: 'lado', giroDaCabeca: 1, comBracosCruzados: true, bracoDaFrenteOmbro: 0, bracoDaFrenteCotovelo: 0, bracoDeTrasOmbro: 0, bracoDeTrasCotovelo: 0, inclina: 0, quadril: 1, cabecaInclina: -1 },
  };
  const gestos = {
    // aponta para o Tony: autoridade
    apontar: [{ t: 0, comBracosCruzados: false }, { t: 0.3, comBracosCruzados: false, bracoDaFrenteOmbro: 85, bracoDaFrenteCotovelo: 0 }, { t: 1.4, comBracosCruzados: false, bracoDaFrenteOmbro: 88, bracoDaFrenteCotovelo: 0, inclina: 1 }, { t: 1.8, comBracosCruzados: false }],
    // mão aberta, explicando com firmeza (sobe e desce)
    enfatizar: [{ t: 0, comBracosCruzados: false }, { t: 0.3, comBracosCruzados: false, bracoDaFrenteOmbro: 60, bracoDaFrenteCotovelo: 50 }, { t: 0.6, comBracosCruzados: false, bracoDaFrenteOmbro: 62, bracoDaFrenteCotovelo: 35 }, { t: 0.9, comBracosCruzados: false, bracoDaFrenteOmbro: 60, bracoDaFrenteCotovelo: 52 }, { t: 1.2, comBracosCruzados: false, bracoDaFrenteOmbro: 62, bracoDaFrenteCotovelo: 35 }, { t: 1.6, comBracosCruzados: false }],
    // inclina o corpo na direção do Tony
    inclinarSe: [{ t: 0 }, { t: 0.35, inclina: 1, cabecaInclina: 1 }, { t: 1.6, inclina: 1, cabecaInclina: 1 }, { t: 2.0 }],
    // balança a cabeça (desaprovação)
    negar: [{ t: 0 }, { t: 0.15, giroDaCabeca: 0 }, { t: 0.3, giroDaCabeca: 1 }, { t: 0.45, giroDaCabeca: 0 }, { t: 0.6, giroDaCabeca: 1 }, { t: 0.75, giroDaCabeca: 0 }, { t: 0.9, giroDaCabeca: 1 }],
    // suspiro: ombros caem, cabeça baixa
    suspirar: [{ t: 0 }, { t: 0.4, respira: -1, cabecaInclina: 1 }, { t: 1.1, respira: -1, cabecaInclina: 1 }, { t: 1.5 }],
    // ajeita a gola do casaco
    ajeitarGola: [{ t: 0, comBracosCruzados: false }, { t: 0.35, comBracosCruzados: false, bracoDaFrenteOmbro: 150, bracoDaFrenteCotovelo: -110, bracoDeTrasOmbro: 150, bracoDeTrasCotovelo: -110 }, { t: 0.7, comBracosCruzados: false, bracoDaFrenteOmbro: 155, bracoDaFrenteCotovelo: -115, bracoDeTrasOmbro: 148, bracoDeTrasCotovelo: -105 }, { t: 1.1, comBracosCruzados: false }],
    // olha para os monitores/armadura e volta
    olharMonitores: [{ t: 0 }, { t: 0.3, giroDaCabeca: -1, cabecaInclina: -1 }, { t: 1.6, giroDaCabeca: -1, cabecaInclina: -1 }, { t: 1.9 }],
    // silêncio pesado: encara sem mexer (só o olhar)
    encarar: [{ t: 0 }, { t: 0.2, inclina: 1 }, { t: 2.2, inclina: 1 }, { t: 2.5 }],
    // assente uma vez, seco
    assentir: [{ t: 0 }, { t: 0.2, cabecaInclina: 1 }, { t: 0.45, cabecaInclina: 0 }],
  };
  // aplicar(pose, fracao do comportamento 0–1, variante sorteada, tempo)
  const ociosos = [
    { nome: 'respirar', intervalo: [0.9, 1.6], duracao: 1.9, aplicar: (pose, fracao) => { pose.respira += fracao > 0.3 && fracao < 0.7 ? 1 : 0; } },
    { nome: 'trocarOPeso', intervalo: [4, 9], duracao: 3, aplicar: (pose, fracao) => { pose.quadril += fracao > 0.1 && fracao < 0.9 ? -1 : 0; } },
    { nome: 'olharDeLado', intervalo: [6, 12], duracao: 1.4, semGesto: true, somenteSe: ator => !ator.falando, aplicar: (pose, fracao) => { if (fracao > 0.2 && fracao < 0.8) pose.giroDaCabeca = pose.vista === 'frente' ? 0 : -1; } },
    { nome: 'tamborilar', intervalo: [5, 10], duracao: 1.2, semGesto: true, somenteSe: ator => ator.base.comBracosCruzados, aplicar: (pose, fracao) => { pose.elevacaoDoPe += Math.floor(fracao * 6) % 2; } },
  ];
  // falando, ele marca o ritmo com a cabeça
  const sempre = (pose, tempo, ator) => { if (ator.falando && Math.floor(tempo * 3) % 4 === 0) pose.cabecaInclina += 1; };

  cenaDoCeleiro.criarNickFury = (x, y) => cenaDoCeleiro.criarAtor({ nome: 'Fury', x, y, altura: 47, poses, poseInicial: 'bracosCruzados', gestos, ociosos, sempre, desenharPartes, contorno: CORES_DO_NICK_FURY.contorno });
})();
