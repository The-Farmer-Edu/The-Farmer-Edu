      // ====================================================================================================
      // FARMEDU 3D — 09-cenario-fixo.js (Fase 3B da refatoração: seção 09)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 09 — CENÁRIO FIXO: CHÃO, CAMINHOS, POSTES, LAMPIÕES E NUVENS
      // Chão, rede de caminhos (incluindo as estradas da praça central), pequenas praças, bancos, modelos dos postes e dos lampiões
      // das construções e nuvens em movimento.
      // ====================================================================================================
      const chao = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), material(0x78b24a));
      chao.rotation.x = -Math.PI / 2;
      chao.receiveShadow = true;
      cena.add(chao);
      // == REDE DE CAMINHOS ==
      // Cada trecho é [x1, z1, x2, z2, largura], alinhado a um eixo. As pontas avançam meia largura, então cantos e
      // entroncamentos se encontram sem frestas; ramais terminam dentro da base da construção ou em praças.
      const COR_ESTRADA = 0xd9b97a;
      const ROTAS = [
        [0, -16.5, 0, 13.5, 2.4],         // espinha norte-sul
        [-15.5, -16.5, 0, -16.5, 2.4],    // mirante da cachoeira
        [-27, -1, 43, -1, 2.4],           // leste-oeste (cruza a ponte)
        [29, -1, 29, 27.5, 2.4],          // anel leste até o lago
        [-8, 13.5, 29, 13.5, 2.4],        // leste-oeste sul
        [43, -1, 43, 4.5, 2.4],           // entrada da grande plantação
        [-8, -5.25, -8, -1, 1.6], [7, -5.25, 7, -1, 1.6], [19.3, -6.3, 19.3, -1, 1.6], [35, -4.35, 35, -1, 1.6],   // fileira norte
        [-8, -1, -8, 2.75, 1.6],                                                                                    // maquinário (norte)
        [-8, 9.25, -8, 13.5, 2.4], [8.6, 8.95, 8.6, 13.5, 1.6], [19.3, 8.7, 19.3, 13.5, 1.6],                      // fileira do meio
        [7, 13.5, 7, 18.05, 1.6], [19, 13.5, 19, 16.6, 1.6],                                                        // ovelhal e estábulo
      ];
      const PRACAS = [[-27, -1, 2.4], [-15.5, -16.5, 2.2], [29, 27.5, 2.4]]; // fim da estrada oeste · mirante · antiga praça do lago (hoje um recanto no caminho até a praça central)
      // == PRAÇA CENTRAL (construída na seção 10) ==
      // Fica no eixo da estrada norte-sul (x = 0), na grande área livre à frente do ovelhal e do estábulo. O lago com o chafariz
      // (seção 11) fica exatamente no centro. As estradas novas abaixo ligam a praça à espinha norte-sul e ao anel leste.
      const PRACA_CENTRAL = {
        x: 0, z: 39.5,                                  // centro da praça = posição do chafariz
        raioX: 15, raioZ: 11.5,                         // elipse externa do pavimento
        escalaDoJardim: 1.68,                           // jardim gramado em volta do lago: o mesmo contorno ondulado do lago, ampliado
        mirante: { x: -16.4, z: 39.5, raio: 1.9 },      // terraço redondo encostado no lado oeste, voltado para o rio
      };
      // Trechos novos (mesmo formato de ROTAS). Ficam numa lista própria porque ROTAS também alimenta a distribuição aleatória
      // da vegetação (ocupado, seção 11): mantê-la igual preserva arbustos, pedras e capins exatamente onde estavam.
      const ROTAS_DA_PRACA_CENTRAL = [
        [0, 13.5, 0, 29.6, 2.4],                        // espinha norte-sul prolongada até a entrada norte da praça
        [13.8, 39.5, 29, 39.5, 2.4],                    // saída leste da praça
        [29, 27.5, 29, 39.5, 2.4],                      // anel leste prolongado até encontrar a saída leste
      ];
      const REDE_DE_CAMINHOS = [...ROTAS, ...ROTAS_DA_PRACA_CENTRAL];   // tudo o que é desenhado e registrado como estrada
      // == MARK 8.2: estrada até a Nova plantação (marcação vermelha) ==
      const ROTAS_DA_MARK_8_2 = [[29, 32.3, 32.4, 32.3, 1.6]];   // sai da estrada x = 29 e chega à entrada oeste da Nova plantação
      REDE_DE_CAMINHOS.push(...ROTAS_DA_MARK_8_2);
      // == MARK 8.2: geometria da mina (marcação roxa) ==
      // A boca da caverna fica no morro a noroeste, depois da ponte; os trilhos descem em linha reta até o depósito, que fica
      // ao lado do fim da estrada oeste. "fundo" é o ponto dentro do escuro onde o carrinho some durante a mineração.
      const MINA_GEOMETRIA = (() => {
        const boca = new THREE.Vector3(-44.8, 0, -26.2), inicio = new THREE.Vector3(-33.0, 0, -4.9);
        const direcaoParaDentro = boca.clone().sub(inicio).normalize();
        const fundo = boca.clone().addScaledVector(direcaoParaDentro, 4.4);
        return { boca, inicio, fundo, direcaoParaDentro, comprimento: inicio.distanceTo(fundo), profundidadeDoTunel: 5,
          giroDaEntrada: Math.atan2(-direcaoParaDentro.x, -direcaoParaDentro.z) };   // a frente da caverna (+z local) olha para o depósito
      })();
      // Verdadeiro se (x, z) está no corredor dos trilhos (do depósito até a boca da caverna).
      const estaNoCorredorDaMina = function estaNoCorredorDaMina(posicaoX, posicaoZ, margem = 0) {
        const { inicio, fundo: boca } = MINA_GEOMETRIA, segmentoX = boca.x - inicio.x, segmentoZ = boca.z - inicio.z;   // até o fundo do túnel (nada de capim dentro da caverna)
        const fracao = Math.max(0, Math.min(1, ((posicaoX - inicio.x) * segmentoX + (posicaoZ - inicio.z) * segmentoZ) / (segmentoX * segmentoX + segmentoZ * segmentoZ)));
        return Math.hypot(posicaoX - (inicio.x + segmentoX * fracao), posicaoZ - (inicio.z + segmentoZ * fracao)) < 1.8 + margem;
      };
      // ---- Geometria da rede de caminhos: UMA malha única, sem retângulos sobrepostos ----
      // Antes cada trecho era uma caixa própria: nos cruzamentos as faces superiores coincidiam (z-fighting) e as praças
      // ficavam a menos de 0,005 de distância entre os anéis. Agora os retângulos são fundidos numa grade de células sem
      // sobreposição (cada pedaço de chão tem exatamente UMA face superior), com saia lateral até o chão.
      const criarMalhaDeCaminhos = function criarMalhaDeCaminhos(rotas, topo, material) {
        const retangulos = rotas.map(([xInicial, zInicial, xFinal, zFinal, largura]) => {
          const ehHorizontal = zInicial === zFinal, centroX = (xInicial + xFinal) / 2, centroZ = (zInicial + zFinal) / 2, metadeX = (ehHorizontal ? Math.abs(xFinal - xInicial) + largura : largura) / 2, metadeZ = (ehHorizontal ? largura : Math.abs(zFinal - zInicial) + largura) / 2;
          return [centroX - metadeX, centroZ - metadeZ, centroX + metadeX, centroZ + metadeZ];
        });
        const unicos = indice => [...new Set(retangulos.flatMap(retangulo => [retangulo[indice], retangulo[indice + 2]]))].sort((valorA, valorB) => valorA - valorB);
        const valoresDeX = unicos(0), valoresDeZ = unicos(1), posicoes = [], normais = [], coordenadasUV = [], indices = [];
        const coberta = (coluna, linha) => {
          if (coluna < 0 || linha < 0 || coluna >= valoresDeX.length - 1 || linha >= valoresDeZ.length - 1) return false;
          const centroX = (valoresDeX[coluna] + valoresDeX[coluna + 1]) / 2, centroZ = (valoresDeZ[linha] + valoresDeZ[linha + 1]) / 2;
          return retangulos.some(retangulo => centroX > retangulo[0] && centroX < retangulo[2] && centroZ > retangulo[1] && centroZ < retangulo[3]);
        };
        const adicionarQuadrilatero = (vertices, normal) => { const indiceBase = posicoes.length / 3; for (const [posicaoX, posicaoY, posicaoZ] of vertices) { posicoes.push(posicaoX, posicaoY, posicaoZ); normais.push(...normal); coordenadasUV.push(posicaoX / 4, posicaoZ / 4); } indices.push(indiceBase, indiceBase + 1, indiceBase + 2, indiceBase, indiceBase + 2, indiceBase + 3); };
        for (let indiceInterno = 0; indiceInterno < valoresDeZ.length - 1; indiceInterno++) for (let indice = 0; indice < valoresDeX.length - 1; indice++) {
          if (!coberta(indice, indiceInterno)) continue;
          const xDaBordaEsquerda = valoresDeX[indice], xDaBordaDireita = valoresDeX[indice + 1], zDaBordaTraseira = valoresDeZ[indiceInterno], zDaBordaFrontal = valoresDeZ[indiceInterno + 1];
          adicionarQuadrilatero([[xDaBordaEsquerda, topo, zDaBordaTraseira], [xDaBordaEsquerda, topo, zDaBordaFrontal], [xDaBordaDireita, topo, zDaBordaFrontal], [xDaBordaDireita, topo, zDaBordaTraseira]], [0, 1, 0]);                       // topo
          if (!coberta(indice - 1, indiceInterno)) adicionarQuadrilatero([[xDaBordaEsquerda, 0, zDaBordaTraseira], [xDaBordaEsquerda, 0, zDaBordaFrontal], [xDaBordaEsquerda, topo, zDaBordaFrontal], [xDaBordaEsquerda, topo, zDaBordaTraseira]], [-1, 0, 0]);     // saias laterais
          if (!coberta(indice + 1, indiceInterno)) adicionarQuadrilatero([[xDaBordaDireita, 0, zDaBordaFrontal], [xDaBordaDireita, 0, zDaBordaTraseira], [xDaBordaDireita, topo, zDaBordaTraseira], [xDaBordaDireita, topo, zDaBordaFrontal]], [1, 0, 0]);
          if (!coberta(indice, indiceInterno - 1)) adicionarQuadrilatero([[xDaBordaDireita, 0, zDaBordaTraseira], [xDaBordaEsquerda, 0, zDaBordaTraseira], [xDaBordaEsquerda, topo, zDaBordaTraseira], [xDaBordaDireita, topo, zDaBordaTraseira]], [0, 0, -1]);
          if (!coberta(indice, indiceInterno + 1)) adicionarQuadrilatero([[xDaBordaEsquerda, 0, zDaBordaFrontal], [xDaBordaDireita, 0, zDaBordaFrontal], [xDaBordaDireita, topo, zDaBordaFrontal], [xDaBordaEsquerda, topo, zDaBordaFrontal]], [0, 0, 1]);
        }
        const geometria = new THREE.BufferGeometry();
        geometria.setAttribute('position', new THREE.Float32BufferAttribute(posicoes, 3)); geometria.setAttribute('normal', new THREE.Float32BufferAttribute(normais, 3));
        geometria.setAttribute('uv', new THREE.Float32BufferAttribute(coordenadasUV, 2)); geometria.setIndex(indices);
        const malha = new THREE.Mesh(geometria, material); malha.receiveShadow = true; cena.add(malha);
        return malha;
      };
      const ALTURA_DO_CAMINHO = 0.055;
      const materialDosCaminhos = new THREE.MeshLambertMaterial({ color: COR_ESTRADA, side: THREE.DoubleSide });
      const malhaDosCaminhos = criarMalhaDeCaminhos(REDE_DE_CAMINHOS, ALTURA_DO_CAMINHO, materialDosCaminhos);
      // Praças: dois discos empilhados (borda e miolo) com alturas bem separadas e polygonOffset, para nunca disputarem a mesma profundidade
      for (const [posicaoX, posicaoZ, raioDaPraca] of PRACAS) {
        [[raioDaPraca, 0xc9a96a, 0.075, -1], [raioDaPraca - 0.35, 0xe3cd93, 0.09, -2]].forEach(([raio, cor, posicaoY, deslocamentoDePoligono]) => {
          const disco = new THREE.Mesh(new THREE.CircleGeometry(raio, 28), new THREE.MeshLambertMaterial({ color: cor, polygonOffset: true, polygonOffsetFactor: deslocamentoDePoligono, polygonOffsetUnits: deslocamentoDePoligono }));
          disco.rotation.x = -Math.PI / 2; disco.position.set(posicaoX, posicaoY, posicaoZ); disco.receiveShadow = true; cena.add(disco);
        });
      }
      const bancosDaFazenda = [];
      // Banco de madeira de praça, girado por "giro". Também fica registrado como obstáculo para fazendeiros,
      // postes e mobs.
      const criarBanco = (posicaoX, posicaoZ, giro) => {
        bancosDaFazenda.push([posicaoX, posicaoZ]); COLISOES.circulo('banco', posicaoX, posicaoZ, 0.9);
        const grupoDoBanco = new THREE.Group(); grupoDoBanco.position.set(posicaoX, 0, posicaoZ); grupoDoBanco.rotation.y = giro; grupoDoBanco.userData.nome = 'banco'; cena.add(grupoDoBanco);
        criarCaixa(1.3, 0.08, 0.4, PALETA_DE_CORES.ripa, 0, 0.42, 0, grupoDoBanco); criarCaixa(1.3, 0.3, 0.06, PALETA_DE_CORES.ripa, 0, 0.7, -0.2, grupoDoBanco);
        for (const escalaX of [-0.55, 0.55]) criarCaixa(0.08, 0.42, 0.4, PALETA_DE_CORES.madeira, escalaX, 0.21, 0, grupoDoBanco);
      };
      // ---- Postes de iluminação rurais: base de pedra, mourão de madeira, ferro escuro e lanterna de vidro com chama ----
      // Cada poste tem: lanterna emissiva (apagada de dia, quente à noite), halo discreto e mancha de luz no chão.
      // Só algumas luzes de ponto reais acompanham a câmera (ver "luzesDosPostes"), o que mantém a taxa de quadros alta.
      const postesDaFazenda = [];   // { x, z, grupo } — cada poste criado fica registrado aqui
      const materialDaLanterna = new THREE.MeshBasicMaterial({ color: 0xc9d9dc, transparent: true, opacity: 0.9 });   // vidro
      const materialDaChama = new THREE.MeshBasicMaterial({ color: 0xd8c9a0 });                                         // núcleo da chama
      const materialDoBrilhoNoChao = new THREE.MeshBasicMaterial({ map: texturaRadial('255,176,84', 0.85), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2 });
      const materialDoHalo = new THREE.SpriteMaterial({ map: texturaRadial('255,200,120', 1), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      for (const materialDaPeca of [materialDaLanterna, materialDaChama, materialDoBrilhoNoChao, materialDoHalo]) materialDaPeca.userData.ignorarCiclo = true; // não escurecem com a noite
      const geometriaDoBrilhoNoChao = new THREE.PlaneGeometry(1, 1);
      const geometriaDaLanterna = new THREE.BoxGeometry(0.26, 0.34, 0.26), geometriaDaChama = new THREE.OctahedronGeometry(0.075, 0);
      const geometriaDoTeto = new THREE.ConeGeometry(0.31, 0.26, 4);
      // Poste de iluminação rural (pedra, madeira, ferro e lanterna de vidro) com halo e mancha de luz no chão.
      // Fica registrado em postesDaFazenda e nas colisões.
      const criarPoste = function criarPoste(posicaoX, posicaoZ, giro = 0) {
        const grupoDoPoste = new THREE.Group(); grupoDoPoste.position.set(posicaoX, 0, posicaoZ); grupoDoPoste.rotation.y = giro; grupoDoPoste.userData.nome = 'poste'; cena.add(grupoDoPoste);
        const madeira = 0x7a4a26, ferro = 0x2c2a2e, pedraBase = 0x8a8d86;
        const peca = (geometria, materialDoObjeto, posicaoLocalX, posicaoLocalY, posicaoLocalZ, sombra = false) => { const malha = new THREE.Mesh(geometria, materialDoObjeto); malha.position.set(posicaoLocalX, posicaoLocalY, posicaoLocalZ); malha.castShadow = sombra; grupoDoPoste.add(malha); return malha; };
        peca(new THREE.CylinderGeometry(0.2, 0.26, 0.28, 6), material(pedraBase), 0, 0.14, 0);            // sapata de pedra
        peca(new THREE.CylinderGeometry(0.14, 0.16, 0.07, 6), material(ferro), 0, 0.31, 0);               // anel de ferro na base
        peca(new THREE.CylinderGeometry(0.065, 0.1, 1.9, 6), material(madeira), 0, 1.23, 0, true);        // mourão afunilado
        for (const lado of [-1, 1]) {                                                                       // escoras de madeira na base
          const escora = peca(new THREE.BoxGeometry(0.05, 0.5, 0.05), material(0xa06a35), lado * 0.12, 0.5, 0); escora.rotation.z = -lado * 0.42;
        }
        peca(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 6), material(ferro), 0, 1.75, 0);                 // abraçadeira de ferro
        const braco = peca(new THREE.BoxGeometry(0.5, 0.06, 0.06), material(madeira), 0.2, 1.95, 0);       // braço lateral para vasinho de flores
        const apoio = peca(new THREE.BoxGeometry(0.05, 0.34, 0.05), material(0xa06a35), 0.12, 1.8, 0); apoio.rotation.z = 0.7;
        peca(new THREE.CylinderGeometry(0.075, 0.055, 0.1, 6), material(0xb5522f), 0.4, 2.03, 0);          // vasinho pendurado
        peca(new THREE.SphereGeometry(0.08, 6, 4), material(0xff8fb1), 0.4, 2.12, 0);                      // flor
        peca(new THREE.BoxGeometry(0.36, 0.05, 0.36), material(ferro), 0, 2.2, 0);                         // base da lanterna
        peca(geometriaDaLanterna, materialDaLanterna, 0, 2.4, 0);                                          // vidro
        peca(geometriaDaChama, materialDaChama, 0, 2.4, 0);                                                // chama
        for (const escalaX of [-1, 1]) for (const escalaZ of [-1, 1]) peca(new THREE.BoxGeometry(0.035, 0.36, 0.035), material(ferro), escalaX * 0.135, 2.4, escalaZ * 0.135); // varões de ferro
        peca(new THREE.BoxGeometry(0.38, 0.04, 0.38), material(ferro), 0, 2.59, 0);                        // aro superior
        const teto = peca(geometriaDoTeto, material(ferro), 0, 2.74, 0); teto.rotation.y = Math.PI / 4;     // teto em pirâmide
        peca(new THREE.SphereGeometry(0.05, 6, 4), material(ferro), 0, 2.9, 0);                            // remate
        const brilho = new THREE.Mesh(geometriaDoBrilhoNoChao, materialDoBrilhoNoChao);                     // mancha de luz no chão
        brilho.rotation.x = -Math.PI / 2; brilho.position.y = 0.12; brilho.scale.set(7.5, 7.5, 1); brilho.renderOrder = 2; grupoDoPoste.add(brilho);
        const halo = new THREE.Sprite(materialDoHalo); halo.position.y = 2.4; halo.scale.set(1.7, 1.7, 1); grupoDoPoste.add(halo);
        postesDaFazenda.push({ x: posicaoX, z: posicaoZ, grupo: grupoDoPoste }); COLISOES.circulo('poste', posicaoX, posicaoZ, 0.45);
        return grupoDoPoste;
      };
      const criarLampiao = (posicaoX, posicaoZ) => criarPoste(posicaoX, posicaoZ); // os lampiões antigos agora usam o modelo novo
      criarBanco(-14.2, -16.5, -Math.PI / 2); criarLampiao(-14.3, -18.1);              // mirante de frente para a cachoeira
      criarLampiao(-27.7, -2.3); criarPlacaDeMadeira(cena, -26.2, 0.6);                          // fim da estrada oeste
      // antiga praça do lago: a estrada agora continua até a praça central, então o banco saiu do meio do caminho e foi para a borda
      criarBanco(31.6, 28.0, -Math.PI / 2); criarLampiao(30.9, 26.3);

      // ---- Lampiões das construções: luminárias pequenas presas em paredes, mourões ou postinhos de madeira ----
      // Reaproveitam os MESMOS materiais dos postes (vidro, chama, halo e brilho no chão), então acendem e apagam junto com o
      // ciclo sem nenhum código extra. Cada cabeça de lampião fica registrada por área: a seção 20 escolhe as mais próximas da
      // câmera para receber uma das poucas luzes reais compartilhadas.
      const lampioesDasConstrucoes = {};   // idDaArea → [cabeças de lampião]; a lista é zerada a cada reconstrução da área (seção 14)
      let idDaAreaEmConstrucao = null;     // área cujo construtor está rodando agora (definida por reconstruirArea)
      let animaisCriadosNaConstrucao = 0;  // animais já criados pelo construtor em andamento (animais mortos de fome não reaparecem)
      const canteirosVisuais = {};         // plantações com canteiros: idDaArea → { plantas, solo, posicoes, ... } (seções 12 e 27)
      let carrinhoDaMina = null;           // carrinho criado pelo construtor da mina: { grupo, carga, rodas } (seção 28)
      let marcadorDaLuzDaCasa = null;      // ponto (Object3D) na frente da casa de onde sai a luz quente noturna; recriado com a casa
      const geometriasDoLampiao = {        // malhas compartilhadas pelas cabeças de lampião (não são descartadas na reconstrução: ver seção 14)
        base: new THREE.BoxGeometry(0.2, 0.03, 0.2), vidro: new THREE.BoxGeometry(0.15, 0.22, 0.15), chama: new THREE.OctahedronGeometry(0.05, 0),
        varao: new THREE.BoxGeometry(0.022, 0.23, 0.022), teto: new THREE.ConeGeometry(0.15, 0.12, 4), argola: new THREE.TorusGeometry(0.035, 0.01, 4, 8),
      };
      const geometriasCompartilhadas = new Set(Object.values(geometriasDoLampiao));   // reconstruirArea não descarta estas
      // Cabeça de lampião (base, vidro com chama, varões, teto e argola) com halo. Centro do vidro em (x, y, z) do grupo pai.
      // Opções: escala · brilhoNoChao = diâmetro da mancha de luz no chão (0 = sem mancha) · alturaDoChao = y do chão no grupo pai.
      const criarCabecaDeLampiao = function criarCabecaDeLampiao(grupoPai, posicaoX, posicaoY, posicaoZ, { escala = 1, brilhoNoChao = 0, alturaDoChao = 0.12 } = {}) {
        const cabeca = new THREE.Group(); cabeca.position.set(posicaoX, posicaoY, posicaoZ); cabeca.scale.setScalar(escala); cabeca.userData.nome = 'lampiao'; grupoPai.add(cabeca);
        const ferro = material(0x2c2a2e);
        const peca = (geometria, materialDaPeca, x, y, z) => { const malha = new THREE.Mesh(geometria, materialDaPeca); malha.position.set(x, y, z); cabeca.add(malha); return malha; };
        peca(geometriasDoLampiao.base, ferro, 0, -0.125, 0);
        peca(geometriasDoLampiao.vidro, materialDaLanterna, 0, 0, 0);
        peca(geometriasDoLampiao.chama, materialDaChama, 0, -0.01, 0);
        for (const diferencaX of [-0.08, 0.08]) for (const diferencaZ of [-0.08, 0.08]) peca(geometriasDoLampiao.varao, ferro, diferencaX, 0, diferencaZ);
        peca(geometriasDoLampiao.teto, ferro, 0, 0.17, 0).rotation.y = Math.PI / 4;
        peca(geometriasDoLampiao.argola, ferro, 0, 0.255, 0);
        const halo = new THREE.Sprite(materialDoHalo); halo.scale.set(1.15, 1.15, 1); cabeca.add(halo);
        if (brilhoNoChao) criarManchaDeLuzNoChao(grupoPai, materialDoBrilhoNoChao, posicaoX, alturaDoChao, posicaoZ, brilhoNoChao);
        if (idDaAreaEmConstrucao) (lampioesDasConstrucoes[idDaAreaEmConstrucao] = lampioesDasConstrucoes[idDaAreaEmConstrucao] || []).push(cabeca);
        return cabeca;
      };
      // Lampião de parede: chapa presa na parede, braço de ferro saindo para a frente (+z local, girado por "giro") e a cabeça
      // pendurada nele. (x, y, z) = ponto da parede na altura do braço. A mancha de luz cai no chão logo à frente da parede.
      const criarLampiaoDeParede = function criarLampiaoDeParede(grupo, posicaoX, posicaoY, posicaoZ, giro = 0, brilhoNoChao = 3.2) {
        const suporte = new THREE.Group(); suporte.position.set(posicaoX, posicaoY, posicaoZ); suporte.rotation.y = giro; grupo.add(suporte);
        criarCaixa(0.1, 0.16, 0.03, 0x2c2a2e, 0, 0, 0.015, suporte);                       // chapa na parede
        criarCaixa(0.035, 0.035, 0.24, 0x2c2a2e, 0, 0.02, 0.12, suporte);                  // braço
        criarCabecaDeLampiao(suporte, 0, -0.27, 0.22);
        if (brilhoNoChao) criarManchaDeLuzNoChao(grupo, materialDoBrilhoNoChao, posicaoX + Math.sin(giro) * 0.7, 0.12, posicaoZ + Math.cos(giro) * 0.7, brilhoNoChao);
        return suporte;
      };
      // Postinho de lampião (mourão de madeira de 1,8 com sapata de pedra, braço lateral e lampião pendurado). Usado junto aos
      // portões dos cercados. "giro" escolhe para que lado o braço aponta (padrão: +x).
      const criarPosteDeLampiao = function criarPosteDeLampiao(grupo, posicaoX, posicaoZ, giro = 0, brilhoNoChao = 4.2) {
        const poste = new THREE.Group(); poste.position.set(posicaoX, 0, posicaoZ); poste.rotation.y = giro; poste.userData.nome = 'poste-de-lampiao'; grupo.add(poste);
        criarCilindro(0.14, 0.17, 0.2, 0x8a8d86, 0, 0.1, 0, poste, 6);                   // sapata de pedra
        criarCaixa(0.11, 1.8, 0.11, PALETA_DE_CORES.madeira, 0, 0.9, 0, poste);            // mourão
        criarCaixa(0.42, 0.06, 0.06, PALETA_DE_CORES.madeira, 0.17, 1.76, 0, poste);       // braço
        criarCaixa(0.04, 0.26, 0.04, PALETA_DE_CORES.ripa, 0.1, 1.62, 0, poste).rotation.z = 0.75; // mão-francesa
        criarCabecaDeLampiao(poste, 0.32, 1.48, 0, { brilhoNoChao, alturaDoChao: 0.12 });
        return poste;
      };

      // Nuvens: volumes arredondados, espalhadas em faixas afastadas da vista principal, deriva lenta e fade nas bordas.
      const nuvens = [];
      {
        const sortearNuvem = criarGeradorDeNumerosAleatorios(23);
        for (let indice = 0; indice < 20; indice++) {
          const flanco = indice >= 14, nuvem = new THREE.Group();
          const materialDoObjeto = new THREE.MeshLambertMaterial({ color: 0xf8fbff, transparent: true, opacity: 0 });
          const escala = 1.1 + sortearNuvem() * 1.1, sopros = 6 + Math.floor(sortearNuvem() * 4);
          for (let indiceDoSopro = 0; indiceDoSopro < sopros; indiceDoSopro++) {
            const angulo = sortearNuvem() * Math.PI * 2, raioSorteado = Math.sqrt(sortearNuvem()), raio = (1.5 - raioSorteado * 0.7) * (0.8 + sortearNuvem() * 0.5);
            const bolaDeFumaca = new THREE.Mesh(new THREE.SphereGeometry(raio, 10, 8), materialDoObjeto);
            bolaDeFumaca.position.set(Math.cos(angulo) * raioSorteado * 3.6, (1 - raioSorteado) * 0.9 + sortearNuvem() * 0.3, Math.sin(angulo) * raioSorteado * 1.9);
            bolaDeFumaca.scale.set(1.1, 0.62 + sortearNuvem() * 0.2, 1);
            nuvem.add(bolaDeFumaca);
          }
          nuvem.scale.setScalar(escala);
          const eixo = flanco ? 'z' : 'x';
          const posicaoX = flanco ? (indice % 2 ? 1 : -1) * (68 + sortearNuvem() * 28) : -100 + sortearNuvem() * 200;
          const posicaoZ = flanco ? -25 + sortearNuvem() * 90 : -100 + sortearNuvem() * 55;
          nuvem.position.set(posicaoX, flanco ? 17 + sortearNuvem() * 8 : 23 + sortearNuvem() * 12, posicaoZ);
          nuvem.userData = { eixo, mat: materialDoObjeto, velocidade: 0.18 + sortearNuvem() * 0.4, yBase: nuvem.position.y, fase: sortearNuvem() * 6.28 };
          cena.add(nuvem);
          nuvem.userData.animado = true; nuvens.push(nuvem);
        }
      }

      arquivoDaMontagemConcluido('09-cenario-fixo.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
