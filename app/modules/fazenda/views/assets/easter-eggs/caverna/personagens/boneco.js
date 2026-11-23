// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · personagens/boneco.js
// Boneco ARTICULADO em pixel art desenhado por código — a MESMA técnica da cena do celeiro (Tony Stark e Nick Fury,
// easter-eggs/vingadores/personagens/ator.js), adaptada à caverna:
//  • três camadas por personagem (tras, corpo, frente), cada uma com CONTORNO PRÓPRIO, depois compostas; o personagem é
//    desenhado sempre olhando para a DIREITA e espelhado quando olha para a esquerda (direcao = −1);
//  • membros de dois segmentos por ÂNGULO de ombro/quadril e cotovelo/joelho (cavernaSecreta.desenharMembro);
//  • pose = pose base + GESTO por quadros-chave suavizados + comportamentos OCIOSOS independentes, cada um com o seu relógio;
//    gestos automáticos também têm relógio próprio (ninguém sincroniza com ninguém);
//  • a pose é amostrada a 12 quadros por segundo (degraus de pixel art).
//
// CONTRATO de uma definição com `boneco: true` (campos lidos aqui, no motor e em falas.js):
//   id, direcao (1 = olha para a direita, −1 = para a esquerda), largura, altura, origem [x, y] (ponto dos pés dentro da tela
//   do personagem), sombra (raio), contorno (cor), pose (valores numéricos ou não), gestos { nome: [quadros-chave {t, ...}] },
//   gestosAutomaticos [{ gesto, intervalo, primeira }], ociosos [{ nome, intervalo, duracao, semGesto, aplicar(pose, fracao,
//   variante, tempo) }], sempre(pose, tempo, estado), desenharPartes(camadas, pose, tempo, estado), luzes(luz, pose, tempo,
//   ponto, estado), brilhos(contexto, pose, tempo, ponto, estado), falas { frases, intervalo, primeira, ancora, gesto }.
//   Nos quadros-chave dos gestos o tempo fica no campo `t` (convenção curta de linha do tempo, igual ao celeiro).
//   `camadas` (recebido por desenharPartes) = { tras, corpo, frente (contextos 2D), origemX, origemY }.
//
// As ferramentas de desenho vêm de easter-eggs/vingadores/pixel.js (window.CenaDoCeleiro.pixel, apelidado aqui de
// `ferramentasPixel`). Os nomes curtos dos métodos — ret (retângulo), px (um pixel), linha, elipse, poligono, contornar,
// espelhado, criarTela — são a interface pública do CELEIRO, que não é modificado; por isso ficam como estão.
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta, ferramentasPixel = window.CenaDoCeleiro.pixel;
  const QUADROS_POR_SEGUNDO = 12;
  const suavizar = fracao => fracao * fracao * (3 - 2 * fracao);
  const grausParaRadianos = graus => graus * Math.PI / 180;
  cavernaSecreta.grausParaRadianos = grausParaRadianos;

  // Membro de dois segmentos (braço ou perna). Ângulos em graus a partir da vertical para baixo; positivo = para a frente
  // (direita). anguloDaRaiz = ombro/quadril; anguloDaDobra = cotovelo/joelho, RELATIVO ao primeiro segmento.
  // opcoes: { comprimentoSuperior, comprimentoInferior, grossuraSuperior, grossuraInferior, corSuperior, corInferior,
  //           corDoRealce (filete de 1 px no lado de cima/esquerda), corDaJunta (cor do cotovelo/joelho) }
  // Devolve { articulacao (cotovelo/joelho), extremidade (mão/pé), anguloFinal (ângulo absoluto do segundo segmento) }.
  cavernaSecreta.desenharMembro = (contexto, raizX, raizY, anguloDaRaiz, anguloDaDobra, opcoes) => {
    const articulacaoX = raizX + Math.sin(grausParaRadianos(anguloDaRaiz)) * opcoes.comprimentoSuperior;
    const articulacaoY = raizY + Math.cos(grausParaRadianos(anguloDaRaiz)) * opcoes.comprimentoSuperior;
    const extremidadeX = articulacaoX + Math.sin(grausParaRadianos(anguloDaRaiz + anguloDaDobra)) * opcoes.comprimentoInferior;
    const extremidadeY = articulacaoY + Math.cos(grausParaRadianos(anguloDaRaiz + anguloDaDobra)) * opcoes.comprimentoInferior;
    ferramentasPixel.linha(contexto, raizX, raizY, articulacaoX, articulacaoY, opcoes.corSuperior, opcoes.grossuraSuperior);
    ferramentasPixel.linha(contexto, articulacaoX, articulacaoY, extremidadeX, extremidadeY, opcoes.corInferior || opcoes.corSuperior, opcoes.grossuraInferior || opcoes.grossuraSuperior);
    if (opcoes.corDoRealce) {
      ferramentasPixel.linha(contexto, raizX - 1, raizY, articulacaoX - 1, articulacaoY, opcoes.corDoRealce, 1);
      ferramentasPixel.linha(contexto, articulacaoX - 1, articulacaoY, extremidadeX - 1, extremidadeY, opcoes.corDoRealce, 1);
    }
    if (opcoes.corDaJunta) {
      const raioDaJunta = Math.max(1, (opcoes.grossuraSuperior - 1) / 2);
      ferramentasPixel.elipse(contexto, articulacaoX, articulacaoY, raioDaJunta, raioDaJunta, opcoes.corDaJunta);
    }
    return { articulacao: [articulacaoX, articulacaoY], extremidade: [extremidadeX, extremidadeY], anguloFinal: anguloDaRaiz + anguloDaDobra };
  };
  // ALCANCE (cinemática inversa de dois segmentos): os ângulos de ombro/quadril e de cotovelo/joelho — na convenção de
  // desenharMembro — que levam a ponta do membro a um ponto (deslocamentoX, deslocamentoY) medido a partir da raiz. Serve para
  // escrever gestos pelo DESTINO da mão ("microfone na boca", "mão no cinto") em vez de ângulos achados por tentativa.
  //  • articulacaoParaAFrente: true = cotovelo/joelho para a frente (+x, o lado do olhar); false = para trás;
  //  • dobraDeReferencia: o ângulo de dobra é devolvido na volta (±360°) mais próxima deste valor — use a dobra da pose de
  //    repouso, para a interpolação dos quadros-chave girar o antebraço pelo caminho curto (e não dar uma volta inteira).
  // Ponto fora do alcance: o membro fica esticado na direção dele.
  cavernaSecreta.angulosParaAlcancar = (deslocamentoX, deslocamentoY, comprimentoSuperior, comprimentoInferior, articulacaoParaAFrente = true, dobraDeReferencia = 0) => {
    const distanciaAoAlvo = Math.hypot(deslocamentoX, deslocamentoY) || 1e-6;
    const direcaoX = deslocamentoX / distanciaAoAlvo, direcaoY = deslocamentoY / distanciaAoAlvo;
    const distancia = Math.min(comprimentoSuperior + comprimentoInferior - 1e-6, distanciaAoAlvo);
    // lei dos cossenos: quanto a articulação avança na direção do alvo e quanto ela se afasta dessa linha
    const avancoNaDirecaoDoAlvo = (comprimentoSuperior ** 2 - comprimentoInferior ** 2 + distancia ** 2) / (2 * distancia);
    const afastamentoDaLinha = Math.sqrt(Math.max(0, comprimentoSuperior ** 2 - avancoNaDirecaoDoAlvo ** 2));
    let perpendicularX = -direcaoY, perpendicularY = direcaoX;                  // uma das duas perpendiculares à linha raiz → alvo
    if ((perpendicularX > 0) !== articulacaoParaAFrente) { perpendicularX = -perpendicularX; perpendicularY = -perpendicularY; }
    const articulacaoX = direcaoX * avancoNaDirecaoDoAlvo + perpendicularX * afastamentoDaLinha;
    const articulacaoY = direcaoY * avancoNaDirecaoDoAlvo + perpendicularY * afastamentoDaLinha;
    const radianosParaGraus = radianos => radianos * 180 / Math.PI;
    const anguloDaRaiz = radianosParaGraus(Math.atan2(articulacaoX, articulacaoY));                       // 0° = para baixo, + = para a frente
    const anguloDoSegundo = radianosParaGraus(Math.atan2(deslocamentoX - articulacaoX, deslocamentoY - articulacaoY));
    let anguloDaDobra = anguloDoSegundo - anguloDaRaiz;
    while (anguloDaDobra - dobraDeReferencia > 180) anguloDaDobra -= 360;
    while (anguloDaDobra - dobraDeReferencia < -180) anguloDaDobra += 360;
    return { anguloDaRaiz: Math.round(anguloDaRaiz), anguloDaDobra: Math.round(anguloDaDobra) };
  };
  // ponto a uma fração do caminho entre dois pontos, para enfeites (placas, faixas)
  cavernaSecreta.pontoEntre = (pontoInicial, pontoFinal, fracao) => [pontoInicial[0] + (pontoFinal[0] - pontoInicial[0]) * fracao, pontoInicial[1] + (pontoFinal[1] - pontoInicial[1]) * fracao];

  const criarBoneco = definicao => {
    const largura = definicao.largura, altura = definicao.altura, origemX = definicao.origem[0], origemY = definicao.origem[1];
    const [posicaoX, posicaoY] = cavernaSecreta.POSICOES[definicao.id];
    const telasDasCamadas = { tras: ferramentasPixel.criarTela(largura, altura), corpo: ferramentasPixel.criarTela(largura, altura), frente: ferramentasPixel.criarTela(largura, altura) };
    const telaComposta = ferramentasPixel.criarTela(largura, altura), telaEspelhada = ferramentasPixel.criarTela(largura, altura);
    const camposNumericos = Object.keys(definicao.pose).filter(campo => typeof definicao.pose[campo] === 'number');
    const estado = { x: posicaoX, y: posicaoY, partes: {}, fatias: null, alfa: 1, extra: {}, tempo: 0 };
    const ociosos = (definicao.ociosos || []).map(ocioso => ({
      ...ocioso,
      espera: cavernaSecreta.sortearEntre(ocioso.primeira ? ocioso.primeira[0] : ocioso.intervalo[0] * 0.3, ocioso.primeira ? ocioso.primeira[1] : ocioso.intervalo[1]),
      ativo: null,
    }));
    const gestosAutomaticos = (definicao.gestosAutomaticos || []).map(automatico => ({
      ...automatico,
      espera: cavernaSecreta.sortearEntre(automatico.primeira ? automatico.primeira[0] : 1, automatico.primeira ? automatico.primeira[1] : automatico.intervalo[1]),
    }));
    let gestoAtual = null, ultimoTempo = null, quadroAtual = -1, quadroComposto = -2, descansoDepoisDoGesto = 0, poseAtual = { ...definicao.pose };

    // pose do gesto no instante atual: interpola entre os dois quadros-chave vizinhos com suavização
    const amostrarGesto = (gesto, poseBase) => {
      const quadrosChave = gesto.quadros;
      let indice = 0;
      while (indice < quadrosChave.length - 1 && gesto.tempo >= quadrosChave[indice + 1].t) indice++;
      const anterior = { ...poseBase, ...quadrosChave[indice] }, seguinte = { ...poseBase, ...(quadrosChave[indice + 1] || quadrosChave[indice]) };
      const duracao = (quadrosChave[indice + 1] ? quadrosChave[indice + 1].t : quadrosChave[indice].t) - quadrosChave[indice].t;
      const fracao = duracao > 0 ? suavizar(Math.min(1, (gesto.tempo - quadrosChave[indice].t) / duracao)) : 1, resultado = { ...poseBase };
      for (const campo of Object.keys(poseBase)) {
        if (campo === 't') continue;
        resultado[campo] = typeof poseBase[campo] === 'number' ? anterior[campo] + (seguinte[campo] - anterior[campo]) * fracao : (fracao < 0.5 ? anterior[campo] : seguinte[campo]);
      }
      return resultado;
    };
    const boneco = {
      id: definicao.id, estado, definicao,
      fazerGesto(nome) {
        const quadrosChave = definicao.gestos[nome];
        if (!quadrosChave || gestoAtual) return false;
        gestoAtual = { nome, quadros: quadrosChave, tempo: 0, fim: quadrosChave[quadrosChave.length - 1].t };
        return true;
      },
      atualizar(tempo) {
        const segundosDoQuadro = ultimoTempo === null ? 0 : Math.max(0, Math.min(0.1, tempo - ultimoTempo));
        ultimoTempo = tempo;
        if (gestoAtual) { gestoAtual.tempo += segundosDoQuadro; if (gestoAtual.tempo >= gestoAtual.fim) gestoAtual = null; }
        for (const automatico of gestosAutomaticos) {
          automatico.espera -= segundosDoQuadro;
          if (automatico.espera <= 0) {
            if (!gestoAtual && descansoDepoisDoGesto <= 0 && boneco.fazerGesto(automatico.gesto)) {
              automatico.espera = cavernaSecreta.sortearEntre(automatico.intervalo[0], automatico.intervalo[1]);
              descansoDepoisDoGesto = gestoAtual.fim + cavernaSecreta.sortearEntre(3, 7);
            } else automatico.espera = cavernaSecreta.sortearEntre(0.5, 1.5);
          }
        }
        descansoDepoisDoGesto -= segundosDoQuadro;   // depois de cada gesto, uma pausa (só os ociosos — respirar, piscar — continuam)
        for (const ocioso of ociosos) {
          if (ocioso.ativo) {
            ocioso.ativo.tempo += segundosDoQuadro;
            if (ocioso.ativo.tempo >= ocioso.ativo.duracao) { ocioso.ativo = null; ocioso.espera = cavernaSecreta.sortearEntre(ocioso.intervalo[0], ocioso.intervalo[1]); }
          } else {
            ocioso.espera -= segundosDoQuadro;
            if (ocioso.espera <= 0) ocioso.ativo = { tempo: 0, duracao: Array.isArray(ocioso.duracao) ? cavernaSecreta.sortearEntre(ocioso.duracao[0], ocioso.duracao[1]) : ocioso.duracao, variante: Math.random() };
          }
        }
        const quadro = Math.floor(tempo * QUADROS_POR_SEGUNDO);
        if (quadro === quadroAtual) return;
        quadroAtual = quadro;
        estado.tempo = quadro / QUADROS_POR_SEGUNDO;
        let pose = { ...definicao.pose };
        if (gestoAtual) pose = amostrarGesto(gestoAtual, pose);
        for (const ocioso of ociosos) if (ocioso.ativo && !(ocioso.semGesto && gestoAtual)) ocioso.aplicar(pose, ocioso.ativo.tempo / ocioso.ativo.duracao, ocioso.ativo.variante, estado.tempo);
        estado.fatias = null; estado.alfa = 1; estado.extra = {};
        if (definicao.sempre) definicao.sempre(pose, estado.tempo, estado);
        poseAtual = pose;
        estado.partes = { gesto: gestoAtual ? gestoAtual.nome : '', ...Object.fromEntries(camposNumericos.map(campo => [campo, Math.round(pose[campo] * 10) / 10])) };
      },
      desenhar(contexto) {
        // a figura só é recomposta (camadas + contornos + espelho) quando a pose muda — 12 vezes por segundo; nos outros
        // quadros da tela reaproveita a imagem pronta (desempenho: o contorno lê os pixels de cada camada)
        if (quadroComposto !== quadroAtual) {
          quadroComposto = quadroAtual;
          for (const nome in telasDasCamadas) telasDasCamadas[nome].ctx.clearRect(0, 0, largura, altura);
          const camadas = { tras: telasDasCamadas.tras.ctx, corpo: telasDasCamadas.corpo.ctx, frente: telasDasCamadas.frente.ctx, origemX, origemY };
          estado.locais = definicao.desenharPartes(camadas, poseAtual, estado.tempo, estado) || {};
          telaComposta.ctx.clearRect(0, 0, largura, altura);
          for (const nome of ['tras', 'corpo', 'frente']) {
            ferramentasPixel.contornar(telasDasCamadas[nome].canvas, definicao.contorno || '#050507');
            telaComposta.ctx.drawImage(telasDasCamadas[nome].canvas, 0, 0);
          }
          if (definicao.direcao < 0) ferramentasPixel.espelhado(telaComposta.canvas, telaEspelhada.canvas);
        }
        const imagem = definicao.direcao < 0 ? telaEspelhada.canvas : telaComposta.canvas;
        const cantoX = Math.round(posicaoX - (definicao.direcao < 0 ? largura - origemX : origemX)), cantoY = Math.round(posicaoY - origemY);
        contexto.save();
        contexto.globalAlpha = estado.alfa;
        if (!estado.fatias) contexto.drawImage(imagem, cantoX, cantoY);
        else {   // fatias horizontais [yInicial, yFinal, deslocamentoX] em coordenadas da tela do personagem (falha de imagem do Slenderman)
          let yAtual = 0;
          for (const [yInicial, yFinal, deslocamentoX] of estado.fatias.slice().sort((primeira, segunda) => primeira[0] - segunda[0])) {
            if (yInicial > yAtual) contexto.drawImage(imagem, 0, yAtual, largura, yInicial - yAtual, cantoX, cantoY + yAtual, largura, yInicial - yAtual);
            contexto.drawImage(imagem, 0, yInicial, largura, yFinal - yInicial, cantoX + deslocamentoX, cantoY + yInicial, largura, yFinal - yInicial);
            yAtual = yFinal;
          }
          if (yAtual < altura) contexto.drawImage(imagem, 0, yAtual, largura, altura - yAtual, cantoX, cantoY + yAtual, largura, altura - yAtual);
        }
        contexto.restore();
      },
      sombra(contexto) {
        const raio = definicao.sombra || 10;
        contexto.fillStyle = 'rgba(4,4,10,0.55)';
        for (let y = -2; y <= 1; y++) for (let x = -raio; x <= raio; x++) {
          const distancia = (x / raio) ** 2 + (y / 2.2) ** 2;
          if (distancia <= 1 && 1 - distancia > cavernaSecreta.limiarPontilhado(posicaoX + x, posicaoY + y) * 0.9) contexto.fillRect(Math.round(posicaoX + x), posicaoY + y, 1, 1);
        }
      },
      // ponto da cena a partir de coordenadas LOCAIS do desenho (relativas aos pés, personagem olhando para a direita)
      ponto: (localX, localY) => [Math.round(posicaoX + (definicao.direcao < 0 ? -localX : localX)), Math.round(posicaoY + localY)],
      luzes(luz, tempo) { if (definicao.luzes) definicao.luzes(luz, poseAtual, tempo, boneco.ponto, estado); },
      brilhos(contexto, tempo) { if (definicao.brilhos) definicao.brilhos(contexto, poseAtual, tempo, boneco.ponto, estado); },
    };
    return boneco;
  };
  const criarPersonagemPorSprite = cavernaSecreta.criarPersonagem;
  cavernaSecreta.criarPersonagem = definicao => definicao.boneco ? criarBoneco(definicao) : criarPersonagemPorSprite(definicao);
})();
