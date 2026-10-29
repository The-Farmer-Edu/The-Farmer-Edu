      // ====================================================================================================
      // FARMEDU 3D — 12a-plantacao-com-canteiros.js (Fase 3B da refatoração: seção 12 — plantação com canteiros)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================

      // ====================================================================================================
      // SEÇÃO 12 — CONSTRUTORES DAS ÁREAS (CONSTRUÇÕES, ANIMAIS E LAMPIÕES, 3 NÍVEIS CADA)
      // Um construtor por área (casa, celeiro, curral...). Cada um recebe o grupo 3D da área, o nível atual e a lista de animações da área.
      // As chaves deste objeto são os ids das áreas: não as renomeie.
      // ====================================================================================================
      // ---- MARK 8.2: plantação com canteiros (usada pela Grande plantação e pela Nova plantação) ----
      // As duas áreas têm EXATAMENTE as mesmas dimensões físicas por nível (as da Grande plantação original: largura de
      // LAVOURA_CONFIG.larguraPorNivel × profundidade 15) e cada uma tem a própria grade de canteiros, cujo estado fica em
      // estado.lavouras[idDaArea]. Solos e bordas dos canteiros são instanciados (2 desenhos por plantação); as plantas são
      // desenhadas pela seção 27. entrada: 'norte' (Grande, como era) ou 'oeste' (Nova, de frente para a estrada).
      // alinharOeste: mantém a borda oeste no mesmo lugar em todos os níveis (a estrada da Nova plantação chega por ali).
      const quantidadeDeCanteirosNoNivel = function quantidadeDeCanteirosNoNivel(nivel) {
        if (!nivel) return { colunas: 0, linhas: 0, total: 0 };
        const { larguraPorNivel, profundidade, tamanhoDoCanteiro, corredor } = LAVOURA_CONFIG;
        const colunas = Math.floor((larguraPorNivel[nivel - 1] - corredor) / (tamanhoDoCanteiro + corredor)), linhas = Math.floor((profundidade - corredor) / (tamanhoDoCanteiro + corredor));
        return { colunas, linhas, total: Math.min(LAVOURA_CONFIG.maximoDeCanteiros, colunas * linhas) };
      };
      const construirPlantacaoComCanteiros = function construirPlantacaoComCanteiros(grupo, nivel, idDaArea, entrada, alinharOeste) {
        const { larguraPorNivel, profundidade, tamanhoDoCanteiro, corredor } = LAVOURA_CONFIG, largura = larguraPorNivel[nivel - 1];
        const deslocamentoX = alinharOeste ? (larguraPorNivel[NIVEL_MAXIMO - 1] - largura) / 2 : 0;
        const campo = new THREE.Group(); campo.position.x = deslocamentoX; grupo.add(campo);
        criarBaseDoTerreno(campo, largura + 1.4, profundidade + 1.4, 0x78bd49);
        criarCaixa(largura, 0.1, profundidade, 0x7a4c28, 0, 0.12, 0, campo);
        // cerca com a entrada no lado escolhido, mourões de entrada, placa, lampião, barril, caixote e espantalho
        criarTrechoDeCerca(campo, -largura / 2, profundidade / 2, largura / 2, profundidade / 2);
        criarTrechoDeCerca(campo, largura / 2, -profundidade / 2, largura / 2, profundidade / 2);
        if (entrada === 'norte') {
          criarTrechoDeCerca(campo, -largura / 2, -profundidade / 2, -1.5, -profundidade / 2); criarTrechoDeCerca(campo, 1.5, -profundidade / 2, largura / 2, -profundidade / 2);
          criarTrechoDeCerca(campo, -largura / 2, -profundidade / 2, -largura / 2, profundidade / 2);
          for (const lado of [-1, 1]) { criarCaixa(0.2, 1.3, 0.2, PALETA_DE_CORES.madeira, lado * 1.5, 0.65, -profundidade / 2, campo); criarEsfera(0.11, 0xc98a4a, lado * 1.5, 1.38, -profundidade / 2, campo); }
          criarPlacaDeMadeira(campo, -2.6, -profundidade / 2 - 0.5);
          criarPosteDeLampiao(campo, 2.5, -profundidade / 2 - 0.45);
        } else {
          criarTrechoDeCerca(campo, -largura / 2, -profundidade / 2, largura / 2, -profundidade / 2);
          criarTrechoDeCerca(campo, -largura / 2, -profundidade / 2, -largura / 2, -1.5); criarTrechoDeCerca(campo, -largura / 2, 1.5, -largura / 2, profundidade / 2);
          for (const lado of [-1, 1]) { criarCaixa(0.2, 1.3, 0.2, PALETA_DE_CORES.madeira, -largura / 2, 0.65, lado * 1.5, campo); criarEsfera(0.11, 0xc98a4a, -largura / 2, 1.38, lado * 1.5, campo); }
          criarPlacaDeMadeira(campo, -largura / 2 - 0.5, 2.6);
          criarPosteDeLampiao(campo, -largura / 2 - 0.45, -2.5, Math.PI);
        }
        criarBarril(campo, largura / 2 - 0.9, profundidade / 2 + 0.7); criarCaixote(campo, -largura / 2 + 0.9, profundidade / 2 + 0.7);
        if (nivel >= 2) {                                                                                        // espantalho num canto
          const espantalho = new THREE.Group(); espantalho.position.set(largura / 2 - 0.35, 0, -profundidade / 2 + 0.35); campo.add(espantalho);
          criarCaixa(0.1, 1.8, 0.1, PALETA_DE_CORES.madeira, 0, 0.9, 0, espantalho); criarCaixa(1.05, 0.1, 0.1, PALETA_DE_CORES.madeira, 0, 1.4, 0, espantalho);
          criarCaixa(0.42, 0.55, 0.3, 0xb74b35, 0, 1.2, 0, espantalho); criarEsfera(0.23, 0xd5ad7b, 0, 1.75, 0, espantalho, 1.1); criarCaixa(0.75, 0.1, 0.55, 0x65401f, 0, 2.02, 0, espantalho);
        }
        // grade de canteiros (instanciada)
        const { colunas, linhas, total } = quantidadeDeCanteirosNoNivel(nivel), larguraDaGrade = colunas * tamanhoDoCanteiro + (colunas + 1) * corredor, profundidadeDaGrade = linhas * tamanhoDoCanteiro + (linhas + 1) * corredor;
        const posicoes = [];
        for (let linha = 0; linha < linhas; linha++) for (let coluna = 0; coluna < colunas; coluna++) if (posicoes.length < total)
          posicoes.push([-larguraDaGrade / 2 + corredor + tamanhoDoCanteiro / 2 + coluna * (tamanhoDoCanteiro + corredor), -profundidadeDaGrade / 2 + corredor + tamanhoDoCanteiro / 2 + linha * (tamanhoDoCanteiro + corredor)]);
        const objetoAuxiliar = new THREE.Object3D(), solo = new THREE.InstancedMesh(new THREE.BoxGeometry(tamanhoDoCanteiro, 0.12, tamanhoDoCanteiro), material(0x4e321d), posicoes.length);
        const bordas = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material(0x8a5a2a), posicoes.length * 4);
        posicoes.forEach(([posicaoX, posicaoZ], indice) => {
          objetoAuxiliar.position.set(posicaoX, 0.22, posicaoZ); objetoAuxiliar.rotation.set(0, 0, 0); objetoAuxiliar.scale.set(1, 1, 1); objetoAuxiliar.updateMatrix(); solo.setMatrixAt(indice, objetoAuxiliar.matrix);
          [[tamanhoDoCanteiro + 0.12, 0.08, 0, -tamanhoDoCanteiro / 2], [tamanhoDoCanteiro + 0.12, 0.08, 0, tamanhoDoCanteiro / 2], [0.08, tamanhoDoCanteiro, -tamanhoDoCanteiro / 2, 0], [0.08, tamanhoDoCanteiro, tamanhoDoCanteiro / 2, 0]]
            .forEach(([larguraDaTabua, profundidadeDaTabua, diferencaX, diferencaZ], lado) => { objetoAuxiliar.position.set(posicaoX + diferencaX, 0.24, posicaoZ + diferencaZ); objetoAuxiliar.scale.set(larguraDaTabua, 0.2, profundidadeDaTabua); objetoAuxiliar.updateMatrix(); bordas.setMatrixAt(indice * 4 + lado, objetoAuxiliar.matrix); });
        });
        for (const malha of [solo, bordas]) { malha.instanceMatrix.needsUpdate = true; malha.receiveShadow = true; malha.castShadow = malha === bordas; campo.add(malha); }
        solo.userData.plantacao = idDaArea;                                                                       // clique no canteiro (seção 23)
        const plantas = new THREE.Group(); plantas.position.y = 0.28; campo.add(plantas);
        canteirosVisuais[idDaArea] = { plantas, solo, posicoes, deslocamentoX, assinaturaDesenhada: null };
      };

      arquivoDaMontagemConcluido('12a-plantacao-com-canteiros.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
