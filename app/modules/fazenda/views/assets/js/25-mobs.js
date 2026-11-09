      // ====================================================================================================
      // FARMEDU 3D — 25-mobs.js (Fase 3B da refatoração: seção 25)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================

      // ====================================================================================================
      // SEÇÃO 25 — MOBS HOSTIS: MODELOS, ANIMAÇÃO E POEIRA
      // Zumbi, esqueleto e vampiro (modelos originais em caixas), animação de caminhada/ataque e a reserva fixa de partículas de poeira.
      // ====================================================================================================
      const MOB_ESCALA = 0.85;
      const MODELOS_DE_MOB = {
        // Zumbi: pele esverdeada, roupas desbotadas e rasgadas, braços estendidos à frente
        zumbi(modelo, caixa) {
          const pele = 0x7aa564, peleEscura = 0x5f8a4e, camisa = 0x4f7f82, calca = 0x424762;
          modelo.pernas = [-1, 1].map(lado => { const grupoDaPerna = new THREE.Group(); grupoDaPerna.position.set(lado * 0.12, 0.8, 0); modelo.corpo.add(grupoDaPerna); caixa(grupoDaPerna, 0.2, 0.62, 0.2, calca, 0, -0.31, 0); caixa(grupoDaPerna, 0.21, 0.2, 0.23, 0x2a2d3d, 0, -0.7, 0.015); return grupoDaPerna; });
          caixa(modelo.corpo, 0.5, 0.2, 0.3, calca, 0, 0.88, 0); caixa(modelo.corpo, 0.5, 0.52, 0.3, camisa, 0, 1.24, 0);
          caixa(modelo.corpo, 0.2, 0.16, 0.02, pele, -0.1, 1.3, 0.155); caixa(modelo.corpo, 0.14, 0.2, 0.02, 0x2f4f3a, 0.14, 1.12, 0.155);      // rasgos e manchas
          for (const [posicaoX, altura] of [[-0.18, 0.16], [0, 0.1], [0.17, 0.2]]) caixa(modelo.corpo, 0.1, altura, 0.31, 0x34585a, posicaoX, 0.96 - altura / 2 + 0.06, 0); // barra esfarrapada
          modelo.bracos = [-1, 1].map(lado => { const grupoDoBraco = new THREE.Group(); grupoDoBraco.position.set(lado * 0.35, 1.45, 0); modelo.corpo.add(grupoDoBraco);
            caixa(grupoDoBraco, 0.18, 0.28, 0.18, camisa, 0, -0.14, 0); caixa(grupoDoBraco, 0.16, 0.32, 0.16, pele, 0, -0.44, 0); caixa(grupoDoBraco, 0.14, 0.1, 0.14, peleEscura, 0, -0.65, 0); return grupoDoBraco; });
          modelo.cabeca = new THREE.Group(); modelo.cabeca.position.set(0, 1.8, 0); modelo.corpo.add(modelo.cabeca);
          caixa(modelo.cabeca, 0.36, 0.36, 0.36, pele, 0, 0, 0); caixa(modelo.cabeca, 0.2, 0.06, 0.2, 0x3c5230, 0.04, 0.2, -0.04);
          for (const lado of [-1, 1]) { caixa(modelo.cabeca, 0.08, 0.06, 0.02, 0x15110e, lado * 0.09, 0.05, 0.185); caixa(modelo.cabeca, 0.03, 0.03, 0.021, 0xd03030, lado * 0.09, 0.05, 0.186); }
          caixa(modelo.cabeca, 0.2, 0.04, 0.02, 0x2a1a1a, 0, -0.1, 0.185); caixa(modelo.cabeca, 0.1, 0.06, 0.02, 0x6a1a1a, 0.1, -0.03, 0.185); // boca e ferida
          modelo.extra.bracoBase = -1.35;
        },
        // Esqueleto: ossos finos, crânio com órbitas escuras e uma espada na mão direita
        esqueleto(modelo, caixa) {
          const osso = 0xe8e4d2, sombra = 0xbab59f, escuro = 0x1b1b1b;
          modelo.pernas = [-1, 1].map(lado => { const grupoDaPerna = new THREE.Group(); grupoDaPerna.position.set(lado * 0.1, 0.8, 0); modelo.corpo.add(grupoDaPerna);
            caixa(grupoDaPerna, 0.1, 0.38, 0.1, osso, 0, -0.2, 0); caixa(grupoDaPerna, 0.12, 0.06, 0.12, sombra, 0, -0.4, 0); caixa(grupoDaPerna, 0.09, 0.34, 0.09, osso, 0, -0.59, 0); caixa(grupoDaPerna, 0.12, 0.06, 0.22, osso, 0, -0.77, 0.05); return grupoDaPerna; });
          caixa(modelo.corpo, 0.34, 0.12, 0.16, osso, 0, 0.86, 0); caixa(modelo.corpo, 0.07, 0.5, 0.07, sombra, 0, 1.2, -0.03);
          for (let indice = 0; indice < 4; indice++) caixa(modelo.corpo, 0.4 - indice * 0.03, 0.06, 0.2, osso, 0, 1.05 + indice * 0.12, 0);
          caixa(modelo.corpo, 0.52, 0.07, 0.1, osso, 0, 1.47, 0);
          modelo.bracos = [-1, 1].map(lado => { const grupoDoBraco = new THREE.Group(); grupoDoBraco.position.set(lado * 0.28, 1.45, 0); modelo.corpo.add(grupoDoBraco);
            caixa(grupoDoBraco, 0.08, 0.3, 0.08, osso, 0, -0.15, 0); caixa(grupoDoBraco, 0.1, 0.05, 0.1, sombra, 0, -0.32, 0); caixa(grupoDoBraco, 0.07, 0.28, 0.07, osso, 0, -0.47, 0); caixa(grupoDoBraco, 0.09, 0.08, 0.09, osso, 0, -0.65, 0); return grupoDoBraco; });
          modelo.cabeca = new THREE.Group(); modelo.cabeca.position.set(0, 1.7, 0); modelo.corpo.add(modelo.cabeca);
          caixa(modelo.cabeca, 0.32, 0.32, 0.3, osso, 0, 0, 0); caixa(modelo.cabeca, 0.24, 0.06, 0.26, osso, 0, -0.18, 0);
          for (const lado of [-1, 1]) caixa(modelo.cabeca, 0.08, 0.08, 0.02, escuro, lado * 0.08, 0.04, 0.155);
          caixa(modelo.cabeca, 0.04, 0.06, 0.02, escuro, 0, -0.04, 0.155); caixa(modelo.cabeca, 0.22, 0.05, 0.02, sombra, 0, -0.12, 0.152);
          for (const posicaoX of [-0.06, 0, 0.06]) caixa(modelo.cabeca, 0.02, 0.05, 0.022, escuro, posicaoX, -0.12, 0.153);
          const espada = new THREE.Group(); espada.position.set(0, -0.66, 0.04); espada.rotation.x = Math.PI / 2; modelo.bracos[1].add(espada); // lâmina para a frente
          caixa(espada, 0.05, 0.14, 0.05, 0x6a4a2a, 0, 0, 0); caixa(espada, 0.24, 0.04, 0.07, 0x3c3f46, 0, 0.09, 0);
          caixa(espada, 0.07, 0.8, 0.025, 0xb9c3cc, 0, 0.52, 0); caixa(espada, 0.02, 0.7, 0.028, 0x8e98a2, 0, 0.5, 0); caixa(espada, 0.05, 0.08, 0.022, 0xd5dde4, 0, 0.96, 0);
          modelo.extra.espada = espada;
        },
        // Vampiro: casaca preta com forro vermelho, gola alta, capa, olhos brilhantes e presas
        vampiro(modelo, caixa) {
          const pele = 0xdcd6e2, preto = 0x14111b, forro = 0x8a1020, prata = 0xc0c4cc, branco = 0xe8e8f0;
          const olho = new THREE.MeshLambertMaterial({ color: 0xff3040, emissive: 0xcc1020 });
          modelo.pernas = [-1, 1].map(lado => { const grupoDaPerna = new THREE.Group(); grupoDaPerna.position.set(lado * 0.11, 0.8, 0); modelo.corpo.add(grupoDaPerna);
            caixa(grupoDaPerna, 0.16, 0.62, 0.17, preto, 0, -0.31, 0); caixa(grupoDaPerna, 0.18, 0.24, 0.27, 0x0c0a10, 0, -0.68, 0.035); caixa(grupoDaPerna, 0.04, 0.04, 0.02, prata, 0, -0.6, 0.145); return grupoDaPerna; });
          caixa(modelo.corpo, 0.46, 0.5, 0.26, preto, 0, 1.22, 0); caixa(modelo.corpo, 0.48, 0.34, 0.28, preto, 0, 0.82, 0);           // tronco e casaca longa
          caixa(modelo.corpo, 0.07, 0.62, 0.275, forro, 0, 1.08, 0); caixa(modelo.corpo, 0.14, 0.1, 0.275, branco, 0, 1.42, 0);        // forro e gravata
          for (let indice = 0; indice < 3; indice++) caixa(modelo.corpo, 0.04, 0.04, 0.285, prata, 0.1, 1.28 - indice * 0.14, 0);
          for (const lado of [-1, 1]) { caixa(modelo.corpo, 0.08, 0.3, 0.1, preto, lado * 0.2, 1.6, -0.08); caixa(modelo.corpo, 0.02, 0.26, 0.1, forro, lado * 0.16, 1.6, -0.08); } // gola alta
          modelo.bracos = [-1, 1].map(lado => { const grupoDoBraco = new THREE.Group(); grupoDoBraco.position.set(lado * 0.31, 1.42, 0); modelo.corpo.add(grupoDoBraco);
            caixa(grupoDoBraco, 0.14, 0.62, 0.15, preto, 0, -0.31, 0); caixa(grupoDoBraco, 0.16, 0.07, 0.17, branco, 0, -0.6, 0); caixa(grupoDoBraco, 0.1, 0.14, 0.1, pele, 0, -0.7, 0);
            for (const posicaoX of [-0.03, 0, 0.03]) caixa(grupoDoBraco, 0.02, 0.1, 0.02, 0xeeeeee, posicaoX, -0.82, 0.02); return grupoDoBraco; });
          modelo.cabeca = new THREE.Group(); modelo.cabeca.position.set(0, 1.72, 0); modelo.corpo.add(modelo.cabeca);
          caixa(modelo.cabeca, 0.3, 0.34, 0.3, pele, 0, 0, 0); caixa(modelo.cabeca, 0.32, 0.12, 0.32, preto, 0, 0.2, -0.01); caixa(modelo.cabeca, 0.06, 0.06, 0.02, preto, 0, 0.14, 0.155);
          for (const lado of [-1, 1]) { caixa(modelo.cabeca, 0.07, 0.04, 0.02, olho, lado * 0.075, 0.03, 0.155); caixa(modelo.cabeca, 0.09, 0.025, 0.02, preto, lado * 0.075, 0.08, 0.155).rotation.z = lado * 0.3; caixa(modelo.cabeca, 0.025, 0.07, 0.02, 0xffffff, lado * 0.05, -0.12, 0.155); }
          caixa(modelo.cabeca, 0.04, 0.06, 0.02, 0xc9bfd0, 0, -0.03, 0.158); caixa(modelo.cabeca, 0.14, 0.025, 0.02, 0x5a1020, 0, -0.1, 0.155);
          const capa = new THREE.Group(); capa.position.set(0, 1.46, -0.16); modelo.corpo.add(capa); modelo.extra.capa = capa;                   // capa que balança
          caixa(capa, 0.7, 1, 0.04, preto, 0, -0.5, -0.02); caixa(capa, 0.66, 0.96, 0.02, forro, 0, -0.5, 0.01); caixa(capa, 0.76, 0.08, 0.12, preto, 0, 0, 0);
        },
      };
      // Monta o modelo 3D de um mob ("zumbi", "esqueleto" ou "vampiro") e o escala.
      const criarMob = function criarMob(tipo) {
        const raiz = new THREE.Group(), corpo = new THREE.Group(); raiz.add(corpo);
        const modelo = { raiz, corpo, tipo, pernas: [], bracos: [], cabeca: null, extra: {} };
        MODELOS_DE_MOB[tipo](modelo, criarFabricaDePecas().caixa);
        raiz.scale.setScalar(MOB_ESCALA);
        return modelo;
      };
      // Anima um mob: caminhada (pernas e braços) ou ataque (zumbi soca, esqueleto golpeia com a espada, vampiro
      // avança com as garras e a capa ondula) e posiciona o modelo.
      const animarMob = function animarMob(mob, segundosDesdeUltimoFrame, tempo, atacando) {
        const modelo = mob.modelo, amplitudeDoPasso = Math.min(1, mob.vel / mob.velMax), balancoDaPassada = Math.sin(mob.passo) * 0.7 * amplitudeDoPasso, tempoDaAnimacao = tempo + mob.fase;
        mob.passo += mob.vel * segundosDesdeUltimoFrame * 3.2;
        modelo.pernas[0].rotation.x = balancoDaPassada; modelo.pernas[1].rotation.x = -balancoDaPassada;
        modelo.corpo.position.y = Math.abs(Math.sin(mob.passo)) * 0.04 * amplitudeDoPasso; modelo.corpo.rotation.x = 0; modelo.corpo.rotation.z = Math.sin(mob.passo) * 0.03 * amplitudeDoPasso;
        if (mob.tipo === 'zumbi') {                                                  // braços à frente; no ataque, socam alternados
          const base = atacando ? -1.15 : -1.35, golpe = atacando ? Math.sin(tempoDaAnimacao * 7) * 0.6 : balancoDaPassada * 0.25;
          modelo.bracos[0].rotation.x = base + golpe; modelo.bracos[1].rotation.x = base - golpe; modelo.corpo.rotation.x = atacando ? 0.12 : 0;
        } else if (mob.tipo === 'esqueleto') {                                       // espada na direita: levanta e desce no ataque
          modelo.bracos[0].rotation.x = atacando ? -0.3 + Math.sin(tempoDaAnimacao * 4) * 0.2 : -balancoDaPassada * 0.9;
          modelo.bracos[1].rotation.x = atacando ? -1.35 - Math.sin(tempoDaAnimacao * 6) * 0.95 : -0.45 + balancoDaPassada * 0.2;
          modelo.corpo.rotation.x = atacando ? 0.1 : 0;
        } else {                                                                    // vampiro: avança com as garras e a capa ondula
          const balancoDasGarras = atacando ? -1.1 + Math.sin(tempoDaAnimacao * 5) * 0.3 : null;
          modelo.bracos[0].rotation.x = balancoDasGarras === null ? -balancoDaPassada * 0.6 : balancoDasGarras; modelo.bracos[1].rotation.x = balancoDasGarras === null ? balancoDaPassada * 0.6 : balancoDasGarras - 0.15;
          modelo.corpo.rotation.x = atacando ? 0.28 + Math.sin(tempoDaAnimacao * 5) * 0.06 : 0.04;
          modelo.extra.capa.rotation.x = 0.1 + Math.sin(tempoDaAnimacao * 3 + mob.passo) * 0.08 + amplitudeDoPasso * 0.2;
        }
        modelo.cabeca.rotation.y = atacando ? Math.sin(tempoDaAnimacao * 2) * 0.15 : 0;
        modelo.raiz.position.set(mob.x, 0, mob.z); modelo.raiz.rotation.y = mob.rot;
      };

      // ---- Poeira do ataque: reserva fixa de partículas, reaproveitadas (nada é criado durante o jogo) ----
      const PoeiraDeAtaque = (() => {
        const MAXIMO = 28, geometria = new THREE.BoxGeometry(0.18, 0.18, 0.18), materialDoObjeto = new THREE.MeshLambertMaterial({ color: 0xc9b690 });
        const itens = Array.from({ length: MAXIMO }, () => { const particula = new THREE.Mesh(geometria, materialDoObjeto); particula.visible = false; cena.add(particula); return { m: particula, vida: 0, duracao: 1, vx: 0, vy: 0, vz: 0 }; });
        let proximo = 0;
        return {
          emitir(posicaoX, posicaoY, posicaoZ, quantidade = 4, forca = 1) {
            for (let indice = 0; indice < quantidade; indice++) {
              const particula = itens[proximo]; proximo = (proximo + 1) % MAXIMO;
              particula.vida = particula.duracao = 0.5 + Math.random() * 0.4; particula.m.position.set(posicaoX, posicaoY, posicaoZ);
              particula.vx = (Math.random() - 0.5) * 1.8 * forca; particula.vy = 0.8 + Math.random() * 1.4 * forca; particula.vz = (Math.random() - 0.5) * 1.8 * forca; particula.m.visible = true;
            }
          },
          atualizar(segundosDesdeUltimoFrame) {
            for (const particula of itens) {
              if (particula.vida <= 0) continue;
              if ((particula.vida -= segundosDesdeUltimoFrame) <= 0) { particula.m.visible = false; continue; }
              particula.vy -= 4 * segundosDesdeUltimoFrame; particula.m.position.x += particula.vx * segundosDesdeUltimoFrame; particula.m.position.y = Math.max(0.05, particula.m.position.y + particula.vy * segundosDesdeUltimoFrame); particula.m.position.z += particula.vz * segundosDesdeUltimoFrame;
              particula.m.scale.setScalar(Math.max(0.1, particula.vida / particula.duracao)); particula.m.rotation.y += segundosDesdeUltimoFrame * 3;
            }
          },
          ativas() { return itens.filter(particula => particula.vida > 0).length; },
        };
      })();

      arquivoDaMontagemConcluido('25-mobs.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
