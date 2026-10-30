      // ====================================================================================================
      // FARMEDU 3D — 12b-construtores-das-areas.js (Fase 3B da refatoração: seção 12 — construtores das áreas)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      const construtoresDasAreas = {

        // N1 casinha de madeira · N2 varanda, água-furtada e jardim · N3 casarão com ala, lago e pérgola
        casa(grupo, nivel, animacoesDestaArea) {
          const largura = [3.2, 3.8, 4.2][nivel - 1], profundidade = [3.4, 3.8, 4.2][nivel - 1], altura = [1.8, 2, 2.2][nivel - 1];
          const larguraDoTerreno = nivel === 3 ? 10.5 : 8, profundidadeDoTerreno = nivel === 3 ? 10 : 7.5;
          criarBaseDoTerreno(grupo, larguraDoTerreno, profundidadeDoTerreno);
          criarCaixa(largura, altura, profundidade, 0xdcc08e, 0, altura / 2, 0, grupo);
          criarCaixa(largura + 0.1, 0.3, profundidade + 0.1, 0x8a8a80, 0, 0.15, 0, grupo);
          criarTelhado(grupo, profundidade + 0.5, largura + 0.5, 1.6, PALETA_DE_CORES.telhaCasa, 0, altura, 0, Math.PI / 2);
          criarCaixa(0.7, 1.2, 0.1, 0x7a4a2a, 0, 0.7, profundidade / 2 + 0.04, grupo);
          for (const lado of [-1, 1]) { criarJanelaIluminada(grupo, lado * largura * 0.3, 1.2, profundidade / 2 + 0.04, false); criarJanelaIluminada(grupo, lado * (largura / 2 + 0.02), 1.2, -profundidade * 0.15, true); }

          // varanda (todos os níveis); grade a partir do nível 2
          const larguraDoPorche = largura * 0.8, alturaDoPorche = altura - 0.25;
          criarCaixa(larguraDoPorche, 0.12, 1.3, 0xb98a55, 0, 0.1, profundidade / 2 + 0.65, grupo);
          criarCaixa(larguraDoPorche + 0.3, 0.1, 1.6, PALETA_DE_CORES.telhaCasa, 0, altura - 0.1, profundidade / 2 + 0.75, grupo).rotation.x = 0.25;
          for (const lado of [-1, 1]) criarCaixa(0.12, alturaDoPorche, 0.12, 0xf2ead8, lado * larguraDoPorche / 2, alturaDoPorche / 2, profundidade / 2 + 1.25, grupo);
          if (nivel >= 2) criarCaixa(larguraDoPorche, 0.35, 0.06, 0xf2ead8, 0, 0.45, profundidade / 2 + 1.3, grupo);

          // iluminação noturna: lampião sobre a porta, postinho junto ao caminho, brilho quente que sai pela porta e pelas janelas
          // (manchas no piso da varanda e no chão ao lado) e o ponto de onde a luz real da casa "sai" (seção 20)
          criarLampiaoDeParede(grupo, 0, 1.72, profundidade / 2 + 0.05, 0, 0);
          criarPosteDeLampiao(grupo, 1.1, profundidade / 2 + 1.75);
          criarManchaDeLuzNoChao(grupo, materialDoBrilhoNoChao, 0, 0.19, profundidade / 2 + 0.95, largura * 1.25, 2.4);
          for (const lado of [-1, 1]) criarManchaDeLuzNoChao(grupo, materialDoBrilhoNoChao, lado * (largura / 2 + 0.8), 0.12, -profundidade * 0.15, 1.7, 1.5);
          marcadorDaLuzDaCasa = new THREE.Object3D(); marcadorDaLuzDaCasa.position.set(0, 1.5, profundidade / 2 + 1.3); grupo.add(marcadorDaLuzDaCasa);
          // chaminé com fumaça
          const chamines = [[largura * 0.25, altura + 1.1, -profundidade * 0.1, 1.5]];
          if (nivel === 3) chamines.push([-largura * 0.15, altura + 0.9, -profundidade / 2 - 1.8, 1.3]);
          for (const [posicaoX, posicaoY, posicaoZ, alturaDaChamine] of chamines) criarCaixa(0.55, alturaDaChamine, 0.55, 0xe6dfd0, posicaoX, posicaoY, posicaoZ, grupo);
          const [fumacaX, fumacaY, fumacaZ] = chamines[0];
          for (let indice = 0; indice < 4; indice++) {
            const bolaDeFumaca = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
            grupo.add(bolaDeFumaca);
            animacoesDestaArea.push(tempoDecorrido => { const progresso = (tempoDecorrido * 0.3 + indice / 4) % 1; bolaDeFumaca.position.set(fumacaX + progresso * 0.8, fumacaY + 1 + progresso * 2.2, fumacaZ); bolaDeFumaca.scale.setScalar(0.5 + progresso); bolaDeFumaca.material.opacity = 0.7 * (1 - progresso); });
          }
          // água-furtada
          if (nivel >= 2) for (const posicaoDaJanelaX of (nivel === 2 ? [0] : [-largura * 0.25, largura * 0.25])) {
            criarCaixa(0.9, 1, 0.7, 0xdcc08e, posicaoDaJanelaX, altura + 0.85, profundidade * 0.25, grupo);
            criarTelhado(grupo, 1.2, 1, 0.5, PALETA_DE_CORES.telhaCasa, posicaoDaJanelaX, altura + 1.35, profundidade * 0.25);
            criarJanelaIluminada(grupo, posicaoDaJanelaX, altura + 0.95, profundidade * 0.25 + 0.37, false);
          }
          // jardim, cerca e árvores
          const quantidadeDeArbustos = [2, 5, 8][nivel - 1];
          for (let indice = 0; indice < quantidadeDeArbustos; indice++) criarArbusto(grupo, (indice % 2 ? 1 : -1) * (largura / 2 + 0.5), profundidade / 2 - 0.3 + Math.floor(indice / 2) * 0.8);
          if (nivel === 1) {
            criarTrechoDeCerca(grupo, larguraDoTerreno / 2 - 0.4, -1, larguraDoTerreno / 2 - 0.4, 2.5);
            criarCaixa(0.1, 1, 0.1, PALETA_DE_CORES.madeira, 2.8, 0.5, profundidadeDoTerreno / 2 - 0.8, grupo); criarCaixa(0.3, 0.25, 0.4, 0x2f6fb0, 2.8, 1.05, profundidadeDoTerreno / 2 - 0.8, grupo);
          } else criarTrechoDeCerca(grupo, -larguraDoTerreno / 2 + 0.4, -profundidadeDoTerreno / 2 + 1, -larguraDoTerreno / 2 + 0.4, profundidadeDoTerreno / 2 - 1);
          criarArvore(grupo, larguraDoTerreno / 2 - 1, -profundidadeDoTerreno / 2 + 1.2, 0.9);
          if (nivel === 3) {
            // ala dos fundos
            criarCaixa(2.8, altura, 3.2, 0xdcc08e, -largura * 0.15, altura / 2, -profundidade / 2 - 1, grupo);
            criarTelhado(grupo, 3.3, 3.5, 1.5, PALETA_DE_CORES.telhaCasa, -largura * 0.15, altura, -profundidade / 2 - 1);
            criarJanelaIluminada(grupo, -largura * 0.15 - 1.42, 1.2, -profundidade / 2 - 1, true);
            // lago de pedras
            criarCilindro(1.2, 1.2, 0.1, 0x9a9a90, 3.9, 0.12, 2.6, grupo, 18);
            criarCilindro(1, 1, 0.1, 0x4aa8c8, 3.9, 0.15, 2.6, grupo, 18);
            // pérgola
            for (const diferencaX of [-0.9, 0.9]) for (const diferencaZ of [-0.9, 0.9]) criarCaixa(0.12, 1.8, 0.12, 0x8a5a2a, 3.9 + diferencaX, 0.9, -2.6 + diferencaZ, grupo);
            for (let indice = 0; indice < 4; indice++) criarCaixa(2.2, 0.08, 0.12, 0xa06a35, 3.9, 1.85, -3.4 + indice * 0.55, grupo);
            criarArvore(grupo, -larguraDoTerreno / 2 + 1.2, -profundidadeDoTerreno / 2 + 1.2, 1);
            criarArvore(grupo, -larguraDoTerreno / 2 + 1, profundidadeDoTerreno / 2 - 1.5, 0.8);
          }
        },

        // N1 celeiro com janelas · N2 maior, com fardos · N3 silo e telheiro lateral
        celeiro(grupo, nivel) {
          const largura = [3.4, 3.8, 4.2][nivel - 1], profundidade = [3.8, 4.4, 4.8][nivel - 1], altura = [2.2, 2.4, 2.6][nivel - 1];
          const larguraDoTerreno = nivel === 3 ? 10.5 : 8;
          criarBaseDoTerreno(grupo, larguraDoTerreno, 7.5);
          const forma = new THREE.Shape();
          [[-largura / 2, 0], [largura / 2, 0], [largura / 2, altura], [largura * 0.3, altura + 1], [0, altura + 1.6], [-largura * 0.3, altura + 1], [-largura / 2, altura]].forEach(([posicaoX, posicaoY], indice) => indice ? forma.lineTo(posicaoX, posicaoY) : forma.moveTo(posicaoX, posicaoY));
          const corpo = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: profundidade, bevelEnabled: false }), material(0xc0392b));
          corpo.position.z = -profundidade / 2; corpo.castShadow = true; grupo.add(corpo);
          criarCaixa(largura + 0.1, 0.25, profundidade + 0.1, 0x6a7078, 0, 0.12, 0, grupo);
          // telhado de duas inclinações (gambrel)
          const topo = [[-largura / 2, altura], [-largura * 0.3, altura + 1], [0, altura + 1.6], [largura * 0.3, altura + 1], [largura / 2, altura]].map(([posicaoX, posicaoY]) => [posicaoX * 1.12, posicaoY]);
          for (let indice = 0; indice < 4; indice++) {
            const [xDoPontoA, yDoPontoA] = topo[indice], [xDoPontoB, yDoPontoB] = topo[indice + 1];
            criarCaixa(Math.hypot(xDoPontoB - xDoPontoA, yDoPontoB - yDoPontoA) + 0.05, 0.16, profundidade + 0.6, 0x4b5060, (xDoPontoA + xDoPontoB) / 2, (yDoPontoA + yDoPontoB) / 2 + 0.08, 0, grupo).rotation.z = Math.atan2(yDoPontoB - yDoPontoA, xDoPontoB - xDoPontoA);
          }
          for (const lado of [-1, 1]) criarCaixa(0.08, altura, 0.08, PALETA_DE_CORES.branco, lado * largura / 2, altura / 2, profundidade / 2 + 0.02, grupo);
          // portão com X e janela do sótão
          const alturaDoPortao = altura * 0.8;
          criarCaixa(1.6, alturaDoPortao, 0.1, PALETA_DE_CORES.branco, 0, alturaDoPortao / 2, profundidade / 2 + 0.03, grupo);
          criarCaixa(1.4, alturaDoPortao - 0.2, 0.12, 0xa82e22, 0, alturaDoPortao / 2, profundidade / 2 + 0.05, grupo);
          for (const lado of [-1, 1]) criarCaixa(0.06, Math.hypot(1.4, alturaDoPortao - 0.2), 0.14, PALETA_DE_CORES.branco, 0, alturaDoPortao / 2, profundidade / 2 + 0.06, grupo).rotation.z = lado * Math.atan(1.4 / (alturaDoPortao - 0.2));
          for (const lado of [-1, 1]) criarLampiaoDeParede(grupo, lado * (0.8 + (largura / 2 - 0.8) / 2), 1.65, profundidade / 2 + 0.04, 0);   // lampiões ao lado do portão
          criarCaixa(0.8, 0.8, 0.1, PALETA_DE_CORES.branco, 0, altura + 0.45, profundidade / 2 + 0.04, grupo);
          criarCaixa(0.6, 0.6, 0.12, 0x7a2a20, 0, altura + 0.45, profundidade / 2 + 0.05, grupo);

          if (nivel === 1) {
            for (const posicaoZ of [-0.8, 0.9]) { criarCaixa(0.1, 0.55, 0.45, PALETA_DE_CORES.branco, largura / 2 + 0.02, 1, posicaoZ, grupo); criarCaixa(0.14, 0.4, 0.3, PALETA_DE_CORES.vidro, largura / 2 + 0.02, 1, posicaoZ, grupo); }
            criarBarril(grupo, largura / 2 + 0.6, profundidade / 2 - 0.4);
            criarArbusto(grupo, largura / 2 + 0.5, 0.2, false);
          } else {
            criarFardoDeFeno(grupo, largura / 2 + 0.9, 0.25, 0.5); criarFardoDeFeno(grupo, largura / 2 + 0.9, 0.25, 1.2); criarFardoDeFeno(grupo, largura / 2 + 1, 0.75, 0.85);
            criarBarril(grupo, largura / 2 + 0.5, profundidade / 2 - 0.2); criarCaixote(grupo, largura / 2 + 1.2, -1.4);
          }
          if (nivel === 3) {
            // silo
            const escalaX = -largura / 2 - 1.1, senoDoAngulo = altura + 2.2;
            criarCilindro(0.85, 0.85, senoDoAngulo, 0xc0392b, escalaX, senoDoAngulo / 2, -0.5, grupo, 16);
            for (const posicaoY of [1.2, 2.6, 4]) criarCilindro(0.87, 0.87, 0.12, PALETA_DE_CORES.branco, escalaX, posicaoY, -0.5, grupo, 16);
            const cupula = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), material(0xc4c8cc));
            cupula.position.set(escalaX, senoDoAngulo, -0.5); grupo.add(cupula);
            // telheiro lateral com fardos
            criarCaixa(2.6, 0.14, profundidade * 0.8, 0x4b5060, largura / 2 + 1.2, altura * 0.62, 0.2, grupo).rotation.z = -0.18;
            for (const posicaoZ of [-1.5, 1.8]) criarCaixa(0.12, altura * 0.55, 0.12, 0xb98a55, largura / 2 + 2.4, altura * 0.275, posicaoZ, grupo);
            criarFardoDeFeno(grupo, largura / 2 + 1.2, 0.25, -0.6); criarFardoDeFeno(grupo, largura / 2 + 1.2, 0.25, 0.4); criarFardoDeFeno(grupo, largura / 2 + 1.3, 0.75, -0.1);
            criarArvore(grupo, larguraDoTerreno / 2 - 0.8, -2.5, 0.9);
          } else {
            criarArvore(grupo, -largura / 2 - 1.6, -profundidade / 2 + 0.8, 0.9);
            criarTrechoDeCerca(grupo, -larguraDoTerreno / 2 + 0.5, -1, -larguraDoTerreno / 2 + 0.5, 2.5);
          }
        },

        // N1 cercado com vaca · N2 vaca e ovelhas · N3 fazendinha cheia (dois abrigos e dois cochos)
        // Fazenda 8.4: o N3 ainda trazia o cata-vento de madeira da antiga "fazendinha" (de antes de o moinho de pedra virar uma
        // construção própria, na Mark 8.2); ele aparecia como um moinho dentro do cercado e foi retirado, com a sua área de colisão.
        curral(grupo, nivel, animacoesDestaArea) {
          const largura = [6, 7.2, 8.8][nivel - 1], profundidade = [5, 6, 7.2][nivel - 1];
          criarBaseDoTerreno(grupo, largura + 0.9, profundidade + 0.9, 0x7fc650);
          criarCercaSimples(grupo, largura, profundidade, { S: 1.6 });
          criarArvore(grupo, largura / 2 - 0.3, -profundidade / 2 - 0.6, 1);
          criarAbrigo(grupo, largura / 2 - 1.6, -profundidade / 2 + 1.4);
          criarCocho(grupo, -0.1, profundidade / 2 - 0.9);
          criarPlacaDeMadeira(grupo, -largura / 2 - 0.2, profundidade / 2 - 0.5);
          criarPosteDeLampiao(grupo, 1.6 + 1.3, profundidade / 2 + 0.32, Math.PI);                    // lampião ao lado do portão
          if (nivel === 3) {
            criarAbrigo(grupo, -largura / 2 + 1.6, -profundidade / 2 + 1.4);
            criarCocho(grupo, -2.4, profundidade / 2 - 0.9);
          }
          // ---- hitboxes: [centroX, centroZ, largura, profundidade] ----
          const retangulos = [
            [largura / 2 - 1.6, -profundidade / 2 + 1.4, 2.3, 1.9], // abrigo
            [-0.1, profundidade / 2 - 0.9, 1.6, 0.6],         // cocho
          ];
          if (nivel === 3) retangulos.push(
            [-largura / 2 + 1.6, -profundidade / 2 + 1.4, 2.3, 1.9], // segundo abrigo
            [-2.4, profundidade / 2 - 0.9, 1.6, 0.6]           // segundo cocho
          );
          const cercado = criarCercado(grupo, largura, profundidade, retangulos);
          const quantidadesPorTipo = { vaca: ANIMAIS_DAS_AREAS.curral.porNivel[nivel - 1] }; // ovelhas ficam em um cercado próprio
          for (const tipo in quantidadesPorTipo) for (let indice = 0; indice < quantidadesPorTipo[tipo]; indice++)
            criarAnimal(grupo, animacoesDestaArea, tipo, cercado);
        },

        // Ovelhal: cercado retangular regular com portão ao norte, abrigo e cochos dentro dos limites, só ovelhas.
        ovelhal(grupo, nivel, animacoesDestaArea) {
          const largura = [6, 7.5, 9][nivel - 1], profundidade = [5, 6.2, 7.5][nivel - 1];
          criarBaseDoTerreno(grupo, largura + 0.9, profundidade + 0.9, 0x9dce68);
          criarCercaRetangular(grupo, largura, profundidade, ['N']);
          criarPlacaDeMadeira(grupo, -largura / 2 - 0.7, profundidade / 2 - 0.5);
          criarPosteDeLampiao(grupo, 1.3, -profundidade / 2 - 0.32, Math.PI);                        // lampião ao lado do portão
          const abrigoX = largura / 2 - 1.5, abrigoZ = profundidade / 2 - 1.4;
          criarAbrigo(grupo, abrigoX, abrigoZ);
          criarCocho(grupo, -largura / 2 + 1.4, profundidade / 2 - 0.8);
          const criarRetangulo = (posicaoX, posicaoZ, larguraDoObstaculo, profundidadeDoObstaculo) => ({ minX: posicaoX - larguraDoObstaculo / 2, maxX: posicaoX + larguraDoObstaculo / 2, minZ: posicaoZ - profundidadeDoObstaculo / 2, maxZ: posicaoZ + profundidadeDoObstaculo / 2 });
          const obstaculos = [criarRetangulo(abrigoX, abrigoZ, 2.3, 1.9), criarRetangulo(-largura / 2 + 1.4, profundidade / 2 - 0.8, 1.8, 0.8)];
          if (nivel >= 2) { criarFardoDeFeno(grupo, -largura / 2 + 1.2, 0.25, -profundidade / 2 + 0.9); criarBarril(grupo, largura / 2 - 0.7, -profundidade / 2 + 0.8); obstaculos.push(criarRetangulo(-largura / 2 + 1.2, -profundidade / 2 + 0.9, 1, 0.8), criarRetangulo(largura / 2 - 0.7, -profundidade / 2 + 0.8, 0.8, 0.8)); }
          if (nivel === 3) { criarAbrigo(grupo, -largura / 2 + 1.5, -profundidade / 2 + 1.3); criarCocho(grupo, 0, profundidade / 2 - 0.8); obstaculos.push(criarRetangulo(-largura / 2 + 1.5, -profundidade / 2 + 1.3, 2.3, 1.9), criarRetangulo(0, profundidade / 2 - 0.8, 1.8, 0.8)); }
          const cercado = { limiteX: largura / 2 - 0.1, limiteZ: profundidade / 2 - 0.1, animais: [], obstaculos };
          for (let indice = 0; indice < ANIMAIS_DAS_AREAS.ovelhal.porNivel[nivel - 1]; indice++) criarAnimal(grupo, animacoesDestaArea, 'ovelha', cercado);
        },

        // Estábulo: edifício aberto na frente (baias, feno), de frente para o caminho (norte); portão na cerca norte.
        // O modelo é montado num grupo girado 180° (fundo do edifício ao sul), por isso as hitboxes são espelhadas.
        estabulo(grupo, nivel, animacoesDestaArea) {
          const largura = [7.6, 9, 10.4][nivel - 1], profundidade = [7.6, 8.4, 9.2][nivel - 1];
          const grupoVirado = new THREE.Group(); grupoVirado.rotation.y = Math.PI; grupo.add(grupoVirado);
          criarBaseDoTerreno(grupoVirado, largura + 1.2, profundidade + 1.2, 0x8fbd56);
          criarCercaRetangular(grupoVirado, largura, profundidade, ['S']);
          const larguraDoBlocoDeBaias = largura - 1.6, profundidadeDaBaia = 2.8, altura = 2.2, baias = [2, 3, 4][nivel - 1];
          const posicaoZDasBaias = -profundidade / 2 + 0.45 + profundidadeDaBaia / 2, zFrente = posicaoZDasBaias + profundidadeDaBaia / 2, parede = nivel === 1 ? 0x9b6738 : 0x87552f;
          criarCaixa(larguraDoBlocoDeBaias, altura, 0.18, parede, 0, altura / 2, posicaoZDasBaias - profundidadeDaBaia / 2 + 0.09, grupoVirado);
          for (const lado of [-1, 1]) criarCaixa(0.18, altura, profundidadeDaBaia, parede, lado * (larguraDoBlocoDeBaias / 2 - 0.09), altura / 2, posicaoZDasBaias, grupoVirado);
          criarTelhado(grupoVirado, profundidadeDaBaia + 1, larguraDoBlocoDeBaias + 0.8, 1.2, 0x9b3f2f, 0, altura, posicaoZDasBaias, Math.PI / 2);
          criarCaixa(larguraDoBlocoDeBaias, 0.2, 0.2, PALETA_DE_CORES.madeira, 0, altura - 0.1, zFrente, grupoVirado);
          for (let indiceDaBaia = 0; indiceDaBaia <= baias; indiceDaBaia++) criarCaixa(0.16, altura, 0.16, PALETA_DE_CORES.madeira, -larguraDoBlocoDeBaias / 2 + indiceDaBaia * larguraDoBlocoDeBaias / baias, altura / 2, zFrente, grupoVirado);
          for (let indiceDaBaia = 0; indiceDaBaia < baias; indiceDaBaia++) {
            const centroXDaBaia = -larguraDoBlocoDeBaias / 2 + (indiceDaBaia + 0.5) * larguraDoBlocoDeBaias / baias;
            if (indiceDaBaia) criarCaixa(0.1, 1.5, profundidadeDaBaia - 0.2, PALETA_DE_CORES.madeira, -larguraDoBlocoDeBaias / 2 + indiceDaBaia * larguraDoBlocoDeBaias / baias, 0.75, posicaoZDasBaias, grupoVirado);
            criarCaixa(larguraDoBlocoDeBaias / baias - 0.5, 0.7, 0.06, PALETA_DE_CORES.ripa, centroXDaBaia, 0.45, zFrente + 0.02, grupoVirado);
            criarFardoDeFeno(grupoVirado, centroXDaBaia, 0.25, posicaoZDasBaias - profundidadeDaBaia / 2 + 0.7);
          }
          for (const lado of [-1, 1]) { criarCaixa(0.1, 1.6, 0.1, PALETA_DE_CORES.madeira, lado * larguraDoBlocoDeBaias / 2, 0.8, zFrente + 0.7, grupoVirado); criarCabecaDeLampiao(grupoVirado, lado * larguraDoBlocoDeBaias / 2, 1.73, zFrente + 0.7, { escala: 0.9, brilhoNoChao: 3.4 }); } // lampiões nos mourões da frente
          criarPosteDeLampiao(grupoVirado, 1.3, profundidade / 2 + 0.35, Math.PI);                     // lampião ao lado do portão (lado do caminho)
          criarPlacaDeMadeira(grupoVirado, -largura / 2 - 0.7, profundidade / 2 - 0.5);
          criarCocho(grupoVirado, largura / 2 - 1.3, profundidade / 2 - 0.8);
          criarFardoDeFeno(grupoVirado, -largura / 2 + 1, 0.25, profundidade / 2 - 0.8);
          if (nivel >= 2) { criarFardoDeFeno(grupoVirado, -largura / 2 + 1, 0.75, profundidade / 2 - 0.8); criarBarril(grupoVirado, largura / 2 - 0.7, zFrente + 0.8); }
          if (nivel === 3) { criarCocho(grupoVirado, -1.9, profundidade / 2 - 0.8); criarFardoDeFeno(grupoVirado, -largura / 2 + 1.9, 0.25, profundidade / 2 - 0.8); } // cocho longe do portão
          // hitboxes no sistema do grupo g (modelo girado: x e z invertidos)
          const criarRetangulo = (posicaoX, posicaoZ, lado, ponto) => ({ minX: -posicaoX - lado / 2, maxX: -posicaoX + lado / 2, minZ: -posicaoZ - ponto / 2, maxZ: -posicaoZ + ponto / 2 });
          const obstaculos = [{ minX: -largura / 2, maxX: largura / 2, minZ: -(zFrente + 0.3), maxZ: profundidade / 2 }, criarRetangulo(largura / 2 - 1.3, profundidade / 2 - 0.8, 1.8, 0.8), criarRetangulo(-largura / 2 + 1.2, profundidade / 2 - 0.8, 1.6, 0.9)];
          if (nivel >= 2) obstaculos.push(criarRetangulo(largura / 2 - 0.7, zFrente + 0.8, 0.8, 0.8));
          if (nivel === 3) obstaculos.push(criarRetangulo(-1.9, profundidade / 2 - 0.8, 1.8, 0.8));
          const cercado = { limiteX: largura / 2 - 0.2, limiteZ: profundidade / 2 - 0.2, animais: [], obstaculos };
          for (let indice = 0; indice < ANIMAIS_DAS_AREAS.estabulo.porNivel[nivel - 1]; indice++) criarAnimal(grupo, animacoesDestaArea, 'cavalo', cercado);
        },

        // N1 galinheiro simples · N2 com poleiro e feno · N3 dois galinheiros
        galinheiro(grupo, nivel, animacoesDestaArea) {
          const largura = [5.5, 6.5, 7.5][nivel - 1], profundidade = [4.5, 5.2, 6][nivel - 1];
          criarBaseDoTerreno(grupo, largura + 0.9, profundidade + 0.9, 0x9ccf5a);
          criarCercaSimples(grupo, largura, profundidade, { S: 0.3 });
          criarPosteDeLampiao(grupo, 0.3 + 1.3, profundidade / 2 + 0.32, Math.PI);                    // lampião ao lado do portão
          criarPlacaDeMadeira(grupo, -largura / 2 - 0.2, profundidade / 2 - 0.5);
          criarArvore(grupo, largura / 2 + 0.7, -profundidade / 2 - 0.4, 0.9);
          for (const posicaoX of (nivel === 3 ? [-1.8, 1.8] : [0])) casinhaDeGalinha(grupo, posicaoX, -profundidade / 2 + 1);
          criarCocho(grupo, -largura / 2 + 1.2, profundidade / 2 - 0.8);
          criarBarril(grupo, largura / 2 - 0.6, profundidade / 2 - 0.6);
          if (nivel >= 2) {
            for (const diferencaZ of [-0.8, 0.8]) criarCaixa(0.1, 0.9, 0.1, PALETA_DE_CORES.madeira, -largura / 2 + 0.8, 0.45, diferencaZ, grupo); // poleiro
            criarCaixa(0.08, 0.08, 1.8, PALETA_DE_CORES.ripa, -largura / 2 + 0.8, 0.9, 0, grupo);
            criarFardoDeFeno(grupo, largura / 2 - 0.9, 0.25, 0.9);
          }

          // ---- hitboxes: [centroX, centroZ, largura, profundidade] ----
          const retangulos = [
            [largura / 2 - 1.6, -profundidade / 2 + 1.4, 2.3, 1.9], // abrigo
            [0.5, profundidade / 2 - 0.9, 1.6, 0.6],          // cocho
          ];
          if (nivel === 3) retangulos.push(
            [-largura / 2 + 1.6, -profundidade / 2 + 1.4, 2.3, 1.9], // segundo abrigo
            [-2.4, profundidade / 2 - 0.9, 1.6, 0.6],          // segundo cocho
            [-largura / 2 + 1, profundidade / 2 - 1.3, 1.1, 1.1]     // base do cata-vento
          );
          const cercado = criarCercado(grupo, largura, profundidade, retangulos);

          const quantidadesPorTipo = { galinha: [1, 3, 5][nivel - 1] };
          for (const tipo in quantidadesPorTipo) for (let indice = 0; indice < quantidadesPorTipo[tipo]; indice++)
            criarAnimal(grupo, animacoesDestaArea, tipo, cercado);
        },

        // N1 chiqueiro com poça de lama · N2 maior, com abrigo · N3 duas poças, feno e barril
        chiqueiro(grupo, nivel, animacoesDestaArea) {
          const largura = [5.5, 6.5, 7.5][nivel - 1], profundidade = [4.5, 5.2, 6][nivel - 1];
          criarBaseDoTerreno(grupo, largura + 0.9, profundidade + 0.9, 0x8fbf5a);
          criarCercaSimples(grupo, largura, profundidade, { S: 0.3 });
          criarPosteDeLampiao(grupo, 0.3 + 1.3, profundidade / 2 + 0.32, Math.PI);                    // lampião ao lado do portão
          criarPlacaDeMadeira(grupo, -largura / 2 - 0.2, profundidade / 2 - 0.5);
          criarArvore(grupo, largura / 2 + 0.7, -profundidade / 2 - 0.4, 0.9);
          criarCocho(grupo, -largura / 2 + 1.2, profundidade / 2 - 0.8);
          if (nivel === 3) { pocaDeLama(grupo, -1.5, 0.2, 1.3); pocaDeLama(grupo, 1.6, 0.6, 1.1); }
          else pocaDeLama(grupo, 0, 0.2, nivel === 1 ? 1.5 : 1.8);
          if (nivel >= 2) criarAbrigo(grupo, largura / 2 - 1.6, -profundidade / 2 + 1.4);
          if (nivel === 3) { criarBarril(grupo, largura / 2 - 0.6, profundidade / 2 - 0.6); criarFardoDeFeno(grupo, -largura / 2 + 1, 0.25, -profundidade / 2 + 0.8); }
          // ---- hitboxes: [centroX, centroZ, largura, profundidade] ----
          const retangulos = [
            [largura / 2 - 1.6, -profundidade / 2 + 1.4, 2.3, 1.9], // abrigo
            [0.5, profundidade / 2 - 0.9, 1.6, 0.6],          // cocho
          ];
          if (nivel === 3) retangulos.push(
            [-largura / 2 + 1.6, -profundidade / 2 + 1.4, 2.3, 1.9], // segundo abrigo
            [-2.4, profundidade / 2 - 0.9, 1.6, 0.6],          // segundo cocho
            [-largura / 2 + 1, profundidade / 2 - 1.3, 1.1, 1.1]     // base do cata-vento
          );
          const cercado = criarCercado(grupo, largura, profundidade, retangulos);

          const quantidadesPorTipo = { porco: [1, 1, 3][nivel - 1] };
          for (const tipo in quantidadesPorTipo) for (let indice = 0; indice < quantidadesPorTipo[tipo]; indice++)
            criarAnimal(grupo, animacoesDestaArea, tipo, cercado);
        },

        // ===== MARK 8.2 =====
        // Moinho de vento de pedra (no lugar da antiga plantação pequena, marcação azul). Lembra um farol: torre cônica de pedra
        // com faixas, porta em arco, janelas que acendem à noite, capuz de madeira e quatro pás que giram.
        // N1 torre baixa · N2 mais alta, com varanda e mais janelas · N3 a mais alta, contrafortes, lanterna envidraçada, bandeira e lampiões.
        moinho(grupo, nivel, animacoesDestaArea) {
          const altura = [6.4, 8.2, 10][nivel - 1], raioDaBase = [1.9, 2.15, 2.4][nivel - 1], raioDoTopo = raioDaBase * 0.68, comprimentoDasPas = [3.0, 3.7, 4.4][nivel - 1];
          const raioNaAltura = posicaoY => raioDaBase + (raioDoTopo - raioDaBase) * Math.max(0, Math.min(1, (posicaoY - 0.5) / altura));
          criarBaseDoTerreno(grupo, 7.8, 7.2, 0x9dce68);
          criarCilindro(raioDaBase + 0.15, raioDaBase + 0.25, 0.5, 0x8d877b, 0, 0.25, 0, grupo, 16);                   // embasamento (Fazenda 8.4: antes 0,4–0,5 além da torre, uma aba larga demais)
          const torre = new THREE.Mesh(new THREE.CylinderGeometry(raioDoTopo, raioDaBase, altura, 16), obterMaterialDaPedraDoMoinho());
          torre.position.y = 0.5 + altura / 2; torre.castShadow = torre.receiveShadow = true; grupo.add(torre);
          const quantidadeDeFaixas = nivel + 1;                                                                           // faixas de pedra mais escura
          for (let indice = 1; indice <= quantidadeDeFaixas; indice++) {
            const posicaoY = 0.5 + altura * indice / (quantidadeDeFaixas + 1), faixa = new THREE.Mesh(new THREE.TorusGeometry(raioNaAltura(posicaoY) + 0.03, 0.09, 6, 28), material(0x958d7e));
            faixa.rotation.x = Math.PI / 2; faixa.position.y = posicaoY; grupo.add(faixa);
          }
          // porta em arco na frente (+z, voltada para a estrada)
          const frenteDaPorta = raioNaAltura(1.2) - 0.06;
          criarCaixa(0.95, 1.45, 0.3, 0x5c3a1e, 0, 1.22, frenteDaPorta, grupo);
          const arco = new THREE.Mesh(new THREE.CylinderGeometry(0.475, 0.475, 0.3, 14, 1, false, 0, Math.PI), material(0x5c3a1e)); arco.rotation.set(Math.PI / 2, Math.PI / 2, 0); arco.position.set(0, 1.95, frenteDaPorta); grupo.add(arco);
          criarCaixa(1.25, 0.16, 0.42, 0x8d877b, 0, 0.56, frenteDaPorta + 0.15, grupo);                                  // degrau
          // janelas (vidro que acende à noite, igual ao da casa), distribuídas em espiral
          const quantidadeDeJanelas = [3, 5, 7][nivel - 1];
          for (let indice = 0; indice < quantidadeDeJanelas; indice++) {
            const posicaoY = 2.6 + indice * (altura - 3.2) / Math.max(1, quantidadeDeJanelas - 1) * 0.92, angulo = 0.9 + indice * 2.3, raio = raioNaAltura(posicaoY);
            const janela = new THREE.Group(); janela.position.set(Math.sin(angulo) * (raio - 0.05), posicaoY, Math.cos(angulo) * (raio - 0.05)); janela.rotation.y = angulo; grupo.add(janela);
            criarCaixa(0.56, 0.78, 0.16, 0x8d877b, 0, 0, 0, janela);
            const vidro = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.56, 0.2), materialDaJanelaAcesa); janela.add(vidro);
          }
          const topoDaTorre = 0.5 + altura;
          if (nivel >= 2) {                                                                                               // varanda em volta
            const alturaDaVaranda = 0.5 + altura * 0.8, raioDaVaranda = raioNaAltura(alturaDaVaranda) + 0.6;
            criarCilindro(raioDaVaranda, raioDaVaranda - 0.1, 0.14, 0x7a6a58, 0, alturaDaVaranda, 0, grupo, 20);
            for (let indice = 0; indice < 16; indice++) { const angulo = indice / 16 * Math.PI * 2; criarCaixa(0.06, 0.55, 0.06, 0x3a2f28, Math.sin(angulo) * (raioDaVaranda - 0.08), alturaDaVaranda + 0.33, Math.cos(angulo) * (raioDaVaranda - 0.08), grupo); }
            const corrimao = new THREE.Mesh(new THREE.TorusGeometry(raioDaVaranda - 0.08, 0.035, 5, 32), material(0x3a2f28)); corrimao.rotation.x = Math.PI / 2; corrimao.position.y = alturaDaVaranda + 0.6; grupo.add(corrimao);
          }
          if (nivel === 3) {
            // Contrafortes. Fazenda 8.4: eram caixas retas (0,6 × 2,75 × 1,3) de pedra mais clara, que pareciam placas soltas ao
            // lado da torre. Agora são cunhas no raio da torre: pé largo no chão, face externa inclinada até encostar na torre logo
            // abaixo da primeira faixa, na mesma pedra do embasamento. Perfil em (raio, altura), extrudado na largura.
            const alturaDoContraforte = 2.35, larguraDoContraforte = 0.55;
            const perfilDoContraforte = new THREE.Shape([
              new THREE.Vector2(raioDaBase - 0.3, 0.03), new THREE.Vector2(raioDaBase + 0.8, 0.03), new THREE.Vector2(raioDaBase + 0.8, 0.4),
              new THREE.Vector2(raioNaAltura(alturaDoContraforte) + 0.1, alturaDoContraforte), new THREE.Vector2(raioNaAltura(alturaDoContraforte) - 0.3, alturaDoContraforte),
            ]);
            const geometriaDoContraforte = new THREE.ExtrudeGeometry(perfilDoContraforte, { depth: larguraDoContraforte, bevelEnabled: false });
            geometriaDoContraforte.translate(0, 0, -larguraDoContraforte / 2);
            for (let indice = 0; indice < 4; indice++) {
              const angulo = Math.PI / 4 + indice * Math.PI / 2, contraforte = new THREE.Mesh(geometriaDoContraforte, material(0x8d877b));
              contraforte.rotation.y = angulo - Math.PI / 2;                                                            // o eixo x do perfil aponta para fora, na direção do ângulo
              contraforte.castShadow = contraforte.receiveShadow = true; grupo.add(contraforte);
            }
            const lanterna = new THREE.Mesh(new THREE.CylinderGeometry(raioDoTopo - 0.05, raioDoTopo - 0.05, 0.55, 16), materialDaJanelaAcesa);  // "farol": anel envidraçado
            lanterna.position.y = topoDaTorre + 0.28; grupo.add(lanterna);
            for (const lado of [-1, 1]) criarLampiaoDeParede(grupo, lado * 0.85, 2.0, raioNaAltura(2.0) - 0.08, 0, 2.6);
          }
          const alturaDoAnelDaLanterna = nivel === 3 ? 0.55 : 0;
          const capuz = new THREE.Mesh(new THREE.ConeGeometry(raioDoTopo + 0.4, 1.6 + nivel * 0.25, 16), material(0x6b4a2e));
          capuz.position.y = topoDaTorre + alturaDoAnelDaLanterna + (1.6 + nivel * 0.25) / 2; capuz.castShadow = true; grupo.add(capuz);
          criarEsfera(0.16, 0xc9a84e, 0, topoDaTorre + alturaDoAnelDaLanterna + 1.6 + nivel * 0.25 + 0.05, 0, grupo);
          if (nivel === 3) { criarCaixa(0.05, 1.2, 0.05, 0x3a2f28, 0, topoDaTorre + 0.55 + 2.35 + 0.6, 0, grupo); criarCaixa(0.6, 0.38, 0.02, 0xc0392b, 0.32, topoDaTorre + 0.55 + 2.35 + 1.0, 0, grupo); }
          // eixo, cubo e quatro pás (treliça de madeira + lona clara) girando no plano da frente
          const alturaDoEixo = topoDaTorre + alturaDoAnelDaLanterna + 0.35, rotor = new THREE.Group(); rotor.position.set(0, alturaDoEixo, raioDoTopo + 0.85); rotor.userData.animado = true; grupo.add(rotor);
          const eixo = criarCilindro(0.12, 0.12, 1.0, 0x4a3a2c, 0, alturaDoEixo, raioDoTopo + 0.35, grupo, 8); eixo.rotation.x = Math.PI / 2;
          criarEsfera(0.26, 0x4a3a2c, 0, 0, 0, rotor);
          for (let indice = 0; indice < 4; indice++) {
            const pa = new THREE.Group(); pa.rotation.z = indice * Math.PI / 2; rotor.add(pa);
            criarCaixa(0.12, comprimentoDasPas, 0.1, 0x6b4a2e, 0, comprimentoDasPas / 2 + 0.15, 0, pa);                    // vara
            for (let barra = 1; barra <= Math.floor(comprimentoDasPas / 0.45); barra++) criarCaixa(0.78, 0.04, 0.05, 0x7a5636, 0.39, 0.3 + barra * 0.45 - 0.2, 0, pa);   // treliça
            criarCaixa(0.66, comprimentoDasPas * 0.78, 0.025, 0xefe6cf, 0.42, 0.35 + comprimentoDasPas * 0.42, -0.04, pa);   // lona
          }
          const velocidadeDasPas = [0.55, 0.75, 0.95][nivel - 1];
          animacoesDestaArea.push((tempo, segundosDesdeUltimoFrame) => { rotor.rotation.z -= segundosDesdeUltimoFrame * velocidadeDasPas; });
          criarPosteDeLampiao(grupo, 1.4, 3.2);
          criarPlacaDeMadeira(grupo, -3.2, 2.9);
        },

        // Nova plantação (marcação vermelha, em frente à Grande): mesmas dimensões e mesmo sistema de canteiros da Grande.
        novaPlantacao(grupo, nivel) { construirPlantacaoComCanteiros(grupo, nivel, 'novaPlantacao', 'oeste', true); },

        // Mina (marcação roxa): depósito ao lado do fim da estrada oeste, trilhos até a caverna, madeiramento da entrada e o
        // carrinho (movido pela seção 28). O grupo desta área fica no depósito; a caverna em si é cenário (seção 11).
        // N1 madeiramento simples e carrinho de madeira · N2 escoras, lampiões, galpão e carrinho de ferro · N3 placa, guindaste e carrinho reforçado.
        mina(grupo, nivel, animacoesDestaArea) {
          const origem = new THREE.Vector3(grupo.position.x, 0, grupo.position.z), local = pontoDoMundo => pontoDoMundo.clone().sub(origem);
          const { inicio, boca, direcaoParaDentro, giroDaEntrada } = MINA_GEOMETRIA, giroDosTrilhos = Math.atan2(direcaoParaDentro.x, direcaoParaDentro.z);
          const lateral = new THREE.Vector3(direcaoParaDentro.z, 0, -direcaoParaDentro.x);
          // trilhos (até 1,6 dentro da boca; dali em diante é só escuro) e dormentes instanciados
          const fimVisivel = boca.clone().addScaledVector(direcaoParaDentro, 1.6), comprimentoVisivel = inicio.distanceTo(fimVisivel), meio = local(inicio.clone().lerp(fimVisivel, 0.5));
          for (const lado of [-1, 1]) { const trilho = criarCaixa(0.08, 0.1, comprimentoVisivel, 0x5f6670, meio.x + lateral.x * lado * 0.42, 0.13, meio.z + lateral.z * lado * 0.42, grupo); trilho.rotation.y = giroDosTrilhos; }
          const dormentes = [], objetoAuxiliar = new THREE.Object3D();
          for (let distancia = 0.2; distancia < comprimentoVisivel; distancia += 0.7) dormentes.push(local(inicio.clone().addScaledVector(direcaoParaDentro, distancia)));
          const malhaDosDormentes = new THREE.InstancedMesh(new THREE.BoxGeometry(1.25, 0.08, 0.24), material(0x6b4a2e), dormentes.length);
          dormentes.forEach((ponto, indice) => { objetoAuxiliar.position.set(ponto.x, 0.04, ponto.z); objetoAuxiliar.rotation.set(0, giroDosTrilhos, 0); objetoAuxiliar.updateMatrix(); malhaDosDormentes.setMatrixAt(indice, objetoAuxiliar.matrix); });
          malhaDosDormentes.instanceMatrix.needsUpdate = true; malhaDosDormentes.receiveShadow = true; grupo.add(malhaDosDormentes);
          // depósito: plataforma, batente no fim dos trilhos, pilha de minério e placa
          const inicioLocal = local(inicio), atras = inicioLocal.clone().addScaledVector(direcaoParaDentro, -0.7);
          criarBaseDoTerreno(grupo, 5.2, 4.4, 0xa58a62);
          const batente = criarCaixa(1.3, 0.35, 0.2, 0x7a2f1e, atras.x, 0.42, atras.z, grupo); batente.rotation.y = giroDosTrilhos;
          for (const lado of [-1, 1]) criarCaixa(0.16, 0.6, 0.16, 0x5c3a1e, atras.x + lateral.x * lado * 0.55, 0.3, atras.z + lateral.z * lado * 0.55, grupo);
          const plataforma = inicioLocal.clone().addScaledVector(lateral, 1.6).addScaledVector(direcaoParaDentro, 0.6);
          const deck = criarCaixa(1.6, 0.3, 2.4, 0x8a6a45, plataforma.x, 0.15, plataforma.z, grupo); deck.rotation.y = giroDosTrilhos;
          const pilha = inicioLocal.clone().addScaledVector(lateral, -1.6), CORES_DO_MINERIO = [0x6e6e6e, 0x8a8a8a, 0xf2c14e, 0x4fa3e0, 0x9a6b4a];
          for (let indice = 0; indice < [5, 8, 12][nivel - 1]; indice++) {
            const angulo = indice * 2.4, raio = 0.15 + (indice % 4) * 0.18, pedra = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + (indice % 3) * 0.05, 0), material(CORES_DO_MINERIO[indice % CORES_DO_MINERIO.length]));
            pedra.position.set(pilha.x + Math.cos(angulo) * raio, 0.15 + (indice < 4 ? 0.15 : 0), pilha.z + Math.sin(angulo) * raio); pedra.castShadow = true; grupo.add(pedra);
          }
          criarPlacaDeMadeira(grupo, plataforma.x + lateral.x * 1.2, plataforma.z + lateral.z * 1.2 + 0.8);
          criarPosteDeLampiao(grupo, inicioLocal.x - lateral.x * 1.1 - direcaoParaDentro.x * 1.2, inicioLocal.z - lateral.z * 1.1 - direcaoParaDentro.z * 1.2);
          if (nivel >= 2) {                                                                                          // galpão sobre a plataforma
            const galpao = new THREE.Group(); galpao.position.set(plataforma.x, 0, plataforma.z); galpao.rotation.y = giroDosTrilhos; grupo.add(galpao);
            for (const [deslocamentoX, deslocamentoZ] of [[-0.7, -1.1], [0.7, -1.1], [-0.7, 1.1], [0.7, 1.1]]) criarCaixa(0.12, 2.0, 0.12, 0x5c3a1e, deslocamentoX, 1.25, deslocamentoZ, galpao);
            criarCaixa(1.9, 0.1, 2.7, 0x7a2f1e, 0, 2.3, 0, galpao).rotation.z = 0.12;
          }
          if (nivel === 3) {                                                                                         // guindaste de carga
            const guindaste = new THREE.Group(); guindaste.position.set(pilha.x - direcaoParaDentro.x * 1.4, 0, pilha.z - direcaoParaDentro.z * 1.4); grupo.add(guindaste);
            criarCaixa(0.18, 2.8, 0.18, 0x5c3a1e, 0, 1.4, 0, guindaste); const braco = criarCaixa(2.2, 0.14, 0.14, 0x5c3a1e, 0.9, 2.75, 0, guindaste);
            braco.rotation.y = giroDosTrilhos; criarCaixa(0.03, 0.9, 0.03, 0x2a2a2a, 1.8, 2.25, 0, guindaste); criarCaixa(0.3, 0.12, 0.3, 0x3a3a3a, 1.8, 1.75, 0, guindaste);
          }
          // madeiramento da entrada da caverna (pórtico com escoras), na boca, virado para o depósito
          const portico = new THREE.Group(); portico.position.copy(local(boca)); portico.rotation.y = giroDaEntrada; grupo.add(portico);
          for (const lado of [-1, 1]) criarCaixa(0.24, 2.75, 0.24, 0x6b4a2e, lado * 1.5, 1.37, 0.2, portico);
          criarCaixa(3.4, 0.26, 0.3, 0x6b4a2e, 0, 2.82, 0.2, portico);
          if (nivel >= 2) {
            for (const lado of [-1, 1]) { criarCaixa(0.12, 1.1, 0.12, 0x5c3a1e, lado * 1.15, 2.4, 0.22, portico).rotation.z = lado * 0.8; criarCabecaDeLampiao(portico, lado * 1.5, 2.25, 0.5, { escala: 0.85, brilhoNoChao: 2.6, alturaDoChao: 0.02 }); }
          }
          if (nivel === 3) {
            const placa = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.08), new THREE.MeshLambertMaterial({ map: criarTexturaDeTexto('⛏ MINA', '#f2dfb4', '#5c3a1e') }));
            placa.position.set(0, 3.25, 0.36); portico.add(placa);
          }
          // Mark 8.3 — evolução visual pontual da entrada da mina. Coordenadas do pórtico: x lateral, z para fora (rumo ao
          // depósito), face da rocha em z = 0. Os trilhos passam em x = ±0,42: nada é colocado no caminho do carrinho.
          if (nivel >= 2) {
            for (const lado of [-1, 1]) {
              criarCaixa(0.9, 1.1, 1.6, 0x8a8f96, lado * 2.15, 0.55, 0.6, portico);               // muretas de pedra ladeando a boca
              criarCaixa(1.0, 0.12, 1.7, 0x6f747b, lado * 2.15, 1.16, 0.6, portico);              // coroamento das muretas
              criarCaixa(0.2, 3.0, 0.2, 0x5c3a1e, lado * 1.75, 1.5, 1.7, portico);                // esteios do alpendre
            }
            criarCaixa(4.0, 0.12, 1.9, 0x7a2f1e, 0, 3.12, 0.95, portico).rotation.x = -0.12;      // alpendre de tábuas sobre a entrada
            for (const posicaoX of [-1.5, -0.5, 0.5, 1.5]) criarCaixa(0.1, 0.1, 1.9, 0x5c3a1e, posicaoX, 3.02, 0.95, portico);   // caibros
            for (const [posicaoX, giro] of [[2.75, 0.3], [2.98, -0.2]]) {                           // picaretas encostadas na mureta
              criarCaixa(0.06, 1.1, 0.06, 0x8a5a2a, posicaoX, 0.6, 1.5, portico).rotation.z = giro;
              criarCaixa(0.5, 0.08, 0.08, 0x6f7680, posicaoX - Math.sin(giro) * 0.5, 1.12, 1.5, portico).rotation.z = giro;
            }
            criarCaixote(portico, -2.9, 1.7); criarCaixote(portico, -2.75, 2.4); criarBarril(portico, -3.4, 2.9);
          }
          if (nivel === 3) {
            const castelete = new THREE.Group(); castelete.position.set(4.4, 0, 2.1); portico.add(castelete);   // castelete: torre de madeira com roldana
            for (const [posicaoX, posicaoZ] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const perna = criarCaixa(0.16, 4.6, 0.16, 0x5c3a1e, posicaoX * 0.52, 2.25, posicaoZ * 0.52, castelete); perna.rotation.set(posicaoZ * 0.08, 0, -posicaoX * 0.08); }
            for (const alturaDaTravessa of [1.4, 2.8]) for (const lado of [-1, 1]) { criarCaixa(1.3, 0.1, 0.1, 0x6b4a2e, 0, alturaDaTravessa, lado * 0.5, castelete); criarCaixa(0.1, 0.1, 1.3, 0x6b4a2e, lado * 0.5, alturaDaTravessa, 0, castelete); }
            criarCaixa(1.3, 0.14, 1.3, 0x5c3a1e, 0, 4.55, 0, castelete);
            const roldana = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.07, 6, 16), material(0x3a3a3a)); roldana.position.set(0, 5.2, 0); roldana.castShadow = true; castelete.add(roldana);
            criarCaixa(0.05, 0.9, 0.05, 0x2a2a2a, 0.55, 4.75, 0, castelete);                          // cabo da roldana
            criarCaixa(0.6, 0.12, 2.6, 0x7a5636, 3.3, 1.2, 2.3, portico).rotation.x = 0.35;           // calha de minério inclinada
            criarCaixa(0.05, 1.5, 0.05, 0x3a2f28, -2.15, 1.95, 0.6, portico); criarCaixa(0.55, 0.32, 0.02, 0xf2c14e, -1.85, 2.5, 0.6, portico);   // bandeira sobre a mureta
            criarCabecaDeLampiao(portico, 0, 2.92, 1.75, { escala: 0.9, brilhoNoChao: 3, alturaDoChao: 0.02 });   // lampião pendurado no alpendre
          }
          // carrinho: chassi, caçamba (madeira → ferro → reforçada), 4 rodas nos trilhos e a carga de minério (visível só quando volta cheio)
          const carrinho = new THREE.Group(); carrinho.userData.nome = 'carrinho-da-mina'; carrinho.rotation.y = giroDosTrilhos; grupo.add(carrinho);
          const corDaCacamba = [0x8a5a2a, 0x6f7680, 0x5d6b78][nivel - 1];
          criarCaixa(0.92, 0.12, 1.3, 0x2f2f33, 0, 0.42, 0, carrinho);
          criarCaixa(0.92, 0.08, 1.2, corDaCacamba, 0, 0.52, 0, carrinho);
          for (const [larguraDaParede, profundidadeDaParede, deslocamentoX, deslocamentoZ] of [[0.92, 0.07, 0, -0.6], [0.92, 0.07, 0, 0.6], [0.07, 1.2, -0.45, 0], [0.07, 1.2, 0.45, 0]])
            criarCaixa(larguraDaParede, 0.5, profundidadeDaParede, corDaCacamba, deslocamentoX, 0.8, deslocamentoZ, carrinho);
          if (nivel === 3) for (const deslocamentoZ of [-0.61, 0.61]) criarCaixa(0.96, 0.06, 0.05, 0xc9a84e, 0, 1.03, deslocamentoZ, carrinho);
          const rodas = [];
          for (const lado of [-1, 1]) for (const deslocamentoZ of [-0.42, 0.42]) { const roda = criarCilindro(0.17, 0.17, 0.08, 0x2a2a2a, lado * 0.42, 0.34, deslocamentoZ, carrinho, 10); roda.rotation.z = Math.PI / 2; rodas.push(roda); }
          const carga = new THREE.Group(); carrinho.add(carga);
          for (let indice = 0; indice < 9; indice++) { const pedra = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), material(CORES_DO_MINERIO[indice % CORES_DO_MINERIO.length])); pedra.position.set(((indice % 3) - 1) * 0.26, 1.02 + (indice === 4 ? 0.12 : 0), (Math.floor(indice / 3) - 1) * 0.32); carga.add(pedra); }
          carrinho.position.set(inicioLocal.x, 0, inicioLocal.z);
          // materiais próprios do carrinho (cópias), para ele escurecer ao entrar na caverna sem afetar outros objetos
          const materiaisDoCarrinho = new Map();
          carrinho.traverse(objeto => { if (objeto.isMesh) { if (!materiaisDoCarrinho.has(objeto.material)) materiaisDoCarrinho.set(objeto.material, objeto.material.clone()); objeto.material = materiaisDoCarrinho.get(objeto.material); } });
          carrinhoDaMina = { grupo: carrinho, carga, rodas, origem, materiais: [...materiaisDoCarrinho.values()].map(materialDaPeca => [materialDaPeca, materialDaPeca.color.clone()]), claridadeAplicada: 1 };
        },

        // N1 reboque e forcado · N2 trator vermelho com reboque e grade · N3 trator verde, arado, fardos e caixa-d'água
        maquinario(grupo, nivel, animacoesDestaArea) {
          const larguraDoTerreno = nivel === 3 ? 10 : 8, profundidadeDoTerreno = nivel === 3 ? 8 : 6.5;
          criarBaseDoTerreno(grupo, larguraDoTerreno, profundidadeDoTerreno);
          criarCaixa(larguraDoTerreno - 2.5, 0.04, profundidadeDoTerreno - 2.5, 0xd6a05a, 0, 0.1, 0, grupo);
          criarPedra(grupo, -larguraDoTerreno / 2 + 0.8, profundidadeDoTerreno / 2 - 0.8, 0.45); criarPedra(grupo, larguraDoTerreno / 2 - 0.9, -profundidadeDoTerreno / 2 + 0.9, 0.5); criarPedra(grupo, larguraDoTerreno / 2 - 1.2, profundidadeDoTerreno / 2 - 1, 0.3);
          criarPosteDeLampiao(grupo, larguraDoTerreno / 2 - 0.45, profundidadeDoTerreno / 2 - 0.45, Math.PI);   // lampião no canto do pátio
          if (nivel === 1) {
            criarReboque(grupo, 0, 0.2, 0.5);
            criarCaixa(0.06, 1.9, 0.06, PALETA_DE_CORES.madeira, 2.2, 0.95, 0.8, grupo);
            criarCaixa(0.45, 0.05, 0.05, 0x666666, 2.2, 0.15, 0.8, grupo);
            for (const diferencaX of [-0.2, 0, 0.2]) criarCaixa(0.04, 0.4, 0.04, 0x666666, 2.2 + diferencaX, 0.25, 0.8, grupo);
            criarCaixote(grupo, 2.3, -1.5);
            criarArvore(grupo, -2.4, -profundidadeDoTerreno / 2 + 0.8, 0.9);
            criarArbusto(grupo, -larguraDoTerreno / 2 + 0.9, -0.5, false);
          } else {
            const cor = nivel === 2 ? 0xd03a2a : 0x3f9a35;
            const trator = criarTrator(grupo, nivel === 2 ? -1.4 : -2, nivel === 2 ? 0.4 : 0.3, nivel === 2 ? 1.05 : 1.15, cor, nivel === 3 ? 0xe8c230 : null);
            trator.rotation.y = 0.5;
            animacoesDestaArea.push(tempo => { trator.position.y = Math.sin(tempo * 40) * 0.01; });
            if (nivel === 2) {
              criarReboque(grupo, 2.3, -0.8, 0.3);
              criarArado(grupo, 0.2, -2, 0.1, 0x7a5a3a);
              criarArvore(grupo, larguraDoTerreno / 2 - 0.9, -profundidadeDoTerreno / 2 + 0.8, 0.9);
              criarArbusto(grupo, -larguraDoTerreno / 2 + 0.8, -profundidadeDoTerreno / 2 + 0.8, false);
            } else {
              criarArado(grupo, 1.3, 0.2, -0.3, 0x2f7a30);
              criarFardoDeFeno(grupo, -1.3, 0.25, 2.8); criarFardoDeFeno(grupo, -0.4, 0.25, 2.8); criarFardoDeFeno(grupo, -0.9, 0.75, 2.8);
              // caixa-d'água em torre
              for (const diferencaX of [-0.5, 0.5]) for (const diferencaZ of [-0.5, 0.5]) criarCaixa(0.1, 2.2, 0.1, PALETA_DE_CORES.madeira, 3.6 + diferencaX, 1.1, -2.3 + diferencaZ, grupo);
              criarCilindro(0.65, 0.65, 1.1, 0x6f9a8a, 3.6, 2.7, -2.3, grupo, 14);
              criarCilindro(0.05, 0.67, 0.4, 0x6f9a8a, 3.6, 3.4, -2.3, grupo, 14);
              // colmeia e cerca
              criarCaixa(0.6, 0.35, 0.6, 0xc9a24a, 0.4, 0.4, -3, grupo); criarCaixa(0.6, 0.35, 0.6, 0xb08a3a, 0.4, 0.75, -3, grupo); criarCaixa(0.7, 0.08, 0.7, 0x8a5a2a, 0.4, 0.95, -3, grupo);
              criarTrechoDeCerca(grupo, 2.2, -3.4, 4.6, -3.4); criarTrechoDeCerca(grupo, 4.6, -3.4, 4.6, -1);
              criarArvore(grupo, -larguraDoTerreno / 2 + 1.3, -profundidadeDoTerreno / 2 + 1, 1);
            }
          }
        },

        // N1 terra preparada · N2 mudas · N3 milharal com espantalho
        // Ponte sobre o rio: tabuleiro reto sobre vigas, apoios de pedra nas margens, rampas e corrimãos simétricos.
        // Eixo ao longo de X; o rio corre ao longo de Z neste trecho.
        ponte(grupo, nivel, animacoesDestaArea) {
          const comprimento = [7, 7.6, 8.2][nivel - 1], rampa = 1.3, alturaDoCentro = 0.5, profundidade = [2.6, 2.9, 3.2][nivel - 1];
          const corDaMadeira = nivel === 3 ? 0x5a3f2a : 0x68452c, pedraBase = 0x7a7c78;
          const quantidadeDeTabuas = Math.round(comprimento / 0.4);
          for (let indice = 0; indice < quantidadeDeTabuas; indice++) criarCaixa(comprimento / quantidadeDeTabuas - 0.04, 0.1, profundidade, [0xb78049, 0xc18b52, 0xa97443][indice % 3], -comprimento / 2 + (indice + 0.5) * comprimento / quantidadeDeTabuas, alturaDoCentro - 0.05, 0, grupo);
          for (const posicaoZ of [-profundidade / 2 + 0.25, profundidade / 2 - 0.25]) criarCaixa(comprimento, 0.2, 0.22, 0x5a3b25, 0, alturaDoCentro - 0.2, posicaoZ, grupo); // vigas
          for (const lado of [-1, 1]) {
            criarCaixa(0.8, alturaDoCentro - 0.1, profundidade + 0.2, pedraBase, lado * (comprimento / 2 - 0.4), (alturaDoCentro - 0.1) / 2, 0, grupo);              // apoio de pedra na margem
            const angulo = Math.atan(alturaDoCentro / rampa);
            const tabuaDaRampa = criarCaixa(Math.hypot(rampa, alturaDoCentro), 0.1, profundidade, 0xa97443, lado * (comprimento / 2 + rampa / 2), alturaDoCentro / 2 - 0.05, 0, grupo);
            tabuaDaRampa.rotation.z = -lado * angulo;                                                                              // rampa até o chão
          }
          if (nivel >= 2) for (const posicaoX of [-1.1, 1.1]) criarCilindro(0.2, 0.2, alturaDoCentro - 0.1, 0x5a3b25, posicaoX, (alturaDoCentro - 0.1) / 2, 0, grupo, 8); // pilares na água
          const quantidadeDePostes = Math.round(comprimento / 1.2);
          for (const posicaoZ of [-profundidade / 2 + 0.1, profundidade / 2 - 0.1]) {
            for (let indice = 0; indice <= quantidadeDePostes; indice++) criarCaixa(0.13, 0.85, 0.13, corDaMadeira, -comprimento / 2 + indice * comprimento / quantidadeDePostes, alturaDoCentro + 0.425, posicaoZ, grupo);
            criarCaixa(comprimento, 0.1, 0.1, nivel === 3 ? 0x8a5a2a : 0x9b6c42, 0, alturaDoCentro + 0.82, posicaoZ, grupo);
            criarCaixa(comprimento, 0.07, 0.07, corDaMadeira, 0, alturaDoCentro + 0.45, posicaoZ, grupo);
            for (const posicaoX of [-comprimento / 2, comprimento / 2]) if (nivel === 3 || Math.sign(posicaoX) === Math.sign(posicaoZ))   // sem mancha no chão: fica sobre a água
              criarCabecaDeLampiao(grupo, posicaoX, alturaDoCentro + 1.04, posicaoZ, { escala: 0.75 });
          }
          if (nivel === 3) for (const lado of [-1, 1]) criarCaixa(0.35, 0.35, profundidade + 0.5, pedraBase, lado * (comprimento / 2 + 0.2), 0.18, 0, grupo);
        },

        // Plantação cercada: no nível 1 só canteiros de terra arada; nos níveis seguintes recebe plantas (folhas
        // e frutos).
        // (Mark 8.2: a área "plantacao" foi substituída pelo moinho; este construtor ficou guardado para reaproveitar o modelo.)
        plantacao(grupo, nivel, animacoesDestaArea) {
          const largura = 7.4, profundidade = 6.4;
          criarBaseDoTerreno(grupo, largura + 0.9, profundidade + 0.9, 0x7fc650);
          criarCercaSimples(grupo, largura, profundidade, { S: 0 });
          criarCaixa(largura - 1, 0.1, profundidade - 1, 0x6b4226, 0, 0.11, 0, grupo);
          criarPlacaDeMadeira(grupo, -largura / 2 - 0.2, -profundidade / 2 + 0.5);
          criarArvore(grupo, largura / 2 - 0.2, -profundidade / 2 - 0.7, 1);
          criarBarril(grupo, largura / 2 - 0.1, profundidade / 2 + 0.3); criarCaixote(grupo, -largura / 2 + 0.4, profundidade / 2 + 0.35);
          criarPosteDeLampiao(grupo, 1.3, profundidade / 2 + 0.35, Math.PI);                          // lampião ao lado do portão

          if (nivel === 1) { // canteiros arados
            for (let indice = 0; indice < 4; indice++) for (let indiceInterno = 0; indiceInterno < 4; indiceInterno++) criarCaixa(1.4, 0.07, 1.25, (indice + indiceInterno) % 2 ? 0x7a4a28 : 0x6b3f20, (indice - 1.5) * 1.5, 0.18, (indiceInterno - 1.5) * 1.3, grupo);
            return;
          }
          // Hortaliças (couve, alface, beterraba/tomate): cultivos baixos e redondos, bem diferentes do trigo e do milho da grande plantação.
          const colunas = nivel === 2 ? 5 : 7, linhas = nivel === 2 ? 4 : 6, passo = nivel === 2 ? 1.15 : 0.88;
          for (let linha = 0; linha < linhas; linha++) for (let coluna = 0; coluna < colunas; coluna++) {
            const grupoDaPlanta = new THREE.Group(), tipo = linha % 3, fatorDeTamanho = 0.85 + ((coluna * 5 + linha * 3) % 4) * 0.1;
            grupoDaPlanta.position.set((coluna - (colunas - 1) / 2) * passo, 0.16, (linha - (linhas - 1) / 2) * passo); grupo.add(grupoDaPlanta);
            if (tipo === 0) {            // couve: cabeça redonda azul-esverdeada com folhas abertas
              criarEsfera(0.26 * fatorDeTamanho, 0x3f8f5a, 0, 0.24 * fatorDeTamanho, 0, grupoDaPlanta, 0.9);
              for (let indiceDaFolha = 0; indiceDaFolha < 5; indiceDaFolha++) { const folha = criarCaixa(0.34, 0.04, 0.22, 0x56a870, Math.cos(indiceDaFolha * 1.26) * 0.2, 0.1, Math.sin(indiceDaFolha * 1.26) * 0.2, grupoDaPlanta); folha.rotation.y = -indiceDaFolha * 1.26; folha.rotation.z = 0.2; }
            } else if (tipo === 1) {     // alface: roseta clara e ondulada
              for (let indiceDoItem = 0; indiceDoItem < 6; indiceDoItem++) criarEsfera(0.17 * fatorDeTamanho, indiceDoItem % 2 ? 0x9fd35a : 0x85c24a, Math.cos(indiceDoItem * 1.05) * 0.16, 0.13, Math.sin(indiceDoItem * 1.05) * 0.16, grupoDaPlanta, 0.55);
              criarEsfera(0.14 * fatorDeTamanho, 0xb8e070, 0, 0.2, 0, grupoDaPlanta, 0.8);
            } else if (nivel === 2) {        // beterraba: folhas arroxeadas
              criarEsfera(0.1, 0xb0203f, 0, 0.05, 0, grupoDaPlanta, 0.8);
              for (let indiceDoItem = 0; indiceDoItem < 4; indiceDoItem++) { const folha = criarCaixa(0.1, 0.38 * fatorDeTamanho, 0.04, indiceDoItem % 2 ? 0x9b2f55 : 0x7a2a4a, Math.cos(indiceDoItem * 1.57) * 0.08, 0.24, Math.sin(indiceDoItem * 1.57) * 0.08, grupoDaPlanta); folha.rotation.y = indiceDoItem * 0.8; folha.rotation.x = 0.35; }
            } else {                     // tomateiro em estaca, com frutos
              criarCaixa(0.05, 1.2, 0.05, PALETA_DE_CORES.madeira, 0, 0.6, 0, grupoDaPlanta); criarEsfera(0.28, 0x3c8c3a, 0, 0.65, 0, grupoDaPlanta, 1.2);
              for (let indiceDoItem = 0; indiceDoItem < 4; indiceDoItem++) criarEsfera(0.09, 0xe03a2a, Math.cos(indiceDoItem * 1.6) * 0.22, 0.45 + indiceDoItem * 0.14, Math.sin(indiceDoItem * 1.6) * 0.22, grupoDaPlanta);
            }
          }
          if (nivel === 3) { // espantalho
            const posicaoX = largura / 2 - 0.9;
            criarCaixa(0.1, 2, 0.1, PALETA_DE_CORES.madeira, posicaoX, 1, 0, grupo);
            criarCaixa(1.2, 0.1, 0.1, PALETA_DE_CORES.madeira, posicaoX, 1.6, 0, grupo);
            criarCaixa(0.5, 0.7, 0.3, 0xc0392b, posicaoX, 1.3, 0, grupo);
            criarCaixa(0.4, 0.4, 0.4, 0xf2c28e, posicaoX, 1.95, 0, grupo);
            criarCaixa(0.9, 0.08, 0.9, 0x9a5a2a, posicaoX, 2.2, 0, grupo);
            criarCaixa(0.4, 0.25, 0.4, 0x9a5a2a, posicaoX, 2.35, 0, grupo);
          }
        },

        // Mark 8.2: a Grande plantação agora tem canteiros de verdade (plantar e colher qualquer cultura), com as mesmas
        // dimensões de antes; as fileiras decorativas de trigo e milho deram lugar aos canteiros do jogador.
        plantacaoGrande(grupoDaPlantacao, nivel) { construirPlantacaoComCanteiros(grupoDaPlantacao, nivel, 'plantacaoGrande', 'norte', false); },
      };

      arquivoDaMontagemConcluido('12b-construtores-das-areas.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
