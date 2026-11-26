// ====================================================================================================
// EDIÇÃO PESSOAL — CAVERNA SECRETA · sprites.js
// Carregador de SPRITES por atlas (usado pelo criador antigo de personagens em personagens/ator.js). Hoje os oito personagens
// são bonecos desenhados por código e a lista de atlas a baixar (CAVERNA_SECRETA_CONFIG.personagens) está vazia; o carregador
// continua aqui para personagens por sprite. Cada personagem por sprite tem um atlas PNG (sprites/<id>.png) e um mapa
// (sprites/<id>.atlas.js, gerado por sprites/_fonte/gerar-atlas.ps1). Uma "parte" é um pedaço do personagem (base, cabeca,
// capaE...) e cada parte tem um ou mais quadros [x, y, largura, altura, deslocamentoX, deslocamentoY] — o FORMATO do atlas é
// fixo (gerado pelo script), por isso os quadros são listas e não objetos.
// ====================================================================================================
(() => {
  const cavernaSecreta = window.CavernaSecreta = window.CavernaSecreta || {};
  const imagensCarregadas = {};   // id → HTMLImageElement já decodificada

  cavernaSecreta.sprites = {
    // Baixa os PNGs dos atlas registrados (os .atlas.js já rodaram). Resolve quando TODOS estiverem prontos.
    carregar(ids) {
      return Promise.all(ids.map(id => {
        const atlas = cavernaSecreta.atlas && cavernaSecreta.atlas[id];
        if (!atlas) return Promise.reject(new Error('atlas não registrado: ' + id));
        if (imagensCarregadas[id]) return imagensCarregadas[id];
        return new Promise((resolver, rejeitar) => {
          const imagem = new Image();
          imagem.onload = () => { imagensCarregadas[id] = imagem; resolver(imagem); };
          imagem.onerror = () => rejeitar(new Error('sprite não carregou: sprites/' + atlas.imagem));
          imagem.src = cavernaSecreta.endereco('caverna/sprites/' + atlas.imagem);
        });
      }));
    },
    pronto: id => !!imagensCarregadas[id],
    // quantidade de quadros de uma parte (0 = a parte não existe no atlas)
    quadros: (id, parte) => ((cavernaSecreta.atlas[id] && cavernaSecreta.atlas[id].partes[parte]) || []).length,
    // Copia o quadro `quadro` da parte para a tela. (x, y) = canto superior esquerdo do PERSONAGEM na tela; deslocamentoX/Y =
    // deslocamento da parte. espelhar = desenha virado (o personagem continua no mesmo lugar). Coordenadas sempre inteiras.
    desenhar(contexto, id, parte, quadro, x, y, deslocamentoX = 0, deslocamentoY = 0, espelhar = false) {
      const imagem = imagensCarregadas[id], quadrosDaParte = cavernaSecreta.atlas[id] && cavernaSecreta.atlas[id].partes[parte];
      if (!imagem || !quadrosDaParte || !quadrosDaParte.length) return;
      const [atlasX, atlasY, largura, altura, posicaoNaFiguraX, posicaoNaFiguraY] = quadrosDaParte[Math.max(0, Math.min(quadrosDaParte.length - 1, quadro | 0))];
      const larguraDoPersonagem = cavernaSecreta.atlas[id].tamanho[0];
      if (!espelhar) {
        contexto.drawImage(imagem, atlasX, atlasY, largura, altura, Math.round(x + posicaoNaFiguraX + deslocamentoX), Math.round(y + posicaoNaFiguraY + deslocamentoY), largura, altura);
        return;
      }
      contexto.save();
      contexto.translate(Math.round(x + larguraDoPersonagem - posicaoNaFiguraX - deslocamentoX), Math.round(y + posicaoNaFiguraY + deslocamentoY));
      contexto.scale(-1, 1);
      contexto.drawImage(imagem, atlasX, atlasY, largura, altura, 0, 0, largura, altura);
      contexto.restore();
    },
    tamanho: id => cavernaSecreta.atlas[id].tamanho,
  };
})();
