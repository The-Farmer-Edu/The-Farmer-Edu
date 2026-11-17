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
      // == ILHA FLUTUANTE (Fazenda 8.4.1) ==
      // A fazenda fica no topo de uma ilha suspensa no céu. O contorno foi medido em volta de tudo o que já existia (montanhas,
      // floresta, rio, caverna, postes e construções), com pelo menos 8 de grama até a beira, e está guardado abaixo como raios
      // a partir do centro: nada é medido ao abrir o jogo. O topo continua plano em y = 0, então posições, colisões e grades de
      // navegação não mudam; só as laterais e o fundo têm relevo. As irregularidades usam sorteios próprios (sementes 8418 e
      // 8420): a sequência do cenário (semente 11) e as nuvens altas (semente 23) continuam iguais.
      const CENTRO_DA_ILHA = { x: 5, z: -6 };
      // 120 raios, um a cada 3°, começando em −178,5° (oeste) e girando de +x para +z (o ângulo de Math.atan2(z, x)).
      const RAIOS_DA_ILHA = [
        101.8, 101.3, 101.3, 101.5, 104.2, 104.7, 104.7, 99.4, 94.7, 94.3, 94.6, 92.1, 87.8, 85.1, 83.9, 82.4, 81.2, 82.5, 84.5, 84.6,
        84.4, 86.3, 91.7, 97.9, 99.9, 99.5, 99.8, 101.7, 102.9, 101.9, 98.7, 96.1, 96.4, 97.7, 96.6, 92.5, 89.1, 87.1, 85.5, 83.8,
        81.8, 80.4, 80.6, 81.8, 83.3, 84.4, 86.1, 85.9, 84.9, 84.4, 86.2, 90.7, 97.8, 103.2, 104.6, 104.8, 104.2, 104.1, 105.0, 106.1,
        106.8, 106.8, 107.5, 108.9, 110.6, 112.3, 114.1, 115.1, 115.6, 116.3, 119.4, 123.9, 128.8, 134.4, 138.9, 139.2, 134.8, 128.9, 123.6, 119.7,
        117.2, 114.4, 111.3, 109.0, 106.6, 104.1, 103.0, 103.2, 103.8, 104.5, 104.6, 104.4, 104.1, 104.1, 104.0, 105.5, 108.1, 110.5, 113.1, 116.0,
        120.3, 125.8, 130.8, 136.3, 142.1, 143.0, 138.7, 133.0, 127.4, 121.9, 117.1, 114.7, 113.3, 112.0, 110.3, 108.8, 107.1, 105.6, 104.0, 102.8,
      ];
      // Lagoa rasa no fim do rio (desenhada na seção 11a): o contorno abre um cabo em volta dela para sobrar grama até a beira.
      const LAGOA_DO_RIO = { x: -32.9, z: 89.4, raioAoLongo: 4.8, raioDeLado: 5.2, margem: 1.4 };
      const CABO_DA_LAGOA = { angulo: Math.atan2(LAGOA_DO_RIO.z - CENTRO_DA_ILHA.z, LAGOA_DO_RIO.x - CENTRO_DA_ILHA.x), altura: 9, abertura: 7 * Math.PI / 180 };
      // Raio da beira num ângulo qualquer: Catmull-Rom fechado entre os raios guardados, mais o cabo da lagoa.
      const raioDaIlha = function raioDaIlha(angulo) {
        const quantidade = RAIOS_DA_ILHA.length, posicao = (angulo + Math.PI) / (2 * Math.PI) * quantidade - 0.5;
        const inicio = Math.floor(posicao), t = posicao - inicio, raio = indice => RAIOS_DA_ILHA[((inicio + indice) % quantidade + quantidade) % quantidade];
        const p0 = raio(-1), p1 = raio(0), p2 = raio(1), p3 = raio(2);
        const suave = 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (3 * p1 - p0 - 3 * p2 + p3) * t * t * t);
        let diferenca = angulo - CABO_DA_LAGOA.angulo; diferenca -= Math.round(diferenca / (2 * Math.PI)) * 2 * Math.PI;
        return suave + CABO_DA_LAGOA.altura * Math.exp(-diferenca * diferenca / (2 * CABO_DA_LAGOA.abertura * CABO_DA_LAGOA.abertura));
      };
      const SEGMENTOS_DA_BEIRA = 180;   // um ponto da beira a cada 2°: o topo e a primeira camada da lateral usam os mesmos pontos
      const CONTORNO_DA_ILHA = [];
      for (let indice = 0; indice < SEGMENTOS_DA_BEIRA; indice++) {
        const angulo = -Math.PI + indice * 2 * Math.PI / SEGMENTOS_DA_BEIRA, raio = raioDaIlha(angulo);
        CONTORNO_DA_ILHA.push([CENTRO_DA_ILHA.x + Math.cos(angulo) * raio, CENTRO_DA_ILHA.z + Math.sin(angulo) * raio]);
      }
      // Topo: leque de triângulos a partir do centro (o contorno é visível inteiro do centro), plano em y = 0, com o mesmo
      // material e as mesmas sombras do chão antigo.
      const chao = (() => {
        const posicoes = [CENTRO_DA_ILHA.x, 0, CENTRO_DA_ILHA.z], indices = [];
        for (const [posicaoX, posicaoZ] of CONTORNO_DA_ILHA) posicoes.push(posicaoX, 0, posicaoZ);
        for (let indice = 0; indice < SEGMENTOS_DA_BEIRA; indice++) indices.push(0, 1 + (indice + 1) % SEGMENTOS_DA_BEIRA, 1 + indice);
        const geometria = new THREE.BufferGeometry();
        geometria.setAttribute('position', new THREE.Float32BufferAttribute(posicoes, 3));
        geometria.setAttribute('normal', new THREE.Float32BufferAttribute(posicoes.map((_, indice) => indice % 3 === 1 ? 1 : 0), 3));
        geometria.setAttribute('uv', new THREE.Float32BufferAttribute(posicoes.flatMap((valor, indice) => indice % 3 === 0 ? [valor / 1000 + 0.5, 0.5 - posicoes[indice + 2] / 1000] : []), 2));
        geometria.setIndex(indices);
        const malha = new THREE.Mesh(geometria, material(0x78b24a));
        malha.receiveShadow = true;
        return malha;
      })();
      cena.add(chao);
      // Laterais e fundo: anéis que descem a partir da beira (grama dobrando, terra com a linha irregular, estratos de rocha em
      // degraus) e depois se fecham por baixo num bulbo torto, com pontas de rocha penduradas. Uma malha só, facetada, com
      // cores por vértice; não projeta nem recebe sombra (o mapa de sombra nem alcança a beira).
      const ladosDaIlha = (() => {
        const sortear = criarGeradorDeNumerosAleatorios(8418), N = SEGMENTOS_DA_BEIRA;
        // ruído fechado em volta da ilha: 3 ondas com frequência e fase sorteadas + um pouco de variação ponto a ponto
        const criarRuido = (frequenciaMaxima, tremor) => {
          const ondas = [0, 1, 2].map(() => [2 + Math.floor(sortear() * (frequenciaMaxima - 1)), sortear() * Math.PI * 2, 0.4 + sortear() * 0.6]);
          const soma = ondas.reduce((total, onda) => total + onda[2], 0);
          return Array.from({ length: N }, (_, indice) => ondas.reduce((total, [frequencia, fase, peso]) => total + peso * Math.sin(frequencia * indice * 2 * Math.PI / N + fase), 0) / soma + (sortear() * 2 - 1) * tremor);
        };
        // Beira: [recuo, altura, variação do recuo, variação da altura, cor]. O recuo negativo é a grama que passa da beira.
        const CAMADAS_DA_BEIRA = [
          [0, 0, 0, 0, 0x78b24a],          // beira do gramado (os mesmos pontos do topo)
          [-0.35, -0.5, 0.15, 0.15, 0x669f3e],   // grama dobrando sobre a beira
          [0.05, -1.4, 0.3, 0.6, 0x55803a],      // raízes: a linha onde a grama vira terra é irregular
          [0.45, -2.3, 0.35, 0.6, 0x8b5e3c],     // terra
          [0.9, -3.6, 0.5, 0.7, 0x744a2d],       // terra escura
          [1.3, -4.6, 0.6, 0.6, 0x8c8a84],       // primeira rocha
          [2.8, -5.1, 0.9, 0.4, 0x857f76],       // degrau (topo de um estrato)
          [3.2, -8.4, 1.0, 1.0, 0x7b8691],
          [4.9, -9.0, 1.2, 0.5, 0x8a7d6c],       // estrato mais quente
          [5.4, -13.0, 1.5, 1.4, 0x6f7883],
          [7.8, -13.8, 1.6, 0.7, 0x7a6f62],
        ];
        // Fundo: [fração do raio, altura, cor]. Desce íngreme logo abaixo da rocha da beira e vai se afinando em lóbulos: três
        // saliências largas (as mesmas em todos os anéis) crescem com a profundidade e descem mais que o resto, como blocos de
        // rocha pendurados. O centro de cada anel escorrega para o lado das montanhas, então o bulbo também fica torto.
        const CAMADAS_DO_FUNDO = [
          [0.9, -18, 0x7e8185], [0.8, -24, 0x787a7e], [0.68, -30, 0x737478], [0.56, -36, 0x6e6f73],
          [0.44, -42, 0x68696d], [0.32, -47, 0x636468], [0.2, -52, 0x5e5f63], [0.1, -56, 0x595a5e],
        ];
        const DESVIO_DO_FUNDO = { x: -6, z: -14 };
        const aneis = [];
        for (const [recuo, altura, variacaoDoRecuo, variacaoDaAltura, cor] of CAMADAS_DA_BEIRA) {
          const ruidoDoRecuo = criarRuido(9, 0.3), ruidoDaAltura = criarRuido(14, 0.45);
          aneis.push(CONTORNO_DA_ILHA.map(([posicaoX, posicaoZ], indice) => {
            const angulo = -Math.PI + indice * 2 * Math.PI / N, recuoAqui = recuo + variacaoDoRecuo * ruidoDoRecuo[indice];
            return { x: posicaoX - Math.cos(angulo) * recuoAqui, y: altura + (recuo ? variacaoDaAltura * ruidoDaAltura[indice] : 0), z: posicaoZ - Math.sin(angulo) * recuoAqui, cor };
          }));
        }
        const ondasDosLobulos = [2, 3, 5].map(frequencia => [frequencia, sortear() * Math.PI * 2, 0.5 + sortear() * 0.5]);
        const lobulo = angulo => ondasDosLobulos.reduce((total, [frequencia, fase, peso]) => total + peso * Math.sin(frequencia * angulo + fase), 0) / 1.6;
        CAMADAS_DO_FUNDO.forEach(([fracao, altura, cor], camada) => {
          const ruidoDoRaio = criarRuido(13, 0.3), ruidoDaAltura = criarRuido(12, 0.3), descida = (camada + 1) / CAMADAS_DO_FUNDO.length;
          const centroX = CENTRO_DA_ILHA.x + DESVIO_DO_FUNDO.x * descida, centroZ = CENTRO_DA_ILHA.z + DESVIO_DO_FUNDO.z * descida;
          aneis.push(CONTORNO_DA_ILHA.map((_, indice) => {
            const angulo = -Math.PI + indice * 2 * Math.PI / N, saliencia = lobulo(angulo);
            const raio = raioDaIlha(angulo) * Math.max(0.03, fracao * (1 + 0.5 * descida * saliencia + (0.04 + 0.1 * descida) * ruidoDoRaio[indice]));
            let posicaoX = centroX + Math.cos(angulo) * raio, posicaoZ = centroZ + Math.sin(angulo) * raio;
            // nunca passa da rocha da beira (senão o fundo vira uma prateleira visível de cima)
            const anguloReal = Math.atan2(posicaoZ - CENTRO_DA_ILHA.z, posicaoX - CENTRO_DA_ILHA.x), distancia = Math.hypot(posicaoX - CENTRO_DA_ILHA.x, posicaoZ - CENTRO_DA_ILHA.z), limite = raioDaIlha(anguloReal) - 10 - 3 * camada;
            if (distancia > limite) { posicaoX = CENTRO_DA_ILHA.x + (posicaoX - CENTRO_DA_ILHA.x) * limite / distancia; posicaoZ = CENTRO_DA_ILHA.z + (posicaoZ - CENTRO_DA_ILHA.z) * limite / distancia; }
            return { x: posicaoX, y: altura + 2.5 * ruidoDaAltura[indice] - 11 * descida * Math.max(0, saliencia), z: posicaoZ, cor };
          }));
        });
        const ponta = { x: CENTRO_DA_ILHA.x + DESVIO_DO_FUNDO.x * 1.1, y: -59, z: CENTRO_DA_ILHA.z + DESVIO_DO_FUNDO.z * 1.1, cor: 0x4a4b4f };
        const posicoes = [], cores = [], corDoVertice = new THREE.Color();
        const vertice = (ponto, tom) => {
          posicoes.push(ponto.x, ponto.y, ponto.z);
          corDoVertice.setHex(ponto.cor).multiplyScalar(tom);
          cores.push(corDoVertice.r, corDoVertice.g, corDoVertice.b);
        };
        // abaixo da grama cada triângulo ganha um tom próprio: as facetas da terra e da rocha aparecem mesmo na sombra
        const triangulo = (a, b, c) => { const tom = Math.min(a.y, b.y, c.y) < -1 ? 0.84 + sortear() * 0.3 : 1; vertice(a, tom); vertice(b, tom); vertice(c, tom); };
        for (let camada = 0; camada < aneis.length - 1; camada++) {
          for (let indice = 0; indice < N; indice++) {
            const seguinte = (indice + 1) % N, a = aneis[camada][indice], b = aneis[camada][seguinte], c = aneis[camada + 1][indice], d = aneis[camada + 1][seguinte];
            triangulo(a, b, c); triangulo(b, d, c);
          }
        }
        const ultimo = aneis[aneis.length - 1];
        for (let indice = 0; indice < N; indice++) triangulo(ultimo[indice], ultimo[(indice + 1) % N], ponta);
        // Rochas penduradas: cones tortos de 7 lados presos por dentro do fundo (o topo fica acima da superfície inclinada).
        // Três grandes nos anéis de cima do fundo e seis menores espalhadas.
        const pendurarRocha = (camada, raioDaRocha, comprimento) => {
          const base = aneis[CAMADAS_DA_BEIRA.length + camada][Math.floor(sortear() * N)];
          const centroX = CENTRO_DA_ILHA.x + (base.x - CENTRO_DA_ILHA.x) * 0.9, centroZ = CENTRO_DA_ILHA.z + (base.z - CENTRO_DA_ILHA.z) * 0.9, topoY = base.y + 2 + raioDaRocha * 1.6;
          const inclinacaoX = (sortear() - 0.5) * raioDaRocha, inclinacaoZ = (sortear() - 0.5) * raioDaRocha;
          const bico = { x: centroX + inclinacaoX, y: base.y - comprimento, z: centroZ + inclinacaoZ, cor: 0x47484c };
          const meio = [], topo = [];
          for (let lado = 0; lado < 7; lado++) {
            const angulo = lado * 2 * Math.PI / 7 + sortear() * 0.4, tremor = 0.8 + sortear() * 0.4;
            topo.push({ x: centroX + Math.cos(angulo) * raioDaRocha * tremor, y: topoY, z: centroZ + Math.sin(angulo) * raioDaRocha * tremor, cor: 0x66676b });
            meio.push({ x: centroX + inclinacaoX * 0.45 + Math.cos(angulo) * raioDaRocha * 0.6 * tremor, y: base.y - comprimento * (0.35 + sortear() * 0.2), z: centroZ + inclinacaoZ * 0.45 + Math.sin(angulo) * raioDaRocha * 0.6 * tremor, cor: 0x5a5b5f });
          }
          for (let lado = 0; lado < 7; lado++) {
            const proximo = (lado + 1) % 7;
            triangulo(topo[lado], topo[proximo], meio[lado]); triangulo(topo[proximo], meio[proximo], meio[lado]); triangulo(meio[lado], meio[proximo], bico);
          }
        };
        for (let indice = 0; indice < 3; indice++) pendurarRocha(1 + indice, 6 + sortear() * 3, 14 + sortear() * 8);
        for (let indice = 0; indice < 6; indice++) pendurarRocha(Math.floor(sortear() * 5), 2.5 + sortear() * 3, 7 + sortear() * 9);
        const geometria = new THREE.BufferGeometry();
        geometria.setAttribute('position', new THREE.Float32BufferAttribute(posicoes, 3));
        geometria.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
        geometria.computeVertexNormals();   // sem índices: cada triângulo tem a própria normal (visual facetado, como as montanhas)
        const malha = new THREE.Mesh(geometria, new THREE.MeshLambertMaterial({ vertexColors: true }));
        malha.userData.parteDaIlha = true;
        return malha;
      })();
      cena.add(ladosDaIlha);
      chao.userData.parteDaIlha = true;
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
      // == POSTOS DOS NPCS INDEPENDENTES (Guardião da Mina e Lenhador) ==
      // Definidos aqui, ANTES da floresta e da vegetação (seção 11), para que as árvores e arbustos instanciados sejam escondidos
      // dentro das clareiras (malhaInstanciada, seção 11b) sem mudar a semente da floresta: o resto do mapa fica idêntico.
      // Guardião: fora da caverna, ao lado esquerdo de quem olha a boca (coordenadas do pórtico: x lateral, z para fora). O lado
      // direito fica livre para o castelete do nível 3 da mina e os caixotes do nível 2 ficam entre ele e a entrada.
      const POSTO_DO_GUARDIAO = (() => {
        const { boca, direcaoParaDentro, giroDaEntrada } = MINA_GEOMETRIA;
        const paraFora = direcaoParaDentro.clone().negate(), esquerda = new THREE.Vector3(direcaoParaDentro.z, 0, -direcaoParaDentro.x);
        const ponto = (lateral, frente) => boca.clone().addScaledVector(esquerda, lateral).addScaledVector(paraFora, frente);
        const pessoa = ponto(3.6, 4.4);
        return { x: pessoa.x, z: pessoa.z, giro: giroDaEntrada + 0.55, ponto, giroDaEntrada };
      })();
      // Acampamento do lenhador: clareira na floresta depois da ponte, ao sul do fim da estrada oeste e do depósito da mina.
      // Fica fora da grade de navegação da equipe (x < −26): ninguém da equipe nem os monstros entram nele.
      const ACAMPAMENTO_DO_LENHADOR = { x: -34, z: 9, raio: 7.2, trilha: [[-28.2, 1.0], [-31.2, 4.2]] };
      const CLAREIRAS_DOS_NPCS = [
        [POSTO_DO_GUARDIAO.ponto(4.2, 4.0).x, POSTO_DO_GUARDIAO.ponto(4.2, 4.0).z, 2.6],
        [ACAMPAMENTO_DO_LENHADOR.x, ACAMPAMENTO_DO_LENHADOR.z, ACAMPAMENTO_DO_LENHADOR.raio],
      ];
      const estaNaClareiraDosNpcs = (posicaoX, posicaoZ) => CLAREIRAS_DOS_NPCS.some(([centroX, centroZ, raio]) => Math.hypot(posicaoX - centroX, posicaoZ - centroZ) < raio)
        || estaNaTrilhaDoLenhador(posicaoX, posicaoZ, 1.1);
      // Trilha de terra que liga o fim da estrada oeste ao acampamento (segmento com folga).
      const estaNaTrilhaDoLenhador = function estaNaTrilhaDoLenhador(posicaoX, posicaoZ, folga) {
        const [[xInicial, zInicial], [xFinal, zFinal]] = ACAMPAMENTO_DO_LENHADOR.trilha, segmentoX = xFinal - xInicial, segmentoZ = zFinal - zInicial;
        const fracao = Math.max(0, Math.min(1, ((posicaoX - xInicial) * segmentoX + (posicaoZ - zInicial) * segmentoZ) / (segmentoX * segmentoX + segmentoZ * segmentoZ)));
        return Math.hypot(posicaoX - (xInicial + segmentoX * fracao), posicaoZ - (zInicial + segmentoZ * fracao)) < folga;
      };
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
      // Fazenda 8.4.1: nuvens baixas, abaixo da beira da ilha. Uma malha só (1 chamada de desenho), parada, com sorteio
      // próprio (semente 8420); escurece à noite com os demais materiais básicos e fica escondida no Modo Leve (seção 21).
      const nuvensDeBaixoDaIlha = (() => {
        const sortear = criarGeradorDeNumerosAleatorios(8420), posicoes = [], cores = [], corDoTopo = new THREE.Color(0xf4f8ff), corDeBaixo = new THREE.Color(0xc4d2e4), cor = new THREE.Color();
        const sopro = new THREE.SphereGeometry(1, 8, 5).toNonIndexed(), matriz = new THREE.Matrix4(), ponto = new THREE.Vector3();
        for (let indice = 0; indice < 7; indice++) {
          const angulo = -Math.PI + (indice + 0.3 + sortear() * 0.4) * 2 * Math.PI / 7, distancia = raioDaIlha(angulo) * (0.95 + sortear() * 0.25);
          const centroX = CENTRO_DA_ILHA.x + Math.cos(angulo) * distancia, centroZ = CENTRO_DA_ILHA.z + Math.sin(angulo) * distancia, centroY = -16 - sortear() * 18;
          const escala = 1 + sortear() * 0.8, sopros = 6 + Math.floor(sortear() * 3);
          for (let indiceDoSopro = 0; indiceDoSopro < sopros; indiceDoSopro++) {
            const deslocamento = (indiceDoSopro / (sopros - 1) - 0.5) * 14 * escala, largura = (3 + sortear() * 2.5) * escala * (1 - Math.abs(deslocamento) / (14 * escala));
            matriz.makeRotationY(-angulo - Math.PI / 2).multiply(new THREE.Matrix4().makeTranslation(deslocamento, sortear() * 1.2, (sortear() - 0.5) * 3 * escala)).multiply(new THREE.Matrix4().makeScale(largura + 1.5, (largura + 1.5) * 0.42, largura + 1.5));
            for (let vertice = 0; vertice < sopro.attributes.position.count; vertice++) {
              ponto.fromBufferAttribute(sopro.attributes.position, vertice);
              cor.copy(corDeBaixo).lerp(corDoTopo, Math.min(1, Math.max(0, ponto.y * 0.6 + 0.6)));   // claras em cima, azuladas embaixo
              ponto.applyMatrix4(matriz);
              posicoes.push(centroX + ponto.x, centroY + ponto.y, centroZ + ponto.z); cores.push(cor.r, cor.g, cor.b);
            }
          }
        }
        sopro.dispose();
        const geometria = new THREE.BufferGeometry();
        geometria.setAttribute('position', new THREE.Float32BufferAttribute(posicoes, 3));
        geometria.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
        const malha = new THREE.Mesh(geometria, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false }));
        malha.userData.parteDaIlha = true;
        return malha;
      })();
      cena.add(nuvensDeBaixoDaIlha);

      arquivoDaMontagemConcluido('09-cenario-fixo.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
