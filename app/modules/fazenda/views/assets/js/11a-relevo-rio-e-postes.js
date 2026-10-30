      // ====================================================================================================
      // FARMEDU 3D — 11a-relevo-rio-e-postes.js (Fase 3B da refatoração: seção 11 — relevo, rio, caverna, colisões e postes)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================

      // ====================================================================================================
      // SEÇÃO 11 — RELEVO E PAISAGEM: MONTANHAS, CACHOEIRA, RIO, FLORESTA, LAGO E PEDRA SECRETA
      // Montanhas e morros, cachoeira e rio; registro das colisões fixas; distribuição dos postes; vegetação e floresta; pedra secreta;
      // lago com chafariz (no centro da praça central) e placa de boas-vindas.
      // A ordem importa: a floresta só pode ser plantada depois que montanhas, estradas e construções foram registradas.
      // ====================================================================================================
      // Animações do cenário (rio correndo, cachoeira, névoa). Recebem (tempo, dt) e rodam todo frame.
      const animacoesDoCenario = [];
      // (Fase 3B: criarGeradorDeNumerosAleatorios foi para 07-modelagem-basica.js, pois as seções 09 e 10 a usam antes desta.)
      const numeroAleatorioDoCenario = criarGeradorDeNumerosAleatorios(11);

      // --- Montanhas: saia de floresta + corpo rochoso + pico nevado + 2 picos menores ---
      const perfilMontanha = function perfilMontanha(raioDaBase, altura, fracaoInicial = 0, fracaoFinal = 1, folga = 1) { // contorno levemente arredondado (expoente 0,82; cone puro = 1)
        const pontos = [];
        for (let indice = 0; indice <= 7; indice++) { const fracao = fracaoInicial + (fracaoFinal - fracaoInicial) * indice / 7; pontos.push(new THREE.Vector2(Math.max(0.02, raioDaBase * Math.pow(1 - fracao, 0.82) * folga), altura * fracao)); }
        return pontos;
      };
      // Monta uma montanha facetada (corpo rochoso, saia de floresta, picos secundários e neve). Registra no
      // mapa de colisões a "saia" ocupada, para que a vegetação não nasça dentro dela.
      const montanha = function montanha(posicaoX, posicaoZ, raioDaBase, altura) {
        const grupoDaMontanha = new THREE.Group();
        grupoDaMontanha.position.set(posicaoX, 0, posicaoZ);
        grupoDaMontanha.userData.nome = 'montanha';   // Fazenda 8.4: a entrada da caverna procura as montanhas que atravessam o túnel
        grupoDaMontanha.rotation.y = numeroAleatorioDoCenario() * 6.28;
        const fatorDeTom = 0.94 + numeroAleatorioDoCenario() * 0.12, variar = cor => new THREE.Color(cor).multiplyScalar(fatorDeTom).getHex(); // tom levemente diferente por montanha
        const parte = (raioDaParte, alturaDaParte, cor, deslocamentoX, deslocamentoZ, fracaoInicial = 0, folga = 1) => {
          const malha = new THREE.Mesh(new THREE.LatheGeometry(perfilMontanha(raioDaParte, alturaDaParte, fracaoInicial, 1, folga), 8), materialPlano(cor));
          malha.position.set(deslocamentoX, 0, deslocamentoZ); grupoDaMontanha.add(malha);
          if (fracaoInicial === 0) { const cosseno = Math.cos(grupoDaMontanha.rotation.y), seno = Math.sin(grupoDaMontanha.rotation.y); COLISOES.circulo('relevo', posicaoX + deslocamentoX * cosseno + deslocamentoZ * seno, posicaoZ - deslocamentoX * seno + deslocamentoZ * cosseno, raioDaParte * folga); }
        };
        parte(raioDaBase * 1.12, altura * 0.7, variar(0x4a8a45), 0, 0);   // floresta na base
        parte(raioDaBase, altura, variar(0x7b8691), 0, 0);                // corpo rochoso
        parte(raioDaBase, altura, 0xf4f7fb, 0, 0, 0.7, 1.012);            // neve: mesmo contorno do corpo, 1,2% maior
        for (let indice = 0; indice < 2; indice++) {                       // picos menores ao redor
          const angulo = numeroAleatorioDoCenario() * 6.28, distanciaDoCentro = raioDaBase * (0.6 + numeroAleatorioDoCenario() * 0.3), raioDoPico = raioDaBase * (0.45 + numeroAleatorioDoCenario() * 0.2), alturaDoPico = altura * (0.45 + numeroAleatorioDoCenario() * 0.25);
          const deslocamentoX = Math.cos(angulo) * distanciaDoCentro, deslocamentoZ = Math.sin(angulo) * distanciaDoCentro;
          parte(raioDoPico * 1.1, alturaDoPico * 0.6, variar(0x4a8a45), deslocamentoX, deslocamentoZ); parte(raioDoPico, alturaDoPico, variar(0x8a929b), deslocamentoX, deslocamentoZ);
        }
        cena.add(grupoDaMontanha);
      };
      const morro = function morro(posicaoX, posicaoZ, raio, altura, cor = 0x6fb04a) { // colina verde baixa
        const malha = new THREE.Mesh(new THREE.SphereGeometry(raio, 12, 6), material(cor));
        malha.scale.set(1, altura / raio, 1); malha.position.set(posicaoX, 0, posicaoZ); malha.receiveShadow = true; cena.add(malha);
        COLISOES.circulo('relevo', posicaoX, posicaoZ, raio);
      };
      // [x, z, raio, altura]. A estrada norte-sul (x = 0) passa por um vale e termina na montanha central.
      [
        [-30, -80, 18, 38],                                   // montanha atrás da cachoeira
        [-62, -88, 20, 30], [-92, -70, 20, 26], [-105, -35, 18, 22], [-118, -28, 18, 20],
        [26, -92, 20, 32], [54, -100, 24, 40], [84, -84, 22, 30], [104, -50, 20, 26], [118, -28, 18, 22],
        [-28, -118, 28, 50], [30, -125, 28, 48], [0, -150, 40, 66],
        [-95, 50, 16, 18], [112, 60, 16, 18],
      ].forEach(([posicaoX, posicaoZ, raioDaBase, altura]) => montanha(posicaoX * 0.62, posicaoZ * 0.42 - 6, raioDaBase * 0.62, altura * 0.8));
      // (Mark 8.2: o morro baixo em [−75, −55] deu lugar ao paredão de rocha da caverna — ver construirEntradaDaCaverna)
      [[-55, -60, 10, 4], [-48, -72, 12, 5], [12, -62, 10, 3.5], [18, -75, 14, 6], [40, -68, 12, 4.5]].forEach(([posicaoX, posicaoZ, raio, altura]) => morro(posicaoX * 0.62, posicaoZ * 0.42 - 6, raio * 0.62, altura * 0.8));

      // --- Rio: curva suave da cachoeira até o fim do mapa, passando pela estrada leste-oeste em (x -24, z -1) ---
      const curvaDoRio = new THREE.CatmullRomCurve3([[-20.5, -19.5], [-20.2, -13], [-20.5, -6], [-20.4, -1], [-20.7, 6], [-22, 14], [-23.5, 24], [-23, 36], [-25, 50], [-28, 65], [-32, 85]].map(([posicaoX, posicaoZ]) => new THREE.Vector3(posicaoX, 0, posicaoZ)));
      const larguraDoRio = fracaoDoPercurso => 3.4 + 1.8 * fracaoDoPercurso;           // mais largo rio abaixo
      const pontosDaCurvaDoRio = curvaDoRio.getPoints(240);
      const distanciaDoRio = (posicaoX, posicaoZ) => { let menor = Infinity; for (const pontoDoRio of pontosDaCurvaDoRio) { const distancia = Math.hypot(pontoDoRio.x - posicaoX, pontoDoRio.z - posicaoZ); if (distancia < menor) menor = distancia; } return menor; }; // sem criar listas a cada chamada

      // Faixa plana que acompanha uma curva (usada no leito e nas margens do rio).
      const criarFita = function criarFita(curva, largura, posicaoY, materialDoObjeto, repeticoesDaTextura, passos = 160) { // faixa plana que segue a curva
        const posicoes = [], coordenadasUV = [], normais = [], indices = [], comprimento = curva.getLength();
        for (let indice = 0; indice <= passos; indice++) {
          const fracao = indice / passos, ponto = curva.getPointAt(fracao), tangente = curva.getTangentAt(fracao), meiaLargura = largura(fracao) / 2;
          posicoes.push(ponto.x + tangente.z * meiaLargura, posicaoY, ponto.z - tangente.x * meiaLargura, ponto.x - tangente.z * meiaLargura, posicaoY, ponto.z + tangente.x * meiaLargura);
          coordenadasUV.push(0, fracao * comprimento / repeticoesDaTextura, 1, fracao * comprimento / repeticoesDaTextura);
          normais.push(0, 1, 0, 0, 1, 0);
          if (indice < passos) { const indiceDoVertice = indice * 2; indices.push(indiceDoVertice, indiceDoVertice + 1, indiceDoVertice + 2, indiceDoVertice + 1, indiceDoVertice + 3, indiceDoVertice + 2); }
        }
        const geometria = new THREE.BufferGeometry();
        geometria.setAttribute('position', new THREE.Float32BufferAttribute(posicoes, 3));
        geometria.setAttribute('uv', new THREE.Float32BufferAttribute(coordenadasUV, 2));
        geometria.setAttribute('normal', new THREE.Float32BufferAttribute(normais, 3));
        geometria.setIndex(indices);
        const malha = new THREE.Mesh(geometria, materialDoObjeto);
        malha.receiveShadow = true;
        cena.add(malha);
        return malha;
      };
      // Textura procedural de água (listras claras sobre azul), que se repete e é animada deslocando o offset.
      const criarTexturaDeAgua = function criarTexturaDeAgua(largura, altura, corBase, quantidadesPorTipo, comprimento, alfa, espessura) { // listras claras que "emendam" na vertical
        const canvasDaTextura = document.createElement('canvas'); canvasDaTextura.width = largura; canvasDaTextura.height = altura;
        const contexto2d = canvasDaTextura.getContext('2d'), sortearNumero = criarGeradorDeNumerosAleatorios(7);
        contexto2d.fillStyle = corBase; contexto2d.fillRect(0, 0, largura, altura);
        for (let indice = 0; indice < quantidadesPorTipo; indice++) {
          const posicaoX = sortearNumero() * largura, posicaoY = sortearNumero() * altura, alturaDaListra = comprimento * (0.5 + sortearNumero()), larguraDaListra = espessura * (0.6 + sortearNumero());
          contexto2d.fillStyle = `rgba(255,255,255,${alfa * (0.5 + sortearNumero() * 0.5)})`;
          for (const deslocamentoY of [-altura, 0, altura]) contexto2d.fillRect(posicaoX, posicaoY + deslocamentoY, larguraDaListra, alturaDaListra);
        }
        const textura = new THREE.CanvasTexture(canvasDaTextura);
        textura.wrapS = textura.wrapT = THREE.RepeatWrapping;
        return textura;
      };
      const texturaDoRio = criarTexturaDeAgua(128, 256, '#3f9fd0', 34, 70, 0.4, 3);
      criarFita(curvaDoRio, fracao => larguraDoRio(fracao) + 2, 0.06, material(0xc2a56b), 8);  // margem de areia
      criarFita(curvaDoRio, larguraDoRio, 0.09, new THREE.MeshLambertMaterial({ map: texturaDoRio, side: THREE.DoubleSide }), 8);
      animacoesDoCenario.push((tempoDecorrido, segundosDesdeUltimoFrame) => { texturaDoRio.offset.y -= segundosDesdeUltimoFrame * 0.25; }); // a água corre rio abaixo

      // Posição da cachoeira (frente do paredão) — usada por vegetação, câmera e construção.
      const CENTRO_X_DA_CACHOEIRA = -20.5, Z_DA_FRENTE_DA_CACHOEIRA = -22, ALTURA_DO_PAREDAO = 15.3;

      // ---- Ocupação do terreno: nada de vegetação sobre construções, estradas, rio, cachoeira ou lago ----
      const METADE_DO_TAMANHO_DA_AREA = { casa: [5.4, 5.2], celeiro: [5.4, 4], curral: [5, 4.2], ovelhal: [5.1, 4.3], estabulo: [5.9, 5.3], galinheiro: [4.4, 3.7], chiqueiro: [4.4, 3.7], maquinario: [5.2, 4.2], moinho: [4.4, 3.9], plantacaoGrande: [11.3, 9.2], ponte: [5.6, 2.8], novaPlantacao: [11.3, 9.2], mina: [2.8, 2.4] };   // a Nova plantação tem as mesmas dimensões da Grande
      // Diz se um ponto do terreno já está ocupado (construções, estradas, rio, cachoeira, lago). Usada para
      // espalhar arbustos, pedras e capim; a margem aumenta a folga.
      const ocupado = function ocupado(posicaoX, posicaoZ, margem = 0) {
        if (AREAS.some(area => Math.abs(posicaoX - area.posicao.x) < METADE_DO_TAMANHO_DA_AREA[area.id][0] + margem && Math.abs(posicaoZ - area.posicao.z) < METADE_DO_TAMANHO_DA_AREA[area.id][1] + margem)) return true;
        if (ROTAS.some(([xInicial, zInicial, xFinal, zFinal, largura]) => posicaoX > Math.min(xInicial, xFinal) - largura / 2 - margem && posicaoX < Math.max(xInicial, xFinal) + largura / 2 + margem && posicaoZ > Math.min(zInicial, zFinal) - largura / 2 - margem && posicaoZ < Math.max(zInicial, zFinal) + largura / 2 + margem) || PRACAS.some(([centroDaPracaX, centroDaPracaZ, raioDaPraca]) => Math.hypot(posicaoX - centroDaPracaX, posicaoZ - centroDaPracaZ) < raioDaPraca + margem)) return true;
          if (Math.abs(posicaoX - CENTRO_X_DA_CACHOEIRA) < 12 + margem && posicaoZ < -15 && posicaoZ > -34) return true;      // paredão da cachoeira
        if (Math.abs(posicaoX - 32) < 8 + margem && Math.abs(posicaoZ - 35) < 6.5 + margem) return true; // antiga área do lago: o lago foi para a praça central,
        // mas este trecho continua reservado (gramado livre para expansões futuras) e manter a regra preserva a sequência aleatória
        // da vegetação. Pelo mesmo motivo esta função usa ROTAS (sem as estradas novas da praça).
        return distanciaDoRio(posicaoX, posicaoZ) < 4.2 + margem;
      };
      // Rede de caminhos, pequenas praças e a praça central (usado pelos postes automáticos e pelos fazendeiros, que preferem
      // passear pelos caminhos)
      const estaSobreCaminho = (posicaoX, posicaoZ, margem) => estaNaAreaDaPracaCentral(posicaoX, posicaoZ, margem) || REDE_DE_CAMINHOS.some(([xInicial, zInicial, xFinal, zFinal, largura]) => posicaoX > Math.min(xInicial, xFinal) - largura / 2 - margem && posicaoX < Math.max(xInicial, xFinal) + largura / 2 + margem && posicaoZ > Math.min(zInicial, zFinal) - largura / 2 - margem && posicaoZ < Math.max(zInicial, zFinal) + largura / 2 + margem) || PRACAS.some(([centroDaPracaX, centroDaPracaZ, raioDaPraca]) => Math.hypot(posicaoX - centroDaPracaX, posicaoZ - centroDaPracaZ) < raioDaPraca + margem);
      // Verdadeiro se o ponto está dentro do retângulo principal da fazenda (a floresta fica fora dele).
      const dentroDaFazenda = (posicaoX, posicaoZ) => posicaoX > -27 && posicaoX < 56 && posicaoZ > -24 && posicaoZ < 54;
      const PLACA = { x: -10, z: 19 }; // placa de boas-vindas (gramado aberto ao sul da casa); a vegetação não nasce aqui
      const PEDRA_SECRETA = { x: 63, z: 44 }; // pedra do Easter egg, numa clareira da floresta a leste da fazenda
      // ---- Registro das colisões fixas (consultado por árvores, postes, fazendeiros e mobs) ----
      for (const area of AREAS) COLISOES.retangulo('area', area.posicao.x, area.posicao.z, METADE_DO_TAMANHO_DA_AREA[area.id][0], METADE_DO_TAMANHO_DA_AREA[area.id][1]);     // terreno de cada instalação (tamanho máximo)
      // ---- MARK 8.2: corredor dos trilhos e entrada da caverna (marcação roxa) ----
      // Registrados ANTES da floresta e da vegetação, para que árvores e arbustos não nasçam nos trilhos nem na frente da caverna.
      for (let distancia = 0; distancia <= MINA_GEOMETRIA.comprimento; distancia += 1.5) {
        const ponto = MINA_GEOMETRIA.inicio.clone().addScaledVector(MINA_GEOMETRIA.direcaoParaDentro, distancia);
        COLISOES.circulo('trilho', ponto.x, ponto.z, 1.9);
      }
      // Entrada natural da caverna (existe desde o início; a mina construída acrescenta madeiramento, trilhos e carrinho).
      // O "interior" é um túnel curto de paredes pretas: o carrinho entra no escuro e some de vista. Nenhuma rocha invade o
      // volume do túnel (afastarDoTunel garante isso), para o escuro continuar escuro.
      const construirEntradaDaCaverna = function construirEntradaDaCaverna() {
        const grupo = new THREE.Group(); grupo.position.copy(MINA_GEOMETRIA.boca); grupo.rotation.y = MINA_GEOMETRIA.giroDaEntrada; grupo.userData.nome = 'entrada-da-caverna'; cena.add(grupo);
        // Mark 8.3 — CORREÇÃO ESTRUTURAL. Causa do "fundo verde": a abertura era uma caixa de planos pretos cercada por rochas
        // soltas; entre as rochas sobravam frestas por onde se via o terreno e a floresta atrás, e o piso disputava profundidade
        // com o chão. Agora a entrada é uma FACE DE ROCHA contínua (extrudada, 1,4 de espessura) com um furo em arco; atrás
        // dela há um túnel fechado (paredes, abóbada, piso e fundo) que escurece com a profundidade. Nenhuma superfície do
        // cenário fica visível pela abertura, e as rochas em volta só decoram (afastarDoTunel impede que invadam o túnel).
        const meiaLargura = 1.35, alturaDaParede = 1.15, altura = alturaDaParede + meiaLargura, profundidadeDaFace = 1.4, profundidade = MINA_GEOMETRIA.profundidadeDoTunel;
        const fundoDoTunel = -(profundidadeDaFace + profundidade), centroDoTunelZ = -(profundidadeDaFace + profundidade / 2);
        const pontosDoArco = [[meiaLargura, 0]];                                  // contorno da abertura: paredes retas + meia-lua
        for (let passo = 0; passo <= 18; passo++) { const angulo = passo / 18 * Math.PI; pontosDoArco.push([Math.cos(angulo) * meiaLargura, alturaDaParede + Math.sin(angulo) * meiaLargura]); }
        pontosDoArco.push([-meiaLargura, 0]);
        const paraVetores = pontos => pontos.map(([posicaoX, posicaoY]) => new THREE.Vector2(posicaoX, posicaoY));
        // 1) face de rocha com o furo (a base vai abaixo do chão, então o furo fica inteiro dentro da face)
        const formaDaFace = new THREE.Shape(paraVetores([[-4.8, -0.4], [4.8, -0.4], [4.3, 3.6], [2.6, 5.0], [0.2, 5.6], [-2.4, 5.1], [-4.4, 3.4]]));
        formaDaFace.holes.push(new THREE.Path(paraVetores(pontosDoArco.slice().reverse())));
        const face = new THREE.Mesh(new THREE.ExtrudeGeometry(formaDaFace, { depth: profundidadeDaFace, bevelEnabled: false, curveSegments: 4 }), material(0x7b8691));
        face.position.z = -profundidadeDaFace; face.castShadow = face.receiveShadow = true; face.userData.nome = 'face-da-caverna'; grupo.add(face);
        // 2) túnel fechado atrás da face: as cores dos vértices vão de um cinza-escuro perto da boca ao preto no fundo
        //    (transição de luz para escuridão). Material sem iluminação nem névoa: o interior não fica claro de dia.
        const materialDoInterior = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false }); materialDoInterior.userData.ignorarCiclo = true;
        const materialDoPisoDoInterior = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); materialDoPisoDoInterior.userData.ignorarCiclo = true;
        const corDaBoca = new THREE.Color(0x2a2520), corDoFundo = new THREE.Color(0x000000), corAuxiliar = new THREE.Color();
        function escurecerComAProfundidade(geometria) {
          const posicoes = geometria.attributes.position, cores = [];
          for (let vertice = 0; vertice < posicoes.count; vertice++) {
            const fracao = Math.max(0, Math.min(1, (-posicoes.getZ(vertice) - profundidadeDaFace) / (profundidade * 0.75)));
            corAuxiliar.copy(corDaBoca).lerp(corDoFundo, Math.pow(fracao, 0.55)); cores.push(corAuxiliar.r, corAuxiliar.g, corAuxiliar.b);
          }
          geometria.setAttribute('color', new THREE.Float32BufferAttribute(cores, 3));
          return geometria;
        }
        const pecaDoTunel = (geometria, materialDaPeca) => { const malha = new THREE.Mesh(escurecerComAProfundidade(geometria), materialDaPeca); malha.userData.nome = 'interior-da-caverna'; grupo.add(malha); return malha; };
        for (const lado of [-1, 1]) { const parede = new THREE.PlaneGeometry(profundidade, alturaDaParede, 8, 1); parede.rotateY(Math.PI / 2); parede.translate(lado * meiaLargura, alturaDaParede / 2, centroDoTunelZ); pecaDoTunel(parede, materialDoInterior); }
        const abobada = new THREE.CylinderGeometry(meiaLargura, meiaLargura, profundidade, 18, 8, true, Math.PI / 2, Math.PI); abobada.rotateX(Math.PI / 2); abobada.translate(0, alturaDaParede, centroDoTunelZ); pecaDoTunel(abobada, materialDoInterior);
        // Fazenda 8.4: o piso vai da frente da face (z = 0) até o fundo. Antes começava em z = −1,3 e, na espessura da face, o chão
        // verde (y = 0) disputava profundidade com a base do furo da rocha (também y = 0): o verde aparecia na entrada.
        const comprimentoDoPiso = profundidadeDaFace + profundidade + 0.1;
        const piso = new THREE.PlaneGeometry(meiaLargura * 2 + 0.1, comprimentoDoPiso, 1, 10); piso.rotateX(-Math.PI / 2); piso.translate(0, 0.035, -0.01 - comprimentoDoPiso / 2); pecaDoTunel(piso, materialDoPisoDoInterior).renderOrder = 1;
        const fundo = new THREE.ShapeGeometry(new THREE.Shape(paraVetores(pontosDoArco))); fundo.translate(0, 0, fundoDoTunel); pecaDoTunel(fundo, materialDoInterior);
        // Fazenda 8.4: a saia de floresta (e o corpo rochoso) da montanha a oeste da caverna atravessa o fundo do túnel, e a
        // superfície verde aparecia lá dentro. Sem mexer na montanha (vértices, colisões e sorteios continuam iguais), os
        // materiais das montanhas cujos triângulos entram no túnel deixam de ser desenhados SÓ dentro do volume do túnel
        // (planos de corte em interseção: paredes, piso, frente, fundo e a abóbada em 12 faces). Fora dele nada muda; as
        // sombras continuam inteiras (clipShadows desligado).
        grupo.updateMatrixWorld(true);
        const volumeDoTunel = new THREE.Box3(new THREE.Vector3(-meiaLargura, 0, fundoDoTunel), new THREE.Vector3(meiaLargura, altura, 0));
        const mundoParaEntrada = grupo.matrixWorld.clone().invert(), triangulo = new THREE.Triangle(), materiaisQueAtravessam = new Set();
        cena.children.filter(objeto => objeto.userData.nome === 'montanha').forEach(montanhaDoCenario => montanhaDoCenario.traverse(malha => {
          if (!malha.isMesh || materiaisQueAtravessam.has(malha.material)) return;
          malha.updateWorldMatrix(true, false);
          const paraEntrada = mundoParaEntrada.clone().multiply(malha.matrixWorld), posicoes = malha.geometry.attributes.position, indices = malha.geometry.index;
          for (let indice = 0; indice < (indices ? indices.count : posicoes.count); indice += 3) {
            const vertice = deslocamento => indices ? indices.getX(indice + deslocamento) : indice + deslocamento;
            triangulo.a.fromBufferAttribute(posicoes, vertice(0)).applyMatrix4(paraEntrada); triangulo.b.fromBufferAttribute(posicoes, vertice(1)).applyMatrix4(paraEntrada); triangulo.c.fromBufferAttribute(posicoes, vertice(2)).applyMatrix4(paraEntrada);
            if (volumeDoTunel.intersectsTriangle(triangulo)) { materiaisQueAtravessam.add(malha.material); break; }
          }
        }));
        if (materiaisQueAtravessam.size) {
          const folga = 0.005, planosDeCorte = [   // normal apontando para FORA do túnel: o que fica do lado de dentro de todos é cortado
            new THREE.Plane(new THREE.Vector3(1, 0, 0), -meiaLargura - folga), new THREE.Plane(new THREE.Vector3(-1, 0, 0), -meiaLargura - folga),
            new THREE.Plane(new THREE.Vector3(0, -1, 0), -0.05), new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), new THREE.Plane(new THREE.Vector3(0, 0, -1), fundoDoTunel - folga)];
          for (let face = 0; face < 12; face++) {   // abóbada: faces tangentes a um círculo um pouco maior que o arco (cortam todo o arco)
            const angulo = (face + 0.5) / 12 * Math.PI, normal = new THREE.Vector3(Math.cos(angulo), Math.sin(angulo), 0);
            planosDeCorte.push(new THREE.Plane(normal, -(normal.y * alturaDaParede + meiaLargura / Math.cos(Math.PI / 24) + folga)));
          }
          planosDeCorte.forEach(plano => plano.applyMatrix4(grupo.matrixWorld));
          for (const materialDaMontanha of materiaisQueAtravessam) { materialDaMontanha.clippingPlanes = planosDeCorte; materialDaMontanha.clipIntersection = true; materialDaMontanha.needsUpdate = true; }
          renderizador.localClippingEnabled = true;
        }

        // empurra o centro de uma rocha para fora do túnel (caixa |x| < meiaLargura, 0 < y < altura, fundoDoTunel < z < 0)
        function afastarDoTunel(centro, raio) {
          const maisProximo = new THREE.Vector3(Math.max(-meiaLargura, Math.min(meiaLargura, centro.x)), Math.max(0, Math.min(altura, centro.y)), Math.max(fundoDoTunel, Math.min(0.4, centro.z)));
          const afastamento = centro.clone().sub(maisProximo), distancia = afastamento.length();
          if (distancia < raio) { if (distancia < 1e-3) afastamento.set(0, 1, 0); centro.add(afastamento.normalize().multiplyScalar(raio - distancia + 0.05)); }
          return centro;
        }
        const CORES_DA_ROCHA = [0x7b8691, 0x8a929b, 0x6f7a84];
        // [x, y, z, raio] em coordenadas da entrada (+z = para fora, na direção do depósito)
        [[-2.4, 1.0, 0.1, 1.1], [2.4, 1.0, 0.1, 1.1], [-2.6, 2.6, -0.6, 1.3], [2.6, 2.6, -0.6, 1.3], [0, 3.6, 0, 1.15], [-1.2, 3.8, -0.8, 1.2], [1.3, 3.9, -0.9, 1.2],
         [-4.2, 1.8, -2.6, 2.4], [4.2, 1.8, -2.6, 2.4], [-3.0, 4.6, -3.2, 2.2], [3.0, 4.8, -3.4, 2.3], [0, 5.2, -3.0, 2.6], [-2.6, 3.0, -8.4, 3.0], [2.8, 3.2, -8.6, 3.1],
         [0, 5.8, -7.0, 3.2], [-6.0, 1.4, -5.0, 2.4], [6.0, 1.5, -5.2, 2.5], [0, 2.4, -9.2, 3.4]]
          .forEach(([posicaoX, posicaoY, posicaoZ, raio], indice) => {
            const centro = afastarDoTunel(new THREE.Vector3(posicaoX, posicaoY, posicaoZ), raio);
            const rocha = new THREE.Mesh(new THREE.DodecahedronGeometry(raio, 0), material(CORES_DA_ROCHA[indice % 3]));
            rocha.position.copy(centro); rocha.rotation.set(indice * 0.7, indice * 1.3, indice * 0.4); rocha.scale.set(1, 0.85 + (indice % 3) * 0.08, 1); rocha.castShadow = rocha.receiveShadow = true; grupo.add(rocha);
          });
        [[-3.2, 6.4, -4.2, 1.5], [2.8, 7.0, -5.0, 1.6], [0, 8.2, -7.2, 1.9]].forEach(([posicaoX, posicaoY, posicaoZ, raio]) => {   // musgo no alto
          const musgo = new THREE.Mesh(new THREE.DodecahedronGeometry(raio, 0), material(0x4a8a45)); musgo.position.set(posicaoX, posicaoY, posicaoZ); musgo.scale.y = 0.55; grupo.add(musgo);
        });
        [[-5.5, -6.5, 0.9, 2.2], [5.8, -7.0, 0.85, 2.4], [-1.5, -10.5, 1, 4.6]].forEach(([posicaoX, posicaoZ, escala, posicaoY]) => criarArvore(grupo, posicaoX, posicaoZ, escala, posicaoY));
        const centroDaMassa = MINA_GEOMETRIA.boca.clone().addScaledVector(MINA_GEOMETRIA.direcaoParaDentro, 4.5);
        COLISOES.circulo('relevo', centroDaMassa.x, centroDaMassa.z, 6.5);
        return grupo;
      };
      const entradaDaCaverna = construirEntradaDaCaverna();
      for (const [xInicial, zInicial, xFinal, zFinal, largura] of REDE_DE_CAMINHOS) {
        const ehHorizontal = zInicial === zFinal, metadeX = (ehHorizontal ? Math.abs(xFinal - xInicial) + largura : largura) / 2, metadeZ = (ehHorizontal ? largura : Math.abs(zFinal - zInicial) + largura) / 2;
        COLISOES.retangulo('estrada', (xInicial + xFinal) / 2, (zInicial + zFinal) / 2, metadeX, metadeZ);
      }
      for (const [posicaoX, posicaoZ, raio] of PRACAS) COLISOES.circulo('estrada', posicaoX, posicaoZ, raio);
      COLISOES.retangulo('cachoeira', CENTRO_X_DA_CACHOEIRA, -24.5, 12, 9.5);                       // paredão e poço da cachoeira
      // (o lago com o chafariz agora fica no centro da praça central: sua colisão é registrada na seção 10)
      COLISOES.retangulo('placa', PLACA.x, PLACA.z, 4.8, 1.2);                   // placa de boas-vindas
      COLISOES.circulo('clareira', -27, -1, 7.5);                                // clareira da ponte (sem árvores; pessoas podem andar)
      COLISOES.circulo('pedra', PEDRA_SECRETA.x, PEDRA_SECRETA.z, 3.8);          // pedra secreta e sua clareira

      // ---- Distribuição organizada dos postes: ao longo dos caminhos (lados alternados), perto das construções e nas praças ----
      const ESPACAMENTO_MINIMO_DOS_POSTES = 7;
      // Posiciona os postes: ao longo dos caminhos (lados alternados), perto de cada construção, nas praças e,
      // por fim, onde sobraram áreas escuras. Respeita colisões e a distância mínima entre postes.
      const distribuirPostes = function distribuirPostes() {
        const livre = (posicaoX, posicaoZ) => dentroDaFazenda(posicaoX, posicaoZ) && !COLISOES.bloqueia(posicaoX, posicaoZ, 0.5) && !COLISOES.rio(posicaoX, posicaoZ, 5.2);
        const longeDosOutros = (posicaoX, posicaoZ, distanciaMinima) => postesDaFazenda.every(poste => Math.hypot(posicaoX - poste.x, posicaoZ - poste.z) >= distanciaMinima);
        const tentar = (posicaoX, posicaoZ, distanciaMinima = ESPACAMENTO_MINIMO_DOS_POSTES) => livre(posicaoX, posicaoZ) && longeDosOutros(posicaoX, posicaoZ, distanciaMinima) && (criarPoste(posicaoX, posicaoZ), true);
        // 1) ao longo dos caminhos principais, a cada ~9 unidades, alternando os lados
        REDE_DE_CAMINHOS.forEach(([xInicial, zInicial, xFinal, zFinal, largura], indiceDaRota) => {
          const ehHorizontal = zInicial === zFinal, comprimento = Math.abs(ehHorizontal ? xFinal - xInicial : zFinal - zInicial), quantidadeDeTrechos = Math.max(1, Math.round(comprimento / 9));
          for (let indice = 0; indice < quantidadeDeTrechos; indice++) {
            const fracaoDoTrecho = (indice + 0.5) / quantidadeDeTrechos, centroX = xInicial + (xFinal - xInicial) * fracaoDoTrecho, centroZ = zInicial + (zFinal - zInicial) * fracaoDoTrecho, afastamentoDoCaminho = largura / 2 + 0.8, lado = (indice + indiceDaRota) % 2 ? -1 : 1;
            const [deslocamentoX, deslocamentoZ] = ehHorizontal ? [0, afastamentoDoCaminho * lado] : [afastamentoDoCaminho * lado, 0];
            tentar(centroX + deslocamentoX, centroZ + deslocamentoZ) || tentar(centroX - deslocamentoX, centroZ - deslocamentoZ);
          }
        });
        // 2) perto de cada construção: o canto do terreno mais próximo do centro da fazenda que esteja livre
        for (const area of AREAS) {
          if (area.id === 'ponte') continue;
          const [metadeX, metadeZ] = METADE_DO_TAMANHO_DA_AREA[area.id], cantos = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([escalaX, escalaZ]) => [area.posicao.x + escalaX * (metadeX + 0.9), area.posicao.z + escalaZ * (metadeZ + 0.9)])
            .sort((cantoA, cantoB) => Math.hypot(cantoA[0] - 14, cantoA[1] - 8) - Math.hypot(cantoB[0] - 14, cantoB[1] - 8));
          if (postesDaFazenda.some(poste => Math.hypot(poste.x - area.posicao.x, poste.z - area.posicao.z) < Math.max(metadeX, metadeZ) + 3.2)) continue; // já iluminada por um poste de caminho
          for (const [posicaoX, posicaoZ] of cantos) if (tentar(posicaoX, posicaoZ, 6)) break;
        }
        // 3) praças e pontos de circulação sem poste por perto
        for (const [posicaoX, posicaoZ, raio] of PRACAS) if (postesDaFazenda.every(poste => Math.hypot(poste.x - posicaoX, poste.z - posicaoZ) > 5)) tentar(posicaoX + raio + 0.9, posicaoZ) || tentar(posicaoX - raio - 0.9, posicaoZ) || tentar(posicaoX, posicaoZ + raio + 0.9);
        // 4) varredura final: elimina grandes áreas escuras perto dos caminhos (grade fixa, sem sorteio)
        for (let posicaoZ = -22; posicaoZ <= 52; posicaoZ += 4) for (let posicaoX = -24; posicaoX <= 54; posicaoX += 4)
          if (estaSobreCaminho(posicaoX, posicaoZ, 4.5) && longeDosOutros(posicaoX, posicaoZ, 12.5)) { const afastamento = 1.9; tentar(posicaoX + afastamento, posicaoZ, 10) || tentar(posicaoX - afastamento, posicaoZ, 10) || tentar(posicaoX, posicaoZ + afastamento, 10) || tentar(posicaoX, posicaoZ - afastamento, 10); }
      };
      distribuirPostes();


      arquivoDaMontagemConcluido('11a-relevo-rio-e-postes.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
