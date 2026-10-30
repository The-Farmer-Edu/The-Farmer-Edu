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
      criarCaixa(3.4, 0.06, 7.2, 0x4aa8d8, CENTRO_X_DA_CACHOEIRA, 15.33, Z_DA_FRENTE_DA_CACHOEIRA - 3.55, cena); // lago de onde a água cai
      for (const lado of [-1, 1]) {                                           // pedras laterais
        const cone = new THREE.Mesh(new THREE.ConeGeometry(3.5, 9, 6), materialPlano(0x7d776c));
        cone.position.set(CENTRO_X_DA_CACHOEIRA + lado * 8, 4.5, Z_DA_FRENTE_DA_CACHOEIRA - 2); cone.castShadow = true; cena.add(cone);
      }
      criarPinheiro(cena, CENTRO_X_DA_CACHOEIRA - 3.6, Z_DA_FRENTE_DA_CACHOEIRA - 4, 1.1, 15.3); criarPinheiro(cena, CENTRO_X_DA_CACHOEIRA + 3.4, Z_DA_FRENTE_DA_CACHOEIRA - 5.5, 0.9, 15.3); criarPinheiro(cena, CENTRO_X_DA_CACHOEIRA + 4, Z_DA_FRENTE_DA_CACHOEIRA - 2.5, 0.8, 15.3);
      const texturaDaCachoeira = criarTexturaDeAgua(64, 256, '#8fd3f0', 40, 90, 0.8, 5);
      texturaDaCachoeira.repeat.set(1, 3);
      const cortina = new THREE.Mesh(new THREE.PlaneGeometry(3.4, ALTURA_DO_PAREDAO), new THREE.MeshBasicMaterial({ map: texturaDaCachoeira, transparent: true, opacity: 0.92 }));
      cortina.position.set(CENTRO_X_DA_CACHOEIRA, ALTURA_DO_PAREDAO / 2, Z_DA_FRENTE_DA_CACHOEIRA + 0.15);
      cena.add(cortina);
      animacoesDoCenario.push((tempoDecorrido, segundosDesdeUltimoFrame) => { texturaDaCachoeira.offset.y += segundosDesdeUltimoFrame * 0.7; }); // a água desce
      criarCilindro(4.6, 4.6, 0.05, 0xc2a56b, CENTRO_X_DA_CACHOEIRA, 0.06, Z_DA_FRENTE_DA_CACHOEIRA + 2.5, cena, 24);  // areia ao redor do poço
      criarCilindro(4.2, 4.2, 0.06, 0x57b3dd, CENTRO_X_DA_CACHOEIRA, 0.09, Z_DA_FRENTE_DA_CACHOEIRA + 2.5, cena, 24);  // poço no pé da cachoeira
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
