      // ====================================================================================================
      // FARMEDU 3D — 08-modelos-reutilizaveis.js (Fase 3B da refatoração: seção 08)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 08 — MODELOS REUTILIZÁVEIS: CERCAS, VEGETAÇÃO, OBJETOS E ANIMAIS
      // Cercas, árvores, arbustos, barris, abrigos, trator com faróis e reboque, e os modelos dos animais (galinha, vaca, ovelha, cavalo,
      // porco) com sua animação de caminhada (pernas articuladas no quadril e pés sempre no chão).
      // ====================================================================================================
      // ---- Faróis do trator: materiais compartilhados. A seção 20 controla o brilho conforme o ciclo de dia e noite
      //      (apagados de dia, acesos à noite) e posiciona a única luz de foco real que acompanha o trator. ----
      // Feixe projetado no chão: estreito e forte perto do trator, mais largo e fraco à distância (desenhado num canvas).
      const criarTexturaDoFeixeDoFarol = function criarTexturaDoFeixeDoFarol() {
        const largura = 128, altura = 256, canvasDaImagem = document.createElement('canvas'); canvasDaImagem.width = largura; canvasDaImagem.height = altura;
        const contexto2d = canvasDaImagem.getContext('2d');
        for (let linha = 0; linha < altura; linha++) {                        // linha 0 = junto ao para-choque; a última = alcance máximo
          const fracao = linha / (altura - 1), meiaLargura = 14 + 48 * fracao;
          const forca = Math.pow(1 - fracao, 1.25) * Math.min(1, fracao / 0.06);  // some no fim do alcance e entra suave junto ao trator
          const gradiente = contexto2d.createLinearGradient(largura / 2 - meiaLargura, 0, largura / 2 + meiaLargura, 0);
          gradiente.addColorStop(0, 'rgba(255,244,214,0)'); gradiente.addColorStop(0.5, `rgba(255,244,214,${0.85 * forca})`); gradiente.addColorStop(1, 'rgba(255,244,214,0)');
          contexto2d.fillStyle = gradiente; contexto2d.fillRect(0, linha, largura, 1);
        }
        return new THREE.CanvasTexture(canvasDaImagem);
      };
      const materialDaLenteDoFarol = new THREE.MeshBasicMaterial({ color: 0x9aa3a8 });   // lente: cinza de dia, branca-amarelada à noite
      const materialDoHaloDoFarol = new THREE.SpriteMaterial({ map: texturaRadial('255,244,214', 1), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      const materialDoFeixeNoChao = new THREE.MeshBasicMaterial({ map: criarTexturaDoFeixeDoFarol(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -3 });
      for (const materialDoFarol of [materialDaLenteDoFarol, materialDoHaloDoFarol, materialDoFeixeNoChao]) materialDoFarol.userData.ignorarCiclo = true; // o ciclo não os escurece
      // Trator atual (só existe um, na área de maquinário a partir do nível 2). origem/alvo são pontos LOCAIS do trator usados
      // pela seção 20 para apontar a luz de foco dos faróis. Quando a área é reconstruída o trator antigo sai da cena (parent = null).
      let farolDoTrator = null;

      // Trator estilizado (a frente é o lado +z): capô, cabine de vidro, paralamas, escapamento, grade, para-choque e dois
      // faróis com lente, halo e feixe de luz no chão. "escala" ajusta o tamanho; corDoAro pinta os aros das rodas.
      const criarTrator = function criarTrator(objetoPai, posicaoX, posicaoZ, escala, cor, corDoAro) {
        const grupoDoTrator = new THREE.Group();
        grupoDoTrator.userData.nome = 'trator';
        criarCaixa(1.1, 0.7, 2, cor, 0, 0.95, 0, grupoDoTrator);
        criarCaixa(0.9, 0.9, 0.9, PALETA_DE_CORES.vidro, 0, 1.7, -0.45, grupoDoTrator);
        criarCaixa(1, 0.08, 1, cor, 0, 2.2, -0.45, grupoDoTrator);
        criarCaixa(0.1, 0.6, 0.1, 0x333333, 0.35, 1.6, 0.7, grupoDoTrator);
        criarCilindro(0.07, 0.06, 0.08, 0x222222, 0.35, 1.94, 0.7, grupoDoTrator, 8);                     // boca do escapamento
        criarCaixa(0.9, 0.06, 0.95, new THREE.Color(cor).multiplyScalar(0.85).getHex(), 0, 1.33, 0.5, grupoDoTrator);  // tampa do capô
        for (const lado of [-1, 1]) criarCaixa(0.44, 0.07, 1.05, cor, lado * 0.8, 1.26, -0.5, grupoDoTrator);   // paralamas das rodas grandes
        criarRoda(0.6, 0.4, -0.8, 0.6, -0.5, grupoDoTrator, corDoAro); criarRoda(0.6, 0.4, 0.8, 0.6, -0.5, grupoDoTrator, corDoAro);
        criarRoda(0.38, 0.3, -0.7, 0.38, 0.8, grupoDoTrator, corDoAro); criarRoda(0.38, 0.3, 0.7, 0.38, 0.8, grupoDoTrator, corDoAro);
        // frente: grade do radiador, para-choque e faróis (carcaça escura, lente que acende e halo luminoso)
        criarCaixa(0.5, 0.32, 0.05, 0x2a2a2a, 0, 0.93, 1.02, grupoDoTrator);
        criarCaixa(1.0, 0.16, 0.12, 0x3a3a3a, 0, 0.62, 1.05, grupoDoTrator);
        for (const lado of [-1, 1]) {
          criarCaixa(0.22, 0.18, 0.08, 0x2c2c2c, lado * 0.39, 1.12, 1.01, grupoDoTrator);
          const lente = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 10), materialDaLenteDoFarol);
          lente.rotation.x = Math.PI / 2; lente.position.set(lado * 0.39, 1.12, 1.06); grupoDoTrator.add(lente);
          const halo = new THREE.Sprite(materialDoHaloDoFarol); halo.position.set(lado * 0.39, 1.12, 1.15); halo.scale.set(0.9, 0.9, 1); grupoDoTrator.add(halo);
        }
        // feixe no chão: começa junto ao para-choque e avança ~6,4 unidades (vezes a escala do trator)
        criarManchaDeLuzNoChao(grupoDoTrator, materialDoFeixeNoChao, 0, 0.14, 1.1 + 3.2, 3.4, 6.4).renderOrder = 3;
        farolDoTrator = { trator: grupoDoTrator, origem: new THREE.Vector3(0, 1.12, 1.15), alvo: new THREE.Vector3(0, 0, 7) };
        grupoDoTrator.scale.setScalar(escala);
        grupoDoTrator.position.set(posicaoX, 0, posicaoZ);
        objetoPai.add(grupoDoTrator);
        return grupoDoTrator;
      };
      // Reboque de trator com caçamba e rodas. "giro" é a rotação em torno do eixo vertical.
      const criarReboque = function criarReboque(grupo, posicaoX, posicaoZ, giro) {
        const grupoDoReboque = new THREE.Group();
        grupoDoReboque.position.set(posicaoX, 0, posicaoZ); grupoDoReboque.rotation.y = giro; grupo.add(grupoDoReboque);
        criarCaixa(1.6, 0.12, 2.4, 0x8a5a2a, 0, 0.7, 0, grupoDoReboque);
        criarCaixa(1.4, 0.05, 2.2, 0xe8e0d0, 0, 0.78, 0, grupoDoReboque);
        for (const lado of [-1, 1]) { criarCaixa(0.1, 0.5, 2.4, 0xa5703a, lado * 0.8, 0.95, 0, grupoDoReboque); criarCaixa(1.6, 0.5, 0.1, 0xa5703a, 0, 0.95, lado * 1.2, grupoDoReboque); }
        criarRoda(0.4, 0.3, -0.9, 0.4, -0.3, grupoDoReboque); criarRoda(0.4, 0.3, 0.9, 0.4, -0.3, grupoDoReboque);
        criarCaixa(0.1, 0.1, 1.4, 0x555555, 0, 0.55, 1.9, grupoDoReboque);
      };
      // Arado agrícola acoplável ao trator, na cor informada.
      const criarArado = function criarArado(grupo, posicaoX, posicaoZ, giro, cor) {
        const grupoDoArado = new THREE.Group();
        grupoDoArado.position.set(posicaoX, 0, posicaoZ); grupoDoArado.rotation.y = giro; grupo.add(grupoDoArado);
        criarCaixa(3, 0.12, 0.3, cor, 0, 0.7, 0, grupoDoArado);
        for (let indice = 0; indice < 8; indice++) criarCaixa(0.05, 0.55, 0.05, 0x555555, -1.3 + indice * 0.37, 0.4, 0, grupoDoArado);
        criarRoda(0.3, 0.1, 1.6, 0.3, 0, grupoDoArado);
      };
      // Abrigo aberto para animais: quatro mourões e um telhado.
      const criarAbrigo = function criarAbrigo(grupo, posicaoX, posicaoZ) {
        for (const diferencaX of [-1, 1]) for (const diferencaZ of [-0.9, 0.9]) criarCaixa(0.12, 1.5, 0.12, PALETA_DE_CORES.madeira, posicaoX + diferencaX, 0.85, posicaoZ + diferencaZ, grupo);
        criarTelhado(grupo, 2.7, 2.5, 0.8, 0xc98a3a, posicaoX, 1.6, posicaoZ);
        criarCaixa(1.2, 0.35, 0.7, 0x2f6f6f, posicaoX, 0.3, posicaoZ, grupo);
      };
      // Cocho (bebedouro/comedouro) retangular para os cercados.
      const criarCocho = function criarCocho(grupo, posicaoX, posicaoZ) { criarCaixa(1.6, 0.4, 0.6, 0x2f6f6f, posicaoX, 0.3, posicaoZ, grupo); criarCaixa(1.4, 0.05, 0.4, 0x5ec7e0, posicaoX, 0.5, posicaoZ, grupo); };

      // casinha de galinha elevada, com rampa, janela e caixa de ninhos (a frente fica virada para +Z)
      const casinhaDeGalinha = function casinhaDeGalinha(grupo, posicaoX, posicaoZ, corParede = 0xc0522f) {
        const casinha = new THREE.Group();
        casinha.position.set(posicaoX, 0, posicaoZ);
        grupo.add(casinha);
        for (const diferencaX of [-0.6, 0.6]) for (const diferencaZ of [-0.45, 0.45]) criarCaixa(0.1, 0.5, 0.1, PALETA_DE_CORES.madeira, diferencaX, 0.25, diferencaZ, casinha); // pernas
        criarCaixa(1.6, 1, 1.2, corParede, 0, 1, 0, casinha);                            // corpo
        criarTelhado(casinha, 1.6, 2, 0.6, PALETA_DE_CORES.telhaCasa, 0, 1.5, 0, Math.PI / 2);            // telhado
        criarCaixa(0.4, 0.5, 0.05, 0x3a2a1a, 0.3, 0.95, 0.62, casinha);                  // porta
        criarCaixa(0.4, 0.04, 0.9, PALETA_DE_CORES.ripa, 0.3, 0.4, 0.95, casinha).rotation.x = 0.75; // rampa
        criarJanela(casinha, -0.4, 1.1, 0.62, false);
        criarCaixa(0.35, 0.4, 1, PALETA_DE_CORES.ripa, 1, 1.1, 0, casinha);                          // caixa de ninhos
      };

      // poça de lama oval (dois cilindros achatados, um mais claro por cima)
      const pocaDeLama = function pocaDeLama(grupo, posicaoX, posicaoZ, raio) {
        criarCilindro(raio, raio, 0.06, 0x5b3a22, posicaoX, 0.13, posicaoZ, grupo, 20).scale.z = 0.7;
        criarCilindro(raio * 0.6, raio * 0.6, 0.06, 0x70492c, posicaoX + raio * 0.1, 0.16, posicaoZ, grupo, 16).scale.z = 0.7;
      };

      const RAIO_DA_HITBOX = { galinha: 0.3, ovelha: 0.5, vaca: 0.8, porco: 0.5, cavalo: 0.85 };
      const ALTURA_DO_CHAO_DOS_CERCADOS = 0.1;   // topo da base de grama das áreas (≈0,095): onde os pés dos animais encostam

      // diz se um animal (círculo de centro x,z) pode ficar nessa posição sem bater em nada
      const posicaoEstaLivre = function posicaoEstaLivre(cercado, animalAtual, posicaoX, posicaoZ, raio) {
        if (Math.abs(posicaoX) > cercado.limiteX - raio || Math.abs(posicaoZ) > cercado.limiteZ - raio) return false; // cerca
        for (const obstaculo of cercado.obstaculos) { // retângulos (abrigo, cocho...)
          const pontoMaisProximoX = Math.min(obstaculo.maxX, Math.max(obstaculo.minX, posicaoX));
          const pontoMaisProximoZ = Math.min(obstaculo.maxZ, Math.max(obstaculo.minZ, posicaoZ));
          if (Math.hypot(posicaoX - pontoMaisProximoX, posicaoZ - pontoMaisProximoZ) < raio) return false;
        }
        return !cercado.animais.some(outro => outro !== animalAtual && Math.hypot(posicaoX - outro.x, posicaoZ - outro.z) < raio + outro.raio);
      };

      // ---- modelos de animais: formas arredondadas (elipsoides), pernas articuladas com cascos/pés, rostos com olhos ----
      // Elipsoide com sombra (raios nos três eixos, posição e giros em X e Z). "segmentos" controla a suavidade: os corpos dos
      // animais maiores usam mais segmentos, para que as manchas encostem na pele sem ficar "flutuando" sobre as facetas.
      const criarElipsoide = (objetoPai, raioX, raioY, raioZ, cor, posicaoX, posicaoY, posicaoZ, giroX = 0, giroZ = 0, segmentos = 10) => {
        const elipsoide = new THREE.Mesh(new THREE.SphereGeometry(1, segmentos, Math.round(segmentos * 0.8)), material(cor));
        elipsoide.scale.set(raioX, raioY, raioZ); elipsoide.position.set(posicaoX, posicaoY, posicaoZ); elipsoide.rotation.set(giroX, 0, giroZ); elipsoide.castShadow = true; objetoPai.add(elipsoide); return elipsoide;
      };
      // Cone (ponta) com sombra, usado em chifres, bicos e orelhas dos animais.
      const criarPonta = (objetoPai, raio, altura, cor, posicaoX, posicaoY, posicaoZ, giroX = 0, giroZ = 0) => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(raio, altura, 6), material(cor));
        cone.position.set(posicaoX, posicaoY, posicaoZ); cone.rotation.set(giroX, 0, giroZ); cone.castShadow = true; objetoPai.add(cone); return cone;
      };
      // Perna articulada: o grupo da perna gira em torno do quadril/ombro (posicaoX, yQuadril, posicaoZ), ponto que fica DENTRO do
      // corpo, e o pé encosta em y = 0 com a perna na vertical (comprimento = yQuadril). "fase" (0 ou π) separa as diagonais.
      // "detalhes" (opcional; usado por vaca, ovelha e cavalo):
      //   raioTopo → a perna afina do alto para baixo · coxa: [raioX, altura, raioZ] → volume (músculo ou lã) no alto da perna que
      //   entra no corpo e esconde a junção, girando junto com ela · corDaCoxa · corInferior + fracaoInferior → canela de outra cor.
      const criarPernaDeAnimal = function criarPernaDeAnimal(grupoDoAnimal, posicaoX, yQuadril, posicaoZ, comprimento, raio, cor, casco, fase, lista, dedos, detalhes = null) {
        const grupoDaPerna = new THREE.Group(); grupoDaPerna.position.set(posicaoX, yQuadril, posicaoZ); grupoDaPerna.userData.perna = { comprimento }; grupoDoAnimal.add(grupoDaPerna);
        if (!detalhes) criarCilindro(raio * 0.85, raio, comprimento, cor, 0, -comprimento / 2, 0, grupoDaPerna, 8);   // perna simples (galinha e porco)
        else {
          const raioTopo = detalhes.raioTopo || raio * 1.2, fracaoInferior = detalhes.corInferior ? (detalhes.fracaoInferior || 0.4) : 0;
          const comprimentoAteOCasco = comprimento - 0.06, alturaSuperior = comprimentoAteOCasco * (1 - fracaoInferior);
          if (fracaoInferior) {
            criarCilindro(raioTopo, raio, alturaSuperior, cor, 0, -alturaSuperior / 2, 0, grupoDaPerna, 8);
            const alturaInferior = comprimentoAteOCasco - alturaSuperior;
            criarCilindro(raio * 1.01, raio * 0.92, alturaInferior, detalhes.corInferior, 0, -alturaSuperior - alturaInferior / 2, 0, grupoDaPerna, 8);
          } else criarCilindro(raioTopo, raio * 0.92, comprimentoAteOCasco, cor, 0, -comprimentoAteOCasco / 2, 0, grupoDaPerna, 8);
          if (detalhes.coxa) { const [raioX, alturaDaCoxa, raioZ] = detalhes.coxa; criarElipsoide(grupoDaPerna, raioX, alturaDaCoxa, raioZ, detalhes.corDaCoxa || cor, 0, -alturaDaCoxa * 0.45, 0); }
        }
        if (dedos) for (let indiceDoDedo = -1; indiceDoDedo <= 1; indiceDoDedo++) criarCaixa(0.028, 0.025, 0.13, casco, indiceDoDedo * 0.04, -comprimento + 0.012, 0.05, grupoDaPerna).rotation.y = indiceDoDedo * 0.4;
        else criarCilindro(raio * 1.12, raio * 1.2, 0.09, casco, 0, -comprimento + 0.045, 0, grupoDaPerna, 8);
        lista.push([grupoDaPerna, fase]);
      };
      // Espalha manchas pequenas e irregulares sobre uma parte do corpo (elipsoide alinhado aos eixos do grupo). Cada mancha é um
      // disco fino "deitado" na pele, orientado pela normal da superfície, com tamanho e giro sorteados. Para não flutuar sobre a
      // curvatura, o disco afunda o quanto a pele se curva até a borda dele (raio² ÷ 2R) e fica só um pouco saliente no centro.
      //   partes: lista de { centro, raios } do corpo · indiceDaParte: parte que recebe as manchas (manchas que cairiam DENTRO de
      //   outra parte ficariam escondidas e são descartadas) · limiteInferior: −1..1, evita a barriga (valores maiores = mais alto).
      // As manchas nunca se sobrepõem (posições já usadas ficam em partes[i].ocupadas).
      const espalharManchas = function espalharManchas(grupo, partes, indiceDaParte, quantidade, cor, tamanhoMinimo, tamanhoMaximo, limiteInferior) {
        const { centro, raios } = partes[indiceDaParte], eixoDaEspessura = new THREE.Vector3(0, 0, 1), ocupadas = partes.ocupadas || (partes.ocupadas = []);
        const dentroDeOutraParte = ponto => partes.some((outra, indice) => indice !== indiceDaParte && ((ponto.x - outra.centro[0]) / outra.raios[0]) ** 2 + ((ponto.y - outra.centro[1]) / outra.raios[1]) ** 2 + ((ponto.z - outra.centro[2]) / outra.raios[2]) ** 2 < 0.97);
        for (let tentativa = 0, feitas = 0; tentativa < quantidade * 40 && feitas < quantidade; tentativa++) {
          const alturaRelativa = limiteInferior + Math.random() * (0.92 - limiteInferior), angulo = Math.random() * Math.PI * 2, horizontal = Math.sqrt(1 - alturaRelativa * alturaRelativa);
          const direcao = [horizontal * Math.cos(angulo), alturaRelativa, horizontal * Math.sin(angulo)];
          const ponto = new THREE.Vector3(centro[0] + raios[0] * direcao[0], centro[1] + raios[1] * direcao[1], centro[2] + raios[2] * direcao[2]);
          const normal = new THREE.Vector3(direcao[0] / raios[0], direcao[1] / raios[1], direcao[2] / raios[2]).normalize();
          const tamanho = tamanhoMinimo + Math.random() * (tamanhoMaximo - tamanhoMinimo);
          if (dentroDeOutraParte(ponto) || ocupadas.some(([outroPonto, outroTamanho]) => outroPonto.distanceTo(ponto) < (tamanho + outroTamanho) * 0.85)) continue;
          const raioDeCurvatura = Math.min(raios[0], raios[1], raios[2]), afundamento = tamanho * tamanho / (2 * raioDeCurvatura), espessura = afundamento + 0.025;
          const mancha = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), material(cor));
          mancha.scale.set(tamanho, tamanho * (0.55 + Math.random() * 0.4), espessura);
          mancha.quaternion.setFromUnitVectors(eixoDaEspessura, normal); mancha.rotateZ(Math.random() * Math.PI);   // forma irregular: giro sorteado na pele
          mancha.position.copy(ponto).addScaledVector(normal, -afundamento + 0.004); mancha.castShadow = true;
          grupo.add(mancha); ocupadas.push([ponto, tamanho]); feitas++;
        }
      };
      // Monta o modelo 3D de um animal ("galinha", "vaca", "ovelha", "cavalo" ou "porco"). Devolve o grupo (a), a lista de
      // pernas com a fase de cada uma, a cabeça (bicadas da galinha) e a cauda (balanço) quando existem, e o comprimento das
      // pernas (usado para manter os pés no chão durante a passada).
      const montarAnimal = function montarAnimal(tipo) {
        const grupoDoAnimal = new THREE.Group(), pernas = []; let cabeca = null, cauda = null, comprimentoDaPerna = 0.3;
        grupoDoAnimal.userData.animal = tipo;
        const faseDaDiagonal = (escalaX, escalaZ) => (escalaX * escalaZ > 0 ? 0 : Math.PI);
        if (tipo === 'galinha') {
          const pena = [0xd2691e, 0xf4efe4, 0xb5651d][Math.floor(Math.random() * 3)], corDaAsa = pena === 0xf4efe4 ? 0xdcd3bd : 0x8f4a14;
          criarElipsoide(grupoDoAnimal, 0.21, 0.2, 0.27, pena, 0, 0.45, 0);
          criarElipsoide(grupoDoAnimal, 0.16, 0.17, 0.14, pena, 0, 0.46, 0.2);                                              // peito
          for (const lado of [-1, 1]) criarElipsoide(grupoDoAnimal, 0.05, 0.14, 0.2, corDaAsa, lado * 0.2, 0.47, -0.02, 0, lado * 0.25);  // asas
          for (let indice = -1; indice <= 1; indice++) criarElipsoide(grupoDoAnimal, 0.035, 0.17, 0.07, indice ? corDaAsa : pena, indice * 0.06, 0.62, -0.3, -0.5, indice * 0.25); // cauda em leque
          cabeca = new THREE.Group(); cabeca.position.set(0, 0.62, 0.2); grupoDoAnimal.add(cabeca);
          criarElipsoide(cabeca, 0.1, 0.105, 0.1, pena, 0, 0.04, 0.03);
          criarPonta(cabeca, 0.04, 0.11, 0xf2b72b, 0, 0.02, 0.15, Math.PI / 2);                              // bico
          for (let indice = 0; indice < 3; indice++) criarElipsoide(cabeca, 0.03, indice === 1 ? 0.06 : 0.04, 0.03, 0xe03a2a, 0, 0.14, 0.07 - indice * 0.04); // crista
          criarElipsoide(cabeca, 0.025, 0.05, 0.025, 0xe03a2a, 0, -0.06, 0.12);                                 // barbela
          for (const lado of [-1, 1]) criarElipsoide(cabeca, 0.018, 0.018, 0.018, 0x111111, lado * 0.085, 0.07, 0.07);
          for (const lado of [-1, 1]) criarPernaDeAnimal(grupoDoAnimal, lado * 0.09, 0.3, 0, 0.3, 0.022, 0xe8a526, 0xe8a526, faseDaDiagonal(lado, 1), pernas, true); // pés com três dedos
        }
        if (tipo === 'vaca') {
          // Vaca holandesa: corpo comprido (tronco + peito + garupa), pescoço curto e cabeça baixa com focinho rosado. As manchas
          // são PEQUENAS e irregulares, sorteadas por vaca e "deitadas" sobre a pele (ver espalharManchas). As pernas saem de
          // dentro do corpo, com coxa e ombro que escondem a junção; o pé encosta no chão.
          const branco = 0xf4f2ec, corDaMancha = Math.random() < 0.25 ? 0x6b4026 : 0x262626, rosa = 0xf2a6b8;
          comprimentoDaPerna = 0.86;
          const partesDoCorpo = [
            { centro: [0, 1.0, 0], raios: [0.46, 0.42, 0.86], manchas: 5 },     // tronco
            { centro: [0, 1.04, 0.5], raios: [0.42, 0.42, 0.42], manchas: 1 },  // peito e ombros
            { centro: [0, 1.1, -0.55], raios: [0.44, 0.38, 0.4], manchas: 2 },  // garupa
            { centro: [0, 1.18, 0.92], raios: [0.25, 0.27, 0.32], manchas: 0, giroX: -0.2, segmentos: 10 },   // pescoço (só bloqueia manchas escondidas)
          ];
          partesDoCorpo.forEach(({ centro, raios, giroX = 0, segmentos = 16 }, indice) => { const parte = criarElipsoide(grupoDoAnimal, ...raios, branco, ...centro, giroX, 0, segmentos); if (!indice) parte.userData.corpoPrincipal = raios; });
          cabeca = new THREE.Group(); cabeca.position.set(0, 1.2, 1.25); cabeca.rotation.x = 0.35; grupoDoAnimal.add(cabeca);  // cabeça inclinada para baixo
          criarElipsoide(cabeca, 0.21, 0.23, 0.3, branco, 0, 0, 0, 0, 0, 14);
          criarElipsoide(cabeca, 0.18, 0.14, 0.13, rosa, 0, -0.075, 0.26);                                    // focinho
          for (const lado of [-1, 1]) {
            criarElipsoide(cabeca, 0.025, 0.025, 0.025, 0x3a2a2a, lado * 0.07, -0.043, 0.378);               // narinas
            criarElipsoide(cabeca, 0.035, 0.035, 0.035, 0x111111, lado * 0.17, 0.118, 0.031);                // olhos
            criarElipsoide(cabeca, 0.15, 0.05, 0.08, 0xe9dccf, lado * 0.3, 0.081, -0.157, 0, lado * 0.35);   // orelhas
            criarPonta(cabeca, 0.045, 0.16, 0xf0e6c8, lado * 0.15, 0.24, -0.06, 0, -lado * 0.6);             // chifres curtos
          }
          const cabecaSemGiro = { centro: [0, 0, 0], raios: [0.21, 0.23, 0.3] };
          espalharManchas(cabeca, [cabecaSemGiro], 0, 1, corDaMancha, 0.07, 0.11, 0.1);                         // uma mancha na testa/olho
          partesDoCorpo.forEach((parte, indice) => parte.manchas && espalharManchas(grupoDoAnimal, partesDoCorpo, indice, parte.manchas, corDaMancha, 0.09, indice ? 0.15 : 0.19, -0.25));
          criarElipsoide(grupoDoAnimal, 0.15, 0.1, 0.16, rosa, 0, 0.6, -0.33);                                 // úbere entre as patas traseiras
          for (const [diferencaX, diferencaZ] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) criarPonta(grupoDoAnimal, 0.022, 0.08, 0xe58fa6, diferencaX * 0.06, 0.5, -0.33 + diferencaZ * 0.06, Math.PI);
          cauda = new THREE.Group(); cauda.position.set(0, 1.36, -0.9); cauda.rotation.x = 0.12; grupoDoAnimal.add(cauda);
          criarCilindro(0.025, 0.03, 0.72, branco, 0, -0.36, 0, cauda, 6); criarElipsoide(cauda, 0.06, 0.13, 0.06, corDaMancha, 0, -0.76, 0);  // cauda com tufo
          for (const escalaX of [-1, 1]) for (const escalaZ of [-1, 1]) criarPernaDeAnimal(grupoDoAnimal, escalaX * 0.26, comprimentoDaPerna, escalaZ > 0 ? 0.5 : -0.55, comprimentoDaPerna, 0.095, branco, 0x3a2a20, faseDaDiagonal(escalaX, escalaZ), pernas, false,
            { raioTopo: 0.12, coxa: escalaZ > 0 ? [0.13, 0.2, 0.15] : [0.15, 0.24, 0.19] });
        }
        if (tipo === 'ovelha') {
          // Ovelha: velo ALONGADO (não uma bola), formado por um núcleo e tufos menores enfileirados pelo dorso e pelos flancos.
          // Cara e patas escuras; "punhos" de lã no alto das pernas as integram ao velo.
          const coresDaLa = [0xf4f1e8, 0xebe4d3, 0xfaf7ef], corDaCara = 0x3e342c;
          comprimentoDaPerna = 0.62;
          const nucleo = criarElipsoide(grupoDoAnimal, 0.35, 0.31, 0.56, coresDaLa[0], 0, 0.8, -0.02, 0, 0, 14); nucleo.userData.corpoPrincipal = [0.35, 0.31, 0.56];
          const tufos = [];
          for (let indice = 0; indice < 5; indice++) {
            const posicaoZ = -0.42 + indice * 0.21;
            tufos.push([0, 1.04 - Math.abs(indice - 2) * 0.025, posicaoZ, 0.2]);                                       // dorso (leve arco)
            for (const lado of [-1, 1]) tufos.push([lado * 0.25, 0.9, posicaoZ + 0.05, 0.17], [lado * 0.29, 0.7, posicaoZ, 0.15]); // flancos
          }
          tufos.push([0, 0.82, -0.55, 0.21], [0, 0.78, 0.48, 0.2]);                                                     // traseira e peito
          tufos.forEach(([posicaoX, posicaoY, posicaoZ, raio], indice) => criarElipsoide(grupoDoAnimal, raio, raio * 0.82, raio * 1.05, coresDaLa[indice % 3], posicaoX, posicaoY, posicaoZ));
          criarElipsoide(grupoDoAnimal, 0.2, 0.19, 0.22, coresDaLa[1], 0, 0.92, 0.47);                                // pescoço de lã
          cabeca = new THREE.Group(); cabeca.position.set(0, 0.96, 0.66); cabeca.rotation.x = 0.45; grupoDoAnimal.add(cabeca);
          criarElipsoide(cabeca, 0.13, 0.15, 0.21, corDaCara, 0, 0, 0);                                                // cara
          criarElipsoide(cabeca, 0.095, 0.09, 0.09, 0x4a4038, 0, -0.05, 0.17);                                        // focinho
          criarElipsoide(cabeca, 0.145, 0.085, 0.13, coresDaLa[0], 0, 0.12, -0.04);                                    // topete de lã
          for (const lado of [-1, 1]) {
            criarElipsoide(cabeca, 0.11, 0.035, 0.055, corDaCara, lado * 0.15, 0.04, -0.04, 0, lado * 0.45);          // orelhas
            criarElipsoide(cabeca, 0.025, 0.025, 0.025, 0x111111, lado * 0.095, 0.045, 0.1);                           // olhos
          }
          cauda = new THREE.Group(); cauda.position.set(0, 0.9, -0.66); grupoDoAnimal.add(cauda);
          criarElipsoide(cauda, 0.08, 0.13, 0.07, coresDaLa[2], 0, -0.1, -0.02);                                      // rabinho de lã
          for (const escalaX of [-1, 1]) for (const escalaZ of [-1, 1]) criarPernaDeAnimal(grupoDoAnimal, escalaX * 0.17, comprimentoDaPerna, escalaZ > 0 ? 0.33 : -0.36, comprimentoDaPerna, 0.05, corDaCara, 0x2a2420, faseDaDiagonal(escalaX, escalaZ), pernas, false,
            { raioTopo: 0.06, coxa: [0.12, 0.13, 0.13], corDaCoxa: coresDaLa[1] });
        }
        if (tipo === 'cavalo') {
          // Cavalo: pelagens naturais sorteadas (baio, alazão, zaino, tordilho, palomino), pernas longas com antebraço/gaskin,
          // pescoço arqueado, cabeça comprida inclinada para baixo, crina ao longo do pescoço, topete e cauda volumosa.
          // Detalhes discretos: listra branca na cara e meias brancas em algumas patas (sorteadas).
          const PELAGENS = [
            { pelo: 0x8b542f, crina: 0x231812, canela: 0x2a1d16 },   // baio: corpo castanho com crina, cauda e canelas pretas
            { pelo: 0xa35a2c, crina: 0x7a3a18, canela: null },       // alazão
            { pelo: 0x3a2a22, crina: 0x17110d, canela: null },       // zaino (quase preto)
            { pelo: 0xc9c2b6, crina: 0x8c8478, canela: 0x9c958a },   // tordilho claro
            { pelo: 0xd2a865, crina: 0xf0e2bf, canela: null },       // palomino (crina clara)
          ];
          const pelagem = PELAGENS[Math.floor(Math.random() * PELAGENS.length)], corDoFocinho = new THREE.Color(pelagem.pelo).multiplyScalar(0.62).getHex(), corDaMeia = 0xf1ede3;
          comprimentoDaPerna = 1.08;
          const tronco = criarElipsoide(grupoDoAnimal, 0.34, 0.38, 0.8, pelagem.pelo, 0, 1.26, 0, 0, 0, 16); tronco.userData.corpoPrincipal = [0.34, 0.38, 0.8];
          criarElipsoide(grupoDoAnimal, 0.33, 0.4, 0.38, pelagem.pelo, 0, 1.27, 0.52, 0, 0, 14);                       // peito
          criarElipsoide(grupoDoAnimal, 0.35, 0.39, 0.42, pelagem.pelo, 0, 1.32, -0.52, 0, 0, 14);                     // garupa
          criarElipsoide(grupoDoAnimal, 0.16, 0.42, 0.22, pelagem.pelo, 0, 1.72, 0.86, 0.62, 0, 12);                    // pescoço arqueado para a frente
          cabeca = new THREE.Group(); cabeca.position.set(0, 1.98, 1.28); cabeca.rotation.x = 0.9; grupoDoAnimal.add(cabeca);
          criarElipsoide(cabeca, 0.13, 0.15, 0.34, pelagem.pelo, 0, 0, 0, 0, 0, 12);                                    // cabeça comprida
          criarElipsoide(cabeca, 0.11, 0.115, 0.13, corDoFocinho, 0, -0.03, 0.26);                                     // focinho
          for (const lado of [-1, 1]) {
            criarElipsoide(cabeca, 0.022, 0.018, 0.02, 0x15100c, lado * 0.05, -0.04, 0.385);                           // narinas
            criarElipsoide(cabeca, 0.028, 0.028, 0.028, 0x111111, lado * 0.12, -0.01, -0.087);                         // olhos
            criarPonta(cabeca, 0.045, 0.17, pelagem.pelo, lado * 0.06, 0.153, -0.286, -0.9, -lado * 0.15);            // orelhas em pé
          }
          criarElipsoide(cabeca, 0.055, 0.03, 0.12, pelagem.crina, 0, 0.135, -0.12);                                    // topete
          if (Math.random() < 0.4) criarElipsoide(cabeca, 0.035, 0.022, 0.12, corDaMeia, 0, 0.137, 0.04);              // listra branca na cara
          for (let indice = 0; indice < 8; indice++) {                                                                // crina no alto do pescoço
            const ao = -0.28 + indice * 0.105, posicaoY = 1.72 + 0.814 * ao + 0.122, posicaoZ = 0.86 + 0.581 * ao - 0.171;
            criarElipsoide(grupoDoAnimal, 0.045, 0.1, 0.07, pelagem.crina, 0.035, posicaoY, posicaoZ, 0.62, 0.25);
          }
          cauda = new THREE.Group(); cauda.position.set(0, 1.6, -0.84); cauda.rotation.x = 0.35; grupoDoAnimal.add(cauda);
          [[0.07, 0.14, 0.08, -0.08, -0.04], [0.08, 0.2, 0.09, -0.3, -0.06], [0.09, 0.24, 0.1, -0.58, -0.05], [0.07, 0.16, 0.08, -0.82, -0.02]]
            .forEach(([raioX, raioY, raioZ, posicaoY, posicaoZ]) => criarElipsoide(cauda, raioX, raioY, raioZ, pelagem.crina, 0, posicaoY, posicaoZ));
          const podeTerMeias = pelagem.pelo !== 0xc9c2b6;
          for (const escalaX of [-1, 1]) for (const escalaZ of [-1, 1]) {
            const comMeia = podeTerMeias && Math.random() < 0.3, corInferior = comMeia ? corDaMeia : pelagem.canela;
            criarPernaDeAnimal(grupoDoAnimal, escalaX * 0.2, comprimentoDaPerna, escalaZ > 0 ? 0.5 : -0.55, comprimentoDaPerna, 0.072, pelagem.pelo, 0x2a2420, faseDaDiagonal(escalaX, escalaZ), pernas, false,
              { raioTopo: 0.1, coxa: escalaZ > 0 ? [0.1, 0.24, 0.12] : [0.12, 0.3, 0.17], corInferior, fracaoInferior: comMeia ? 0.28 : 0.42 });
          }
        }
        if (tipo === 'porco') {
          criarElipsoide(grupoDoAnimal, 0.38, 0.34, 0.56, 0xf2a0b5, 0, 0.52, 0);
          criarElipsoide(grupoDoAnimal, 0.26, 0.25, 0.27, 0xf2a0b5, 0, 0.56, 0.58);
          criarCilindro(0.12, 0.13, 0.12, 0xe58aa2, 0, 0.5, 0.84, grupoDoAnimal, 10).rotation.x = Math.PI / 2;      // focinho
          for (const lado of [-1, 1]) { criarElipsoide(grupoDoAnimal, 0.02, 0.025, 0.02, 0x7a3a4a, lado * 0.04, 0.5, 0.91); criarElipsoide(grupoDoAnimal, 0.025, 0.025, 0.025, 0x111111, lado * 0.12, 0.65, 0.78); criarPonta(grupoDoAnimal, 0.09, 0.17, 0xe58aa2, lado * 0.17, 0.78, 0.5, 0.9, -lado * 0.35); }
          const rabo = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 6, 10), material(0xe58aa2)); rabo.position.set(0, 0.6, -0.57); grupoDoAnimal.add(rabo);
          for (const escalaX of [-1, 1]) for (const escalaZ of [-1, 1]) criarPernaDeAnimal(grupoDoAnimal, escalaX * 0.2, 0.26, escalaZ * 0.33, 0.26, 0.07, 0xf2a0b5, 0xb86a80, faseDaDiagonal(escalaX, escalaZ), pernas);
        }
        if (tipo === 'porco') comprimentoDaPerna = 0.26;
        return { a: grupoDoAnimal, pernas, cabeca, cauda, comprimentoDaPerna };
      };

      // Registro dos animais para o sistema de áudio (animais removidos ao evoluir uma área saem da lista).
      const animaisParaSom = [];
      // Anota o animal criado para o sistema de áudio sortear quem "faz o som". Remove da lista os animais que
      // já saíram da cena (área reconstruída).
      const registrarAnimalParaSom = function registrarAnimalParaSom(tipo, grupo) {
        for (let indice = animaisParaSom.length - 1; indice >= 0; indice--) if (!animaisParaSom[indice].grupo.parent) animaisParaSom.splice(indice, 1);
        animaisParaSom.push({ tipo, grupo });
      };
      // Cria um animal dentro do cercado: escolhe uma posição inicial livre, e registra em "animacoes" a função
      // que o faz andar, virar ao acaso, desviar de obstáculos e dos limites do cercado, balançar as pernas e
      // (galinhas) bicar.
      const criarAnimal = function criarAnimal(objetoPai, animacoes, tipo, cercado) {
        // Mark 8.2: animais mortos de fome não reaparecem ao reconstruir a instalação (até o jogador repô-los, seção 27)
        if (idDaAreaEmConstrucao && ANIMAIS_DAS_AREAS[idDaAreaEmConstrucao]) { if (animaisCriadosNaConstrucao >= animaisVivosDaArea(idDaAreaEmConstrucao)) return null; animaisCriadosNaConstrucao++; }
        const modeloDoAnimal = montarAnimal(tipo), grupoDoAnimal = modeloDoAnimal.a;
        objetoPai.add(grupoDoAnimal);
        registrarAnimalParaSom(tipo, grupoDoAnimal);
        const raio = RAIO_DA_HITBOX[tipo];
        const dados = { x: 0, z: 0, raio };
        for (let tentativa = 0; tentativa < 50; tentativa++) { // posição inicial livre
          const posicaoX = (Math.random() * 2 - 1) * (cercado.limiteX - raio);
          const posicaoZ = (Math.random() * 2 - 1) * (cercado.limiteZ - raio);
          if (posicaoEstaLivre(cercado, dados, posicaoX, posicaoZ, raio)) { dados.x = posicaoX; dados.z = posicaoZ; break; }
        }
        cercado.animais.push(dados);

        let direcao = Math.random() * Math.PI * 2;
        const velocidade = 0.4 + Math.random() * 0.4;
        const fase = Math.random() * 6;                                    // cada animal pisa num ritmo próprio
        const amplitudeDaPassada = tipo === 'cavalo' ? 0.42 : 0.5;          // ângulo máximo das pernas (radianos)
        const giroBaseDaCabeca = modeloDoAnimal.cabeca ? modeloDoAnimal.cabeca.rotation.x : 0;   // inclinação natural da cabeça do modelo
        let segundosAteVirar = 1 + Math.random() * 3;

        animacoes.push((tempo, segundosDesdeUltimoFrame) => {
          segundosAteVirar -= segundosDesdeUltimoFrame;
          if (segundosAteVirar <= 0) { direcao += (Math.random() - 0.5) * Math.PI; segundosAteVirar = 1 + Math.random() * 3; }

          const novoX = dados.x + Math.sin(direcao) * velocidade * segundosDesdeUltimoFrame;
          const novoZ = dados.z + Math.cos(direcao) * velocidade * segundosDesdeUltimoFrame;
          if (posicaoEstaLivre(cercado, dados, novoX, novoZ, raio)) { dados.x = novoX; dados.z = novoZ; }
          else direcao += Math.PI / 2 + Math.random() * Math.PI / 2; // bateu: vira

          // Passada: as pernas giram nos quadris/ombros (diagonais em fases opostas). Com as pernas abertas o corpo desce o quanto
          // elas "encurtam" (comprimento × (1 − cos θ)), então os pés de apoio continuam encostados no chão do cercado durante
          // toda a passada, sem flutuar nem atravessar o terreno.
          const anguloDaPassada = Math.sin(tempo * 7 + fase) * amplitudeDaPassada;
          grupoDoAnimal.position.set(dados.x, ALTURA_DO_CHAO_DOS_CERCADOS - modeloDoAnimal.comprimentoDaPerna * (1 - Math.cos(anguloDaPassada)), dados.z);
          grupoDoAnimal.rotation.y = direcao;
          for (const [pernaDoAnimal, faseDaPerna] of modeloDoAnimal.pernas) pernaDoAnimal.rotation.x = Math.sin(tempo * 7 + fase + faseDaPerna) * amplitudeDaPassada;
          if (modeloDoAnimal.cauda) modeloDoAnimal.cauda.rotation.z = Math.sin(tempo * 2.3 + fase) * 0.18;                 // cauda balançando
          if (modeloDoAnimal.cabeca) modeloDoAnimal.cabeca.rotation.x = tipo === 'galinha'
            ? Math.max(0, Math.sin(tempo * 3 + fase)) * 0.55                                                    // galinha: bicadas
            : giroBaseDaCabeca + Math.sin(tempo * 3.5 + fase) * 0.04;                                           // demais: leve aceno
        });
      };;

      arquivoDaMontagemConcluido('08-modelos-reutilizaveis.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
