// ====================================================================================================
// EDIÇÃO PESSOAL — CENA DO CELEIRO · personagens/ator.js
// Boneco articulado em pixel art + controlador de animação. Cada personagem (homem-de-ferro.js, nick-fury.js) desenha suas
// PARTES numa pose; este arquivo cuida de:
//  • camadas por parte (braço de trás, corpo, braço da frente), cada uma com CONTORNO PRÓPRIO, depois compostas e espelhadas;
//  • pose = pose base (atividade atual) + GESTO por quadros-chave + comportamentos OCIOSOS independentes (respirar, olhar em
//    volta, trocar o peso, piscar...), cada um com o seu ritmo;
//  • a pose é amostrada a 12 quadros por segundo (degraus de animação de pixel art, não interpolação "lisa").
//
// CAMPOS DA POSE (lidos pelos personagens):
//   direcao (1 = olha para a direita, −1 = para a esquerda), vista ('lado' | 'frente'), giroDaCabeca (+1 = 3/4 para a frente,
//   0 = de frente, −1 = 3/4 olhando para trás), comBracosCruzados, falando, maoAberta, olhandoParaBaixo,
//   respira, inclina, quadril, cabecaInclina, elevacaoDoPe, agacha (deslocamentos em pixels),
//   bracoDaFrenteOmbro / bracoDaFrenteCotovelo / bracoDeTrasOmbro / bracoDeTrasCotovelo (ângulos em graus, ver desenharBraco).
// Nos quadros-chave dos gestos o instante fica no campo `t` (segundos) — convenção curta de linha do tempo, também usada pela
// caverna. Um comportamento ocioso pode ter `somenteSe(ator)` (só roda quando devolve true) e `semGesto` (pausa durante gestos).
// ====================================================================================================
(() => {
  const cenaDoCeleiro = window.CenaDoCeleiro, ferramentasPixel = cenaDoCeleiro.pixel;
  const QUADROS_POR_SEGUNDO = 12, LARGURA_DA_FIGURA = 56, ALTURA_DA_FIGURA = 60, ORIGEM_X = 28, ORIGEM_Y = 56;   // pés em (ORIGEM_X, ORIGEM_Y)
  const CAMPOS_NUMERICOS = ['respira', 'inclina', 'quadril', 'cabecaInclina', 'elevacaoDoPe', 'bracoDaFrenteOmbro', 'bracoDaFrenteCotovelo', 'bracoDeTrasOmbro', 'bracoDeTrasCotovelo', 'agacha'];
  const CAMPOS_DISCRETOS = ['direcao', 'vista', 'giroDaCabeca', 'comBracosCruzados', 'falando', 'maoAberta', 'olhandoParaBaixo'];
  const suavizar = fracao => fracao * fracao * (3 - 2 * fracao);
  const grausParaRadianos = graus => graus * Math.PI / 180;

  // Desenha um braço de dois segmentos (ângulos em graus a partir da vertical para baixo; positivo = para a frente).
  // anguloDoCotovelo é RELATIVO ao braço. Devolve as posições do cotovelo e da mão (para luvas, repulsores, mãos de pele...).
  // opcoes: { comprimentoDoBraco, comprimentoDoAntebraco, grossuraDoBraco, grossuraDoAntebraco, corDoBraco, corDoAntebraco, corDaLuz }
  cenaDoCeleiro.desenharBraco = (contexto, ombroX, ombroY, anguloDoOmbro, anguloDoCotovelo, opcoes) => {
    const { comprimentoDoBraco = 6, comprimentoDoAntebraco = 6, grossuraDoBraco = 3, grossuraDoAntebraco = 3, corDoBraco, corDoAntebraco, corDaLuz } = opcoes;
    const cotoveloX = ombroX + Math.sin(grausParaRadianos(anguloDoOmbro)) * comprimentoDoBraco, cotoveloY = ombroY + Math.cos(grausParaRadianos(anguloDoOmbro)) * comprimentoDoBraco;
    const maoX = cotoveloX + Math.sin(grausParaRadianos(anguloDoOmbro + anguloDoCotovelo)) * comprimentoDoAntebraco;
    const maoY = cotoveloY + Math.cos(grausParaRadianos(anguloDoOmbro + anguloDoCotovelo)) * comprimentoDoAntebraco;
    ferramentasPixel.linha(contexto, ombroX, ombroY, cotoveloX, cotoveloY, corDoBraco, grossuraDoBraco);
    ferramentasPixel.linha(contexto, cotoveloX, cotoveloY, maoX, maoY, corDoAntebraco || corDoBraco, grossuraDoAntebraco);
    if (corDaLuz) ferramentasPixel.linha(contexto, ombroX - 1, ombroY, cotoveloX - 1, cotoveloY, corDaLuz, 1);   // luz de cima/esquerda
    return { cotovelo: [cotoveloX, cotoveloY], mao: [maoX, maoY] };
  };

  // Cria um ator. "desenharPartes(camadas, pose, tempo)" do personagem desenha nas 3 camadas (tras, corpo, frente) com a origem
  // nos pés em (camadas.origemX, camadas.origemY) e o personagem OLHANDO PARA A DIREITA; o ator compõe, contorna, espelha e posiciona.
  cenaDoCeleiro.criarAtor = definicao => {
    const telasDasCamadas = { tras: ferramentasPixel.criarTela(LARGURA_DA_FIGURA, ALTURA_DA_FIGURA), corpo: ferramentasPixel.criarTela(LARGURA_DA_FIGURA, ALTURA_DA_FIGURA), frente: ferramentasPixel.criarTela(LARGURA_DA_FIGURA, ALTURA_DA_FIGURA) };
    const telaComposta = ferramentasPixel.criarTela(LARGURA_DA_FIGURA, ALTURA_DA_FIGURA), telaEspelhada = ferramentasPixel.criarTela(LARGURA_DA_FIGURA, ALTURA_DA_FIGURA);
    const poseVazia = () => ({ direcao: 1, vista: 'lado', giroDaCabeca: 1, comBracosCruzados: false, falando: false, maoAberta: false, olhandoParaBaixo: false, respira: 0, inclina: 0, quadril: 0, cabecaInclina: 0, elevacaoDoPe: 0, bracoDaFrenteOmbro: 0, bracoDaFrenteCotovelo: 0, bracoDeTrasOmbro: 0, bracoDeTrasCotovelo: 0, agacha: 0 });
    const poseCompleta = nome => ({ ...poseVazia(), ...definicao.poses[nome] });   // toda pose tem TODOS os campos (sem NaN nas transições)
    const ator = {
      nome: definicao.nome, x: definicao.x, y: definicao.y, base: poseCompleta(definicao.poseInicial), poseBase: definicao.poseInicial,
      gesto: null, pose: null, quadro: -1,
      ociosos: definicao.ociosos.map(ocioso => ({ ...ocioso, espera: ocioso.intervalo[0] + Math.random() * (ocioso.intervalo[1] - ocioso.intervalo[0]), ativo: null })),
      falando: false, transicao: null,
    };
    // troca de pose base com transição suave (ex.: virar de costas para a bancada e encarar o outro personagem)
    ator.mudarPoseBase = (nome, duracao = 0.5) => {
      if (!definicao.poses[nome] || ator.poseBase === nome) return;
      const poseDeOrigem = { ...ator.base }, poseDeDestino = poseCompleta(nome);
      ator.transicao = { de: poseDeOrigem, para: poseDeDestino, tempo: 0, duracao, virando: poseDeOrigem.direcao !== poseDeDestino.direcao }; ator.poseBase = nome;
    };
    // gesto: lista de quadros-chave { t, ...campos } (t em segundos); no fim volta à pose base
    ator.fazerGesto = (nome, opcoes = {}) => {
      const gesto = definicao.gestos[nome]; if (!gesto) return 0;
      const quadrosChave = typeof gesto === 'function' ? gesto(ator.base, opcoes) : gesto;
      ator.gesto = { quadros: quadrosChave, tempo: 0, fim: quadrosChave[quadrosChave.length - 1].t, nome };
      return ator.gesto.fim;
    };
    // pose do gesto no instante atual: interpola entre os dois quadros-chave vizinhos com suavização
    const amostrarGesto = (gesto, poseBase) => {
      const { quadros: quadrosChave, tempo } = gesto; let indice = 0;
      while (indice < quadrosChave.length - 1 && tempo >= quadrosChave[indice + 1].t) indice++;
      const anterior = { ...poseBase, ...quadrosChave[indice] }, seguinte = { ...poseBase, ...(quadrosChave[indice + 1] || quadrosChave[indice]) };
      const intervalo = (quadrosChave[indice + 1] ? quadrosChave[indice + 1].t : quadrosChave[indice].t) - quadrosChave[indice].t;
      const fracao = intervalo > 0 ? suavizar(Math.min(1, (tempo - quadrosChave[indice].t) / intervalo)) : 1, saida = {};
      for (const campo of CAMPOS_NUMERICOS) saida[campo] = anterior[campo] + (seguinte[campo] - anterior[campo]) * fracao;
      for (const campo of CAMPOS_DISCRETOS) saida[campo] = fracao < 0.5 ? anterior[campo] : seguinte[campo];
      return saida;
    };
    ator.atualizar = (segundosDoQuadro, tempo) => {
      // transição de pose base
      if (ator.transicao) {
        const transicao = ator.transicao; transicao.tempo += segundosDoQuadro; const fracao = suavizar(Math.min(1, transicao.tempo / transicao.duracao));
        for (const campo of CAMPOS_NUMERICOS) ator.base[campo] = transicao.de[campo] + (transicao.para[campo] - transicao.de[campo]) * fracao;
        for (const campo of CAMPOS_DISCRETOS) ator.base[campo] = fracao < 0.5 ? transicao.de[campo] : transicao.para[campo];
        if (transicao.virando) ator.base.vista = fracao > 0.3 && fracao < 0.7 ? 'frente' : transicao.para.vista;   // vira passando pela vista de frente
        if (transicao.tempo >= transicao.duracao) { Object.assign(ator.base, transicao.para); ator.transicao = null; }
      }
      if (ator.gesto) { ator.gesto.tempo += segundosDoQuadro; if (ator.gesto.tempo >= ator.gesto.fim) ator.gesto = null; }
      for (const ocioso of ator.ociosos) {
        if (ocioso.ativo) {
          ocioso.ativo.tempo += segundosDoQuadro;
          if (ocioso.ativo.tempo >= ocioso.ativo.duracao) { ocioso.ativo = null; ocioso.espera = ocioso.intervalo[0] + Math.random() * (ocioso.intervalo[1] - ocioso.intervalo[0]); }
        } else if (!ocioso.somenteSe || ocioso.somenteSe(ator)) {
          ocioso.espera -= segundosDoQuadro;
          if (ocioso.espera <= 0) ocioso.ativo = { tempo: 0, duracao: ocioso.duracao, variante: Math.random() };
        }
      }
    };
    // pose final no quadro atual (amostrada a 12 fps)
    ator.poseAtual = tempo => {
      const quadro = Math.floor(tempo * QUADROS_POR_SEGUNDO);
      if (quadro === ator.quadro && ator.pose) return ator.pose;
      ator.quadro = quadro;
      let pose = { ...poseVazia(), ...ator.base };
      if (ator.gesto) pose = { ...pose, ...amostrarGesto(ator.gesto, pose) };
      for (const ocioso of ator.ociosos) if (ocioso.ativo && !(ocioso.semGesto && ator.gesto)) ocioso.aplicar(pose, ocioso.ativo.tempo / ocioso.ativo.duracao, ocioso.ativo.variante, tempo);
      pose.falando = ator.falando;
      if (definicao.sempre) definicao.sempre(pose, tempo, ator);
      ator.pose = pose;
      return pose;
    };
    ator.desenhar = (contexto, tempo) => {
      const pose = ator.poseAtual(tempo);
      for (const nome in telasDasCamadas) telasDasCamadas[nome].ctx.clearRect(0, 0, LARGURA_DA_FIGURA, ALTURA_DA_FIGURA);
      definicao.desenharPartes({ tras: telasDasCamadas.tras.ctx, corpo: telasDasCamadas.corpo.ctx, frente: telasDasCamadas.frente.ctx, origemX: ORIGEM_X, origemY: ORIGEM_Y }, pose, tempo);
      telaComposta.ctx.clearRect(0, 0, LARGURA_DA_FIGURA, ALTURA_DA_FIGURA);
      for (const nome of ['tras', 'corpo', 'frente']) { ferramentasPixel.contornar(telasDasCamadas[nome].canvas, definicao.contorno); telaComposta.ctx.drawImage(telasDasCamadas[nome].canvas, 0, 0); }
      const imagem = pose.direcao < 0 ? ferramentasPixel.espelhado(telaComposta.canvas, telaEspelhada.canvas) : telaComposta.canvas;
      // sombra no chão (pontilhada, mais densa no centro)
      ferramentasPixel.pontilharCampo(contexto, ator.x - 12, ator.y - 2, 25, 4, '#0b0c0f', (coluna, linha) => {
        const distanciaX = (coluna - 12) / 12, distanciaY = (linha - 1.5) / 2;
        return Math.max(0, 0.85 - (distanciaX * distanciaX + distanciaY * distanciaY));
      });
      contexto.drawImage(imagem, Math.round(ator.x - ORIGEM_X), Math.round(ator.y - ORIGEM_Y));
      if (definicao.desenharLuzes) definicao.desenharLuzes(contexto, pose, tempo, (localX, localY) => [Math.round(ator.x + (pose.direcao < 0 ? -localX : localX)), Math.round(ator.y + localY)]);
    };
    // posição (na tela da cena) do topo da cabeça: âncora do balão de fala
    ator.cabeca = () => [ator.x, ator.y - definicao.altura];
    return ator;
  };
  cenaDoCeleiro.ator = { grausParaRadianos, suavizar, QUADROS_POR_SEGUNDO };
})();
