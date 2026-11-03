      // ====================================================================================================
      // FARMEDU 3D — 11f-otimizacao-do-cenario.js (Fase 3B da refatoração: seção 11 — otimização do cenário estático)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ---- Cenário estático: matrizes calculadas uma única vez ----
      // O Three.js recalcula a matriz de TODO objeto a cada quadro. Chão, caminhos, praça, postes, relevo, rio, floresta, lago
      // etc. nunca se movem depois de montados, então suas matrizes são calculadas agora e congeladas (matrixAutoUpdate = false).
      // Ficam de fora as luzes (sol/lua se movem) e os objetos marcados com userData.animado (nuvens, espuma, névoa e anéis
      // do lago), que continuam sendo atualizados normalmente. Áreas, animais, céu, fazendeiros e mobs são criados depois e
      // não são afetados. Não muda nada na imagem: só evita contas repetidas.
      const congelarMatrizesEstaticas = function congelarMatrizesEstaticas(objeto) {
        if (objeto.isLight || objeto === luzDoSol.target || objeto.userData.animado) return;
        objeto.updateMatrix(); objeto.matrixAutoUpdate = false;
        for (const filho of objeto.children) congelarMatrizesEstaticas(filho);
      };
      for (const objetoDoCenario of cena.children) congelarMatrizesEstaticas(objetoDoCenario);
      // ---- Desempenho (Mark 8.2): mesclagem de malhas estáticas ----
      // Cada malha separada custa uma chamada de desenho no quadro normal e OUTRA no mapa de sombras. O cenário fixo (postes,
      // bancos, praça, rochas, pinheiros das margens, cachoeira...) tinha milhares de malhas pequenas. Esta função junta as malhas
      // estáticas que usam o MESMO material (e as mesmas opções de sombra) numa única geometria em coordenadas do mundo: a
      // imagem é idêntica, mas com muito menos chamadas de desenho. Materiais compartilhados continuam sendo os mesmos objetos,
      // então o que o ciclo de dia e noite muda neles (brilho das lanternas, cores...) continua valendo.
      // Não entram: malhas instanciadas, transparentes, com renderOrder, animadas (userData.animado em qualquer ancestral),
      // marcadas com userData.naoMesclar (ex.: pedra secreta, que tem clique) ou com escala espelhada.
      const matrizDeNormalTemporaria = new THREE.Matrix3(), vetorTemporarioDaMesclagem = new THREE.Vector3();
      const juntarGeometrias = function juntarGeometrias(malhas, comUV) {
        let totalDeVertices = 0, totalDeIndices = 0;
        for (const malha of malhas) { const geometria = malha.geometry; totalDeVertices += geometria.attributes.position.count; totalDeIndices += geometria.index ? geometria.index.count : geometria.attributes.position.count; }
        const posicoes = new Float32Array(totalDeVertices * 3), normais = new Float32Array(totalDeVertices * 3), coordenadas = comUV ? new Float32Array(totalDeVertices * 2) : null;
        const indices = totalDeVertices > 65535 ? new Uint32Array(totalDeIndices) : new Uint16Array(totalDeIndices);
        let deslocamentoDeVertices = 0, deslocamentoDeIndices = 0;
        for (const malha of malhas) {
          const geometria = malha.geometry, posicao = geometria.attributes.position, normal = geometria.attributes.normal, uv = geometria.attributes.uv;
          matrizDeNormalTemporaria.getNormalMatrix(malha.matrixWorld);
          for (let vertice = 0; vertice < posicao.count; vertice++) {
            vetorTemporarioDaMesclagem.set(posicao.getX(vertice), posicao.getY(vertice), posicao.getZ(vertice)).applyMatrix4(malha.matrixWorld);
            posicoes.set([vetorTemporarioDaMesclagem.x, vetorTemporarioDaMesclagem.y, vetorTemporarioDaMesclagem.z], (deslocamentoDeVertices + vertice) * 3);
            vetorTemporarioDaMesclagem.set(normal.getX(vertice), normal.getY(vertice), normal.getZ(vertice)).applyMatrix3(matrizDeNormalTemporaria).normalize();
            normais.set([vetorTemporarioDaMesclagem.x, vetorTemporarioDaMesclagem.y, vetorTemporarioDaMesclagem.z], (deslocamentoDeVertices + vertice) * 3);
            if (comUV) coordenadas.set([uv.getX(vertice), uv.getY(vertice)], (deslocamentoDeVertices + vertice) * 2);
          }
          if (geometria.index) for (let indice = 0; indice < geometria.index.count; indice++) indices[deslocamentoDeIndices + indice] = geometria.index.getX(indice) + deslocamentoDeVertices;
          else for (let indice = 0; indice < posicao.count; indice++) indices[deslocamentoDeIndices + indice] = indice + deslocamentoDeVertices;
          deslocamentoDeVertices += posicao.count; deslocamentoDeIndices += geometria.index ? geometria.index.count : posicao.count;
        }
        const resultado = new THREE.BufferGeometry();
        resultado.setAttribute('position', new THREE.BufferAttribute(posicoes, 3)); resultado.setAttribute('normal', new THREE.BufferAttribute(normais, 3));
        if (comUV) resultado.setAttribute('uv', new THREE.BufferAttribute(coordenadas, 2));
        resultado.setIndex(new THREE.BufferAttribute(indices, 1));
        return resultado;
      };
      const mesclarMalhasEstaticas = function mesclarMalhasEstaticas(raiz) {
        raiz.updateMatrixWorld(true);
        const ignorar = objeto => { for (let atual = objeto; atual; atual = atual.parent) if (atual.userData.animado || atual.userData.naoMesclar) return true; return false; };
        const grupos = new Map();
        raiz.traverse(objeto => {
          if (!objeto.isMesh || objeto.isInstancedMesh || Array.isArray(objeto.material) || objeto.material.transparent || objeto.renderOrder || !objeto.visible || ignorar(objeto)) return;
          const geometria = objeto.geometry, atributos = geometria && geometria.attributes;
          if (!atributos || !atributos.position || !atributos.normal || Object.keys(atributos).some(nome => !['position', 'normal', 'uv'].includes(nome))) return;
          if (objeto.matrixWorld.determinant() < 0) return;
          const chave = objeto.material.uuid + '|' + objeto.castShadow + '|' + objeto.receiveShadow + '|' + (atributos.uv ? 1 : 0);
          if (!grupos.has(chave)) grupos.set(chave, []);
          grupos.get(chave).push(objeto);
        });
        let removidas = 0, criadas = 0;
        for (const malhas of grupos.values()) {
          if (malhas.length < 2) continue;
          const mesclada = new THREE.Mesh(juntarGeometrias(malhas, !!malhas[0].geometry.attributes.uv), malhas[0].material);
          mesclada.castShadow = malhas[0].castShadow; mesclada.receiveShadow = malhas[0].receiveShadow; mesclada.userData.mesclada = true;
          mesclada.updateMatrix(); mesclada.matrixAutoUpdate = false; cena.add(mesclada);
          for (const malha of malhas) { malha.parent.remove(malha); if (!geometriasCompartilhadas.has(malha.geometry)) malha.geometry.dispose(); }
          removidas += malhas.length; criadas++;
        }
        return { removidas, criadas };
      };

      pedraSecreta.grupo.userData.naoMesclar = true;     // tem clique (raycast) e cristais próprios
      entradaDaCaverna.userData.naoMesclar = true;       // o túnel escuro precisa continuar com a própria ordem de desenho
      const resultadoDaMesclagem = mesclarMalhasEstaticas(cena);
      console.info('[FarmEdu] cenário estático: ' + resultadoDaMesclagem.removidas + ' malhas juntadas em ' + resultadoDaMesclagem.criadas + ' (menos chamadas de desenho).');

      arquivoDaMontagemConcluido('11f-otimizacao-do-cenario.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
