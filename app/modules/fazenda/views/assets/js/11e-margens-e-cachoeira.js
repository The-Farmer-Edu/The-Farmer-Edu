      // ====================================================================================================
      // FARMEDU 3D — 11e-margens-e-cachoeira.js (Fase 3B da refatoração: seção 11 — margens e cachoeira)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // margens: pedras, pinheiros e capim (menos perto da ponte)
      for (let fracaoDoRio = 0.02; fracaoDoRio < 0.98; fracaoDoRio += 0.012) {
        const pontoDoRio = curvaDoRio.getPointAt(fracaoDoRio), tangente = curvaDoRio.getTangentAt(fracaoDoRio);
        if (Math.abs(pontoDoRio.z + 1) < 8 || fracaoDoRio < 0.07) continue;
        const lado = numeroAleatorioDoCenario() < 0.5 ? -1 : 1, afastamentoDaMargem = larguraDoRio(fracaoDoRio) / 2 + 1.1 + numeroAleatorioDoCenario() * 1.6, sorteado = numeroAleatorioDoCenario();
        const posicaoX = pontoDoRio.x + tangente.z * lado * afastamentoDaMargem, posicaoZ = pontoDoRio.z - tangente.x * lado * afastamentoDaMargem;
        if (sorteado < 0.45) criarPedra(cena, posicaoX, posicaoZ, 0.2 + numeroAleatorioDoCenario() * 0.35);
        else if (sorteado < 0.7) { const escala = 0.7 + numeroAleatorioDoCenario() * 0.5; if (podeColocarArvore(posicaoX, posicaoZ, escala, 2.6)) { criarPinheiro(cena, posicaoX, posicaoZ, escala); REGISTRO_DE_ARVORES.adicionar(posicaoX, posicaoZ, escala); } }
        else criarCapim(cena, posicaoX, posicaoZ);
      }
      // pinheiros do vale, ao redor do paredão da cachoeira (nunca na frente dela)
      for (let indice = 0, quantidadeColocada = 0; indice < 800 && quantidadeColocada < 26; indice++) {
        const posicaoX = -42 + numeroAleatorioDoCenario() * 48, posicaoZ = -38 + numeroAleatorioDoCenario() * 22;
        if (distanciaDoRio(posicaoX, posicaoZ) < 7 || Math.abs(posicaoX - CENTRO_X_DA_CACHOEIRA) < 13) continue;
        const escala = 0.8 + numeroAleatorioDoCenario() * 0.4;                       // mesma faixa de tamanhos da floresta (antes ia até 1,5)
        if (!podeColocarArvore(posicaoX, posicaoZ, escala)) continue;           // respeita relevo, construções, estradas e as outras árvores
        criarPinheiro(cena, posicaoX, posicaoZ, escala); REGISTRO_DE_ARVORES.adicionar(posicaoX, posicaoZ, escala); quantidadeColocada++;
      }

      // --- Cachoeira: paredão de pedra em degraus, lago em cima, cortina de água animada e névoa embaixo ---
      // (CX, CZ_FRENTE e ALTURA_CLIFF definidos acima)
      criarCaixa(14, 8, 10, 0x7d776c, CENTRO_X_DA_CACHOEIRA, 4, Z_DA_FRENTE_DA_CACHOEIRA - 5, cena);          // degrau de baixo
      criarCaixa(10, 7, 8, 0x8a8478, CENTRO_X_DA_CACHOEIRA, 11.5, Z_DA_FRENTE_DA_CACHOEIRA - 4, cena);         // degrau de cima (mesma face da frente)
      criarCaixa(10.2, 0.3, 8.2, 0x6fae4a, CENTRO_X_DA_CACHOEIRA, 15.15, Z_DA_FRENTE_DA_CACHOEIRA - 4, cena);  // grama no topo
      const lagoDeCima = criarCaixa(3.4, 0.06, 7.2, 0x4aa8d8, CENTRO_X_DA_CACHOEIRA, 15.33, Z_DA_FRENTE_DA_CACHOEIRA - 3.55, cena); // lago de onde a água cai
      // Fazenda 8.4.1: o lago de cima usa uma cópia da textura do rio (raso nas laterais, fundo no meio), correndo devagar até a
      // borda. Na face de cima da caixa, v = 1 no fundo e v = 0 na borda da queda: por isso o offset aumenta (no rio diminui).
      const texturaDoLagoDeCima = texturaDoRio.clone(); texturaDoLagoDeCima.needsUpdate = true;
      lagoDeCima.material = new THREE.MeshLambertMaterial({ map: texturaDoLagoDeCima });
      animacoesDoCenario.push((tempoDecorrido, segundosDesdeUltimoFrame) => { texturaDoLagoDeCima.offset.y += segundosDesdeUltimoFrame * 0.12; });
      for (const lado of [-1, 1]) {                                           // pedras laterais
        const cone = new THREE.Mesh(new THREE.ConeGeometry(3.5, 9, 6), materialPlano(0x7d776c));
        cone.position.set(CENTRO_X_DA_CACHOEIRA + lado * 8, 4.5, Z_DA_FRENTE_DA_CACHOEIRA - 2); cone.castShadow = true; cena.add(cone);
      }
      criarPinheiro(cena, CENTRO_X_DA_CACHOEIRA - 3.6, Z_DA_FRENTE_DA_CACHOEIRA - 4, 1.1, 15.3); criarPinheiro(cena, CENTRO_X_DA_CACHOEIRA + 3.4, Z_DA_FRENTE_DA_CACHOEIRA - 5.5, 0.9, 15.3); criarPinheiro(cena, CENTRO_X_DA_CACHOEIRA + 4, Z_DA_FRENTE_DA_CACHOEIRA - 2.5, 0.8, 15.3);
      // Fazenda 8.4.1: cortina d'água redesenhada (antes: um plano reto com listras quadradas e bordas duras, colado ao paredão).
      // Agora é uma lâmina que nasce no lago de cima, dobra sobre a borda e cai em arco (afasta-se do paredão como um jato: raiz
      // quadrada da queda), alargando um pouco até o poço; as bordas laterais se desfazem na textura e a água clareia embaixo.
      // Duas camadas com a mesma forma correm em velocidades diferentes, o que dá profundidade à queda. Mesma largura no topo e
      // mesmo ponto de queda (dentro da espuma); materiais "Basic" como antes, então escurecem à noite pelo registro do ciclo.
      const criarTexturaDaCortina = function criarTexturaDaCortina(semente, alfaDoFundo, quantidadeDeRiscos, alfaDosRiscos) {
        const largura = 128, altura = 512, canvasDaTextura = document.createElement('canvas'); canvasDaTextura.width = largura; canvasDaTextura.height = altura;
        const contexto2d = canvasDaTextura.getContext('2d'), sortearNumero = criarGeradorDeNumerosAleatorios(semente);   // gerador próprio
        contexto2d.fillStyle = `rgba(178,226,246,${alfaDoFundo})`; contexto2d.fillRect(0, 0, largura, altura);
        contexto2d.lineCap = 'round';
        for (let indice = 0; indice < quantidadeDeRiscos; indice++) {                                   // fios de água descendo
          const posicaoX = largura * (0.04 + sortearNumero() * 0.92), posicaoY = sortearNumero() * altura, comprimento = 50 + sortearNumero() * 170, claro = sortearNumero() < 0.85;
          contexto2d.lineWidth = 1.5 + sortearNumero() * 4.5;
          contexto2d.strokeStyle = claro ? `rgba(255,255,255,${(alfaDosRiscos * (0.4 + sortearNumero() * 0.6)).toFixed(2)})` : `rgba(60,135,190,${(0.35 * (0.5 + sortearNumero() * 0.5)).toFixed(2)})`;
          for (const deslocamentoY of [-altura, 0, altura]) { contexto2d.beginPath(); contexto2d.moveTo(posicaoX, posicaoY + deslocamentoY); contexto2d.lineTo(posicaoX, posicaoY + deslocamentoY + comprimento); contexto2d.stroke(); }
        }
        contexto2d.globalCompositeOperation = 'destination-in';                                         // bordas laterais que se desfazem
        const mascara = contexto2d.createLinearGradient(0, 0, largura, 0);
        [[0, 0], [0.12, 1], [0.88, 1], [1, 0]].forEach(([parada, alfa]) => mascara.addColorStop(parada, `rgba(0,0,0,${alfa})`));
        contexto2d.fillStyle = mascara; contexto2d.fillRect(0, 0, largura, altura);
        const textura = new THREE.CanvasTexture(canvasDaTextura);
        textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
        return textura;
      };
      // Perfil da lâmina no plano (y, z): trecho deitado sobre o lago de cima, dobra na borda e queda em arco até o poço.
      const perfilDaCortina = [[15.38, -0.9], [15.39, -0.4], [15.33, 0]];
      for (let passo = 0; passo <= 20; passo++) { const queda = passo / 20; perfilDaCortina.push([15.15 * (1 - queda), 0.12 + 0.55 * Math.sqrt(queda)]); }
      const criarGeometriaDaCortina = function criarGeometriaDaCortina(larguraNoTopo, colunas = 8) {
        const distancias = [0]; for (let indice = 1; indice < perfilDaCortina.length; indice++) distancias.push(distancias[indice - 1] + Math.hypot(perfilDaCortina[indice][0] - perfilDaCortina[indice - 1][0], perfilDaCortina[indice][1] - perfilDaCortina[indice - 1][1]));
        const comprimentoTotal = distancias[distancias.length - 1], posicoes = [], coordenadasUV = [], cores = [], indices = [];
        perfilDaCortina.forEach(([posicaoY, posicaoZ], linha) => {
          const queda = Math.max(0, 1 - posicaoY / 15.15), meiaLargura = larguraNoTopo / 2 * (1 + 0.12 * queda), brilho = 0.86 + 0.14 * queda;
          for (let coluna = 0; coluna <= colunas; coluna++) {
            const fracaoU = coluna / colunas, centro = 1 - (2 * fracaoU - 1) ** 2;
            posicoes.push((fracaoU * 2 - 1) * meiaLargura, posicaoY, posicaoZ + (linha > 2 ? 0.08 * centro : 0));   // a queda abaula um pouco no meio
            coordenadasUV.push(fracaoU, 1 - distancias[linha] / comprimentoTotal);
            cores.push(brilho * 0.93, brilho * 0.97, brilho);
            if (linha && coluna) { const atual = linha * (colunas + 1) + coluna, acima = atual - colunas - 1; indices.push(acima - 1, atual - 1, acima, acima, atual - 1, atual); }
          }
        });
        const geometria = new THREE.BufferGeometry();
        geometria.setAttribute('position', new THREE.Float32BufferAttribute(posicoes, 3));
        geometria.setAttribute('uv', new THREE.Float32BufferAttribute(coordenadasUV, 2));
        geometria.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
        geometria.setIndex(indices);
        geometria.userData.comprimento = comprimentoTotal;
        return geometria;
      };
      const geometriaDaCortina = criarGeometriaDaCortina(3.4);
      // [semente, alfa do fundo, riscos, alfa dos riscos, opacidade, velocidade, afastamento do paredão, escala da largura]
      for (const [semente, alfaDoFundo, quantidadeDeRiscos, alfaDosRiscos, opacidade, velocidade, afastamento, escalaDaLargura] of [[7, 1, 80, 0.8, 0.97, 0.55, 0, 1], [13, 0.12, 34, 0.9, 0.85, 0.95, 0.07, 0.94]]) {
        const textura = criarTexturaDaCortina(semente, alfaDoFundo, quantidadeDeRiscos, alfaDosRiscos);
        textura.repeat.set(1, geometriaDaCortina.userData.comprimento / 6);
        const camada = new THREE.Mesh(geometriaDaCortina, new THREE.MeshBasicMaterial({ map: textura, vertexColors: true, transparent: true, opacity: opacidade, side: THREE.DoubleSide, depthWrite: !afastamento }));
        camada.position.set(CENTRO_X_DA_CACHOEIRA, 0, Z_DA_FRENTE_DA_CACHOEIRA + afastamento); camada.scale.x = escalaDaLargura;
        cena.add(camada);
        animacoesDoCenario.push((tempoDecorrido, segundosDesdeUltimoFrame) => { textura.offset.y += segundosDesdeUltimoFrame * velocidade; }); // a água desce
      }
      criarCilindro(4.6, 4.6, 0.05, 0xc2a56b, CENTRO_X_DA_CACHOEIRA, 0.06, Z_DA_FRENTE_DA_CACHOEIRA + 2.5, cena, 24);  // areia ao redor do poço
      const poco = criarCilindro(4.2, 4.2, 0.06, 0x57b3dd, CENTRO_X_DA_CACHOEIRA, 0.09, Z_DA_FRENTE_DA_CACHOEIRA + 2.5, cena, 24);  // poço no pé da cachoeira
      // Fazenda 8.4.1: o poço era um disco de um azul só. Agora tem textura própria: fundo escuro sob a queda, clareando até a
      // água rasa da borda. Na tampa do cilindro, u segue o eixo z do mundo e v o eixo x, então a queda (1,9 atrás do centro)
      // fica em u ≈ 0,27, v = 0,5. Três anéis claros se abrem a partir do pé da queda, como os do lago da praça.
      const canvasDoPoco = document.createElement('canvas'); canvasDoPoco.width = canvasDoPoco.height = 128;
      const contextoDoPoco = canvasDoPoco.getContext('2d'), gradienteDoPoco = contextoDoPoco.createRadialGradient(0.27 * 128, 64, 4, 0.4 * 128, 64, 78);
      [[0, '#1f6fa8'], [0.45, '#2f8fc4'], [0.8, '#4fb0d6'], [1, '#86d6e4']].forEach(([parada, cor]) => gradienteDoPoco.addColorStop(parada, cor));
      contextoDoPoco.fillStyle = gradienteDoPoco; contextoDoPoco.fillRect(0, 0, 128, 128);
      poco.material = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvasDoPoco) });
      const aneisDoPoco = [];
      for (let indice = 0; indice < 3; indice++) {
        const anel = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
        anel.rotation.x = -Math.PI / 2; anel.position.set(CENTRO_X_DA_CACHOEIRA, 0.13, Z_DA_FRENTE_DA_CACHOEIRA + 0.9); anel.userData.animado = true;
        cena.add(anel); aneisDoPoco.push(anel);
      }
      animacoesDoCenario.push(tempoDecorrido => aneisDoPoco.forEach((anel, indice) => {
        const progresso = (tempoDecorrido * 0.35 + indice / 3) % 1, escala = 1 + 1.6 * progresso;
        anel.scale.set(escala, escala, 1); anel.material.opacity = 0.4 * (1 - progresso);
      }));
      // Fazenda 8.4: a espuma usava o Lambert branco COMPARTILHADO do cache, que fica cinza-esverdeado no lado voltado para a
      // câmera (o sol vem do norte, por trás do paredão). Agora tem material próprio "Basic" (quase opaco), que entra no registro
      // do ciclo e escurece à noite como a névoa; um sombreado suave nos vértices (topo branco, laterais azuladas) dá o volume.
      const materialDaEspuma = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, opacity: 0.92 });
      for (let indice = 0; indice < 7; indice++) {                                                  // espuma pulsando
        const espuma = criarEsfera(0.5 + (indice % 3) * 0.12, 0xffffff, CENTRO_X_DA_CACHOEIRA + (indice - 3) * 0.55, 0.3, Z_DA_FRENTE_DA_CACHOEIRA + 0.9 + (indice % 2) * 0.4, cena, 0.7);
        const normais = espuma.geometry.attributes.normal, cores = [];
        for (let vertice = 0; vertice < normais.count; vertice++) { const luz = 0.5 + 0.5 * normais.getY(vertice); cores.push(0.84 + 0.16 * luz, 0.89 + 0.11 * luz, 0.93 + 0.07 * luz); }
        espuma.geometry.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
        espuma.material = materialDaEspuma; espuma.castShadow = false; espuma.userData.animado = true;
        animacoesDoCenario.push(tempoDecorrido => espuma.scale.set(1 + 0.12 * Math.sin(tempoDecorrido * 4 + indice), 0.7 + 0.1 * Math.sin(tempoDecorrido * 5 + indice), 1 + 0.12 * Math.sin(tempoDecorrido * 4 + indice)));
      }
      // Fazenda 8.4: a névoa eram esferas brancas a 38% sobre o paredão (sempre na sombra), lidas como bolas cinzentas de borda
      // dura. Agora cada nuvem é um plano virado para a câmera com miolo cheio e borda que some aos poucos.
      const canvasDaNevoa = document.createElement('canvas'); canvasDaNevoa.width = canvasDaNevoa.height = 64;
      const contextoDaNevoa = canvasDaNevoa.getContext('2d'), gradienteDaNevoa = contextoDaNevoa.createRadialGradient(32, 32, 0, 32, 32, 32);
      [[0, 1], [0.4, 0.8], [0.7, 0.35], [1, 0]].forEach(([parada, alfa]) => gradienteDaNevoa.addColorStop(parada, `rgba(255,255,255,${alfa})`));
      contextoDaNevoa.fillStyle = gradienteDaNevoa; contextoDaNevoa.fillRect(0, 0, 64, 64);
      const geometriaDaNevoa = new THREE.PlaneGeometry(2, 2), texturaDaNevoa = new THREE.CanvasTexture(canvasDaNevoa);
      for (let indice = 0; indice < 8; indice++) {                                                  // névoa subindo
        const nevoa = new THREE.Mesh(geometriaDaNevoa, new THREE.MeshBasicMaterial({ color: 0xffffff, map: texturaDaNevoa, transparent: true, depthWrite: false }));
        nevoa.userData.animado = true; cena.add(nevoa);
        const deslocamentoX = (numeroAleatorioDoCenario() - 0.5) * 3.2;
        animacoesDoCenario.push(tempoDecorrido => {
          const progresso = (tempoDecorrido * 0.25 + indice / 8) % 1;
          nevoa.position.set(CENTRO_X_DA_CACHOEIRA + deslocamentoX, 0.6 + progresso * 4.5, Z_DA_FRENTE_DA_CACHOEIRA + 0.5 + progresso * 1.5);
          nevoa.quaternion.copy(camera.quaternion);
          nevoa.scale.setScalar(0.8 + progresso * 1.6);
          nevoa.material.opacity = 0.7 * (1 - progresso);
        });
      }


      arquivoDaMontagemConcluido('11e-margens-e-cachoeira.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
