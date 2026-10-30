      // ====================================================================================================
      // FARMEDU 3D — 14-areas-e-reconstrucao.js (Fase 3B da refatoração: seção 14)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================

      // ====================================================================================================
      // SEÇÃO 14 — GRUPOS 3D DAS ÁREAS E RECONSTRUÇÃO
      // Um grupo 3D por área e a função que reconstrói seu conteúdo quando ela evolui, é destruída ou reparada.
      // ====================================================================================================
      const grupoDaArea = {}, animacoesDaArea = {};
      for (const area of AREAS) {
        grupoDaArea[area.id] = new THREE.Group();
        grupoDaArea[area.id].position.set(area.posicao.x, 0, area.posicao.z);
        grupoDaArea[area.id].userData.areaId = area.id;
        cena.add(grupoDaArea[area.id]);
      }
      // Descarta o conteúdo 3D de uma área e o constrói de novo: ruína se a instalação está destruída, senão o
      // construtor do nível atual. Libera as geometrias antigas (menos as compartilhadas: halos e peças dos lampiões).
      // A lista de lampiões da área é refeita pelo construtor (ruínas não têm lampiões: ficam apagadas).
      const reconstruirArea = function reconstruirArea(idDaArea) {
        const grupo = grupoDaArea[idDaArea];
        while (grupo.children.length) {
          const modelo = grupo.children[0];
          grupo.remove(modelo);
          modelo.traverse(objeto => { if (objeto.geometry && !objeto.isSprite && !geometriasCompartilhadas.has(objeto.geometry)) objeto.geometry.dispose(); });
        }
        animacoesDaArea[idDaArea] = [];
        lampioesDasConstrucoes[idDaArea] = [];
        animaisCriadosNaConstrucao = 0;
        if (PLANTACOES_COM_CANTEIROS.includes(idDaArea)) delete canteirosVisuais[idDaArea];
        if (idDaArea === 'mina') carrinhoDaMina = null;
        const destruida = !!(estado.danos[idDaArea] && estado.danos[idDaArea].destruida);   // o dano salvo vence: a instalação nunca reaparece intacta
        idDaAreaEmConstrucao = idDaArea;   // os lampiões criados pelo construtor ficam registrados nesta área
        try {
          const nivelAtual = estado.niveis[idDaArea];
          if (!nivelAtual && !AREAS_COM_BASE_FISICA_NO_NIVEL_0.includes(idDaArea)) construirDemarcacao(grupo, idDaArea);   // nível 0: lote reservado
          else if (!nivelAtual && idDaArea === 'ponte') construirPonteQuebrada(grupo);                       // ponte antiga e quebrada (nível 0)
          else if (!nivelAtual) construirCasaBase(grupo, animacoesDaArea[idDaArea]);                        // casa base (nível 0)
          else if (destruida) construirRuinas(grupo, idDaArea, estado.niveis[idDaArea], animacoesDaArea[idDaArea]);
          else construtoresDasAreas[idDaArea](grupo, estado.niveis[idDaArea], animacoesDaArea[idDaArea]);
        } finally { idDaAreaEmConstrucao = null; }
        coletarMateriaisBasicos(grupo);
        removerMateriaisBasicosForaDaCena();
        grupo.userData.progressoDoEfeitoDeEvolucao = destruida ? 0 : 1;
        if (destruida) grupo.scale.setScalar(1);
      };
      AREAS.forEach(areaDaLista => reconstruirArea(areaDaLista.id));

      arquivoDaMontagemConcluido('14-areas-e-reconstrucao.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
