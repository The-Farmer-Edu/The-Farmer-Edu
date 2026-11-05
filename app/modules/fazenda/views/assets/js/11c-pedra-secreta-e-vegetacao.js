      // ====================================================================================================
      // FARMEDU 3D — 11c-pedra-secreta-e-vegetacao.js (Fase 3B da refatoração: seção 11 — pedra secreta e vegetação)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ---- Pedra secreta (Easter egg): menir facetado com placa de símbolo, cristais discretos e musgo, numa clareira da floresta ----
      const pedraSecreta = (() => {
        const grupo = new THREE.Group(); grupo.position.set(PEDRA_SECRETA.x, 0, PEDRA_SECRETA.z); grupo.rotation.y = Math.atan2(-11.5 - PEDRA_SECRETA.x, 62 - PEDRA_SECRETA.z); // de frente para a câmera inicial
        grupo.scale.setScalar(0.85); grupo.userData.segredo = 'pedra-secreta'; cena.add(grupo);
        const sombra = malha => { malha.castShadow = malha.receiveShadow = true; return malha; };
        const corpo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.95, 1.5, 6), materialPlano(0x8d98a3))); corpo.position.y = 0.7; corpo.rotation.y = 0; grupo.add(corpo);
        const topo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.62, 0.5, 6), materialPlano(0x9aa5b0))); topo.position.y = 1.7; grupo.add(topo);
        // placa lisa na face frontal (a face do hexágono que aponta para +z fica a 30°) com um símbolo de sol gravado
        const cara = new THREE.Group(); cara.rotation.y = Math.PI / 6; cara.position.y = 0.75; grupo.add(cara);
        const raioNaAltura = posicaoY => 0.785 - 0.22 * (posicaoY - 0.7), apotema = raioNaAltura(0.75) * Math.cos(Math.PI / 6);
        const placa = new THREE.Group(); placa.position.set(0, 0, apotema + 0.012); placa.rotation.x = -0.19; cara.add(placa);
        const peca = (geometria, cor, posicaoX, posicaoY, posicaoZ) => { const malha = new THREE.Mesh(geometria, materialPlano(cor)); malha.position.set(posicaoX, posicaoY, posicaoZ); placa.add(malha); return malha; };
        peca(new THREE.BoxGeometry(0.52, 0.52, 0.03), 0xa4aeb8, 0, 0, 0);
        peca(new THREE.TorusGeometry(0.13, 0.022, 5, 10), 0x55616d, 0, 0, 0.02);
        peca(new THREE.BoxGeometry(0.03, 0.4, 0.012), 0x55616d, 0, 0, 0.018);
        peca(new THREE.BoxGeometry(0.4, 0.03, 0.012), 0x55616d, 0, 0, 0.018);
        for (const [diferencaX, diferencaZ] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) peca(new THREE.BoxGeometry(0.045, 0.045, 0.012), 0x55616d, diferencaX * 0.2, diferencaZ * 0.2, 0.018);
        // cristais discretos (emissivos, mais vivos à noite) e pedras ao redor
        const materialDosCristais = new THREE.MeshLambertMaterial({ color: 0x8fe8f5, emissive: 0x2aa8c0, emissiveIntensity: 0.3, flatShading: true });
        const cristais = [[-0.78, 0.35, -0.35, 0.2, 0.55, -0.35], [-0.95, 0.22, 0.05, 0.14, 0.4, 0.5], [-0.62, 0.2, -0.7, 0.16, 0.45, -0.1], [0.82, 0.18, -0.5, 0.12, 0.33, 0.45]].map(([posicaoX, posicaoY, posicaoZ, raio, altura, inclinacao]) => {
          const cristal = new THREE.Mesh(new THREE.OctahedronGeometry(raio, 0), materialDosCristais); cristal.scale.set(0.75, altura / raio * 0.9, 0.75);
          cristal.position.set(posicaoX, posicaoY, posicaoZ); cristal.rotation.z = inclinacao * 0.5; cristal.rotation.y = posicaoX * 3; cristal.castShadow = true; grupo.add(cristal); return cristal;
        });
        criarPedra(grupo, 1.35, 0.5, 0.34); criarPedra(grupo, -1.25, 0.85, 0.26); criarPedra(grupo, 0.95, 1.2, 0.2); criarPedra(grupo, 1.5, -0.4, 0.22);
        for (const [posicaoX, posicaoZ, escalaX, escalaZ] of [[0.55, 0.62, 0.5, 0.4], [-0.5, 0.7, 0.4, 0.34], [0.2, -0.9, 0.55, 0.3]]) {   // musgo
          const malha = new THREE.Mesh(new THREE.SphereGeometry(1, 7, 5), material(0x4f8a3c)); malha.scale.set(escalaX, 0.1, escalaZ); malha.position.set(posicaoX, 0.05, posicaoZ); grupo.add(malha);
        }
        const hitbox = new THREE.Mesh(new THREE.SphereGeometry(1.7, 8, 6), new THREE.MeshBasicMaterial({ visible: false })); // área de clique (invisível)
        hitbox.material.userData.ignorarCiclo = true; hitbox.position.y = 1; grupo.add(hitbox);
        return { grupo: grupo, hitbox, cristais, materialDosCristais, pulso: 0 };
      })();
      // Anima o brilho dos cristais da pedra secreta: pulsa devagar, brilha mais à noite e reage ao clique
      // (pulso).
      const atualizarPedraSecreta = function atualizarPedraSecreta(tempo, segundosDesdeUltimoFrame) {
        pedraSecreta.pulso = Math.max(0, pedraSecreta.pulso - segundosDesdeUltimoFrame * 1.4);
        pedraSecreta.materialDosCristais.emissiveIntensity = 0.28 + 0.1 * Math.sin(tempo * 1.4) + 0.55 * ESTADO_DO_CEU.noite + pedraSecreta.pulso * 1.6;
      };

      // arbustos em pequenos grupos (floresta e margens do campo)
      {
        const itens = [];
        for (let quantidadeDeGrupos = 0, tentativas = 0; quantidadeDeGrupos < 80 && tentativas < 2000; tentativas++) {
          const centroX = -80 + numeroAleatorioDoCenario() * 170, centroZ = -30 + numeroAleatorioDoCenario() * 112;
          if (ocupado(centroX, centroZ, 2) || (dentroDaFazenda(centroX, centroZ) && numeroAleatorioDoCenario() < 0.7)) continue;
          quantidadeDeGrupos++;
          for (let indiceDoItem = 0, quantidadeNoGrupo = 2 + Math.floor(numeroAleatorioDoCenario() * 4); indiceDoItem < quantidadeNoGrupo; indiceDoItem++) {
            const posicaoX = centroX + (numeroAleatorioDoCenario() - 0.5) * 3.4, posicaoZ = centroZ + (numeroAleatorioDoCenario() - 0.5) * 3.4, tamanho = 0.35 + numeroAleatorioDoCenario() * 0.65;
            if (ocupado(posicaoX, posicaoZ, 0.6)) continue;
            itens.push([posicaoX, tamanho * 0.5, posicaoZ, tamanho * (1 + numeroAleatorioDoCenario() * 0.4), tamanho * (0.6 + numeroAleatorioDoCenario() * 0.3), tamanho * (1 + numeroAleatorioDoCenario() * 0.4), escolher([0x3f8a35, 0x4a9e3a, 0x5aa844, 0x2f7a30, 0x6fae4a]), numeroAleatorioDoCenario() * 3, 0]);
          }
        }
        malhaInstanciada(new THREE.SphereGeometry(1, 8, 6), itens);
      }
      // pedras pequenas e médias, formas e giros variados, cores das rochas da montanha
      {
        const itens = [];
        for (let quantidadeDeGrupos = 0, tentativas = 0; quantidadeDeGrupos < 70 && tentativas < 1500; tentativas++) {
          const centroX = -80 + numeroAleatorioDoCenario() * 170, centroZ = -30 + numeroAleatorioDoCenario() * 112;
          if (ocupado(centroX, centroZ, 1.5) || (dentroDaFazenda(centroX, centroZ) && numeroAleatorioDoCenario() < 0.6)) continue;
          quantidadeDeGrupos++;
          for (let indiceDoItem = 0, quantidadeNoGrupo = 1 + Math.floor(numeroAleatorioDoCenario() * 3); indiceDoItem < quantidadeNoGrupo; indiceDoItem++) {
            const posicaoX = centroX + (numeroAleatorioDoCenario() - 0.5) * 2.2, posicaoZ = centroZ + (numeroAleatorioDoCenario() - 0.5) * 2.2, tamanho = indiceDoItem ? 0.12 + numeroAleatorioDoCenario() * 0.2 : 0.22 + numeroAleatorioDoCenario() * 0.4;
            if (ocupado(posicaoX, posicaoZ, 0.5)) continue;
            itens.push([posicaoX, tamanho * 0.3, posicaoZ, tamanho * (0.8 + numeroAleatorioDoCenario() * 0.7), tamanho * (0.5 + numeroAleatorioDoCenario() * 0.4), tamanho * (0.8 + numeroAleatorioDoCenario() * 0.7), escolher([0x777b78, 0x8a8d86, 0x686d69, 0x9a9c94]), numeroAleatorioDoCenario() * 3.1, 0]);
          }
        }
        malhaInstanciada(new THREE.DodecahedronGeometry(1), itens);
      }
      // gramas: touceiras baixas, gramas altas e flores silvestres, só em áreas livres
      {
        const lamina = new THREE.BoxGeometry(0.05, 1, 0.04); lamina.translate(0, 0.5, 0);
        const folhas = [], hastes = [], cabecas = [];
        const baixa = [0x5f9d38, 0x70b843, 0x8bc653, 0x4e8733, 0xa0cb5a], alta = [0x3f7f2c, 0x4e8f33, 0x6aa83c];
        for (let tentativas = 0, quantidadeColocada = 0; tentativas < 4000 && quantidadeColocada < 560; tentativas++) {
          const posicaoX = -75 + numeroAleatorioDoCenario() * 160, posicaoZ = -32 + numeroAleatorioDoCenario() * 112;
          if (ocupado(posicaoX, posicaoZ, 0.8) || (dentroDaFazenda(posicaoX, posicaoZ) && numeroAleatorioDoCenario() < 0.4)) continue;
          quantidadeColocada++;
          const altaTouceira = numeroAleatorioDoCenario() < 0.3;
          for (let indiceDaFolha = 0, quantidadeDeFolhas = altaTouceira ? 6 : 4 + Math.floor(numeroAleatorioDoCenario() * 3); indiceDaFolha < quantidadeDeFolhas; indiceDaFolha++)
            folhas.push([posicaoX + (numeroAleatorioDoCenario() - 0.5) * 0.35, 0, posicaoZ + (numeroAleatorioDoCenario() - 0.5) * 0.35, 1, (altaTouceira ? 0.55 : 0.18) + numeroAleatorioDoCenario() * (altaTouceira ? 0.6 : 0.3), 1, escolher(altaTouceira ? alta : baixa), numeroAleatorioDoCenario() * 3.1, (numeroAleatorioDoCenario() - 0.5) * 0.6]);
        }
        for (let tentativas = 0, quantidadeColocada = 0; tentativas < 2000 && quantidadeColocada < 150; tentativas++) {
          const posicaoX = -75 + numeroAleatorioDoCenario() * 160, posicaoZ = -32 + numeroAleatorioDoCenario() * 112;
          if (ocupado(posicaoX, posicaoZ, 1)) continue;
          quantidadeColocada++;
          const altura = 0.3 + numeroAleatorioDoCenario() * 0.3;
          hastes.push([posicaoX, 0, posicaoZ, 1.2, altura, 1.2, 0x4f9e3a, 0, 0]);
          cabecas.push([posicaoX, altura, posicaoZ, 0.08 + numeroAleatorioDoCenario() * 0.05, 0.08 + numeroAleatorioDoCenario() * 0.05, 0.08 + numeroAleatorioDoCenario() * 0.05, escolher([0xffffff, 0xffd23f, 0xff8fb1, 0xb48cf2, 0xff6b6b]), 0, 0]);
        }
        malhaInstanciada(lamina, folhas); malhaInstanciada(lamina, hastes); malhaInstanciada(new THREE.SphereGeometry(1, 6, 4), cabecas);
      }

      arquivoDaMontagemConcluido('11c-pedra-secreta-e-vegetacao.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
