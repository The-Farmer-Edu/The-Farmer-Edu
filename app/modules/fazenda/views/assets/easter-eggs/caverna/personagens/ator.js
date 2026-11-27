// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · personagens/ator.js
// Base comum dos personagens. Um personagem é uma DEFINIÇÃO (arquivo próprio em personagens/) registrada com
// cavernaSecreta.registrarPersonagem({...}). Hoje os oito são bonecos articulados desenhados por código (boneco.js, campo
// `boneco: true`); este arquivo guarda o registro, os utilitários de animação e o CRIADOR ANTIGO por atlas de sprites
// (sprites.js), que continua disponível para definições sem `boneco: true`:
//  • camadas: as partes do atlas em ordem de desenho (ex.: tentáculos atrás, base, tronco, cabeça). Uma camada pode
//    "seguir" outra (a cabeça acompanha o tronco que respira) e pode começar oculta (língua, tentáculos).
//  • continuos: movimentos sempre ativos e lentos (respiração, capa ao vento), cada um com o seu período.
//  • comportamentos: ações OCASIONAIS, cada uma com o seu relógio sorteado (intervalo e duração próprios) e um "grupo"
//    (só uma ação por grupo por vez: duas ações não disputam a mesma cabeça). Começam defasadas: ninguém sincroniza.
//  • luzes / brilhos: o que o personagem acrescenta ao mapa de luz e os halos que emite (olhos, energia...).
// A pose é amostrada a 12 quadros por segundo (passo de animação de pixel art); deslocamentos são sempre inteiros.
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta = window.CavernaSecreta || {};
  const definicoes = cavernaSecreta.definicoesDePersonagens = cavernaSecreta.definicoesDePersonagens || [];
  cavernaSecreta.registrarPersonagem = definicao => { definicoes.push(definicao); };

  // utilitários para os comportamentos (fracao = andamento 0–1 da ação)
  cavernaSecreta.vaiEVolta = fracao => Math.sin(Math.PI * Math.max(0, Math.min(1, fracao)));                        // 0 → 1 → 0
  cavernaSecreta.patamar = (fracao, subida = 0.2) => Math.min(1, fracao / subida, (1 - fracao) / subida);           // sobe, segura, desce
  cavernaSecreta.degrau = (fracao, quantidadeDeQuadros) => Math.min(quantidadeDeQuadros - 1, Math.floor(fracao * quantidadeDeQuadros));   // fração em n quadros

  const MARGEM = 12;   // folga em volta do personagem na tela própria (quadros que saem do retângulo, deslocamentos)

  cavernaSecreta.criarPersonagem = definicao => {
    const id = definicao.id, [largura, altura] = cavernaSecreta.sprites.tamanho(id), [posicaoX, posicaoY] = cavernaSecreta.POSICOES[id];
    const telaPropria = cavernaSecreta.novaTela(largura + MARGEM * 2, altura + MARGEM * 2);
    const camadas = definicao.camadas.map(camada => typeof camada === 'string' ? { parte: camada } : camada);
    const estado = { partes: {}, fatias: null, alfa: 1, tempo: 0, x: posicaoX, y: posicaoY, largura, altura, extra: {} };
    const zerarPose = () => {
      for (const camada of camadas) estado.partes[camada.parte] = { quadro: 0, dx: 0, dy: 0, visivel: !camada.oculta };
      estado.fatias = null; estado.alfa = 1; estado.extra = {};
    };
    // relógios das ações ocasionais: a primeira vez de cada uma é sorteada (defasagem entre personagens e entre ações)
    const acoes = (definicao.comportamentos || []).map(acao => ({
      ...acao,
      proxima: cavernaSecreta.sortearEntre(acao.primeira ? acao.primeira[0] : 1, acao.primeira ? acao.primeira[1] : acao.intervalo[1]),
      inicio: -1, duracaoAtual: 0,
    }));
    const sortearDuracao = acao => Array.isArray(acao.duracao) ? cavernaSecreta.sortearEntre(acao.duracao[0], acao.duracao[1]) : acao.duracao;
    let ultimoPasso = -1;

    const personagem = {
      id, estado, definicao,
      // relógio da cena → pose (só muda a cada 1/12 s)
      atualizar(tempo) {
        const passo = Math.floor(tempo * cavernaSecreta.QUADROS_POR_SEGUNDO_DOS_SPRITES);
        if (passo === ultimoPasso) return;
        ultimoPasso = passo;
        const tempoDoPasso = passo / cavernaSecreta.QUADROS_POR_SEGUNDO_DOS_SPRITES;
        estado.tempo = tempoDoPasso;
        zerarPose();
        for (const continuo of definicao.continuos || []) continuo(estado, tempoDoPasso);
        const gruposOcupados = new Set();
        for (const acao of acoes) if (acao.inicio >= 0) gruposOcupados.add(acao.grupo || acao.nome);
        for (const acao of acoes) {
          if (acao.inicio < 0 && tempoDoPasso >= acao.proxima) {
            if (gruposOcupados.has(acao.grupo || acao.nome)) acao.proxima = tempoDoPasso + cavernaSecreta.sortearEntre(0.6, 2.2);   // grupo ocupado: tenta depois
            else { acao.inicio = tempoDoPasso; acao.duracaoAtual = sortearDuracao(acao); acao.variante = Math.random(); gruposOcupados.add(acao.grupo || acao.nome); }
          }
          if (acao.inicio >= 0) {
            const fracao = (tempoDoPasso - acao.inicio) / acao.duracaoAtual;
            if (fracao >= 1) { acao.inicio = -1; acao.proxima = tempoDoPasso + cavernaSecreta.sortearEntre(acao.intervalo[0], acao.intervalo[1]); continue; }
            acao.aplicar(estado, fracao, acao.variante, tempoDoPasso);
          }
        }
      },
      // desenha na tela própria e copia para a cena (com fatias deslocadas, se a pose pedir "falha" de imagem)
      desenhar(contexto) {
        const contextoProprio = telaPropria.contexto;
        contextoProprio.clearRect(0, 0, telaPropria.tela.width, telaPropria.tela.height);
        for (const camada of camadas) {
          const parte = estado.partes[camada.parte];
          if (!parte.visivel || !cavernaSecreta.sprites.quadros(id, camada.parte)) continue;
          let deslocamentoX = parte.dx, deslocamentoY = parte.dy;
          for (let pai = camada.segue; pai; pai = (camadas.find(item => item.parte === pai) || {}).segue) { deslocamentoX += estado.partes[pai].dx; deslocamentoY += estado.partes[pai].dy; }
          cavernaSecreta.sprites.desenhar(contextoProprio, id, camada.parte, parte.quadro, MARGEM, MARGEM, deslocamentoX, deslocamentoY);
        }
        const origemNaCenaX = Math.round(posicaoX - largura / 2) - MARGEM, origemNaCenaY = posicaoY - altura - MARGEM;
        contexto.save();
        contexto.globalAlpha = estado.alfa;
        if (!estado.fatias) contexto.drawImage(telaPropria.tela, origemNaCenaX, origemNaCenaY);
        else {   // fatias horizontais [yInicial, yFinal, deslocamentoX] (coordenadas do personagem); o resto sai no lugar
          const larguraDaTela = telaPropria.tela.width, alturaDaTela = telaPropria.tela.height;
          const copiarFaixa = (yInicial, yFinal, deslocamentoX) => { if (yFinal > yInicial) contexto.drawImage(telaPropria.tela, 0, yInicial, larguraDaTela, yFinal - yInicial, origemNaCenaX + deslocamentoX, origemNaCenaY + yInicial, larguraDaTela, yFinal - yInicial); };
          let yAtual = 0;
          const fatiasNaTela = estado.fatias.map(([yInicial, yFinal, deslocamentoX]) => [yInicial + MARGEM, yFinal + MARGEM, deslocamentoX]).sort((primeira, segunda) => primeira[0] - segunda[0]);
          for (const [inicio, fim, deslocamento] of fatiasNaTela) {
            copiarFaixa(yAtual, Math.max(yAtual, inicio), 0);
            copiarFaixa(Math.max(yAtual, inicio), fim, deslocamento);
            yAtual = Math.max(yAtual, fim);
          }
          copiarFaixa(yAtual, alturaDaTela, 0);
        }
        contexto.restore();
      },
      // sombra pontilhada sob os pés (desenhada antes do personagem)
      sombra(contexto) {
        const raio = definicao.sombra || Math.round(largura * 0.42);
        contexto.fillStyle = 'rgba(4,4,10,0.55)';
        for (let y = -2; y <= 1; y++) for (let x = -raio; x <= raio; x++) {
          const distancia = (x / raio) ** 2 + (y / 2.2) ** 2;
          if (distancia > 1) continue;
          if (1 - distancia > cavernaSecreta.limiarPontilhado(posicaoX + x, posicaoY + y) * 0.9) contexto.fillRect(Math.round(posicaoX + x), posicaoY + y, 1, 1);
        }
      },
      // ponto do personagem na cena a partir de um ponto do sprite (para luzes e brilhos)
      ponto: (spriteX, spriteY) => [Math.round(posicaoX - largura / 2) + spriteX, posicaoY - altura + spriteY],
      luzes(luz, tempo) { if (definicao.luzes) definicao.luzes(luz, estado, tempo, personagem); },
      brilhos(contexto, tempo) { if (definicao.brilhos) definicao.brilhos(contexto, estado, tempo, personagem); },
    };
    zerarPose();
    return personagem;
  };
})();
