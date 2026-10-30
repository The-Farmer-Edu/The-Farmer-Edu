      // ====================================================================================================
      // FARMEDU 3D — 13-demarcacoes-e-ruinas.js (Fase 3B da refatoração: seção 13)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 13 — DEMARCAÇÕES DE CONSTRUÇÃO E RUÍNAS
      // Modelo usado no lugar do construtor normal enquanto uma instalação está destruída. O nível e o XP não mudam; só estado.danos decide qual modelo aparece.
      // ====================================================================================================
      // O nível e o XP da instalação NÃO mudam ao ser destruída: só o estado de dano (estado.danos) faz o construtor visual
      // ser trocado por esta ruína. Ao reparar, o construtor normal volta a ser usado com o nível preservado.
      const COR_DAS_RUINAS = { casa: 0xdcc08e, celeiro: 0xc0392b, estabulo: 0x9a6a3a, ovelhal: 0xb98a55, curral: 0xb07a45, galinheiro: 0xb5522f, chiqueiro: 0xa5703a, maquinario: 0x6a7078 };
      // Constrói a ruína de uma instalação destruída (terreno queimado, alicerce, tábuas, vigas, bandeira de
      // aviso e fumaça), usando o tamanho máximo do terreno e o nível preservado.
      // ---- MARK 8.2: demarcação de uma construção ainda não construída (nível 0) ----
      // Terreno nivelado de terra clara, estacas com corda e bandeirolas no contorno e uma placa com o ícone e o nome do
      // edifício que pode ser construído ali. Não lembra um edifício pronto: é só o lote reservado.
      const criarTexturaDeTexto = function criarTexturaDeTexto(texto, corDoTexto = '#3b2410', corDoFundo = '#f2dfb4', subtitulo = '') {
        const canvasDaImagem = document.createElement('canvas'); canvasDaImagem.width = 256; canvasDaImagem.height = 128;
        const contexto2d = canvasDaImagem.getContext('2d');
        contexto2d.fillStyle = corDoFundo; contexto2d.fillRect(0, 0, 256, 128); contexto2d.strokeStyle = '#5c3a1e'; contexto2d.lineWidth = 8; contexto2d.strokeRect(4, 4, 248, 120);
        contexto2d.fillStyle = corDoTexto; contexto2d.textAlign = 'center'; contexto2d.textBaseline = 'middle';
        contexto2d.font = 'bold 34px Arial, sans-serif'; contexto2d.fillText(texto, 128, subtitulo ? 50 : 64, 236);
        if (subtitulo) { contexto2d.font = '22px Arial, sans-serif'; contexto2d.fillText(subtitulo, 128, 94, 236); }
        return new THREE.CanvasTexture(canvasDaImagem);
      };
      const construirDemarcacao = function construirDemarcacao(grupo, idDaArea) {
        // Peças pequenas (estacas, pontas, cordas e bandeirolas) vão para UMA malha instanciada por lote (antes eram dezenas de malhas).
        const area = AREAS.find(areaDaLista => areaDaLista.id === idDaArea), [metadeX, metadeZ] = METADE_DO_TAMANHO_DA_AREA[idDaArea];
        const largura = Math.min(metadeX * 1.7, 20), profundidade = Math.min(metadeZ * 1.7, 16), sobreORio = idDaArea === 'ponte';
        if (!sobreORio) criarCaixa(largura, 0.05, profundidade, 0xcdb88a, 0, 0.025, 0, grupo).castShadow = false;   // solo preparado (a ponte fica sobre o rio)
        const pecas = [];   // [largura, altura, profundidade, cor, x, y, z, giroY, giroZ]
        const cantos = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([escalaX, escalaZ]) => [escalaX * largura / 2, escalaZ * profundidade / 2]);
        cantos.forEach(([posicaoX, posicaoZ], indice) => {
          pecas.push([0.09, 0.7, 0.09, 0x8a5a2a, posicaoX, 0.35, posicaoZ, 0, 0], [0.11, 0.1, 0.11, 0xe67e22, posicaoX, 0.72, posicaoZ, 0, 0]);
          const [proximoX, proximoZ] = cantos[(indice + 1) % 4], comprimento = Math.hypot(proximoX - posicaoX, proximoZ - posicaoZ), giro = -Math.atan2(proximoZ - posicaoZ, proximoX - posicaoX);
          pecas.push([comprimento, 0.025, 0.025, 0xf2efe6, (posicaoX + proximoX) / 2, 0.55, (posicaoZ + proximoZ) / 2, giro, 0]);
          for (let distancia = 0.8; distancia < comprimento - 0.4; distancia += 1.1) { const fracao = distancia / comprimento; pecas.push([0.16, 0.16, 0.012, distancia % 2.2 < 1.1 ? 0xc0392b : 0xf1c40f, posicaoX + (proximoX - posicaoX) * fracao, 0.47, posicaoZ + (proximoZ - posicaoZ) * fracao, giro, Math.PI / 4]); }
        });
        const malha = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), pecas.length), objetoAuxiliar = new THREE.Object3D(), cor = new THREE.Color();
        pecas.forEach(([larguraDaPeca, alturaDaPeca, profundidadeDaPeca, corDaPeca, posicaoX, posicaoY, posicaoZ, giroY, giroZ], indice) => {
          objetoAuxiliar.position.set(posicaoX, posicaoY, posicaoZ); objetoAuxiliar.rotation.set(0, giroY, giroZ); objetoAuxiliar.scale.set(larguraDaPeca, alturaDaPeca, profundidadeDaPeca); objetoAuxiliar.updateMatrix();
          malha.setMatrixAt(indice, objetoAuxiliar.matrix); malha.setColorAt(indice, cor.setHex(corDaPeca));
        });
        malha.instanceMatrix.needsUpdate = true; if (malha.instanceColor) malha.instanceColor.needsUpdate = true; malha.castShadow = true; grupo.add(malha);
        const placa = new THREE.Group(); placa.position.set(sobreORio ? -largura / 2 - 0.6 : 0, 0, sobreORio ? 0 : profundidade / 2 - 0.2); if (sobreORio) placa.rotation.y = -Math.PI / 2; grupo.add(placa);
        criarCaixa(0.1, 1.3, 0.1, 0x8a5a2a, -0.55, 0.65, 0, placa); criarCaixa(0.1, 1.3, 0.1, 0x8a5a2a, 0.55, 0.65, 0, placa);
        const quadro = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.75, 0.06), new THREE.MeshLambertMaterial({ map: criarTexturaDeTexto(area.icone + ' ' + area.nome, '#3b2410', '#f2dfb4', 'Lote reservado') }));
        quadro.position.set(0, 1.05, 0.06); quadro.castShadow = true; placa.add(quadro);
      };
      // Ponte quebrada (nível 0): a MESMA ponte do nível 1 (mesmas medidas e posição), mas antiga e destruída — apoios de pedra
      // gastos, uma viga partida e afundando na água, tábuas faltando no meio (lacuna visível), tábuas soltas e tortas,
      // uma rampa caída e o guarda-corpo incompleto. Não tem demarcação de obra. Reparar (nível 1) troca tudo pela ponte inteira.
      // Todas as peças são fixas (sem sorteio): o visual é sempre o mesmo e nada sobra depois da reconstrução.
      const construirPonteQuebrada = function construirPonteQuebrada(grupo) {
        const comprimento = 7, rampa = 1.3, alturaDoCentro = 0.5, profundidade = 2.6, pedraGasta = 0x6f716c, madeiraVelha = [0x7d5a3a, 0x8a6442, 0x6e4e33];
        const quantidadeDeTabuas = Math.round(comprimento / 0.4), larguraDaTabua = comprimento / quantidadeDeTabuas - 0.04;
        const TABUAS_QUE_FALTAM = [7, 8, 9, 11], TABUAS_TORTAS = { 5: [0.12, 0.08], 6: [-0.18, -0.1], 10: [0.25, 0.14], 13: [-0.08, 0.05] };   // índice → [giro em Y, inclinação]
        for (let indice = 0; indice < quantidadeDeTabuas; indice++) {
          if (TABUAS_QUE_FALTAM.includes(indice)) continue;
          const tabua = criarCaixa(larguraDaTabua, 0.1, indice === 12 ? profundidade * 0.55 : profundidade, madeiraVelha[indice % 3], -comprimento / 2 + (indice + 0.5) * comprimento / quantidadeDeTabuas, alturaDoCentro, indice === 12 ? -profundidade * 0.22 : 0, grupo);
          if (TABUAS_TORTAS[indice]) { tabua.rotation.y = TABUAS_TORTAS[indice][0]; tabua.rotation.z = TABUAS_TORTAS[indice][1]; tabua.position.y -= Math.abs(TABUAS_TORTAS[indice][1]) * 0.4; }
        }
        // vigas: a de trás inteira; a da frente partida ao meio, com as duas metades caídas em direção à água
        criarCaixa(comprimento, 0.2, 0.22, 0x4f3420, 0, alturaDoCentro - 0.2, -profundidade / 2 + 0.25, grupo);
        for (const lado of [-1, 1]) { const metade = criarCaixa(comprimento / 2 - 0.25, 0.2, 0.22, 0x4f3420, lado * (comprimento / 4 + 0.15), alturaDoCentro - 0.32, profundidade / 2 - 0.25, grupo); metade.rotation.z = lado * 0.16; }
        // apoios de pedra nas margens (um com um canto quebrado) e entulho de pedra ao pé do apoio
        for (const lado of [-1, 1]) criarCaixa(0.8, alturaDoCentro - 0.1, profundidade + 0.2, pedraGasta, lado * (comprimento / 2 - 0.4), (alturaDoCentro - 0.1) / 2, 0, grupo);
        criarCaixa(0.42, 0.22, 0.6, 0x5f615c, comprimento / 2 - 0.3, alturaDoCentro - 0.05, profundidade / 2 - 0.15, grupo).rotation.y = 0.4;
        criarPedra(grupo, -comprimento / 2 + 0.95, profundidade / 2 + 0.25, 0.22); criarPedra(grupo, comprimento / 2 - 1.0, -profundidade / 2 - 0.2, 0.18);
        // rampas: a oeste inteira; a leste caída (mais curta, apoiada no chão)
        const angulo = Math.atan(alturaDoCentro / rampa);
        criarCaixa(Math.hypot(rampa, alturaDoCentro), 0.1, profundidade, 0x8a6442, -(comprimento / 2 + rampa / 2), alturaDoCentro / 2 - 0.05, 0, grupo).rotation.z = angulo;
        const rampaCaida = criarCaixa(rampa * 0.8, 0.1, profundidade * 0.85, 0x7d5a3a, comprimento / 2 + rampa * 0.55, 0.08, 0.15, grupo); rampaCaida.rotation.set(0, 0.18, -0.06);
        // guarda-corpo: postes faltando e um inclinado; corrimãos partidos (só trechos nas pontas)
        const quantidadeDePostes = Math.round(comprimento / 1.2), POSTES_QUE_FALTAM = { [-1]: [2, 3], [1]: [3, 4] };
        for (const ladoZ of [-1, 1]) {
          const posicaoZ = ladoZ * (profundidade / 2 - 0.1);
          for (let indice = 0; indice <= quantidadeDePostes; indice++) {
            if (POSTES_QUE_FALTAM[ladoZ].includes(indice)) continue;
            const poste = criarCaixa(0.13, 0.85, 0.13, 0x5a3f2a, -comprimento / 2 + indice * comprimento / quantidadeDePostes, alturaDoCentro + 0.425, posicaoZ, grupo);
            if (indice === 1 && ladoZ === 1) { poste.rotation.z = 0.35; poste.position.y -= 0.05; }
          }
          criarCaixa(comprimento * 0.3, 0.1, 0.1, 0x7d5a3a, -comprimento * 0.35, alturaDoCentro + 0.82, posicaoZ, grupo);
          const trechoDireito = criarCaixa(comprimento * 0.22, 0.1, 0.1, 0x7d5a3a, comprimento * 0.39, alturaDoCentro + 0.78, posicaoZ, grupo); trechoDireito.rotation.z = ladoZ * 0.12;
        }
      };
      // Casa base (nível 0): a casa do nível 1 em escala menor. É a construção física inicial da fazenda.
      const construirCasaBase = function construirCasaBase(grupo, animacoesDestaArea) {
        const base = new THREE.Group(); base.scale.setScalar(0.8); base.userData.areaId = 'casa'; grupo.add(base);
        construtoresDasAreas.casa(base, 1, animacoesDestaArea);
      };
      // Material de pedra do moinho: blocos claros desencontrados (textura de canvas criada uma única vez e reaproveitada).
      let materialDaPedraDoMoinho = null;
      const obterMaterialDaPedraDoMoinho = function obterMaterialDaPedraDoMoinho() {
        if (materialDaPedraDoMoinho) return materialDaPedraDoMoinho;
        const canvasDaImagem = document.createElement('canvas'); canvasDaImagem.width = canvasDaImagem.height = 128;
        const contexto2d = canvasDaImagem.getContext('2d'), tons = ['#d6cfbf', '#cbc3b2', '#ded7c8', '#c3bba9'];
        contexto2d.fillStyle = '#9d9585'; contexto2d.fillRect(0, 0, 128, 128);
        for (let linha = 0; linha < 8; linha++) for (let coluna = -1; coluna < 5; coluna++) {
          contexto2d.fillStyle = tons[(linha * 3 + coluna + 8) % tons.length];
          contexto2d.fillRect(coluna * 32 + (linha % 2) * 16 + 2, linha * 16 + 2, 28, 12);
        }
        const textura = new THREE.CanvasTexture(canvasDaImagem); textura.wrapS = textura.wrapT = THREE.RepeatWrapping; textura.repeat.set(4, 5);
        materialDaPedraDoMoinho = new THREE.MeshLambertMaterial({ map: textura });
        return materialDaPedraDoMoinho;
      };

      const construirRuinas = function construirRuinas(grupo, idDaArea, nivel, animacoesDestaArea) {
        const [metadeX, metadeZ] = METADE_DO_TAMANHO_DA_AREA[idDaArea], escala = [0.8, 0.9, 1][nivel - 1] || 1, largura = metadeX * 2 * escala - 0.8, profundidade = metadeZ * 2 * escala - 0.8;
        const sortearNumero = criarGeradorDeNumerosAleatorios(3000 + idDaArea.charCodeAt(0) * 31 + idDaArea.length), cor = COR_DAS_RUINAS[idDaArea] || 0xb07a45;
        criarCaixa(largura, 0.1, profundidade, 0x4a4238, 0, 0.02, 0, grupo);                                                 // terreno queimado
        for (let indice = 0; indice < 7; indice++) criarCaixa(0.8 + sortearNumero() * 1.6, 0.03, 0.6 + sortearNumero() * 1.2, 0x2c2723, (sortearNumero() - 0.5) * (largura - 1.5), 0.085, (sortearNumero() - 0.5) * (profundidade - 1.5), grupo).rotation.y = sortearNumero() * 3; // cinzas
        for (let indice = 0; indice < 10; indice++) {                                                                   // alicerce de pedra, em pedaços
          const lado = indice % 2 ? 1 : -1, ladoHorizontal = indice < 5, fracao = (Math.floor(indice / 2) + 0.5) / 2.5 - 0.5;
          criarCaixa(ladoHorizontal ? 1 + sortearNumero() * 0.6 : 0.5, 0.25 + sortearNumero() * 0.2, ladoHorizontal ? 0.5 : 1 + sortearNumero() * 0.6, 0x7d776c, ladoHorizontal ? fracao * (largura - 1.4) : lado * (largura / 2 - 0.9), 0.2, ladoHorizontal ? lado * (profundidade / 2 - 0.9) : fracao * (profundidade - 1.4), grupo);
        }
        for (let indice = 0; indice < 16; indice++) {                                                                   // tábuas e escombros
          const madeira = [0x5a3a20, 0x3a2a1c, cor, 0x7a5a3a][indice % 4];
          const tabua = criarCaixa(0.5 + sortearNumero() * 1.3, 0.07, 0.15, madeira, (sortearNumero() - 0.5) * (largura - 1.2), 0.14 + sortearNumero() * 0.18, (sortearNumero() - 0.5) * (profundidade - 1.2), grupo);
          tabua.rotation.set(0, sortearNumero() * 3.14, (sortearNumero() - 0.5) * 1.1);
        }
        for (let indice = 0; indice < 3; indice++) {                                                                    // vigas queimadas cruzadas
          const viga = criarCaixa(2 + sortearNumero() * 1.4, 0.18, 0.2, 0x2a1f18, (sortearNumero() - 0.5) * (largura - 3), 0.32 + indice * 0.1, (sortearNumero() - 0.5) * (profundidade - 3), grupo); viga.rotation.set(0, sortearNumero() * 3.14, (sortearNumero() - 0.5) * 0.35);
        }
        for (let indice = 0; indice < 4; indice++) {                                                                    // pedaços de parede com a cor original
          const paredeCaida = criarCaixa(0.9 + sortearNumero() * 0.8, 0.5 + sortearNumero() * 0.5, 0.14, cor, (sortearNumero() - 0.5) * (largura - 2.5), 0.38, (sortearNumero() - 0.5) * (profundidade - 2.5), grupo);
          paredeCaida.rotation.set((sortearNumero() - 0.5) * 0.5, sortearNumero() * 3.14, (sortearNumero() - 0.5) * 0.5);
        }
        for (let indice = 0; indice < 6; indice++) {                                                                    // mourões quebrados
          const altura = 0.3 + sortearNumero() * 0.7, mourao = criarCaixa(0.14, altura, 0.14, PALETA_DE_CORES.madeira, (sortearNumero() - 0.5) * (largura - 0.6), altura / 2 + 0.07, (sortearNumero() > 0.5 ? 1 : -1) * (profundidade / 2 - 0.4), grupo); mourao.rotation.z = (sortearNumero() - 0.5) * 0.5;
        }
        criarCaixa(0.1, 1.5, 0.1, PALETA_DE_CORES.madeira, largura / 2 - 0.5, 0.75, profundidade / 2 - 0.5, grupo);                       // estaca com bandeira vermelha de aviso
        criarCaixa(0.55, 0.32, 0.04, 0xc0392b, largura / 2 - 0.2, 1.3, profundidade / 2 - 0.5, grupo);
        const fumaca = [0, 1, 2, 3, 4].map(indice => {                                                         // coluna de fumaça (materiais Basic escurecem à noite)
          const bolaDeFumaca = new THREE.Mesh(new THREE.SphereGeometry(0.4, 7, 5), new THREE.MeshBasicMaterial({ color: 0x6d6d6d, transparent: true, opacity: 0.5 }));
          bolaDeFumaca.userData.fase = indice / 5; grupo.add(bolaDeFumaca); return bolaDeFumaca;
        });
        animacoesDestaArea.push((tempo) => fumaca.forEach(bolaDeFumaca => {
          const progresso = (tempo * 0.12 + bolaDeFumaca.userData.fase) % 1;
          bolaDeFumaca.position.set(Math.sin(tempo * 0.5 + bolaDeFumaca.userData.fase * 6) * 0.25, 0.5 + progresso * 3.2, 0); bolaDeFumaca.scale.setScalar(0.5 + progresso * 1.2); bolaDeFumaca.material.opacity = 0.5 * (1 - progresso);
        }));
      };

      // Cercado de animais: limites do terreno + obstáculos retangulares [centroX, centroZ, largura, profundidade] (usado por curral, ovelhal e estábulo)
      const MOSTRAR_HITBOXES = false; // true = mostra retângulos vermelhos no chão para conferir
      const criarCercado = function criarCercado(grupo, larguraDoCercado, profundidadeDoCercado, retangulos) {
        if (MOSTRAR_HITBOXES) retangulos.forEach(([posicaoX, posicaoZ, largura, profundidade]) => criarCaixa(largura, 0.05, profundidade, 0xff0000, posicaoX, 0.2, posicaoZ, grupo));
        return {
          limiteX: larguraDoCercado / 2 - 0.1, limiteZ: profundidadeDoCercado / 2 - 0.1, animais: [],
          obstaculos: retangulos.map(([posicaoX, posicaoZ, largura, profundidade]) => ({ minX: posicaoX - largura / 2, maxX: posicaoX + largura / 2, minZ: posicaoZ - profundidade / 2, maxZ: posicaoZ + profundidade / 2 })),
        };
      };

      arquivoDaMontagemConcluido('13-demarcacoes-e-ruinas.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
