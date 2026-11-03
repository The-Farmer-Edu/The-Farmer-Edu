      // ====================================================================================================
      // FARMEDU 3D — 10-praca-central.js (Fase 3B da refatoração: seção 10)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================

      // ====================================================================================================
      // SEÇÃO 10 — PRAÇA CENTRAL DO CHAFARIZ
      // Praça planejada na frente da fazenda: pavimento de pedra elíptico, jardim gramado em volta do lago com o chafariz (o lago é
      // construído na seção 11, no centro desta praça), meio-fio, faixa decorativa, mirante para o rio, bancos voltados para o
      // chafariz, postes, canteiros, arbustos, árvores pequenas e pedras. Tudo é posicionado por ângulos em volta do centro,
      // deixando livres as entradas (norte, leste e mirante a oeste) e o anel de circulação entre o jardim e os bancos.
      // Registra as próprias colisões ANTES da distribuição automática de postes e da vegetação (seção 11).
      // ====================================================================================================
      // Contorno ondulado do lago (raio relativo por ângulo, ~0,83 a ~1,19). É compartilhado pelo lago (seção 11), pelo jardim e
      // pela colisão, para que a água, as plantas da margem e a grama sigam sempre a mesma forma.
      const LAGO_DA_PRACA = { raioX: 6, raioZ: 4.2, contorno: angulo => 1 + 0.1 * Math.sin(3 * angulo + 1) + 0.07 * Math.sin(5 * angulo + 2) + 0.04 * Math.sin(8 * angulo) };
      // Verdadeiro se (x, z) está dentro do jardim que cerca o lago (margem = folga extra em unidades do mapa).
      const dentroDoJardimDaPraca = function dentroDoJardimDaPraca(posicaoX, posicaoZ, margem = 0) {
        const relativoX = (posicaoX - PRACA_CENTRAL.x) / LAGO_DA_PRACA.raioX, relativoZ = (posicaoZ - PRACA_CENTRAL.z) / LAGO_DA_PRACA.raioZ;
        const angulo = Math.atan2(relativoZ, relativoX), raioMedio = (LAGO_DA_PRACA.raioX + LAGO_DA_PRACA.raioZ) / 2;
        return Math.hypot(relativoX, relativoZ) < PRACA_CENTRAL.escalaDoJardim * LAGO_DA_PRACA.contorno(angulo) + margem / raioMedio;
      };
      // Verdadeiro se (x, z) cai no pavimento da praça, no mirante ou nas estradas novas que levam até ela. A vegetação sorteada da
      // seção 11 que cairia aqui é escondida (sem sortear de novo, para não mudar o restante do cenário).
      const estaNaAreaDaPracaCentral = function estaNaAreaDaPracaCentral(posicaoX, posicaoZ, margem = 0) {
        if (estaNoCorredorDaMina(posicaoX, posicaoZ, margem) || ROTAS_DA_MARK_8_2.some(([xInicial, zInicial, xFinal, zFinal, largura]) => posicaoX > Math.min(xInicial, xFinal) - largura / 2 - margem && posicaoX < Math.max(xInicial, xFinal) + largura / 2 + margem && Math.abs(posicaoZ - zInicial) < largura / 2 + margem)) return true;   // Mark 8.2: trilhos da mina e estrada da Nova plantação
        const { x: centroX, z: centroZ, raioX, raioZ, mirante } = PRACA_CENTRAL;
        if (((posicaoX - centroX) / (raioX + margem)) ** 2 + ((posicaoZ - centroZ) / (raioZ + margem)) ** 2 < 1) return true;
        if (Math.hypot(posicaoX - mirante.x, posicaoZ - mirante.z) < mirante.raio + margem) return true;
        return ROTAS_DA_PRACA_CENTRAL.some(([xInicial, zInicial, xFinal, zFinal, largura]) => posicaoX > Math.min(xInicial, xFinal) - largura / 2 - margem && posicaoX < Math.max(xInicial, xFinal) + largura / 2 + margem && posicaoZ > Math.min(zInicial, zFinal) - largura / 2 - margem && posicaoZ < Math.max(zInicial, zFinal) + largura / 2 + margem);
      };

      // Textura do piso: pedras retangulares irregulares em tons de areia, com rejunte. É repetida pelo mapa (UV em coordenadas do
      // mundo), então o desenho continua igual de uma malha para outra (pavimento, mirante).
      const criarTexturaDoPisoDaPraca = function criarTexturaDoPisoDaPraca() {
        const tamanho = 256, canvasDaImagem = document.createElement('canvas'); canvasDaImagem.width = canvasDaImagem.height = tamanho;
        const contexto2d = canvasDaImagem.getContext('2d'), sortear = criarGeradorDeNumerosAleatorios(415), tons = ['#e3d4ae', '#d8c69c', '#cdb98f', '#eadfbf', '#c4b187', '#dccaa2'];
        contexto2d.fillStyle = '#a8946c'; contexto2d.fillRect(0, 0, tamanho, tamanho);                               // rejunte
        for (let linha = 0, alturaDaLinha = 32; linha < tamanho / alturaDaLinha; linha++) {
          let posicaoX = linha % 2 ? -22 : 0;                                                                         // fiadas desencontradas
          while (posicaoX < tamanho) {
            const largura = 30 + Math.floor(sortear() * 34);
            contexto2d.fillStyle = tons[Math.floor(sortear() * tons.length)];
            for (const deslocamento of [0, -tamanho, tamanho]) contexto2d.fillRect(posicaoX + 2 + deslocamento, linha * alturaDaLinha + 2, largura - 4, alturaDaLinha - 4); // emenda nas bordas
            contexto2d.fillStyle = 'rgba(255,255,255,0.12)';
            for (const deslocamento of [0, -tamanho, tamanho]) contexto2d.fillRect(posicaoX + 3 + deslocamento, linha * alturaDaLinha + 3, largura - 6, 3);
            posicaoX += largura;
          }
        }
        const textura = new THREE.CanvasTexture(canvasDaImagem); textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
        return textura;
      };
      // Troca as coordenadas de textura de uma geometria plana (ShapeGeometry/CircleGeometry, que depois é deitada com
      // rotation.x = −π/2) por coordenadas do mundo divididas por "escala": as pedras ficam do mesmo tamanho em todas as peças.
      const aplicarUVDoMundo = function aplicarUVDoMundo(geometria, centroX, centroZ, escala) {
        const posicoes = geometria.attributes.position, coordenadasUV = [];
        for (let indice = 0; indice < posicoes.count; indice++) coordenadasUV.push((centroX + posicoes.getX(indice)) / escala, (centroZ - posicoes.getY(indice)) / escala);
        geometria.setAttribute('uv', new THREE.Float32BufferAttribute(coordenadasUV, 2));
      };
      // Forma plana (THREE.Shape) a partir de pontos do MUNDO [x, z], já convertidos para o sistema da forma deitada
      // (x da forma = x − centroX; y da forma = −(z − centroZ)).
      const formaAPartirDePontos = function formaAPartirDePontos(pontos, centroX, centroZ) {
        const forma = new THREE.Shape();
        pontos.forEach(([posicaoX, posicaoZ], indice) => indice ? forma.lineTo(posicaoX - centroX, centroZ - posicaoZ) : forma.moveTo(posicaoX - centroX, centroZ - posicaoZ));
        return forma;
      };

      const pracaCentral = (() => {
        const { x: centroX, z: centroZ, raioX, raioZ, mirante, escalaDoJardim } = PRACA_CENTRAL;
        const grupo = new THREE.Group(); grupo.position.set(centroX, 0, centroZ); grupo.userData.nome = 'praca-central'; cena.add(grupo);
        const PONTOS_DO_CONTORNO = 128;
        // contornos no mundo: jardim (mesma ondulação do lago) e elipse externa do pavimento
        const contornoDoJardim = Array.from({ length: PONTOS_DO_CONTORNO }, (_, indice) => {
          const angulo = indice / PONTOS_DO_CONTORNO * Math.PI * 2, raio = escalaDoJardim * LAGO_DA_PRACA.contorno(angulo);
          return [centroX + Math.cos(angulo) * LAGO_DA_PRACA.raioX * raio, centroZ + Math.sin(angulo) * LAGO_DA_PRACA.raioZ * raio];
        });
        const elipse = escala => Array.from({ length: PONTOS_DO_CONTORNO }, (_, indice) => { const angulo = indice / PONTOS_DO_CONTORNO * Math.PI * 2; return [centroX + Math.cos(angulo) * raioX * escala, centroZ + Math.sin(angulo) * raioZ * escala]; });
        const deitar = (geometria, materialDaPeca, posicaoY, ordem = 0) => { const malha = new THREE.Mesh(geometria, materialDaPeca); malha.rotation.x = -Math.PI / 2; malha.position.y = posicaoY; malha.receiveShadow = true; malha.renderOrder = ordem; grupo.add(malha); return malha; };

        // 1) jardim gramado (um verde um pouco mais vivo que o campo) e pavimento com o jardim vazado no meio.
        //    Material Phong (luz calculada por pixel): os postes da praça desenham manchas de luz reais no piso à noite.
        deitar(new THREE.ShapeGeometry(formaAPartirDePontos(contornoDoJardim, centroX, centroZ)), new THREE.MeshPhongMaterial({ color: 0x84c856, specular: 0x000000, shininess: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }), 0.035);
        const texturaDoPiso = criarTexturaDoPisoDaPraca();
        const materialDoPiso = new THREE.MeshPhongMaterial({ map: texturaDoPiso, specular: 0x000000, shininess: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
        const formaDoPiso = formaAPartirDePontos(elipse(1), centroX, centroZ); formaDoPiso.holes.push(formaAPartirDePontos(contornoDoJardim.slice().reverse(), centroX, centroZ));
        const geometriaDoPiso = new THREE.ShapeGeometry(formaDoPiso); aplicarUVDoMundo(geometriaDoPiso, centroX, centroZ, 3.2);
        deitar(geometriaDoPiso, materialDoPiso, 0.075, 1);
        // faixa de pedras mais escuras acompanhando a borda (desenho de praça planejada)
        const formaDaFaixa = formaAPartirDePontos(elipse(0.955), centroX, centroZ); formaDaFaixa.holes.push(formaAPartirDePontos(elipse(0.925).reverse(), centroX, centroZ));
        deitar(new THREE.ShapeGeometry(formaDaFaixa), new THREE.MeshPhongMaterial({ color: 0xa48d64, specular: 0x000000, shininess: 0, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), 0.082, 2);
        // mirante: disco do mesmo piso, um pouco mais baixo (onde encosta no pavimento, o pavimento fica por cima, sem z-fighting)
        const geometriaDoMirante = new THREE.CircleGeometry(mirante.raio, 32); aplicarUVDoMundo(geometriaDoMirante, mirante.x, mirante.z, 3.2);
        deitar(geometriaDoMirante, materialDoPiso, 0.065).position.set(mirante.x - centroX, 0.065, mirante.z - centroZ);

        // 2) meio-fio de pedra (instanciado: uma única chamada de desenho por anel), com tons levemente variados
        const materialDoMeioFio = new THREE.MeshLambertMaterial({ color: 0xffffff }), corDoMeioFio = new THREE.Color(), objetoAuxiliar = new THREE.Object3D();
        function criarMeioFio(pontos, pular, fechado = true) {
          const pecas = [];
          for (let indice = 0; indice < pontos.length - (fechado ? 0 : 1); indice++) {
            const [xA, zA] = pontos[indice], [xB, zB] = pontos[(indice + 1) % pontos.length], meioX = (xA + xB) / 2, meioZ = (zA + zB) / 2;
            if (pular(meioX, meioZ)) continue;
            pecas.push([meioX, meioZ, Math.hypot(xB - xA, zB - zA) + 0.03, Math.atan2(-(zB - zA), xB - xA)]);
          }
          const malha = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.15, 0.24), materialDoMeioFio, pecas.length);
          pecas.forEach(([meioX, meioZ, comprimento, giro], indice) => {
            objetoAuxiliar.position.set(meioX - centroX, 0.075, meioZ - centroZ); objetoAuxiliar.rotation.set(0, giro, 0); objetoAuxiliar.scale.set(comprimento, 1, 1); objetoAuxiliar.updateMatrix();
            malha.setMatrixAt(indice, objetoAuxiliar.matrix); malha.setColorAt(indice, corDoMeioFio.setHex(0xbab4a5).multiplyScalar(0.9 + ((indice * 37) % 10) / 50));
          });
          malha.instanceMatrix.needsUpdate = true; if (malha.instanceColor) malha.instanceColor.needsUpdate = true;
          malha.frustumCulled = false; malha.receiveShadow = true; grupo.add(malha);
          return malha;
        }
        const naEntrada = (posicaoX, posicaoZ) => (Math.abs(posicaoX - centroX) < 1.75 && posicaoZ < centroZ)          // entrada norte (espinha)
          || (Math.abs(posicaoZ - centroZ) < 1.75 && posicaoX > centroX)                                                   // saída leste
          || Math.hypot(posicaoX - mirante.x, posicaoZ - mirante.z) < mirante.raio + 0.1;                                  // abertura do mirante
        criarMeioFio(contornoDoJardim, () => false);
        criarMeioFio(elipse(1), naEntrada);
        criarMeioFio(Array.from({ length: 40 }, (_, indice) => { const angulo = indice / 40 * Math.PI * 2; return [mirante.x + Math.cos(angulo) * mirante.raio, mirante.z + Math.sin(angulo) * mirante.raio]; }),
          (posicaoX, posicaoZ) => ((posicaoX - centroX) / raioX) ** 2 + ((posicaoZ - centroZ) / raioZ) ** 2 < 1.02);     // só a parte do mirante fora da praça

        // 3) colisões: pavimento e mirante são piso (pessoas andam, postes automáticos e árvores não nascem); o jardim bloqueia
        COLISOES.elipse('estrada', centroX, centroZ, raioX, raioZ);
        COLISOES.circulo('estrada', mirante.x, mirante.z, mirante.raio);
        COLISOES.forma('lago', dentroDoJardimDaPraca);

        // 4) mobiliário em volta do anel de circulação. Ângulos em graus (0° = leste, 90° = sul, 270° = norte/entrada).
        //    Bancos ficam encostados na borda externa, virados para o chafariz, onde o anel é mais largo; os postes ladeiam as
        //    entradas. Nada fica no caminho entre o jardim e os bancos.
        const pontoNaBorda = (graus, recuo) => { const angulo = graus * Math.PI / 180; return [centroX + Math.cos(angulo) * (raioX - recuo), centroZ + Math.sin(angulo) * (raioZ - recuo)]; };
        const ANGULOS_DOS_BANCOS = [35, 58, 90, 122, 212, 238, 302, 328], ANGULOS_DOS_POSTES = [15, 75, 105, 165, 195, 256, 284, 345];
        for (const graus of ANGULOS_DOS_BANCOS) { const [posicaoX, posicaoZ] = pontoNaBorda(graus, 0.85); criarBanco(posicaoX, posicaoZ, Math.atan2(centroX - posicaoX, centroZ - posicaoZ)); }
        for (const graus of ANGULOS_DOS_POSTES) { const [posicaoX, posicaoZ] = pontoNaBorda(graus, 0.45); criarPoste(posicaoX, posicaoZ, -graus * Math.PI / 180); }
        criarBanco(mirante.x - 0.75, mirante.z, -Math.PI / 2);                                                            // banco do mirante, de frente para o rio

        // 5) verde em volta: arbustos atrás dos bancos, canteiros floridos ladeando as entradas, árvores pequenas com flores ao pé e pedras
        const flores = [], CORES_DAS_FLORES = [0xff8fb1, 0xffd23f, 0xffffff, 0xb48cf2, 0xff6b6b, 0xffa94d];
        const plantarFlores = (posicaoX, posicaoZ, raio, quantidade, alturaDoSolo, semente) => { for (let indice = 0; indice < quantidade; indice++) { const angulo = (indice + 0.3 * Math.sin(semente + indice)) / quantidade * Math.PI * 2; flores.push([posicaoX + Math.cos(angulo) * raio, alturaDoSolo, posicaoZ + Math.sin(angulo) * raio, CORES_DAS_FLORES[(indice + semente) % CORES_DAS_FLORES.length]]); } };
        for (const graus of ANGULOS_DOS_BANCOS) for (const desvio of [-4.5, 4.5]) {
          const angulo = (graus + desvio) * Math.PI / 180, posicaoX = centroX + Math.cos(angulo) * (raioX + 0.75), posicaoZ = centroZ + Math.sin(angulo) * (raioZ + 0.75);
          criarArbusto(cena, posicaoX, posicaoZ, desvio > 0); COLISOES.circulo('canteiro', posicaoX, posicaoZ, 0.45);
        }
        // canteiro elevado: borda de pedra, terra, um arbusto no centro e flores em volta
        function criarCanteiro(posicaoX, posicaoZ, raio, semente) {
          const borda = new THREE.Mesh(new THREE.TorusGeometry(raio, 0.09, 6, 22), material(0xa9a396)); borda.rotation.x = Math.PI / 2; borda.position.set(posicaoX - centroX, 0.12, posicaoZ - centroZ); borda.castShadow = true; grupo.add(borda);
          criarCilindro(raio, raio, 0.16, 0x6b4a2b, posicaoX - centroX, 0.08, posicaoZ - centroZ, grupo, 20).receiveShadow = true;
          criarArbusto(grupo, posicaoX - centroX, posicaoZ - centroZ, false);
          plantarFlores(posicaoX - centroX, posicaoZ - centroZ, raio * 0.68, Math.round(raio * 11), 0.2, semente);
          COLISOES.circulo('canteiro', posicaoX, posicaoZ, raio + 0.1);
        }
        [[-3.0, 26.9, 0.75], [3.0, 26.9, 0.75], [16.0, 36.6, 0.6], [16.0, 42.4, 0.6], [-16.0, 36.95, 0.6], [-16.0, 42.05, 0.6], [0, 52.3, 1.0]]
          .forEach(([posicaoX, posicaoZ, raio], indice) => criarCanteiro(posicaoX, posicaoZ, raio, indice * 2));
        // árvores pequenas fora do anel (sem tocar estradas, construções nem o mirante), cada uma com flores e pedras ao pé
        [[20, 0.7], [45, 0.75], [135, 0.72], [160, 0.62], [200, 0.62], [225, 0.7], [315, 0.68], [340, 0.7]].forEach(([graus, escala], indice) => {
          const angulo = graus * Math.PI / 180, posicaoX = centroX + Math.cos(angulo) * (raioX + 2.6), posicaoZ = centroZ + Math.sin(angulo) * (raioZ + 2.6);
          criarArvore(grupo, posicaoX - centroX, posicaoZ - centroZ, escala);
          plantarFlores(posicaoX - centroX, posicaoZ - centroZ, 0.95, 9, 0.1, indice);
          criarPedra(grupo, posicaoX - centroX + 1.15, posicaoZ - centroZ + 0.45, 0.28); criarPedra(grupo, posicaoX - centroX - 0.9, posicaoZ - centroZ + 0.8, 0.2);
          COLISOES.circulo('arvore', posicaoX, posicaoZ, 0.8);
        });
        const malhaDasFlores = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshLambertMaterial({ color: 0xffffff }), flores.length);
        flores.forEach(([posicaoX, posicaoY, posicaoZ, cor], indice) => { objetoAuxiliar.position.set(posicaoX, posicaoY, posicaoZ); objetoAuxiliar.rotation.set(0, 0, 0); objetoAuxiliar.scale.setScalar(0.09); objetoAuxiliar.updateMatrix(); malhaDasFlores.setMatrixAt(indice, objetoAuxiliar.matrix); malhaDasFlores.setColorAt(indice, corDoMeioFio.setHex(cor)); });
        malhaDasFlores.instanceMatrix.needsUpdate = true; if (malhaDasFlores.instanceColor) malhaDasFlores.instanceColor.needsUpdate = true; malhaDasFlores.frustumCulled = false; grupo.add(malhaDasFlores);
        return { grupo, contornoDoJardim };
      })();

      arquivoDaMontagemConcluido('10-praca-central.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
