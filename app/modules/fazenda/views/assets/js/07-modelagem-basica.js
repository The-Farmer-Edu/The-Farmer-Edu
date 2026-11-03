      // ====================================================================================================
      // FARMEDU 3D — 07-modelagem-basica.js (Fase 3B da refatoração: seção 07)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================

      // ====================================================================================================
      // SEÇÃO 07 — FUNÇÕES AUXILIARES DE MODELAGEM
      // Cache de materiais e funções que criam as peças básicas (caixa, cilindro, esfera, roda...), além das peças de iluminação
      // compartilhadas (textura radial, janela acesa da casa e mancha de luz no chão). Todo o cenário é montado com elas.
      // ====================================================================================================
      const cacheDeMateriais = {};
      // Materiais "Basic" (não reagem à luz: fumaça, névoa, gotas, cachoeira...) escurecem junto com a noite; ficam registrados aqui.
      const materiaisBasicosDoCenario = [], materiaisBasicosVistos = new Set();
      // Registra os materiais "Basic" (que não reagem à luz: fumaça, névoa, gotas...) de um grupo 3D para que
      // escureçam junto com a noite. Ignora os marcados com userData.ignorarCiclo (lanternas, halos, sol, lua).
      const coletarMateriaisBasicos = function coletarMateriaisBasicos(raiz) {
        raiz.traverse(objetoDaCena => {
          const materialDaPeca = objetoDaCena.material;
          if (!materialDaPeca || !materialDaPeca.isMeshBasicMaterial || materialDaPeca.userData.ignorarCiclo || materiaisBasicosVistos.has(materialDaPeca)) return;
          materiaisBasicosVistos.add(materialDaPeca); materiaisBasicosDoCenario.push([materialDaPeca, materialDaPeca.color.clone()]);
        });
      };
      // Tira da lista acima os materiais que não estão mais na cena (fumaça de modelos antigos, descartados ao evoluir ou ao
      // virar ruína). Sem isso a lista só crescia e o ciclo de dia e noite recoloria, a cada quadro, materiais que nem existem.
      const removerMateriaisBasicosForaDaCena = function removerMateriaisBasicosForaDaCena() {
        const materiaisEmUso = new Set(); cena.traverse(objetoDaCena => { if (objetoDaCena.material) materiaisEmUso.add(objetoDaCena.material); });
        for (let indice = materiaisBasicosDoCenario.length - 1; indice >= 0; indice--) {
          const [materialDaLista] = materiaisBasicosDoCenario[indice];
          if (!materiaisEmUso.has(materialDaLista)) { materiaisBasicosVistos.delete(materialDaLista); materiaisBasicosDoCenario.splice(indice, 1); }
        }
      };

      // Gera num canvas 128x128 uma textura salpicada (ruído) em torno de uma cor base. A semente vem da própria
      // cor, então o resultado é sempre o mesmo.
      const criarTexturaProcedural = function criarTexturaProcedural(cor) {
        const tamanho = 128;
        const canvasTextura = document.createElement('canvas');
        canvasTextura.width = canvasTextura.height = tamanho;
        const contexto2d = canvasTextura.getContext('2d');

        contexto2d.fillStyle = '#' + cor.toString(16).padStart(6, '0');
        contexto2d.fillRect(0, 0, tamanho, tamanho);

        let semente = cor || 1;
        function aleatorio() {
          semente = (semente * 1664525 + 1013904223) >>> 0;
          return semente / 4294967296;
        }

        for (let indice = 0; indice < 450; indice++) {
          const alpha = 0.04 + aleatorio() * 0.13;
          contexto2d.fillStyle = aleatorio() > 0.5
            ? `rgba(255,255,255,${alpha})`
            : `rgba(0,0,0,${alpha})`;
          contexto2d.beginPath();
          contexto2d.arc(aleatorio() * tamanho, aleatorio() * tamanho, 1 + aleatorio() * 5, 0, Math.PI * 2);
          contexto2d.fill();
        }

        const textura = new THREE.CanvasTexture(canvasTextura);
        textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
        textura.repeat.set(2, 2);
        return textura;
      };

      // Devolve o material (Lambert) de uma cor, reaproveitando o cache. Com textura = true usa a textura
      // salpicada. Materiais iguais são COMPARTILHADOS: não altere um material obtido aqui.
      const material = function material(cor, textura = false) {
        if (!cacheDeMateriais[cor]) {
          cacheDeMateriais[cor] = new THREE.MeshLambertMaterial({
            color: cor
          });
          if(textura) {
            cacheDeMateriais[cor].map = criarTexturaProcedural(cor)
          }
        }

        return cacheDeMateriais[cor];
      };
      // Cria uma caixa com sombra, com o CENTRO em (posicaoX, posicaoY, posicaoZ), e a adiciona ao objetoPai. É
      // a peça básica da maioria dos modelos.
      const criarCaixa = function criarCaixa(largura, altura, profundidade, cor, posicaoX, posicaoY, posicaoZ, objetoPai) {
        const caixa = new THREE.Mesh(new THREE.BoxGeometry(largura, altura, profundidade), material(cor));
        caixa.position.set(posicaoX, posicaoY, posicaoZ);
        caixa.castShadow = caixa.receiveShadow = true;
        objetoPai.add(caixa);
        return caixa;
      };
      // Cria um cilindro com sombra. raioTopo e raioBase diferentes formam um tronco de cone; "segmentos" é o
      // número de lados (poucos lados = estilo low-poly).
      const criarCilindro = function criarCilindro(raioTopo, raioBase, altura, cor, posicaoX, posicaoY, posicaoZ, objetoPai, segmentos = 14) {
        const cilindro = new THREE.Mesh(new THREE.CylinderGeometry(raioTopo, raioBase, altura, segmentos), material(cor));
        cilindro.position.set(posicaoX, posicaoY, posicaoZ);
        cilindro.castShadow = true;
        objetoPai.add(cilindro);
        return cilindro;
      };
      // Cria uma esfera com sombra; escalaY achata ou estica a esfera na vertical.
      const criarEsfera = function criarEsfera(raio, cor, posicaoX, posicaoY, posicaoZ, objetoPai, escalaY = 1) {
        const esfera = new THREE.Mesh(new THREE.SphereGeometry(raio, 8, 6), material(cor));
        esfera.position.set(posicaoX, posicaoY, posicaoZ);
        esfera.scale.y = escalaY;
        esfera.castShadow = true;
        objetoPai.add(esfera);
        return esfera;
      };
      // Cria uma roda deitada de lado (pneu escuro) e, se corDoAro for informada, um aro colorido um pouco mais
      // largo no centro.
      const criarRoda = function criarRoda(raio, largura, posicaoX, posicaoY, posicaoZ, objetoPai, corDoAro) {
        const roda = criarCilindro(raio, raio, largura, PALETA_DE_CORES.pneu, posicaoX, posicaoY, posicaoZ, objetoPai);
        roda.rotation.z = Math.PI / 2;
        if (corDoAro) criarCilindro(raio * 0.55, raio * 0.55, largura + 0.04, corDoAro, posicaoX, posicaoY, posicaoZ, objetoPai).rotation.z = Math.PI / 2;
      };
      // base de grama sob cada área (como nas ilustrações isométricas)
      const criarBaseDoTerreno = function criarBaseDoTerreno(grupo, largura, profundidade, cor = 0x8fd05a) { criarCaixa(largura, 0.15, profundidade, cor, 0, 0.02, 0, grupo); };
      // telhado de duas águas (prisma). largura = vão entre as águas; comprimento = ao longo do cume.
      const criarTelhado = function criarTelhado(grupo, largura, comprimento, altura, cor, posicaoX, posicaoY, posicaoZ, giro = 0) {
        const raio = altura / 1.5;
        const malhaDoTelhado = new THREE.Mesh(new THREE.CylinderGeometry(raio, raio, comprimento, 3), material(cor));
        malhaDoTelhado.rotation.x = -Math.PI / 2;
        malhaDoTelhado.scale.x = largura / (raio * 1.732);
        malhaDoTelhado.position.y = raio / 2;
        malhaDoTelhado.castShadow = true;
        const grupoDoTelhado = new THREE.Group();
        grupoDoTelhado.add(malhaDoTelhado);
        grupoDoTelhado.position.set(posicaoX, posicaoY, posicaoZ);
        grupoDoTelhado.rotation.y = giro;
        grupo.add(grupoDoTelhado);
      };
      // Cerca reta entre dois pontos: mourões a cada ~1 unidade e duas ripas horizontais.
      const criarTrechoDeCerca = function criarTrechoDeCerca(grupo, xInicial, zInicial, xFinal, zFinal) {
        const comprimento = Math.hypot(xFinal - xInicial, zFinal - zInicial), quantidadeDeMouroes = Math.ceil(comprimento), angulo = Math.atan2(xFinal - xInicial, zFinal - zInicial);
        for (let indice = 0; indice <= quantidadeDeMouroes; indice++) criarCaixa(0.14, 0.8, 0.14, PALETA_DE_CORES.madeira, xInicial + (xFinal - xInicial) * indice / quantidadeDeMouroes, 0.5, zInicial + (zFinal - zInicial) * indice / quantidadeDeMouroes, grupo);
        for (const posicaoY of [0.68, 0.42]) criarCaixa(0.07, 0.09, comprimento, PALETA_DE_CORES.ripa, (xInicial + xFinal) / 2, posicaoY, (zInicial + zFinal) / 2, grupo).rotation.y = angulo;
      };
      // Portão fechado de duas folhas, com mourões altos e travessa em diagonal, centrado em centroX sobre a
      // cerca.
      const criarPortao = function criarPortao(grupo, centroX, posicaoZ, larguraDoPortao = 1.7) { // portão fechado de duas folhas, com mourões altos e travessa em diagonal
        const corDasTravessas = 0xb9824a;
        for (const lado of [-1, 1]) { criarCaixa(0.18, 1.15, 0.18, PALETA_DE_CORES.madeira, centroX + lado * larguraDoPortao / 2, 0.58, posicaoZ, grupo); criarEsfera(0.1, 0xc98a4a, centroX + lado * larguraDoPortao / 2, 1.22, posicaoZ, grupo); }
        const larguraDaFolha = larguraDoPortao / 2 - 0.14, angulo = Math.atan2(0.35, larguraDaFolha);
        for (const lado of [-1, 1]) {
          const posicaoX = centroX + lado * (larguraDaFolha / 2 + 0.07);
          for (const posicaoY of [0.4, 0.75]) criarCaixa(larguraDaFolha, 0.09, 0.06, corDasTravessas, posicaoX, posicaoY, posicaoZ, grupo);
          for (const ladoDaTravessa of [-1, 1]) criarCaixa(0.07, 0.44, 0.06, corDasTravessas, posicaoX + ladoDaTravessa * (larguraDaFolha / 2 - 0.035), 0.575, posicaoZ, grupo);
          criarCaixa(Math.hypot(larguraDaFolha, 0.35), 0.06, 0.05, corDasTravessas, posicaoX, 0.575, posicaoZ + 0.01, grupo).rotation.z = -lado * angulo;
        }
      };
      // portoes: { N: deslocamentoX, S: deslocamentoX } abre uma passagem de 1,7 na cerca norte (z−) ou sul (z+)
      const criarCercaSimples = function criarCercaSimples(grupo, largura, profundidade, portoes = {}) {
        const desenharLadoHorizontal = (posicaoZ, deslocamentoX) => deslocamentoX === undefined ? criarTrechoDeCerca(grupo, -largura / 2, posicaoZ, largura / 2, posicaoZ) : (criarTrechoDeCerca(grupo, -largura / 2, posicaoZ, deslocamentoX - 0.85, posicaoZ), criarTrechoDeCerca(grupo, deslocamentoX + 0.85, posicaoZ, largura / 2, posicaoZ));
        desenharLadoHorizontal(-profundidade / 2, portoes.N); desenharLadoHorizontal(profundidade / 2, portoes.S);
        if (portoes.N !== undefined) criarPortao(grupo, portoes.N, -profundidade / 2);
        if (portoes.S !== undefined) criarPortao(grupo, portoes.S, profundidade / 2);
        criarTrechoDeCerca(grupo, -largura / 2, -profundidade / 2, -largura / 2, profundidade / 2); criarTrechoDeCerca(grupo, largura / 2, -profundidade / 2, largura / 2, profundidade / 2);
      };
      // Cerca retangular regular: postes igualmente espaçados, trilhos exatos entre os cantos; portão central opcional.
      const criarCercaRetangular = function criarCercaRetangular(grupo, largura, profundidade, portoes = []) {
        const trecho = (xInicial, zInicial, xFinal, zFinal, incluirMouraoFinal) => {
          const comprimento = Math.hypot(xFinal - xInicial, zFinal - zInicial), quantidadeDeVaos = Math.max(1, Math.round(comprimento / 1.1)), ehHorizontal = Math.abs(xFinal - xInicial) > Math.abs(zFinal - zInicial);
          for (let indice = 0; indice < quantidadeDeVaos + (incluirMouraoFinal ? 1 : 0); indice++) criarCaixa(0.14, 0.85, 0.14, PALETA_DE_CORES.madeira, xInicial + (xFinal - xInicial) * indice / quantidadeDeVaos, 0.43, zInicial + (zFinal - zInicial) * indice / quantidadeDeVaos, grupo);
          for (const posicaoY of [0.4, 0.7]) criarCaixa(ehHorizontal ? comprimento : 0.07, 0.09, ehHorizontal ? 0.07 : comprimento, PALETA_DE_CORES.ripa, (xInicial + xFinal) / 2, posicaoY, (zInicial + zFinal) / 2, grupo);
        };
        const lado = (xInicial, zInicial, xFinal, zFinal, aberto) => {
          if (!aberto) return trecho(xInicial, zInicial, xFinal, zFinal, false);
          const meiaAberturaDoPortao = 0.85 * Math.sign(xFinal - xInicial);
          trecho(xInicial, zInicial, -meiaAberturaDoPortao, zFinal, true); trecho(meiaAberturaDoPortao, zInicial, xFinal, zFinal, false);
          criarPortao(grupo, 0, zInicial);
        };
        lado(-largura / 2, -profundidade / 2, largura / 2, -profundidade / 2, portoes.includes('N')); trecho(largura / 2, -profundidade / 2, largura / 2, profundidade / 2, false);
        lado(largura / 2, profundidade / 2, -largura / 2, profundidade / 2, portoes.includes('S')); trecho(-largura / 2, profundidade / 2, -largura / 2, -profundidade / 2, false);
      };
      // Árvore de 3 cones empilhados. A base do tronco encosta na altura posicaoY (altura do terreno no ponto).
      // Se o grupo pertence a uma área, o tronco é limitado ao terreno daquela área.
      const criarArvore = function criarArvore(grupo, posicaoX, posicaoZ, escala = 1, posicaoY = 0) { // árvore de 3 cones empilhados; a base do tronco encosta em y (altura do terreno no ponto)
        const idDaArea = grupo.userData && grupo.userData.areaId;   // árvore decorativa de uma instalação: o tronco fica dentro do terreno dela (qualquer nível)
        if (idDaArea && METADE_DO_TAMANHO_DA_AREA[idDaArea]) { posicaoX = Math.max(-METADE_DO_TAMANHO_DA_AREA[idDaArea][0] + 0.7, Math.min(METADE_DO_TAMANHO_DA_AREA[idDaArea][0] - 0.7, posicaoX)); posicaoZ = Math.max(-METADE_DO_TAMANHO_DA_AREA[idDaArea][1] + 0.7, Math.min(METADE_DO_TAMANHO_DA_AREA[idDaArea][1] - 0.7, posicaoZ)); }
        const grupoDaArvore = new THREE.Group(); grupoDaArvore.position.set(posicaoX, posicaoY, posicaoZ); grupoDaArvore.userData.arvore = { raio: 1.1 * escala }; // marcada para a auditoria de posicionamento
        criarCilindro(0.12 * escala, 0.18 * escala, 0.9 * escala, 0x6b4a2b, 0, 0.45 * escala, 0, grupoDaArvore, 6);
        [[1.1, 1.5, 1.2], [0.85, 1.3, 2], [0.55, 1.1, 2.8]].forEach(([raioDaCamada, altura, alturaDaCamada], indiceDaCamada) => {
          const cone = new THREE.Mesh(new THREE.ConeGeometry(raioDaCamada * escala, altura * escala, 7), material(indiceDaCamada % 2 ? 0x2f7a4a : 0x2a6b40));
          cone.position.set(0, alturaDaCamada * escala, 0); cone.castShadow = true; grupoDaArvore.add(cone);
        });
        grupo.add(grupoDaArvore);
        return grupoDaArvore;
      };
      const criarPinheiro = criarArvore; // antes eram duas funções idênticas

      const cacheDePlano = {};
      const materialPlano = function materialPlano(cor) { // faces "facetadas" (visual low-poly) para montanhas
        return cacheDePlano[cor] || (cacheDePlano[cor] = new THREE.MeshLambertMaterial({ color: cor, flatShading: true }));
      };
      // Touceira baixa de capim: quatro lâminas finas e levemente inclinadas.
      const criarCapim = function criarCapim(grupo, posicaoX, posicaoZ) {
        for (let indice = 0; indice < 4; indice++) criarCaixa(0.05, 0.55, 0.05, 0x4f9e3a, posicaoX + (indice - 1.5) * 0.08, 0.27, posicaoZ + (indice % 2) * 0.06, grupo).rotation.z = (indice - 1.5) * 0.18;
      };
      // Arbusto redondo; com flores = true recebe três florzinhas coloridas.
      const criarArbusto = function criarArbusto(grupo, posicaoX, posicaoZ, flores = true) {
        criarEsfera(0.4, 0x4a9e3a, posicaoX, 0.35, posicaoZ, grupo, 0.8);
        if (flores) [0xe84a5f, 0xffd23f, 0xff8fb1].forEach((corDaFlor, indiceDaFlor) => criarCaixa(0.12, 0.12, 0.12, corDaFlor, posicaoX + (indiceDaFlor - 1) * 0.22, 0.6, posicaoZ + 0.25, grupo));
      };
      // Pedra comum low-poly (dodecaedro achatado) sobre o chão.
      const criarPedra = function criarPedra(grupo, posicaoX, posicaoZ, tamanho = 0.4) {
        const malhaDaPedra = new THREE.Mesh(new THREE.DodecahedronGeometry(tamanho), material(0xb4b4aa));
        malhaDaPedra.position.set(posicaoX, tamanho * 0.5, posicaoZ); malhaDaPedra.scale.y = 0.7; malhaDaPedra.castShadow = true; grupo.add(malhaDaPedra);
      };
      // Versão simples de montanha em cone. Está definida mas não é usada pelo cenário atual (que usa
      // montanha()). Mantida por compatibilidade.
      const criarMontanha = function criarMontanha(posicaoX, posicaoZ, largura, altura, profundidade, cor) {
        const montanha = new THREE.Mesh(
          new THREE.ConeGeometry(largura, altura, 5),
          material(cor, true)
        );
        montanha.position.set(posicaoX, altura / 2 - 0.2, posicaoZ);
        montanha.scale.z = profundidade / largura;
        montanha.castShadow = true;
        montanha.receiveShadow = true;
        cena.add(montanha);
      };

      // Versão simples de lago (disco de água). Definida mas não usada: o lago do cenário é construído por
      // lagoDestaque().
      const criarLago = function criarLago(posicaoX, posicaoZ, largura, profundidade) {
        const agua = new THREE.Mesh(
          new THREE.CircleGeometry(1, 32),
          new THREE.MeshLambertMaterial({
            color: 0x55bddd,
            transparent: true,
            opacity: 0.88
          })
        );
        agua.rotation.x = -Math.PI / 2;
        agua.position.set(posicaoX, 0.07, posicaoZ);
        agua.scale.set(largura, profundidade, 1);
        cena.add(agua);

        for (let indice = 0; indice < 36; indice++) {
          const angulo = (indice / 36) * Math.PI * 2;
          criarPedra(
            cena,
            posicaoX + Math.cos(angulo) * largura * 0.95,
            posicaoZ + Math.sin(angulo) * profundidade * 0.95,
            0.3
          );
        }
      };

      // Versão simples de cachoeira. Definida mas não usada: a cachoeira do cenário é montada mais adiante no
      // arquivo.
      const criarCachoeira = function criarCachoeira() {
        const rocha = new THREE.Mesh(
          new THREE.ConeGeometry(9, 18, 5),
          material(0x777d70)
        );
        rocha.position.set(-24, 8.8, -36);
        rocha.scale.z = 0.8;
        cena.add(rocha);

        const agua = new THREE.Mesh(
          new THREE.PlaneGeometry(3.2, 9),
          new THREE.MeshLambertMaterial({
            color: 0x7fe5f2,
            transparent: true,
            opacity: 0.82,
            side: THREE.DoubleSide
          })
        );
        agua.position.set(-24, 5.2, -31);
        cena.add(agua);

        criarLago(-24, -25, 4.5, 2.8);
      };

      // Barril de madeira (cilindro) no chão.
      const criarBarril = function criarBarril(grupo, posicaoX, posicaoZ) { criarCilindro(0.32, 0.32, 0.7, 0x7a4a2a, posicaoX, 0.45, posicaoZ, grupo, 10); };
      // Caixote de madeira no chão.
      const criarCaixote = function criarCaixote(grupo, posicaoX, posicaoZ) { criarCaixa(0.55, 0.45, 0.55, 0xa0703a, posicaoX, 0.32, posicaoZ, grupo); };
      // Fardo de feno retangular; posicaoY permite empilhar um fardo sobre outro.
      const criarFardoDeFeno = function criarFardoDeFeno(grupo, posicaoX, posicaoY, posicaoZ) { criarCaixa(0.8, 0.5, 0.6, PALETA_DE_CORES.feno, posicaoX, posicaoY, posicaoZ, grupo); };
      // Janela com moldura e vidro. "lateral" = true vira a janela para a parede lateral (eixo X).
      const criarJanela = function criarJanela(grupo, posicaoX, posicaoY, posicaoZ, lateral) {
        criarCaixa(...(lateral ? [0.1, 0.67, 0.62] : [0.62, 0.67, 0.1]), 0x9a4a2a, posicaoX, posicaoY, posicaoZ, grupo);
        criarCaixa(...(lateral ? [0.14, 0.5, 0.45] : [0.45, 0.5, 0.14]), PALETA_DE_CORES.vidro, posicaoX, posicaoY, posicaoZ, grupo);
      };
      // ---- Peças de iluminação noturna compartilhadas (janelas acesas, brilhos no chão e halos) ----
      // Textura de brilho redondo (centro forte que some nas bordas), usada em halos e manchas de luz no chão.
      // cor = "R,G,B" (texto) · nucleo = opacidade no centro (0–1).
      const texturaRadial = (cor, nucleo) => {
        const canvasDaImagem = document.createElement('canvas'); canvasDaImagem.width = canvasDaImagem.height = 128;
        const contexto2d = canvasDaImagem.getContext('2d'), gradiente = contexto2d.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradiente.addColorStop(0, `rgba(${cor},${nucleo})`); gradiente.addColorStop(0.35, `rgba(${cor},${nucleo * 0.45})`); gradiente.addColorStop(1, `rgba(${cor},0)`);
        contexto2d.fillStyle = gradiente; contexto2d.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(canvasDaImagem);
      };
      // Desenha o "interior aceso" visto pela janela: luz quente mais forte embaixo, cortinas nas laterais e o caixilho em cruz.
      // É usada como textura EMISSIVA: de dia a janela continua um vidro azulado comum; à noite este desenho brilha,
      // dando a impressão de que a luz vem de dentro da casa (e não de uma simples superfície amarela).
      const criarTexturaDaJanelaAcesa = function criarTexturaDaJanelaAcesa() {
        const canvasDaImagem = document.createElement('canvas'); canvasDaImagem.width = canvasDaImagem.height = 64;
        const contexto2d = canvasDaImagem.getContext('2d');
        const luzInterna = contexto2d.createRadialGradient(32, 46, 2, 32, 40, 44);
        luzInterna.addColorStop(0, '#fff1c4'); luzInterna.addColorStop(0.45, '#ffc46a'); luzInterna.addColorStop(1, '#a8541c');
        contexto2d.fillStyle = luzInterna; contexto2d.fillRect(0, 0, 64, 64);
        contexto2d.fillStyle = 'rgba(110,40,18,0.6)';                                                    // cortinas presas nas laterais
        for (const lado of [0, 1]) { const borda = lado ? 64 : 0, sentido = lado ? -1 : 1; contexto2d.beginPath(); contexto2d.moveTo(borda, 0); contexto2d.lineTo(borda + sentido * 20, 0); contexto2d.quadraticCurveTo(borda + sentido * 8, 30, borda + sentido * 14, 64); contexto2d.lineTo(borda, 64); contexto2d.fill(); }
        contexto2d.fillStyle = '#2e1a0c'; contexto2d.fillRect(30, 0, 4, 64); contexto2d.fillRect(0, 29, 64, 4);   // caixilho em cruz
        contexto2d.strokeStyle = '#2e1a0c'; contexto2d.lineWidth = 6; contexto2d.strokeRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvasDaImagem);
      };
      // Vidro das janelas da casa: material ÚNICO e compartilhado. A seção 20 ajusta emissiveIntensity (0 de dia → 1 à noite).
      const materialDaJanelaAcesa = new THREE.MeshLambertMaterial({ color: PALETA_DE_CORES.vidro, emissive: 0xffffff, emissiveMap: criarTexturaDaJanelaAcesa(), emissiveIntensity: 0 });
      // Igual a criarJanela, mas com o vidro que acende à noite (usado na casa). Devolve a malha do vidro.
      const criarJanelaIluminada = function criarJanelaIluminada(grupo, posicaoX, posicaoY, posicaoZ, lateral) {
        criarCaixa(...(lateral ? [0.1, 0.67, 0.62] : [0.62, 0.67, 0.1]), 0x9a4a2a, posicaoX, posicaoY, posicaoZ, grupo);       // moldura
        const vidro = new THREE.Mesh(new THREE.BoxGeometry(...(lateral ? [0.14, 0.5, 0.45] : [0.45, 0.5, 0.14])), materialDaJanelaAcesa);
        vidro.position.set(posicaoX, posicaoY, posicaoZ); vidro.receiveShadow = true; vidro.userData.nome = 'janela-acesa'; grupo.add(vidro);
        return vidro;
      };
      // Mancha de luz no chão (plano deitado com textura radial e mistura aditiva). larguraX/larguraZ deformam o círculo
      // numa elipse. Recebe um material compartilhado, cuja opacidade é controlada pelo ciclo de dia e noite.
      const criarManchaDeLuzNoChao = function criarManchaDeLuzNoChao(grupo, materialDaMancha, posicaoX, posicaoY, posicaoZ, larguraX, larguraZ = larguraX) {
        const mancha = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), materialDaMancha);
        mancha.rotation.x = -Math.PI / 2; mancha.position.set(posicaoX, posicaoY, posicaoZ); mancha.scale.set(larguraX, larguraZ, 1); mancha.renderOrder = 2;
        grupo.add(mancha);
        return mancha;
      };
      // Placa simples: um poste de madeira com uma tábua na ponta.
      const criarPlacaDeMadeira = function criarPlacaDeMadeira(grupo, posicaoX, posicaoZ) { criarCaixa(0.1, 1.5, 0.1, PALETA_DE_CORES.madeira, posicaoX, 0.75, posicaoZ, grupo); criarCaixa(0.6, 0.45, 0.08, 0xc98a4a, posicaoX, 1.4, posicaoZ, grupo); };
      // (Fase 3B: criarGeradorDeNumerosAleatorios veio da seção 11 para cá, porque as seções 09 e 10 a usam durante a montagem.)
      // Gerador pseudoaleatório com semente fixa (sempre a mesma sequência). Dá ao cenário a mesma aparência a
      // cada carregamento.
      const criarGeradorDeNumerosAleatorios = function criarGeradorDeNumerosAleatorios(semente) { let estadoDoSorteio = semente; return () => (estadoDoSorteio = (estadoDoSorteio * 16807) % 2147483647) / 2147483647; }; // aleatório repetível: o cenário é sempre igual

      arquivoDaMontagemConcluido('07-modelagem-basica.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
