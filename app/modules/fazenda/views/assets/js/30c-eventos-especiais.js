// ====================================================================================================
// FARMEDU 3D — 30c-eventos-especiais.js
// SEÇÃO 30c — EVENTOS ESPECIAIS (Etapa 2): a cena do céu da poção misteriosa e a abdução alienígena
// Script clássico carregado em sequência por fazenda.js, depois da integração (30b) e antes do laço (31). As funções daqui só
// são chamadas durante o jogo: atualizarEventosEspeciais (laço 30b) e aplicarCameraDosEventos (laço 31, logo depois de
// posicionarCamera). Nada aqui muda a órbita da câmera nem os controles: a cena só MISTURA a câmera da órbita com a câmera do
// evento por um peso de 0 a 1, então, quando o peso volta a 0, o jogador está exatamente onde estava.
//  • Cena do céu (poção misteriosa): a câmera sobe suavemente até enquadrar o céu da própria fazenda, um unicórnio montado com
//    peças 3D atravessa o céu soltando um arco-íris (faixas de 7 cores que ficam no céu por alguns segundos) e a câmera volta.
//    Música opcional: AUDIO_CONFIG.segredos.misterio (seção 02b).
//  • Abdução: um disco voador com um alienígena verde chega, acende o feixe sobre uma vaca do curral, a puxa para dentro e vai
//    embora. Etapa 1: a vaca sai por 20 s (estado.eventosEspeciais.alienigena.vacaAusente, salvo) e o disco a traz de volta, sem custo.
// Todos os objetos temporários são criados aqui e descartados no fim (geometrias, materiais e texturas próprias).
// ====================================================================================================

      // ---- utilidades ----
      const suavizarNoEvento = valor => { const t = Math.max(0, Math.min(1, valor)); return t * t * (3 - 2 * t); };
      const misturarNoEvento = (a, b, t) => a + (b - a) * t;
      const CORES_DO_ARCO_IRIS = [0xff3b4f, 0xff8a1f, 0xffd93b, 0x4cd964, 0x3aa8ff, 0x5b5bff, 0xb04bff];
      // Coleção de recursos de um evento: tudo o que for criado passa por aqui e é descartado de uma vez no fim.
      const criarColecaoDeRecursos = function criarColecaoDeRecursos() {
        const objetos = new Set(), geometrias = new Set(), materiais = new Set(), texturas = new Set();
        return {
          geometria: geometria => { geometrias.add(geometria); return geometria; },
          material: material => { materiais.add(material); return material; },
          textura: textura => { texturas.add(textura); return textura; },
          naCena: objeto => { objetos.add(objeto); cena.add(objeto); return objeto; },
          tirarDaCena: objeto => { if (objeto && objeto.parent) objeto.parent.remove(objeto); objetos.delete(objeto); },
          descartar: () => {
            for (const objeto of objetos) if (objeto.parent) objeto.parent.remove(objeto);
            for (const geometria of geometrias) geometria.dispose();
            for (const material of materiais) material.dispose();
            for (const textura of texturas) textura.dispose();
            objetos.clear(); geometrias.clear(); materiais.clear(); texturas.clear();
          },
          quantidadeNaCena: () => [...objetos].filter(objeto => objeto.parent).length,
        };
      };
      // Peças 3D com material próprio (brilho leve e SEM neblina, para ficarem nítidas no céu); cores repetidas reaproveitam o material.
      const criarFabricaDePecasDoEvento = function criarFabricaDePecasDoEvento(recursos, opcoes = {}) {
        const cache = new Map();
        const materialDaCor = (cor, brilho = opcoes.brilho ?? 0.22) => {
          const chave = cor + ':' + brilho;
          if (!cache.has(chave)) cache.set(chave, recursos.material(new THREE.MeshLambertMaterial({ color: cor, emissive: new THREE.Color(cor).multiplyScalar(brilho), fog: false })));
          return cache.get(chave);
        };
        const peca = (geometria, cor, pai, x = 0, y = 0, z = 0, brilho) => { const malha = new THREE.Mesh(recursos.geometria(geometria), materialDaCor(cor, brilho)); malha.position.set(x, y, z); pai.add(malha); return malha; };
        return {
          materialDaCor,
          esfera: (raio, cor, pai, x, y, z, escala = [1, 1, 1], brilho) => { const malha = peca(new THREE.SphereGeometry(raio, 14, 10), cor, pai, x, y, z, brilho); malha.scale.set(...escala); return malha; },
          cilindro: (raioTopo, raioBase, altura, cor, pai, x, y, z, brilho, lados = 12) => peca(new THREE.CylinderGeometry(raioTopo, raioBase, altura, lados), cor, pai, x, y, z, brilho),
          cone: (raio, altura, cor, pai, x, y, z, brilho, lados = 10) => peca(new THREE.ConeGeometry(raio, altura, lados), cor, pai, x, y, z, brilho),
          toro: (raio, tubo, cor, pai, x, y, z, brilho) => peca(new THREE.TorusGeometry(raio, tubo, 8, 20), cor, pai, x, y, z, brilho),
          grupo: (pai, x = 0, y = 0, z = 0) => { const grupo = new THREE.Group(); grupo.position.set(x, y, z); pai.add(grupo); return grupo; },
        };
      };
      // Textura de ponto redondo e macio (brilhos e estrelas), desenhada num canvas.
      const criarTexturaDeBrilho = function criarTexturaDeBrilho(recursos) {
        const tela = document.createElement('canvas'); tela.width = tela.height = 64;
        const contexto = tela.getContext('2d'), gradiente = contexto.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradiente.addColorStop(0, 'rgba(255,255,255,1)'); gradiente.addColorStop(0.35, 'rgba(255,255,255,0.75)'); gradiente.addColorStop(1, 'rgba(255,255,255,0)');
        contexto.fillStyle = gradiente; contexto.fillRect(0, 0, 64, 64);
        return recursos.textura(new THREE.CanvasTexture(tela));
      };

      // ---- estado do módulo ----
      let eventoEmAndamento = null;   // { tipo, atualizar(segundos), encerrar(porErro) }
      const eventoEspecialEmAndamento = () => !!eventoEmAndamento;

      // ---- câmera da cena (misturada à da órbita) ----
      const cameraDoEvento = { peso: 0, posicao: new THREE.Vector3(), alvo: new THREE.Vector3() };
      const posicaoDaOrbita = new THREE.Vector3(), rotacaoDaOrbita = new THREE.Quaternion(), rotacaoDoEvento = new THREE.Quaternion(), matrizDoOlhar = new THREE.Matrix4(), CIMA = new THREE.Vector3(0, 1, 0);
      // Chamada pelo laço (seção 31) depois de posicionarCamera. Com peso 0 não faz nada (a órbita manda); com peso 1 a câmera é a
      // do evento; no meio, posição e rotação são interpoladas (sem saltos nem teletransporte).
      const aplicarCameraDosEventos = function aplicarCameraDosEventos() {
        const peso = cameraDoEvento.peso;
        if (!(peso > 0)) return;
        posicaoDaOrbita.copy(camera.position); rotacaoDaOrbita.copy(camera.quaternion);
        matrizDoOlhar.lookAt(cameraDoEvento.posicao, cameraDoEvento.alvo, CIMA); rotacaoDoEvento.setFromRotationMatrix(matrizDoOlhar);
        camera.position.lerpVectors(posicaoDaOrbita, cameraDoEvento.posicao, peso);
        camera.quaternion.slerpQuaternions(rotacaoDaOrbita, rotacaoDoEvento, peso);
      };

      // ---- apresentação da tela durante a cena (faixas de cinema, brilho suave, interface recolhida) ----
      const camadaDoEvento = selecionar('#camada-do-evento');
      const entrarNoModoDeCena = function entrarNoModoDeCena(classeExtra) {
        fecharPaineisDaBarra();                       // fecha os painéis do menu sem tocar o som de fechar
        menuPrincipal.hidden = true; atualizarBotaoDoMenu();
        definirGavetaAberta(false);
        if (typeof fecharPainelDaEstrutura === 'function') fecharPainelDaEstrutura(false);
        if (typeof fecharInventario === 'function') fecharInventario();
        if (typeof fecharDialogoDoLenhador === 'function') fecharDialogoDoLenhador();
        camadaDoEvento.hidden = false; camadaDoEvento.className = classeExtra || '';
        document.body.classList.add('em-evento-especial');
        requestAnimationFrame(() => camadaDoEvento.classList.add('ativa'));
      };
      const sairDoModoDeCena = function sairDoModoDeCena() {
        camadaDoEvento.classList.remove('ativa');
        document.body.classList.remove('em-evento-especial');
        setTimeout(() => { if (!eventoEmAndamento) camadaDoEvento.hidden = true; }, 700);
      };

      // ====================================================================================================
      // UNICÓRNIO (cena do céu da poção misteriosa)
      // ====================================================================================================
      // Modelo montado com peças 3D, olhando para +Z (Object3D.lookAt aponta o +Z para o destino): corpo, peito, garupa, pescoço,
      // cabeça com focinho, olhos, orelhas e chifre dourado em espiral, crina e cauda com as cores do arco-íris (em segmentos
      // articulados que ondulam) e quatro patas com coxa, joelho e casco (galope no ar).
      const criarUnicornio = function criarUnicornio(recursos) {
        const fabrica = criarFabricaDePecasDoEvento(recursos, { brilho: 0.45 }), raiz = new THREE.Group(), corpo = fabrica.grupo(raiz);   // brilho alto: branco de verdade sob a luz esverdeada da cena
        const BRANCO = 0xfff6fb, LILAS = 0xf4e8ff, DOURADO = 0xffd25a, CASCO = 0xf3b93c, ROSA = 0xffd3e6, ESCURO = 0x2b1b3a;
        fabrica.esfera(1, BRANCO, corpo, 0, 0, 0, [0.78, 0.72, 1.3]);                     // tronco
        fabrica.esfera(0.62, BRANCO, corpo, 0, 0.12, 0.85, [1, 1, 0.9]);                  // peito
        fabrica.esfera(0.66, LILAS, corpo, 0, 0.08, -0.85);                               // garupa
        fabrica.esfera(0.5, LILAS, corpo, 0, -0.32, 0, [1.1, 0.5, 1.6]);                  // barriga (sombra suave)
        const pescoco = fabrica.cilindro(0.34, 0.46, 1.25, BRANCO, corpo, 0, 0.72, 1.2); pescoco.rotation.x = 0.62;
        // cabeça
        const cabeca = fabrica.grupo(corpo, 0, 1.38, 1.62);
        fabrica.esfera(0.42, BRANCO, cabeca, 0, 0, 0, [0.82, 0.86, 1.05]);
        fabrica.esfera(0.3, ROSA, cabeca, 0, -0.16, 0.42, [0.85, 0.75, 1.1]);             // focinho
        for (const lado of [-1, 1]) {
          fabrica.esfera(0.04, ESCURO, cabeca, lado * 0.1, -0.14, 0.72);                  // narinas
          fabrica.esfera(0.085, ESCURO, cabeca, lado * 0.26, 0.06, 0.18, [1, 1.15, 1], 0);// olhos
          fabrica.esfera(0.032, 0xffffff, cabeca, lado * 0.29, 0.1, 0.25, [1, 1, 1], 0.8); // brilho dos olhos
          fabrica.esfera(0.08, 0xff9ec7, cabeca, lado * 0.3, -0.1, 0.3, [1, 0.7, 0.5], 0.3); // bochechas
          const orelha = fabrica.cone(0.09, 0.3, BRANCO, cabeca, lado * 0.18, 0.42, -0.06); orelha.rotation.z = -lado * 0.25;
        }
        // chifre dourado com anéis em espiral (brilho forte)
        const chifre = fabrica.grupo(cabeca, 0, 0.42, 0.14); chifre.rotation.x = 0.5;
        fabrica.cone(0.085, 0.8, DOURADO, chifre, 0, 0.4, 0, 0.55);
        for (let anel = 0; anel < 3; anel++) { const toro = fabrica.toro(0.07 - anel * 0.018, 0.016, 0xfff1b0, chifre, 0, 0.14 + anel * 0.2, 0, 0.6); toro.rotation.x = Math.PI / 2; toro.rotation.y = anel * 0.6; }
        // crina: segmentos coloridos do alto da cabeça até a cernelha
        const crina = [];
        for (let indice = 0; indice < 7; indice++) {
          const t = indice / 6, segmento = fabrica.grupo(corpo, 0, misturarNoEvento(1.62, 0.9, t), misturarNoEvento(1.5, 0.55, t));
          fabrica.esfera(0.21, CORES_DO_ARCO_IRIS[indice], segmento, 0, 0.12, -0.08, [0.55, 1, 1.25], 0.35);
          crina.push(segmento);
        }
        fabrica.esfera(0.13, CORES_DO_ARCO_IRIS[0], cabeca, 0, 0.36, 0.18, [0.8, 0.7, 1.2], 0.35);   // topete
        // cauda: corrente articulada (cada segmento é filho do anterior), apontando para trás
        const cauda = []; let pai = fabrica.grupo(corpo, 0, 0.35, -1.35); pai.rotation.x = -0.35;
        const raizDaCauda = pai;
        for (let indice = 0; indice < 7; indice++) {
          const segmento = fabrica.grupo(pai, 0, 0, indice ? -0.32 : 0), raio = 0.16 + Math.sin(indice / 6 * Math.PI) * 0.12;
          fabrica.esfera(raio, CORES_DO_ARCO_IRIS[indice], segmento, 0, 0, -0.16, [1, 0.8, 1.4], 0.35);
          cauda.push(segmento); pai = segmento;
        }
        // patas: quadril → coxa → joelho → canela → casco
        const pernas = [[-0.4, 0.8, 'frente', 0], [0.4, 0.8, 'frente', Math.PI], [-0.42, -0.85, 'tras', Math.PI * 0.5], [0.42, -0.85, 'tras', Math.PI * 1.5]].map(([x, z, lado, fase]) => {
          const quadril = fabrica.grupo(corpo, x, -0.35, z);
          fabrica.cilindro(0.16, 0.13, 0.62, BRANCO, quadril, 0, -0.31, 0);
          const joelho = fabrica.grupo(quadril, 0, -0.6, 0);
          fabrica.cilindro(0.11, 0.1, 0.55, BRANCO, joelho, 0, -0.27, 0);
          fabrica.cilindro(0.12, 0.13, 0.14, CASCO, joelho, 0, -0.58, 0, 0.4);
          return { quadril, joelho, lado, fase };
        });
        return {
          raiz, corpo, raizDaCauda,
          animar: tempo => {
            corpo.position.y = Math.sin(tempo * 5) * 0.08; corpo.rotation.x = Math.sin(tempo * 5 + 1) * 0.05;     // ondula no voo
            cabeca.rotation.x = Math.sin(tempo * 5 + 0.6) * 0.08;
            for (const perna of pernas) {                                                                        // galope no ar
              const onda = Math.sin(tempo * 9 + perna.fase);
              if (perna.lado === 'frente') { perna.quadril.rotation.x = -0.75 + onda * 0.45; perna.joelho.rotation.x = 1.1 + Math.sin(tempo * 9 + perna.fase + 1) * 0.45; }
              else { perna.quadril.rotation.x = 0.65 + onda * 0.4; perna.joelho.rotation.x = -0.8 + Math.sin(tempo * 9 + perna.fase + 1) * 0.35; }
            }
            crina.forEach((segmento, indice) => { segmento.rotation.x = Math.sin(tempo * 7 - indice * 0.7) * 0.25; segmento.rotation.z = Math.sin(tempo * 4 - indice * 0.5) * 0.18; });
            cauda.forEach((segmento, indice) => { segmento.rotation.x = Math.sin(tempo * 6 - indice * 0.65) * 0.22; segmento.rotation.y = Math.sin(tempo * 3.4 - indice * 0.5) * 0.25; });
          },
        };
      };
      // Arco-íris: uma fita de 7 faixas horizontais que acompanha o caminho do unicórnio. A cada ~0,5 unidade percorrida, um novo
      // ponto entra na fita; a faixa começa fina no traseiro e se abre com o tempo. A geometria é alocada uma vez (até MAXIMO pontos).
      const criarArcoIris = function criarArcoIris(recursos, larguraMaxima) {
        const MAXIMO = 480, FAIXAS = CORES_DO_ARCO_IRIS.length, POR_PONTO = FAIXAS * 2;
        const posicoes = new Float32Array(MAXIMO * POR_PONTO * 3), cores = new Float32Array(MAXIMO * POR_PONTO * 3), indices = [];
        const cor = new THREE.Color();
        for (let ponto = 0; ponto < MAXIMO; ponto++) for (let faixa = 0; faixa < FAIXAS; faixa++) {
          cor.setHex(CORES_DO_ARCO_IRIS[faixa]);
          for (const lado of [0, 1]) cores.set([cor.r, cor.g, cor.b], ((ponto * POR_PONTO) + faixa * 2 + lado) * 3);
          if (ponto < MAXIMO - 1) { const a = ponto * POR_PONTO + faixa * 2, b = a + 1, c = a + POR_PONTO, d = c + 1; indices.push(a, c, b, b, c, d); }
        }
        const geometria = recursos.geometria(new THREE.BufferGeometry());
        geometria.setAttribute('position', new THREE.BufferAttribute(posicoes, 3)); geometria.setAttribute('color', new THREE.BufferAttribute(cores, 3));
        geometria.setIndex(indices); geometria.setDrawRange(0, 0);
        const material = recursos.material(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthWrite: false, fog: false }));
        const malha = recursos.naCena(new THREE.Mesh(geometria, material)); malha.frustumCulled = false; malha.renderOrder = 5;
        const pontos = [];
        return {
          material,
          adicionar: (posicao, tempo) => {
            const ultimo = pontos[pontos.length - 1];
            if (pontos.length >= MAXIMO || (ultimo && ultimo.posicao.distanceTo(posicao) < 0.5)) return;
            pontos.push({ posicao: posicao.clone(), nascimento: tempo });
          },
          atualizar: tempo => {
            pontos.forEach((ponto, indice) => {
              const largura = Math.min(larguraMaxima, 0.35 + (tempo - ponto.nascimento) * 3.2), altura = largura / FAIXAS;
              for (let faixa = 0; faixa < FAIXAS; faixa++) {
                const topo = ponto.posicao.y + largura / 2 - faixa * altura, base = (indice * POR_PONTO + faixa * 2) * 3;
                posicoes[base] = ponto.posicao.x; posicoes[base + 1] = topo; posicoes[base + 2] = ponto.posicao.z;
                posicoes[base + 3] = ponto.posicao.x; posicoes[base + 4] = topo - altura; posicoes[base + 5] = ponto.posicao.z;
              }
            });
            geometria.attributes.position.needsUpdate = true;
            geometria.setDrawRange(0, Math.max(0, pontos.length - 1) * FAIXAS * 6);
          },
          quantidade: () => pontos.length,
        };
      };
      // Brilhos: partículas coloridas que saem junto do arco-íris e somem aos poucos; e estrelinhas que piscam no céu da cena.
      const criarBrilhos = function criarBrilhos(recursos, textura, quantidade, tamanho) {
        const posicoes = new Float32Array(quantidade * 3).fill(-10000), cores = new Float32Array(quantidade * 3).fill(1), vidas = new Float32Array(quantidade), velocidades = new Float32Array(quantidade * 3);
        const geometria = recursos.geometria(new THREE.BufferGeometry());
        geometria.setAttribute('position', new THREE.BufferAttribute(posicoes, 3)); geometria.setAttribute('color', new THREE.BufferAttribute(cores, 3));
        const material = recursos.material(new THREE.PointsMaterial({ size: tamanho, map: textura, vertexColors: true, transparent: true, opacity: 1, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
        const nuvem = recursos.naCena(new THREE.Points(geometria, material)); nuvem.frustumCulled = false; nuvem.renderOrder = 6;
        let proximo = 0; const cor = new THREE.Color();
        return {
          material,
          soltar: (posicao, espalhamento, velocidade, vida, corHex) => {
            const indice = proximo; proximo = (proximo + 1) % quantidade;
            posicoes.set([posicao.x + (Math.random() - 0.5) * espalhamento, posicao.y + (Math.random() - 0.5) * espalhamento, posicao.z + (Math.random() - 0.5) * espalhamento], indice * 3);
            velocidades.set([(Math.random() - 0.5) * velocidade, (Math.random() - 0.5) * velocidade, (Math.random() - 0.5) * velocidade], indice * 3);
            cor.setHex(corHex ?? CORES_DO_ARCO_IRIS[Math.floor(Math.random() * CORES_DO_ARCO_IRIS.length)]); cores.set([cor.r, cor.g, cor.b], indice * 3);
            vidas[indice] = vida;
          },
          atualizar: segundos => {
            for (let indice = 0; indice < quantidade; indice++) {
              if (vidas[indice] <= 0) continue;
              vidas[indice] -= segundos;
              if (vidas[indice] <= 0) { posicoes[indice * 3 + 1] = -10000; continue; }
              for (let eixo = 0; eixo < 3; eixo++) posicoes[indice * 3 + eixo] += velocidades[indice * 3 + eixo] * segundos;
            }
            geometria.attributes.position.needsUpdate = true; geometria.attributes.color.needsUpdate = true;
          },
        };
      };

      // Cena completa. "teste" = só a animação (ferramenta de desenvolvedor): não marca nem conclui nada no save.
      let cenaDoCeuJaRetomada = false;
      const iniciarEventoDoUnicornio = function iniciarEventoDoUnicornio(opcoes = {}) {
        if (eventoEmAndamento) return false;
        const C = EVENTOS_ESPECIAIS_CONFIG.unicornio, recursos = criarColecaoDeRecursos();
        const fimDaSubida = C.segundosDaSubida, fimDoVoo = fimDaSubida + C.segundosDoVoo, fimDoArcoIris = fimDoVoo + C.segundosDoArcoIris, fim = fimDoArcoIris + C.segundosDaVolta;
        // Enquadramento: parte da câmera atual (sem salto), sobe um pouco e olha para o céu À FRENTE, ~37° acima do horizonte.
        const inicio = camera.position.clone(), frente = alvoAtualDaCamera.clone().sub(inicio); frente.y = 0;
        if (frente.lengthSq() < 0.01) frente.set(0, 0, -1); frente.normalize();
        const direita = new THREE.Vector3().crossVectors(frente, CIMA).normalize();
        cameraDoEvento.posicao.copy(inicio).addScaledVector(CIMA, 2.5);
        const focoDoCeu = cameraDoEvento.posicao.clone().addScaledVector(frente, 58).addScaledVector(CIMA, 44);
        cameraDoEvento.alvo.copy(focoDoCeu); cameraDoEvento.peso = 0;
        // Caminho do voo: entra pela esquerda, longe, sobe em arco e sai pela direita, mais perto (dá profundidade ao voo).
        const caminho = s => focoDoCeu.clone().addScaledVector(direita, misturarNoEvento(-80, 80, s)).addScaledVector(frente, misturarNoEvento(30, -6, s)).addScaledVector(CIMA, -16 + 30 * Math.sin(Math.PI * s));
        const unicornio = criarUnicornio(recursos); unicornio.raiz.scale.setScalar(C.escala); unicornio.raiz.visible = false; recursos.naCena(unicornio.raiz);
        const arcoIris = criarArcoIris(recursos, 2.1 * C.escala);
        const textura = criarTexturaDeBrilho(recursos), brilhos = criarBrilhos(recursos, textura, 260, 1.1), estrelas = criarBrilhos(recursos, textura, 140, 0.8);
        estrelas.material.opacity = 0;
        for (let indice = 0; indice < 140; indice++) estrelas.soltar(focoDoCeu.clone().addScaledVector(direita, (Math.random() - 0.5) * 150).addScaledVector(CIMA, (Math.random() - 0.5) * 70), 4, 0.4, 999, [0xffffff, 0xfff1b0, 0xd9c8ff][indice % 3]);
        const traseiro = new THREE.Vector3(), anterior = new THREE.Vector3(), atual = new THREE.Vector3();
        let tempo = 0, musicaIniciada = false, encerrado = false;
        const musica = FONTES_DE_SOM.segredos.misterio;
        entrarNoModoDeCena('cena-do-ceu');
        if (FONTES_DE_SOM.musica && !FONTES_DE_SOM.musica.el.paused) FONTES_DE_SOM.musica.el.volume = volumeDaMusica() * 0.25;   // a música de fundo abaixa durante a cena
        const encerrar = function encerrar(porErro = false) {
          if (encerrado) return; encerrado = true;
          recursos.descartar();
          cameraDoEvento.peso = 0; eventoEmAndamento = null;
          if (musica) pararSom(musica);
          sincronizarMusica();
          sairDoModoDeCena();
          if (!opcoes.teste) {
            const registro = estado.eventosEspeciais.misterio;
            if (registro.usadoEm && !registro.concluido) { registro.concluido = true; salvarProgresso(); avisarObjetivos('lenda', {}); }   // Etapa 2: quadro de objetivos
            if (!porErro) mostrarAviso('✨ Você descobriu a Poção Misteriosa do Unicórnio! 🦄🌈');
          }
          if (typeof atualizarInventario === 'function') atualizarInventario();
          desenharCards();
        };
        eventoEmAndamento = {
          tipo: 'unicornio', recursos, encerrar,
          atualizar: segundos => {
            tempo += segundos;
            // peso da câmera: sobe → fica no céu → volta
            cameraDoEvento.peso = tempo < fimDaSubida ? suavizarNoEvento(tempo / fimDaSubida) : tempo < fimDoArcoIris ? 1 : 1 - suavizarNoEvento((tempo - fimDoArcoIris) / C.segundosDaVolta);
            estrelas.material.opacity = 0.85 * cameraDoEvento.peso * (0.75 + 0.25 * Math.sin(tempo * 3));
            if (tempo >= fimDaSubida && tempo < fimDoVoo) {
              if (!musicaIniciada) { musicaIniciada = true; if (musica) tocarSegredo('misterio'); }
              const s = (tempo - fimDaSubida) / C.segundosDoVoo;
              anterior.copy(unicornio.raiz.position); atual.copy(caminho(s));
              unicornio.raiz.position.copy(atual); unicornio.raiz.visible = true;
              // olha para onde vai, mas com metade da inclinação do caminho (o corpo fica mais nivelado, como num voo)
              const proximo = caminho(Math.min(1, s + 0.01)); proximo.y = misturarNoEvento(atual.y, proximo.y, 0.45); unicornio.raiz.lookAt(proximo);
              unicornio.animar(tempo);
              // arco-íris pelo traseiro, de propósito
              unicornio.raizDaCauda.getWorldPosition(traseiro);
              arcoIris.adicionar(traseiro, tempo);
              for (let vezes = 0; vezes < 3; vezes++) brilhos.soltar(traseiro, 1.6, 2.5, 1.6 + Math.random());
              // a câmera acompanha um pouco o unicórnio (sem perder o céu)
              cameraDoEvento.alvo.copy(focoDoCeu).lerp(atual, 0.22);
            } else if (tempo >= fimDoVoo) {
              if (unicornio.raiz.parent) recursos.tirarDaCena(unicornio.raiz);   // saiu do enquadramento
              cameraDoEvento.alvo.lerp(focoDoCeu, Math.min(1, segundos * 1.5));
              if (Math.random() < 0.5) brilhos.soltar(caminho(Math.random()), 3, 0.8, 1.2);   // o arco-íris ainda cintila
            }
            arcoIris.atualizar(tempo);
            // o arco-íris fica no céu e some devagar enquanto a câmera volta
            arcoIris.material.opacity = tempo < fimDoArcoIris ? 0.88 : 0.88 * (1 - suavizarNoEvento((tempo - fimDoArcoIris) / C.segundosDaVolta));
            brilhos.atualizar(segundos);
            if (musica && musicaIniciada && tempo > fimDoArcoIris) musica.el.volume = Math.max(0, AUDIO_CONFIG.segredos.misterio.volume * (1 - (tempo - fimDoArcoIris) / C.segundosDaVolta));
            if (tempo >= fim) encerrar();
          },
        };
        return true;
      };

      // ====================================================================================================
      // ABDUÇÃO ALIENÍGENA
      // ====================================================================================================
      // Disco voador metálico com luzes que piscam, cúpula de vidro e um alienígena verde clássico (cabeça grande, olhos pretos
      // enormes e antenas). O feixe é um cone aberto com mistura aditiva.
      const criarDiscoVoador = function criarDiscoVoador(recursos) {
        const fabrica = criarFabricaDePecasDoEvento(recursos, { brilho: 0.12 }), raiz = new THREE.Group(), nave = fabrica.grupo(raiz);
        fabrica.cilindro(2.4, 2.4, 0.35, 0xb8c4cf, nave, 0, 0, 0, 0.15, 28);
        const aro = fabrica.toro(2.4, 0.16, 0x8a96a3, nave, 0, 0, 0, 0.1); aro.rotation.x = Math.PI / 2;
        fabrica.cilindro(1.3, 1.9, 0.45, 0x77828e, nave, 0, -0.38, 0, 0.1, 24);
        fabrica.cilindro(0.75, 0.9, 0.12, 0xd9ffb0, nave, 0, -0.64, 0, 0.9, 20);                     // saída do feixe
        const luzes = [];
        for (let indice = 0; indice < 10; indice++) { const angulo = indice / 10 * Math.PI * 2; luzes.push(fabrica.esfera(0.14, [0xff4d6d, 0xffe14d, 0x52d273, 0x3fa7ff][indice % 4], nave, Math.cos(angulo) * 2.05, -0.12, Math.sin(angulo) * 2.05, [1, 1, 1], 0.9)); }
        const alienigena = fabrica.grupo(nave, 0, 0.18, 0);
        fabrica.cilindro(0.22, 0.3, 0.42, 0x5fb84a, alienigena, 0, 0.2, 0, 0.25);                  // corpo
        fabrica.esfera(0.42, 0x7be05a, alienigena, 0, 0.72, 0, [1, 1.18, 1], 0.3);                  // cabeça
        for (const lado of [-1, 1]) {
          const olho = fabrica.esfera(0.16, 0x101418, alienigena, lado * 0.16, 0.76, 0.33, [0.6, 1, 0.38], 0); olho.rotation.z = lado * 0.4;
          const antena = fabrica.cilindro(0.015, 0.015, 0.35, 0x5fb84a, alienigena, lado * 0.17, 1.2, 0, 0.25, 6); antena.rotation.z = -lado * 0.35;
          fabrica.esfera(0.05, 0xd9ff6a, alienigena, lado * 0.24, 1.36, 0, [1, 1, 1], 0.9);
        }
        const vidro = recursos.material(new THREE.MeshLambertMaterial({ color: 0x9fe8ff, emissive: 0x1d5a6e, transparent: true, opacity: 0.4, depthWrite: false, fog: false }));
        const cupula = new THREE.Mesh(recursos.geometria(new THREE.SphereGeometry(1.05, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2)), vidro); cupula.position.y = 0.15; nave.add(cupula);
        const geometriaDoFeixe = recursos.geometria(new THREE.ConeGeometry(2.3, 1, 28, 1, true)); geometriaDoFeixe.translate(0, -0.5, 0);
        const materialDoFeixe = recursos.material(new THREE.MeshBasicMaterial({ color: 0xcfff9a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        const feixe = new THREE.Mesh(geometriaDoFeixe, materialDoFeixe); feixe.position.y = -0.66; feixe.renderOrder = 4; raiz.add(feixe);
        return {
          raiz, nave, alienigena, feixe, materialDoFeixe,
          animar: (tempo, direcaoDaCamera) => {
            nave.rotation.y += 0.02; alienigena.rotation.y = Math.atan2(direcaoDaCamera.x, direcaoDaCamera.z) - nave.rotation.y;   // o alienígena olha para a câmera
            luzes.forEach((luz, indice) => { luz.visible = Math.sin(tempo * 8 + indice * 1.3) > -0.3; });
          },
        };
      };
      // Uma vaca do curral que está na cena agora (para o disco ir até ela). null se não houver.
      const vacaVisivelDoCurral = function vacaVisivelDoCurral() {
        const vacas = [];
        if (grupoDaArea.curral) grupoDaArea.curral.traverse(objeto => { if (objeto.userData && objeto.userData.animal === 'vaca') vacas.push(objeto); });
        return vacas.length ? vacas[Math.floor(Math.random() * vacas.length)] : null;
      };
      // Pode acontecer agora? (todas as regras de segurança juntas; usada pelo sorteio e pelo botão de teste)
      const motivoParaNaoAbduzir = function motivoParaNaoAbduzir(ignorarIntervalo = false) {
        const C = EVENTOS_ESPECIAIS_CONFIG.abducao, registro = estado.eventosEspeciais.alienigena;
        if (eventoEmAndamento) return 'Já há um evento acontecendo.';
        if (!estado.niveis.curral || instalacaoDestruida('curral')) return 'Não há curral.';
        if (registro.vacaAusente) return 'Uma vaca ainda está com o disco voador (volta em ' + segundosParaAVacaVoltar() + ' s).';   // Etapa 1: uma por vez
        if (animaisVivosDaArea('curral') < C.vacasMinimas) return 'Não há vaca no curral agora.';
        if (!ignorarIntervalo && registro.ultimoEm && Date.now() - registro.ultimoEm < C.horasDeIntervaloMinimo * 3600000) return 'Intervalo mínimo entre abduções ainda não passou.';
        if (typeof INVASAO_EM_CURSO !== 'undefined' && INVASAO_EM_CURSO.fase !== 'nenhuma') return 'Há uma invasão em andamento.';
        if (!painelDoGuardiao.hidden || !selecionar('#tutorial').hidden || document.hidden) return 'O jogador está ocupado.';
        return '';
      };
      // Etapa 1 — abdução TEMPORÁRIA. Tira a vaca do curral só por segundosParaVoltar: ela conta como abduzida (seção 05: não aparece,
      // não come e não produz) e o registro { saiuEm, voltaEm } é salvo no MESMO passo. A produção guardada não é tocada (a vaca volta).
      // Falhou o salvamento → nada muda.
      const abduzirUmaVaca = function abduzirUmaVaca() {
        const situacao = estado.animais.curral, registro = estado.eventosEspeciais.alienigena, C = EVENTOS_ESPECIAIS_CONFIG.abducao;
        if (!situacao || registro.vacaAusente || animaisVivosDaArea('curral') < C.vacasMinimas) return false;
        atualizarAlimentacao();   // fecha a produção e o consumo até agora com todas as vacas
        const antes = { abduzidos: situacao.abduzidos | 0, abducoes: registro.abducoes, vacaAusente: registro.vacaAusente }, agora = Date.now();
        situacao.abduzidos = 1; registro.abducoes++;
        registro.vacaAusente = { saiuEm: agora, voltaEm: agora + C.segundosParaVoltar * 1000, origem: 'sorteio' };
        if (!salvarProgresso()) { situacao.abduzidos = antes.abduzidos; registro.abducoes = antes.abducoes; registro.vacaAusente = antes.vacaAusente; return false; }
        avisarObjetivos('abducao', {});   // Etapa 2: quadro de objetivos (seção 30e; o total fica em registro.abducoes)
        reconstruirArea('curral'); desenharCards(); atualizarPaineisDaMark82(true);
        return true;
      };
      // Etapa 1 — devolve a vaca: fecha a produção do período em que ela esteve fora, zera o registro e salva; só então o curral é
      // redesenhado com ela. É a ÚNICA mudança de estado da volta (a animação vem depois e é só visual): recarregar a página no meio
      // da animação nunca duplica a vaca. Falhou o salvamento → nada muda e uma nova tentativa acontece em 2 s.
      // Correção do ET: reconstruir = false quando a MESMA vaca (guardada escondida pelo ET) vai reaparecer; o curral não é refeito.
      const devolverAVaca = function devolverAVaca(reconstruir = true) {
        const situacao = estado.animais.curral, registro = estado.eventosEspeciais.alienigena;
        if (!situacao || !registro.vacaAusente) return false;
        atualizarAlimentacao();   // até agora ela estava fora: não comeu nem produziu
        const antes = { abduzidos: situacao.abduzidos | 0, vacaAusente: registro.vacaAusente };
        situacao.abduzidos = 0; registro.vacaAusente = null;
        if (!salvarProgresso()) { situacao.abduzidos = antes.abduzidos; registro.vacaAusente = antes.vacaAusente; return false; }
        if (reconstruir) reconstruirArea('curral');
        desenharCards(); atualizarPaineisDaMark82(true);
        return true;
      };
      // Correção do ET: a vaca levada pelo ET fica guardada (escondida) no curral enquanto está fora, para que a MESMA vaca (mesmas
      // manchas e pelagem) reapareça. Não vai para o save: se a página recarregar, o curral é montado pelo save (sem ela) e, na
      // volta, ele é refeito com ela (aparência sorteada de novo, como em qualquer montagem do curral).
      let vacaGuardadaPeloET = null;
      const vacaGuardadaAindaNoCurral = () => { if (!vacaGuardadaPeloET) return false; for (let objeto = vacaGuardadaPeloET; objeto; objeto = objeto.parent) if (objeto === grupoDaArea.curral) return !!grupoDaArea.curral.parent; return false; };
      let ultimaInteracaoDoJogador = performance.now();
      for (const nomeDoEvento of ['pointerdown', 'keydown', 'wheel']) addEventListener(nomeDoEvento, () => { ultimaInteracaoDoJogador = performance.now(); }, true);
      const iniciarAbducao = function iniciarAbducao(opcoes = {}) {
        const motivo = motivoParaNaoAbduzir(!!opcoes.teste);
        if (motivo) { if (opcoes.teste) mostrarAviso('🛸 ' + motivo); return false; }
        const C = EVENTOS_ESPECIAIS_CONFIG.abducao, recursos = criarColecaoDeRecursos(), disco = criarDiscoVoador(recursos);
        const registro = estado.eventosEspeciais.alienigena;
        registro.ultimoEm = Date.now(); salvarProgresso();   // o intervalo mínimo começa já (mesmo que o disco vá embora sem levar nada)
        let vacaReal = vacaVisivelDoCurral(), vacaLevada = null, levou = false, tempo = 0, encerrado = false;
        const alvo = new THREE.Vector3(), inicioDoVoo = new THREE.Vector3(), pairando = new THREE.Vector3(), direcaoDaCamera = new THREE.Vector3(), saida = new THREE.Vector3();
        const centroDoCurral = AREAS.find(area => area.id === 'curral').posicao;
        const posicaoDaVaca = destino => { if (vacaReal && vacaReal.parent) vacaReal.getWorldPosition(destino); else destino.set(centroDoCurral.x, 0, centroDoCurral.z); return destino; };
        posicaoDaVaca(alvo);
        const angulo = Math.random() * Math.PI * 2;
        inicioDoVoo.set(alvo.x + Math.cos(angulo) * 55, 20, alvo.z + Math.sin(angulo) * 55);   // entra pelo lado, baixo o bastante para ser visto
        saida.set(alvo.x - Math.cos(angulo) * 40, 90, alvo.z - Math.sin(angulo) * 40);
        disco.raiz.position.copy(inicioDoVoo); recursos.naCena(disco.raiz);
        mostrarAviso('🛸 Um disco voador apareceu sobre o ' + nomeDaArea('curral') + '!');
        tocarSegredo('discoVoador');
        if (performance.now() - ultimaInteracaoDoJogador > C.segundosParadoParaFocar * 1000) focarCameraNaArea('curral');   // só se o jogador estiver parado
        const encerrar = function encerrar() {
          if (encerrado) return; encerrado = true;
          recursos.descartar();
          if (vacaLevada) { vacaLevada.a.traverse(objeto => { if (objeto.geometry && !geometriasCompartilhadas.has(objeto.geometry)) objeto.geometry.dispose(); }); if (vacaLevada.a.parent) vacaLevada.a.parent.remove(vacaLevada.a); }
          eventoEmAndamento = null;
          if (levou) mostrarAviso('🛸 Os alienígenas levaram uma vaca para dar uma volta! Ela volta em ' + segundosParaAVacaVoltar() + ' segundos.');
        };
        eventoEmAndamento = {
          tipo: 'abducao', recursos, encerrar,
          atualizar: segundos => {
            tempo += segundos;
            camera.getWorldDirection(direcaoDaCamera).negate();
            disco.animar(tempo, direcaoDaCamera);
            const balanco = Math.sin(tempo * 2.2) * 0.25;
            if (!levou && tempo < 5.8) posicaoDaVaca(alvo);   // segue a vaca até o feixe a pegar
            pairando.set(alvo.x, alvo.y + 5.6 + balanco, alvo.z);   // altura que cabe no enquadramento da câmera focada no curral
            if (tempo < 5) {                                                              // chegada
              disco.raiz.position.lerpVectors(inicioDoVoo, pairando, suavizarNoEvento(tempo / 5));
              disco.nave.rotation.z = Math.sin(tempo * 3) * 0.12;
            } else if (tempo < 12) {                                                      // pairando com o feixe
              disco.raiz.position.copy(pairando); disco.nave.rotation.z = Math.sin(tempo * 3) * 0.05;
              disco.materialDoFeixe.opacity = tempo < 6.2 ? 0.45 * suavizarNoEvento((tempo - 5) / 1.2) : tempo < 11 ? 0.45 + Math.sin(tempo * 9) * 0.06 : 0.45 * (1 - suavizarNoEvento(tempo - 11));
              disco.feixe.scale.set(1, pairando.y - alvo.y + 0.2, 1);
              if (tempo >= 5.8 && !levou && !vacaLevada) {
                const posicaoReal = posicaoDaVaca(new THREE.Vector3()), rotacao = new THREE.Quaternion();
                if (vacaReal && vacaReal.parent) vacaReal.getWorldQuaternion(rotacao);
                levou = abduzirUmaVaca();
                if (levou) {                                                              // a vaca de verdade saiu do curral: entra a vaca do feixe
                  vacaLevada = montarAnimal('vaca'); vacaLevada.a.position.copy(posicaoReal); vacaLevada.a.quaternion.copy(rotacao);
                  vacaLevada.inicioY = posicaoReal.y; cena.add(vacaLevada.a);
                } else tempo = Math.max(tempo, 11);                                       // não deu (regra das 2 vacas): desliga o feixe
              }
              if (vacaLevada && vacaLevada.a.parent) {                                     // a vaca sobe girando, com as patas se debatendo
                const subida = suavizarNoEvento((tempo - 5.8) / 5);
                vacaLevada.a.position.y = misturarNoEvento(vacaLevada.inicioY, pairando.y - 0.9, subida);
                vacaLevada.a.rotation.y += segundos * 1.2; vacaLevada.a.rotation.z = Math.sin(tempo * 4) * 0.25;
                vacaLevada.a.scale.setScalar(1 - 0.55 * Math.max(0, subida - 0.6) / 0.4);
                for (const [perna, fase] of vacaLevada.pernas) perna.rotation.x = Math.sin(tempo * 14 + fase) * 0.7;
                if (subida >= 1) { vacaLevada.a.traverse(objeto => { if (objeto.geometry && !geometriasCompartilhadas.has(objeto.geometry)) objeto.geometry.dispose(); }); cena.remove(vacaLevada.a); }
              }
            } else {                                                                      // vai embora acelerando
              const partida = suavizarNoEvento((tempo - 12) / 4);
              disco.materialDoFeixe.opacity = 0;
              disco.raiz.position.lerpVectors(pairando, saida, partida * partida);
              disco.raiz.scale.setScalar(1 - 0.6 * partida);
              disco.nave.rotation.z = Math.sin(tempo * 10) * 0.1 * (1 - partida);
              if (tempo >= 16) encerrar();
            }
          },
        };
        return true;
      };

      // ---- Etapa 1: a volta da vaca (o inverso da abdução) ----
      // O estado muda PRIMEIRO (devolverAVaca: salvo, sem duplicar). A vaca de verdade, já de volta ao curral, fica escondida enquanto
      // uma vaca "do feixe" desce do disco girando devagar até o lugar dela; ao tocar o chão as duas trocam de lugar sem salto. Se a
      // animação for interrompida, encerrar() mostra a vaca de verdade de qualquer jeito.
      const iniciarDevolucaoDaVaca = function iniciarDevolucaoDaVaca() {
        const doET = estado.eventosEspeciais.alienigena.vacaAusente && estado.eventosEspeciais.alienigena.vacaAusente.origem === 'et';
        const mesmaVaca = doET && vacaGuardadaAindaNoCurral() ? vacaGuardadaPeloET : null;   // a MESMA vaca que o ET levou
        if (!devolverAVaca(!mesmaVaca)) return false;
        vacaGuardadaPeloET = null;
        const textoDaVolta = doET ? '👽 O ET devolveu a vaca ao curral!' : '🐄 A vaca voltou do passeio com os alienígenas!';
        const vacas = []; grupoDaArea.curral.traverse(objeto => { if (objeto.userData && objeto.userData.animal === 'vaca') vacas.push(objeto); });
        const vacaReal = mesmaVaca || (vacas.length ? vacas[Math.floor(Math.random() * vacas.length)] : null);
        if (!vacaReal) { mostrarAviso(textoDaVolta); return true; }
        vacaReal.visible = false;
        // a vaca do feixe: uma cópia idêntica da mesma vaca (geometrias e materiais compartilhados) ou uma vaca nova (abdução normal)
        const recursos = criarColecaoDeRecursos(), disco = criarDiscoVoador(recursos), vacaDoFeixe = mesmaVaca ? { a: mesmaVaca.clone(true), pernas: [], copia: true } : montarAnimal('vaca');
        if (mesmaVaca) vacaDoFeixe.a.visible = true;
        const alvo = new THREE.Vector3(), alto = new THREE.Vector3(), pairando = new THREE.Vector3(), saida = new THREE.Vector3(), direcaoDaCamera = new THREE.Vector3();
        vacaReal.getWorldPosition(alvo);
        alto.set(alvo.x, alvo.y + 34, alvo.z); saida.set(alvo.x + 30, 90, alvo.z - 30);
        disco.raiz.position.copy(alto); disco.raiz.scale.setScalar(0.4); recursos.naCena(disco.raiz);
        vacaDoFeixe.a.visible = false; vacaDoFeixe.a.scale.setScalar(0.45); recursos.naCena(vacaDoFeixe.a);
        mostrarAviso(doET ? '👽 O ET está trazendo a vaca de volta!' : '🛸 O disco voador está trazendo a vaca de volta!');
        tocarSegredo('discoVoador');
        let tempo = 0, encerrado = false, pousou = false;
        const encerrar = function encerrar() {
          if (encerrado) return; encerrado = true;
          vacaReal.visible = true;          // a vaca de verdade sempre reaparece, mesmo se a cena for interrompida
          if (!vacaDoFeixe.copia) vacaDoFeixe.a.traverse(objeto => { if (objeto.geometry && !geometriasCompartilhadas.has(objeto.geometry)) objeto.geometry.dispose(); });   // geometrias próprias da vaca do feixe (a cópia da mesma vaca compartilha as da original: não libera)
          recursos.descartar(); eventoEmAndamento = null;
          mostrarAviso(textoDaVolta);
        };
        eventoEmAndamento = {
          tipo: 'devolucao', recursos, encerrar,
          atualizar: segundos => {
            tempo += segundos;
            camera.getWorldDirection(direcaoDaCamera).negate();
            disco.animar(tempo, direcaoDaCamera);
            if (vacaReal.parent && !pousou) vacaReal.getWorldPosition(alvo);           // acompanha a vaca de verdade (ela anda no curral)
            pairando.set(alvo.x, alvo.y + 5.6 + Math.sin(tempo * 2.2) * 0.25, alvo.z);
            if (tempo < 2) {                                                           // desce do alto, crescendo
              const descida = suavizarNoEvento(tempo / 2);
              disco.raiz.position.lerpVectors(alto, pairando, descida); disco.raiz.scale.setScalar(0.4 + 0.6 * descida);
            } else if (tempo < 6.6) {                                                  // feixe aceso; a vaca desce girando devagar
              disco.raiz.position.copy(pairando); disco.raiz.scale.setScalar(1); disco.nave.rotation.z = Math.sin(tempo * 3) * 0.05;
              disco.materialDoFeixe.opacity = tempo < 2.6 ? 0.45 * suavizarNoEvento((tempo - 2) / 0.6) : tempo < 5.8 ? 0.45 + Math.sin(tempo * 9) * 0.06 : 0.45 * (1 - suavizarNoEvento((tempo - 5.8) / 0.8));
              disco.feixe.scale.set(1, pairando.y - alvo.y + 0.2, 1);
              if (tempo >= 2.4 && !pousou) {
                const descida = suavizarNoEvento((tempo - 2.4) / 3.2);
                vacaDoFeixe.a.visible = true;
                vacaDoFeixe.a.position.set(alvo.x, misturarNoEvento(pairando.y - 0.9, alvo.y, descida), alvo.z);
                vacaDoFeixe.a.scale.setScalar(0.45 + 0.55 * Math.min(1, descida / 0.5));
                vacaDoFeixe.a.rotation.y += segundos * 1.2 * (1 - descida); vacaDoFeixe.a.rotation.z = Math.sin(tempo * 4) * 0.2 * (1 - descida);
                for (const [perna, fase] of vacaDoFeixe.pernas) perna.rotation.x = Math.sin(tempo * 10 + fase) * 0.5 * (1 - descida);
                if (descida >= 1) {                                                    // tocou o chão: troca pela vaca de verdade
                  pousou = true; vacaDoFeixe.a.visible = false; vacaReal.visible = true;
                }
              }
            } else {                                                                   // vai embora acelerando
              const partida = suavizarNoEvento((tempo - 6.6) / 3.2);
              disco.materialDoFeixe.opacity = 0;
              disco.raiz.position.lerpVectors(pairando, saida, partida * partida); disco.raiz.scale.setScalar(1 - 0.6 * partida);
              if (tempo >= 9.8) encerrar();
            }
          },
        };
        return true;
      };
      let proximaTentativaDeDevolver = 0;
      // Chamado a cada quadro: chegou a hora de a vaca voltar? Com outra cena (que não seja a própria abdução), aba escondida ou
      // invasão, ela volta na hora, sem animação; durante a própria abdução (máquinas muito lentas) espera a cena terminar.
      const conferirVoltaDaVaca = function conferirVoltaDaVaca() {
        const ausente = estado.eventosEspeciais.alienigena.vacaAusente;
        if (!ausente || Date.now() < ausente.voltaEm || performance.now() < proximaTentativaDeDevolver) return false;
        if (eventoEmAndamento && (eventoEmAndamento.tipo === 'abducao' || eventoEmAndamento.tipo === 'et')) return false;   // espera a própria cena da saída acabar
        proximaTentativaDeDevolver = performance.now() + 2000;
        const invasao = typeof INVASAO_EM_CURSO !== 'undefined' && INVASAO_EM_CURSO.fase !== 'nenhuma';
        if (!eventoEmAndamento && !document.hidden && !invasao) return iniciarDevolucaoDaVaca();
        // volta sem cena: a mesma vaca do ET reaparece onde está (sem refazer o curral); nos outros casos o curral é refeito com ela
        const mesmaVaca = ausente.origem === 'et' && vacaGuardadaAindaNoCurral() ? vacaGuardadaPeloET : null;
        if (devolverAVaca(!mesmaVaca)) { if (mesmaVaca) mesmaVaca.visible = true; vacaGuardadaPeloET = null; mostrarAviso(ausente.origem === 'et' ? '👽 O ET devolveu a vaca ao curral!' : '🐄 A vaca voltou do passeio com os alienígenas!'); }
        return true;
      };

      // ---- Etapa 2 (corrigida): EASTER EGG DO ET — o ET ABDUZ a vaca clicada ----
      // Clicar numa vaca (35% de chance, no mínimo 30 min entre aparições) traz o disco do ET bem em cima dela. O ET olha para a vaca,
      // o feixe a envolve, ela sobe girando até o disco e o disco some no céu levando-a. A vaca sai DE VERDADE do sistema por 20 s
      // (mesmo registro da abdução normal: estado.eventosEspeciais.alienigena.vacaAusente, agora com origem 'et'; não come, não
      // produz, não conta no curral) e depois o ET a devolve: a MESMA vaca (guardada escondida) desce pelo feixe e volta ao curral.
      // Independente da abdução normal: não usa o sorteio nem o intervalo de 72 h dela e não conta no total de abduções; as duas só
      // não acontecem ao mesmo tempo (uma vaca fora por vez, uma cena por vez). O registro do ET (ultimaEm/vezes/descobertoEm) é
      // SALVO antes da cena: cliques rápidos, recarregar ou fechar o jogo não repetem nem reiniciam o intervalo. Nada é gasto ou ganho.
      const motivoParaNaoMostrarOET = function motivoParaNaoMostrarOET(ignorarIntervalo = false) {
        const C = EVENTOS_ESPECIAIS_CONFIG.et, registro = estado.eventosEspeciais.et;
        if (eventoEmAndamento) return 'Há outra cena acontecendo.';
        if (estado.eventosEspeciais.alienigena.vacaAusente) return 'Uma abdução está em andamento.';   // espera a vaca voltar
        if (!estado.niveis.curral || instalacaoDestruida('curral')) return 'Não há curral.';
        if (typeof INVASAO_EM_CURSO !== 'undefined' && INVASAO_EM_CURSO.fase !== 'nenhuma') return 'Há uma invasão em andamento.';
        if (!painelDoGuardiao.hidden || !selecionar('#tutorial').hidden || document.hidden) return 'O jogador está ocupado.';
        if (!ignorarIntervalo && registro.ultimaEm && Date.now() - registro.ultimaEm < C.minutosEntreAparicoes * 60000) return 'O ET ainda não voltou (intervalo mínimo).';
        return '';
      };
      // Tira a vaca clicada do sistema por 20 s (mesmo registro e mesmas regras da abdução normal: não come, não produz, não conta), com
      // origem 'et'. O curral NÃO é refeito: a própria vaca fica guardada, escondida, para reaparecer igual. Falhou o salvamento → nada muda.
      const levarVacaPeloET = function levarVacaPeloET(vaca) {
        const situacao = estado.animais.curral, registro = estado.eventosEspeciais.alienigena;
        if (!situacao || registro.vacaAusente || !vaca || !vaca.parent || animaisVivosDaArea('curral') < 1) return false;
        atualizarAlimentacao();   // fecha a produção e o consumo até agora com todas as vacas
        const antes = { abduzidos: situacao.abduzidos | 0, vacaAusente: registro.vacaAusente }, agora = Date.now();
        situacao.abduzidos = 1;
        registro.vacaAusente = { saiuEm: agora, voltaEm: agora + EVENTOS_ESPECIAIS_CONFIG.abducao.segundosParaVoltar * 1000, origem: 'et' };
        if (!salvarProgresso()) { situacao.abduzidos = antes.abduzidos; registro.vacaAusente = antes.vacaAusente; return false; }
        vaca.visible = false; vacaGuardadaPeloET = vaca;
        desenharCards(); atualizarPaineisDaMark82(true);
        return true;
      };
      const iniciarEasterEggDoET = function iniciarEasterEggDoET(vaca, opcoes = {}) {
        const motivo = motivoParaNaoMostrarOET(!!opcoes.teste);
        if (motivo || !vaca || !vaca.parent || !vaca.visible) return false;
        const registro = estado.eventosEspeciais.et, antes = { ...registro }, primeiraVez = !registro.descobertoEm, agora = Date.now();
        registro.ultimaEm = agora; registro.vezes++; if (primeiraVez) registro.descobertoEm = agora;
        if (!salvarProgresso()) { Object.assign(registro, antes); return false; }   // sem registro salvo, sem cena
        avisarObjetivos('et', { primeiraVez });
        const C = EVENTOS_ESPECIAIS_CONFIG.et, recursos = criarColecaoDeRecursos(), disco = criarDiscoVoador(recursos);
        const alvo = new THREE.Vector3(), alto = new THREE.Vector3(), pairando = new THREE.Vector3(), saida = new THREE.Vector3(), direcaoDaCamera = new THREE.Vector3();
        vaca.getWorldPosition(alvo);
        alto.set(alvo.x, alvo.y + 32, alvo.z);                                          // aparece bem em cima da vaca, descendo do céu
        const angulo = Math.random() * Math.PI * 2;
        saida.set(alvo.x + Math.cos(angulo) * 40, alvo.y + 80, alvo.z + Math.sin(angulo) * 40);
        disco.raiz.scale.setScalar(0.35); disco.raiz.position.copy(alto); recursos.naCena(disco.raiz);
        mostrarAviso(primeiraVez ? '👽 Um disco voador surgiu sobre a vaca… é o ET!' : '👽 O ET voltou atrás das vacas!');
        tocarSegredo('discoVoador');
        let tempo = 0, encerrado = false, levou = false, vacaNoFeixe = null, inicioY = 0, entrou = false;
        const encerrar = function encerrar() {
          if (encerrado) return; encerrado = true;
          recursos.descartar(); eventoEmAndamento = null;   // a cópia da vaca compartilha geometrias com a original: só sai da cena
          if (levou) mostrarAviso('👽 O ET levou a vaca para um passeio no espaço! Ela volta em ' + segundosParaAVacaVoltar() + ' segundos.');
        };
        eventoEmAndamento = {
          tipo: 'et', recursos, encerrar,
          atualizar: segundos => {
            tempo += segundos;
            camera.getWorldDirection(direcaoDaCamera).negate();
            disco.animar(tempo, direcaoDaCamera);
            if (!levou && vaca.parent) vaca.getWorldPosition(alvo);                       // segue a vaca até o feixe a pegar
            pairando.set(alvo.x, alvo.y + 5 + Math.sin(tempo * 2.4) * 0.15, alvo.z);
            if (tempo < 1.4) {                                                            // desce do céu, crescendo, e freia sobre a vaca
              const descida = 1 - Math.pow(1 - tempo / 1.4, 3);
              disco.raiz.position.lerpVectors(alto, pairando, descida); disco.raiz.scale.setScalar(0.35 + 0.5 * descida);
              disco.nave.rotation.z = Math.sin(tempo * 6) * 0.15 * (1 - descida);
            } else if (tempo < 6.6) {
              disco.raiz.position.copy(pairando); disco.raiz.scale.setScalar(0.85);
              // o ET sobe na cúpula e se inclina para olhar a vaca (início da abdução)
              const olhar = suavizarNoEvento((tempo - 1.4) / 0.6);
              disco.alienigena.position.y = 0.18 + 0.22 * olhar; disco.alienigena.rotation.x = 0.45 * olhar;
              // o feixe acende, envolve a vaca e pulsa; apaga quando ela entra no disco
              disco.materialDoFeixe.opacity = tempo < 2 ? 0 : tempo < 2.6 ? 0.5 * suavizarNoEvento((tempo - 2) / 0.6) : !entrou ? 0.5 + Math.sin(tempo * 10) * 0.07 : Math.max(0, disco.materialDoFeixe.opacity - segundos * 1.5);
              disco.feixe.scale.set(0.7, (pairando.y - alvo.y) / 0.85 + 0.25, 0.7);
              if (tempo >= 2.6 && !levou) {                                               // a vaca sai DE VERDADE do curral (salvo)
                const posicao = new THREE.Vector3(), rotacao = new THREE.Quaternion();
                vaca.getWorldPosition(posicao); vaca.getWorldQuaternion(rotacao);
                levou = levarVacaPeloET(vaca);
                if (levou) {                                                              // no feixe sobe a MESMA vaca (cópia idêntica)
                  vacaNoFeixe = vaca.clone(true); vacaNoFeixe.visible = true; vacaNoFeixe.position.copy(posicao); vacaNoFeixe.quaternion.copy(rotacao);
                  inicioY = posicao.y; recursos.naCena(vacaNoFeixe);
                } else { entrou = true; tempo = Math.max(tempo, 6.2); }                       // não deu: o feixe apaga e o disco vai embora sem a vaca
              }
              if (vacaNoFeixe && !entrou) {                                               // sobe girando devagar e balançando, encolhendo no fim
                const subida = suavizarNoEvento((tempo - 2.6) / 3.4);
                vacaNoFeixe.position.y = misturarNoEvento(inicioY, pairando.y - 0.6, subida);
                vacaNoFeixe.rotation.y += segundos * 1.4; vacaNoFeixe.rotation.z = Math.sin(tempo * 4) * 0.22; vacaNoFeixe.rotation.x = Math.sin(tempo * 3) * 0.12;
                vacaNoFeixe.scale.setScalar(1 - 0.75 * Math.max(0, subida - 0.55) / 0.45);
                if (subida >= 1) { entrou = true; vacaNoFeixe.visible = false; disco.alienigena.position.y = 0.18; disco.alienigena.rotation.x = 0; }
              }
            } else {                                                                      // gira e some no céu, levando a vaca
              const partida = suavizarNoEvento((tempo - 6.6) / (C.segundosDaCena - 6.6));
              disco.materialDoFeixe.opacity = 0;
              disco.nave.rotation.y += segundos * 16 * (1 - partida * 0.5);
              disco.raiz.position.lerpVectors(pairando, saida, partida * partida); disco.raiz.scale.setScalar(0.85 * (1 - 0.85 * partida));
            }
            if (tempo >= C.segundosDaCena) encerrar();
          },
        };
        return true;
      };
      // Clique (sem arrastar) numa vaca do curral: mesmo critério do clique no mundo (seção 23). Só um raio no curral, e só no clique.
      const raioDoCliqueNaVaca = new THREE.Raycaster(), pontoDoCliqueNaVaca = new THREE.Vector2();
      let inicioDoCliqueNaVaca = null;
      canvas.addEventListener('pointerdown', evento => { inicioDoCliqueNaVaca = evento.isPrimary ? { x: evento.clientX, y: evento.clientY, t: performance.now() } : null; });
      canvas.addEventListener('pointerup', evento => {
        const inicio = inicioDoCliqueNaVaca; inicioDoCliqueNaVaca = null;
        if (!inicio || Math.hypot(evento.clientX - inicio.x, evento.clientY - inicio.y) > 6 || performance.now() - inicio.t > 500) return;
        if (!estado.niveis.curral || motivoParaNaoMostrarOET()) return;   // fora do intervalo ou ocupado: o clique não faz nada (segredo)
        const retangulo = canvas.getBoundingClientRect();
        pontoDoCliqueNaVaca.set(((evento.clientX - retangulo.left) / retangulo.width) * 2 - 1, -((evento.clientY - retangulo.top) / retangulo.height) * 2 + 1);
        raioDoCliqueNaVaca.setFromCamera(pontoDoCliqueNaVaca, camera);
        const acerto = raioDoCliqueNaVaca.intersectObject(grupoDaArea.curral, true)[0];
        if (!acerto) return;
        let vaca = null; for (let objeto = acerto.object; objeto; objeto = objeto.parent) if (objeto.userData && objeto.userData.animal === 'vaca') { vaca = objeto; break; }
        if (!vaca || !vaca.visible) return;
        if (Math.random() < EVENTOS_ESPECIAIS_CONFIG.et.chancePorClique) iniciarEasterEggDoET(vaca);
      });

      // ---- laço: sorteio da abdução, retomada da cena interrompida e atualização do evento em andamento ----
      let segundosDeJogoParaOSorteio = 0, segundosDesdeAMontagem = 0;
      const atualizarEventosEspeciais = function atualizarEventosEspeciais(segundosDesdeUltimoFrame) {
        segundosDesdeAMontagem += segundosDesdeUltimoFrame;
        conferirVoltaDaVaca();   // Etapa 1: a vaca abduzida volta no prazo salvo (independe do sorteio e do evento em andamento)
        if (eventoEmAndamento) {
          try { eventoEmAndamento.atualizar(segundosDesdeUltimoFrame); }
          catch (erro) { console.error('[FarmEdu] Evento especial interrompido com segurança:', erro); const evento = eventoEmAndamento; evento.encerrar(true); cameraDoEvento.peso = 0; eventoEmAndamento = null; }
          return;
        }
        // A poção foi usada, mas a página fechou antes do fim da cena: mostra a cena uma vez ao voltar (o uso já está gravado).
        const registro = estado.eventosEspeciais.misterio;
        if (registro.usadoEm && !registro.concluido && !cenaDoCeuJaRetomada && segundosDesdeAMontagem > 5 && !document.hidden && painelDoGuardiao.hidden) {
          cenaDoCeuJaRetomada = true; iniciarEventoDoUnicornio(); return;
        }
        if (document.hidden) return;
        segundosDeJogoParaOSorteio += segundosDesdeUltimoFrame;
        const C = EVENTOS_ESPECIAIS_CONFIG.abducao;
        if (segundosDeJogoParaOSorteio < C.minutosDeJogoEntreSorteios * 60) return;
        segundosDeJogoParaOSorteio = 0;
        if (!motivoParaNaoAbduzir() && Math.random() < C.chancePorSorteio) iniciarAbducao();
      };
      // Ferramenta do modo desenvolvedor (botão "🛸 Abdução agora") e API de teste no console.
      selecionar('#botao-teste-abducao').onclick = () => { if (!modoDesenvolvedorAtivo) return; iniciarAbducao({ teste: true }); };
      Object.assign(window, { farmEduEventos: {
        iniciarAbducao: () => iniciarAbducao({ teste: true }), reproduzirCenaDoCeu: () => iniciarEventoDoUnicornio({ teste: true }),
        mostrarET: (ignorarIntervalo = true) => iniciarEasterEggDoET(vacaVisivelDoCurral(), { teste: ignorarIntervalo }), motivoDoET: () => motivoParaNaoMostrarOET(),   // Etapa 2 (testes)
        situacao: () => ({ evento: eventoEmAndamento && eventoEmAndamento.tipo, pesoDaCamera: cameraDoEvento.peso, objetosTemporarios: eventoEmAndamento ? eventoEmAndamento.recursos.quantidadeNaCena() : 0, filhosDaCena: cena.children.length }),
      } });

      arquivoDaMontagemConcluido('30c-eventos-especiais.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
