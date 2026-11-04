      // ====================================================================================================
      // FARMEDU 3D — 11b-floresta.js (Fase 3B da refatoração: seção 11 — floresta)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ---- Vegetação instanciada (poucas draw calls), com semente fixa: sempre igual ao recarregar ----
      const materialBranco = new THREE.MeshLambertMaterial({ color: 0xffffff });
      // Cria uma InstancedMesh (um único desenho para centenas de objetos iguais) a partir de itens [x, y, z,
      // escalaX, escalaY, escalaZ, cor, giroY, giroZ]. Itens muito próximos da placa de boas-vindas, ou que cairiam na praça
      // central e nas estradas novas, são escondidos (escala 0). respeitarAreasLivres = false desliga esse filtro (usado pelas
      // plantas do próprio lago da praça).
      const malhaInstanciada = function malhaInstanciada(geometria, itens, materialDoObjeto = materialBranco, respeitarAreasLivres = true) { // item = [x, y, z, sx, sy, sz, cor, giroY, giroZ]
        const malha = new THREE.InstancedMesh(geometria, materialDoObjeto, itens.length), objetoAuxiliar = new THREE.Object3D(), cor = new THREE.Color();
        itens.forEach((item, indice) => {
          const livre = !respeitarAreasLivres || (Math.hypot(item[0] - PLACA.x, item[2] - PLACA.z) > 5.6 && !estaNaAreaDaPracaCentral(item[0], item[2], 0.8)) ? 1 : 0; // escala 0 = instância oculta (mantém a semente intacta)
          objetoAuxiliar.position.set(item[0], item[1], item[2]); objetoAuxiliar.rotation.set(0, item[7] || 0, item[8] || 0); objetoAuxiliar.scale.set(item[3] * livre, item[4] * livre, item[5] * livre); objetoAuxiliar.updateMatrix();
          malha.setMatrixAt(indice, objetoAuxiliar.matrix); malha.setColorAt(indice, cor.set(item[6]));
        });
        malha.instanceMatrix.needsUpdate = true; malha.instanceColor.needsUpdate = true;
        malha.frustumCulled = false; // em r128 o volume do InstancedMesh não cobre as instâncias
        cena.add(malha);
        return malha;
      };
      // Escurece ou clareia uma cor em até ±20% para dar variedade natural à vegetação.
      const variarTom = cor => new THREE.Color(cor).multiplyScalar(0.8 + numeroAleatorioDoCenario() * 0.4);
      // Sorteia um item de uma lista usando o gerador do cenário (sempre a mesma sequência).
      const escolher = lista => lista[Math.floor(numeroAleatorioDoCenario() * lista.length)];

      // Mantém a sequência aleatória 'sorte' idêntica à da versão anterior: arbustos, pedras, gramas, lago e pinheiros dos rios
      // continuam exatamente nos mesmos lugares (a floresta nova usa o próprio gerador, 'sorteio(907)', logo abaixo).
      {
        let aceitas = 0;
        for (let indice = 0; indice < 4000 && aceitas < 900; indice++) {
          const posicaoX = -85 + numeroAleatorioDoCenario() * 180, posicaoZ = -34 + numeroAleatorioDoCenario() * 118;
          if (dentroDaFazenda(posicaoX, posicaoZ) || distanciaDoRio(posicaoX, posicaoZ) < 5.5) continue;
          numeroAleatorioDoCenario(); aceitas++;
        }
        for (let indice = 0; indice < aceitas * 8; indice++) numeroAleatorioDoCenario();
      }

      // ---- Floresta: tronco + 3 cones por árvore, instanciados (4 draw calls) ----
      // CORREÇÃO ESTRUTURAL DO POSICIONAMENTO DAS ÁRVORES (ver COLISOES / podeColocarArvore):
      //  1) a floresta, os pinheiros do vale e os das margens do rio agora passam pela MESMA função de posicionamento seguro, que
      //     consulta o registro de colisões (construções, estradas, relevo, cachoeira, lago, placa, postes, pedra secreta, rio);
      //  2) antes, os pinheiros do vale atrás da cachoeira nasciam dentro das saias das montanhas e dos morros (só a ponta da copa
      //     aparecia) e tinham escalas de até 1,5; agora respeitam o relevo e usam a mesma faixa de tamanhos da floresta;
      //  3) distância mínima proporcional ao tamanho das copas, compartilhada entre todas as árvores;
      //  4) um único giro e tom de verde por árvore.
      const ARVORES_DA_FLORESTA = REGISTRO_DE_ARVORES.lista;   // [x, z, escala] de todas as árvores livres plantadas
      {
        const sortearFloresta = criarGeradorDeNumerosAleatorios(907), MAXIMO = 1050;
        for (let indice = 0; indice < 40000 && REGISTRO_DE_ARVORES.lista.length < MAXIMO; indice++) {
          const posicaoX = -85 + sortearFloresta() * 180, posicaoZ = -34 + sortearFloresta() * 118;
          const densidade = Math.min(1, Math.max(0.14, 0.5 + 0.5 * Math.sin(posicaoX * 0.06 + 1.1) * Math.sin(posicaoZ * 0.075 + 0.3) + 0.2)); // bosques e pequenas clareiras
          if (sortearFloresta() > densidade) continue;
          if (dentroDaFazenda(posicaoX, posicaoZ) || COLISOES.bloqueia(posicaoX, posicaoZ, 1.4)) continue;   // testes baratos antes de sortear o tamanho
          const escala = 0.85 + sortearFloresta() * 0.4;
          if (podeColocarArvore(posicaoX, posicaoZ, escala)) REGISTRO_DE_ARVORES.adicionar(posicaoX, posicaoZ, escala);
        }
        const verdeA = new THREE.Color(0x2a6b40), verdeB = new THREE.Color(0x2f7a4a), olivo = new THREE.Color(0x5a8c3a), tronco = new THREE.Color(0x6b4a2b);
        const troncos = [], camada1 = [], camada2 = [], camada3 = [];
        for (const [posicaoX, posicaoZ, escala] of ARVORES_DA_FLORESTA) {
          const escalaVertical = escala * (0.92 + sortearFloresta() * 0.22), giro = sortearFloresta() * 6.28, tomDaArvore = 0.86 + sortearFloresta() * 0.28, olivado = sortearFloresta() * 0.35; // um único giro e tom por árvore
          const corDaCamadaA = verdeA.clone().lerp(olivo, olivado).multiplyScalar(tomDaArvore), corDaCamadaB = verdeB.clone().lerp(olivo, olivado).multiplyScalar(tomDaArvore);
          troncos.push([posicaoX, 0.45 * escalaVertical, posicaoZ, escala, escalaVertical, escala, tronco.clone().multiplyScalar(0.85 + sortearFloresta() * 0.3), giro, 0]);   // a base do tronco encosta em y = 0 (terreno plano fora do relevo)
          camada1.push([posicaoX, 1.2 * escalaVertical, posicaoZ, escala, escalaVertical, escala, corDaCamadaA, giro, 0]);
          camada2.push([posicaoX, 2.0 * escalaVertical, posicaoZ, escala, escalaVertical, escala, corDaCamadaB, giro, 0]);
          camada3.push([posicaoX, 2.8 * escalaVertical, posicaoZ, escala, escalaVertical, escala, corDaCamadaA, giro, 0]);
        }
        const materialDasArvores = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }); // faces facetadas, como as montanhas
        malhaInstanciada(new THREE.CylinderGeometry(0.12, 0.18, 0.9, 6), troncos, materialDasArvores);
        malhaInstanciada(new THREE.ConeGeometry(1.1, 1.5, 7), camada1, materialDasArvores);
        malhaInstanciada(new THREE.ConeGeometry(0.85, 1.3, 7), camada2, materialDasArvores);
        malhaInstanciada(new THREE.ConeGeometry(0.55, 1.1, 7), camada3, materialDasArvores);
      }

      arquivoDaMontagemConcluido('11b-floresta.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
