      // ====================================================================================================
      // FARMEDU 3D — 22-fazendeiros-e-navegacao.js (Fase 3B da refatoração: seção 22)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 22 — FAZENDEIROS: MODELOS E NAVEGAÇÃO (OS FAZENDEIROS DECORATIVOS GRATUITOS FORAM DESLIGADOS NA MARK 8.2)
      // Três fazendeiros 3D, a grade de navegação (A*) compartilhada com os mobs e a máquina de estados que os faz andar, parar e olhar em volta.
      // ====================================================================================================
      const FAZENDEIROS = [
        { nome: 'Fazendeiro de palha', pele: 0xe8b98f, camisa: 0xc0392b, camisaLinha: 0x7a1d16, xadrez: true, calca: 0x3d5f94, macacao: true, bota: 0x5a3820, cabelo: 0x4a3020,
          chapeu: 'palha', corChapeu: 0xe3c46d, fita: 0xb5342a, inicio: [0, 6], velocidade: 1.05 },
        { nome: 'Fazendeiro vaqueiro', pele: 0xc58b62, camisa: 0x2f6fb0, mangaLonga: true, calca: 0x6b4a2b, bota: 0x2a1a10, cabelo: 0x2a1c12, barba: 0x3a2616,
          chapeu: 'vaqueiro', corChapeu: 0x7a4a2a, fita: 0x2a1a10, inicio: [29, 6], velocidade: 0.95 },
        { nome: 'Fazendeiro de colete', pele: 0xf0c8a0, camisa: 0xf2efe6, mangaLonga: true, colete: 0xe0a830, calca: 0x5c6b3a, bota: 0x4a2f1b, cabelo: 0xb9b4aa, bigode: 0xb9b4aa,
          chapeu: 'larga', corChapeu: 0xd9b565, fita: 0x3f7a3a, inicio: [-2, 16], velocidade: 1.15 },
      ];
      // Textura xadrez (camisa) desenhada num canvas, repetida e sem suavização.
      const texturaXadrez = function texturaXadrez(corBase, corLinha) {
        const canvasDaImagem = document.createElement('canvas'); canvasDaImagem.width = canvasDaImagem.height = 64;
        const contexto2d = canvasDaImagem.getContext('2d'); contexto2d.fillStyle = new THREE.Color(corBase).getStyle(); contexto2d.fillRect(0, 0, 64, 64);
        contexto2d.globalAlpha = 0.55; contexto2d.fillStyle = new THREE.Color(corLinha).getStyle();
        for (const [posicaoDaListra, espessuraDaListra] of [[8, 12], [36, 6]]) { contexto2d.fillRect(0, posicaoDaListra, 64, espessuraDaListra); contexto2d.fillRect(posicaoDaListra, 0, espessuraDaListra, 64); }
        const textura = new THREE.CanvasTexture(canvasDaImagem); textura.wrapS = textura.wrapT = THREE.RepeatWrapping; textura.magFilter = THREE.NearestFilter; return textura;
      };
      // Monta o modelo 3D de um fazendeiro a partir de uma configuração (cores, chapéu, barba/bigode...).
      // Devolve raiz, corpo, pernas e braços (com pivôs para a animação) e cabeça.
      const criarFazendeiro = function criarFazendeiro(configuracaoDoFazendeiro) {
        const raiz = new THREE.Group(), corpo = new THREE.Group(); raiz.add(corpo);
        const { caixa, esfera, cilindro } = criarFabricaDePecas();
        const peleEscura = new THREE.Color(configuracaoDoFazendeiro.pele).multiplyScalar(0.86).getHex();
        const materialDaCamisa = configuracaoDoFazendeiro.xadrez ? new THREE.MeshLambertMaterial({ map: texturaXadrez(configuracaoDoFazendeiro.camisa, configuracaoDoFazendeiro.camisaLinha) }) : material(configuracaoDoFazendeiro.camisa);
        // pernas com pivô no quadril (o pé encosta em y = 0)
        const pernas = [-1, 1].map(lado => {
          const grupoDaPerna = new THREE.Group(); grupoDaPerna.position.set(lado * 0.11, 0.8, 0); corpo.add(grupoDaPerna);
          caixa(grupoDaPerna, 0.17, 0.6, 0.19, configuracaoDoFazendeiro.calca, 0, -0.31, 0);
          caixa(grupoDaPerna, 0.19, 0.22, 0.31, configuracaoDoFazendeiro.bota, 0, -0.69, 0.04);
          caixa(grupoDaPerna, 0.2, 0.05, 0.32, 0x24170e, 0, -0.775, 0.04);
          return grupoDaPerna;
        });
        caixa(corpo, 0.47, 0.22, 0.28, configuracaoDoFazendeiro.calca, 0, 0.87, 0);                 // quadril
        caixa(corpo, 0.5, 0.06, 0.3, 0x3a2414, 0, 0.97, 0);                  // cinto
        caixa(corpo, 0.08, 0.06, 0.02, 0xd9b44a, 0, 0.97, 0.155);            // fivela
        caixa(corpo, 0.5, 0.48, 0.29, materialDaCamisa, 0, 1.24, 0);                // tronco
        caixa(corpo, 0.56, 0.12, 0.3, materialDaCamisa, 0, 1.43, 0);                // ombros
        if (configuracaoDoFazendeiro.colete) {
          caixa(corpo, 0.52, 0.4, 0.31, configuracaoDoFazendeiro.colete, 0, 1.2, 0);
          caixa(corpo, 0.1, 0.4, 0.318, materialDaCamisa, 0, 1.2, 0);               // abertura do colete
          for (let indice = 0; indice < 3; indice++) caixa(corpo, 0.03, 0.03, 0.32, 0x5a3a14, 0, 1.08 + indice * 0.1, 0);
        }
        if (configuracaoDoFazendeiro.macacao) {
          caixa(corpo, 0.34, 0.3, 0.03, configuracaoDoFazendeiro.calca, 0, 1.12, 0.155);            // peitilho
          for (const lado of [-1, 1]) { caixa(corpo, 0.06, 0.34, 0.03, configuracaoDoFazendeiro.calca, lado * 0.14, 1.36, 0.155); caixa(corpo, 0.05, 0.05, 0.035, 0xd9b44a, lado * 0.14, 1.2, 0.17); }
        }
        // braços com pivô no ombro
        const bracos = [-1, 1].map(lado => {
          const grupoDoBraco = new THREE.Group(); grupoDoBraco.position.set(lado * 0.33, 1.4, 0); corpo.add(grupoDoBraco);
          caixa(grupoDoBraco, 0.14, 0.3, 0.16, materialDaCamisa, 0, -0.15, 0);
          if (configuracaoDoFazendeiro.mangaLonga) caixa(grupoDoBraco, 0.13, 0.28, 0.15, materialDaCamisa, 0, -0.43, 0);
          else { caixa(grupoDoBraco, 0.15, 0.05, 0.17, materialDaCamisa, 0, -0.31, 0); caixa(grupoDoBraco, 0.115, 0.26, 0.13, configuracaoDoFazendeiro.pele, 0, -0.45, 0); }
          caixa(grupoDoBraco, 0.11, 0.1, 0.12, configuracaoDoFazendeiro.pele, 0, -0.62, 0);
          return grupoDoBraco;
        });
        cilindro(corpo, 0.06, 0.07, 0.12, configuracaoDoFazendeiro.pele, 0, 1.54, 0);               // pescoço
        const cabeca = new THREE.Group(); cabeca.position.set(0, 1.7, 0); corpo.add(cabeca);
        esfera(cabeca, 0.17, configuracaoDoFazendeiro.pele, 0, 0, 0, 1, 1.08, 1);
        for (const lado of [-1, 1]) {
          esfera(cabeca, 0.035, configuracaoDoFazendeiro.pele, lado * 0.165, 0, 0, 0.6, 1, 1);                              // orelhas
          esfera(cabeca, 0.03, 0xf4f4f0, lado * 0.065, 0.02, 0.14, 1, 0.8, 0.6);                      // olhos (branco)
          esfera(cabeca, 0.018, 0x15110e, lado * 0.065, 0.02, 0.163);                                 // pupilas
          caixa(cabeca, 0.07, 0.014, 0.02, configuracaoDoFazendeiro.cabelo, lado * 0.065, 0.065, 0.155).rotation.z = lado * 0.12; // sobrancelhas
          esfera(cabeca, 0.028, 0xe58f7a, lado * 0.1, -0.045, 0.12, 1, 0.8, 0.5);                    // bochechas
          caixa(cabeca, 0.03, 0.1, 0.07, configuracaoDoFazendeiro.cabelo, lado * 0.163, -0.01, -0.01);                       // costeletas
        }
        caixa(cabeca, 0.04, 0.06, 0.05, peleEscura, 0, -0.015, 0.168);                                // nariz
        caixa(cabeca, 0.075, 0.014, 0.02, 0x7a2f2f, 0, -0.08, 0.155);                                 // boca
        esfera(cabeca, 0.178, configuracaoDoFazendeiro.cabelo, 0, 0.05, -0.025, 1, 0.8, 1);                                  // cabelo
        if (configuracaoDoFazendeiro.barba) { esfera(cabeca, 0.13, configuracaoDoFazendeiro.barba, 0, -0.09, 0.07, 1, 0.8, 0.9); caixa(cabeca, 0.11, 0.03, 0.035, configuracaoDoFazendeiro.barba, 0, -0.05, 0.165); }
        if (configuracaoDoFazendeiro.bigode) { caixa(cabeca, 0.12, 0.03, 0.04, configuracaoDoFazendeiro.bigode, 0, -0.052, 0.165); caixa(cabeca, 0.03, 0.05, 0.03, configuracaoDoFazendeiro.bigode, -0.06, -0.075, 0.16); caixa(cabeca, 0.03, 0.05, 0.03, configuracaoDoFazendeiro.bigode, 0.06, -0.075, 0.16); }
        const chapeu = new THREE.Group(); chapeu.position.set(0, 0.1, 0); cabeca.add(chapeu);
        if (configuracaoDoFazendeiro.chapeu === 'palha') {
          cilindro(chapeu, 0.36, 0.36, 0.03, configuracaoDoFazendeiro.corChapeu, 0, 0.07, 0).rotation.z = 0.04;
          cilindro(chapeu, 0.18, 0.2, 0.16, configuracaoDoFazendeiro.corChapeu, 0, 0.17, 0);
          cilindro(chapeu, 0.205, 0.205, 0.045, configuracaoDoFazendeiro.fita, 0, 0.11, 0);
          cilindro(chapeu, 0.18, 0.18, 0.02, 0xc9a84e, 0, 0.26, 0);
        } else if (configuracaoDoFazendeiro.chapeu === 'vaqueiro') {
          const abaDoChapeu = cilindro(chapeu, 0.33, 0.33, 0.025, configuracaoDoFazendeiro.corChapeu, 0, 0.07, 0); abaDoChapeu.scale.z = 0.9;
          for (const lado of [-1, 1]) caixa(chapeu, 0.14, 0.03, 0.22, configuracaoDoFazendeiro.corChapeu, lado * 0.32, 0.1, 0).rotation.z = lado * 0.5; // abas laterais viradas para cima
          cilindro(chapeu, 0.15, 0.19, 0.18, configuracaoDoFazendeiro.corChapeu, 0, 0.17, 0);
          caixa(chapeu, 0.2, 0.05, 0.1, 0x6a3e22, 0, 0.27, 0);               // vinco do topo
          cilindro(chapeu, 0.195, 0.195, 0.04, configuracaoDoFazendeiro.fita, 0, 0.1, 0);
        } else {
          cilindro(chapeu, 0.42, 0.42, 0.025, configuracaoDoFazendeiro.corChapeu, 0, 0.07, 0).rotation.z = -0.05;
          cilindro(chapeu, 0.14, 0.19, 0.13, configuracaoDoFazendeiro.corChapeu, 0, 0.15, 0);
          cilindro(chapeu, 0.195, 0.195, 0.04, configuracaoDoFazendeiro.fita, 0, 0.1, 0);
        }
        raiz.scale.setScalar(0.8);
        return { raiz, corpo, pernas, bracos, cabeca };
      };

      // ---- Peças de modelagem compartilhadas por fazendeiros e mobs (antes cada um tinha as próprias cópias) ----
      const criarFabricaDePecas = function criarFabricaDePecas() {
        const peca = (objetoPai, geometria, materialDoObjeto, posicaoX, posicaoY, posicaoZ) => { const malha = new THREE.Mesh(geometria, materialDoObjeto); malha.position.set(posicaoX, posicaoY, posicaoZ); malha.castShadow = true; objetoPai.add(malha); return malha; };
        const obterMaterial = cor => typeof cor === 'object' ? cor : material(cor);
        return {
          peca,
          caixa: (objetoPai, largura, altura, profundidade, cor, posicaoX, posicaoY, posicaoZ) => peca(objetoPai, new THREE.BoxGeometry(largura, altura, profundidade), obterMaterial(cor), posicaoX, posicaoY, posicaoZ),
          esfera: (objetoPai, raio, cor, posicaoX, posicaoY, posicaoZ, escalaX = 1, escalaY = 1, escalaZ = 1) => { const malha = peca(objetoPai, new THREE.SphereGeometry(raio, 10, 8), obterMaterial(cor), posicaoX, posicaoY, posicaoZ); malha.scale.set(escalaX, escalaY, escalaZ); return malha; },
          cilindro: (objetoPai, raioDoTopo, raioDaBase, altura, cor, posicaoX, posicaoY, posicaoZ) => peca(objetoPai, new THREE.CylinderGeometry(raioDoTopo, raioDaBase, altura, 12), obterMaterial(cor), posicaoX, posicaoY, posicaoZ),
        };
      };

      // ---- Grade de navegação (usada por fazendeiros e mobs): células livres + A* em 8 direções + endireitamento do trajeto ----
      class GradeDeNavegacao {
        // Divide o terreno em células, marca as bloqueadas (função "bloqueado") e agrupa as livres em regiões
        // conectadas; destinos só são sorteados na mesma região do ponto de partida.
        constructor(xMinimo, zMinimo, xInicial, zInicial, passo, bloqueado) {
          Object.assign(this, { x0: xMinimo, z0: zMinimo, passo, nx: Math.ceil((xInicial - xMinimo) / passo), nz: Math.ceil((zInicial - zMinimo) / passo) });
          const quantidadeDeCelulas = this.n = this.nx * this.nz, componenteDaCelula = new Int32Array(quantidadeDeCelulas).fill(-1);
          this.livreCel = new Uint8Array(quantidadeDeCelulas); this.componentes = [];
          for (let indiceInterno = 0; indiceInterno < this.nz; indiceInterno++) for (let indice = 0; indice < this.nx; indice++) this.livreCel[indiceInterno * this.nx + indice] = bloqueado(xMinimo + (indice + 0.5) * passo, zMinimo + (indiceInterno + 0.5) * passo) ? 0 : 1;
          for (let celulaInicial = 0; celulaInicial < quantidadeDeCelulas; celulaInicial++) {   // componentes conexas: destinos só são sorteados na mesma região do ponto de partida
            if (!this.livreCel[celulaInicial] || componenteDaCelula[celulaInicial] >= 0) continue;
            const idDoComponente = this.componentes.length, lista = [celulaInicial]; componenteDaCelula[celulaInicial] = idDoComponente;
            for (let posicaoNaFila = 0; posicaoNaFila < lista.length; posicaoNaFila++) {
              const celulaAtual = lista[posicaoNaFila], colunaDaCelula = celulaAtual % this.nx, linhaDaCelula = (celulaAtual - colunaDaCelula) / this.nx;
              for (const [variacaoDeColuna, variacaoDeLinha] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                const colunaVizinha = colunaDaCelula + variacaoDeColuna, linhaVizinha = linhaDaCelula + variacaoDeLinha; if (colunaVizinha < 0 || linhaVizinha < 0 || colunaVizinha >= this.nx || linhaVizinha >= this.nz) continue;
                const indiceDoItem = linhaVizinha * this.nx + colunaVizinha; if (this.livreCel[indiceDoItem] && componenteDaCelula[indiceDoItem] < 0) { componenteDaCelula[indiceDoItem] = idDoComponente; lista.push(indiceDoItem); }
              }
            }
            this.componentes.push(lista);
          }
          this.maior = 0; this.componentes.forEach((componente, indice) => { if (componente.length > this.componentes[this.maior].length) this.maior = indice; });
          this.g = new Float32Array(quantidadeDeCelulas); this.pai = new Int32Array(quantidadeDeCelulas); this.marca = new Uint32Array(quantidadeDeCelulas); this.fechado = new Uint8Array(quantidadeDeCelulas); this.carimbo = 0;
        }
        // Índice da célula que contém o ponto (ou -1 se estiver fora da grade).
        celula(posicaoX, posicaoZ) { const coluna = Math.floor((posicaoX - this.x0) / this.passo), linha = Math.floor((posicaoZ - this.z0) / this.passo); return coluna < 0 || linha < 0 || coluna >= this.nx || linha >= this.nz ? -1 : linha * this.nx + coluna; }
        // Coordenadas do centro de uma célula.
        centro(celula) { const coluna = celula % this.nx, linha = (celula - coluna) / this.nx; return [this.x0 + (coluna + 0.5) * this.passo, this.z0 + (linha + 0.5) * this.passo]; }
        // Verdadeiro se o ponto está numa célula livre.
        livre(posicaoX, posicaoZ) { const celula = this.celula(posicaoX, posicaoZ); return celula >= 0 && this.livreCel[celula] === 1; }
        // Células da maior região conectada (onde as personagens andam).
        celulasPrincipais() { return this.componentes[this.maior]; }
        // Verdadeiro se o segmento entre dois pontos passa só por células livres (amostragem a cada 0,2).
        linhaLivre(xInicial, zInicial, xFinal, zFinal) {
          const distancia = Math.hypot(xFinal - xInicial, zFinal - zInicial), quantidadeDePassos = Math.max(1, Math.ceil(distancia / 0.2));
          for (let indice = 1; indice <= quantidadeDePassos; indice++) if (!this.livre(xInicial + (xFinal - xInicial) * indice / quantidadeDePassos, zInicial + (zFinal - zInicial) * indice / quantidadeDePassos)) return false;
          return true;
        }
        // Célula livre (da região principal) mais próxima de um ponto, mesmo que o ponto esteja bloqueado.
        maisProxima(posicaoX, posicaoZ) { // célula livre (da região principal) mais próxima de um ponto, mesmo que ele esteja bloqueado
          let melhor = -1, menorDistancia = 1e9;
          for (const celula of this.celulasPrincipais()) { const [centroX, centroZ] = this.centro(celula), distancia = Math.hypot(centroX - posicaoX, centroZ - posicaoZ); if (distancia < menorDistancia) { menorDistancia = distancia; melhor = celula; } }
          return melhor;
        }
        // Caminho entre dois pontos com A* em 8 direções (sem cortar quinas), depois endireitado por linha de
        // visão. Devolve a lista de pontos ou null.
        acharCaminho(xDoPontoA, zDoPontoA, xDoPontoB, zDoPontoB) {
          const celulaDeOrigem = this.celula(xDoPontoA, zDoPontoA), celulaDeDestino = this.celula(xDoPontoB, zDoPontoB); if (celulaDeOrigem < 0 || celulaDeDestino < 0 || !this.livreCel[celulaDeOrigem] || !this.livreCel[celulaDeDestino]) return null;
          const { nx: celulasEmX, nz: celulasEmZ, g: custoAcumulado, pai: celulaAnterior, marca, fechado, livreCel } = this, carimbo = ++this.carimbo, heap = [];
          const estimativaAteODestino = celula => { const coluna = celula % celulasEmX, linha = (celula - coluna) / celulasEmX, colunaDoDestino = celulaDeDestino % celulasEmX, linhaDoDestino = (celulaDeDestino - colunaDoDestino) / celulasEmX, diferencaX = Math.abs(coluna - colunaDoDestino), diferencaZ = Math.abs(linha - linhaDoDestino); return (diferencaX + diferencaZ) - 0.5858 * Math.min(diferencaX, diferencaZ); };
          const empurrar = (celula, prioridade) => { heap.push([prioridade, celula]); let posicao = heap.length - 1; while (posicao > 0) { const posicaoDoPai = (posicao - 1) >> 1; if (heap[posicaoDoPai][0] <= heap[posicao][0]) break; [heap[posicaoDoPai], heap[posicao]] = [heap[posicao], heap[posicaoDoPai]]; posicao = posicaoDoPai; } };
          const tirar = () => { const topo = heap[0], ultimo = heap.pop(); if (heap.length) { heap[0] = ultimo; let posicao = 0; for (;;) { let menor = posicao; const filhoEsquerdo = 2 * posicao + 1, filhoDireito = filhoEsquerdo + 1; if (filhoEsquerdo < heap.length && heap[filhoEsquerdo][0] < heap[menor][0]) menor = filhoEsquerdo; if (filhoDireito < heap.length && heap[filhoDireito][0] < heap[menor][0]) menor = filhoDireito; if (menor === posicao) break; [heap[menor], heap[posicao]] = [heap[posicao], heap[menor]]; posicao = menor; } } return topo; };
          marca[celulaDeOrigem] = carimbo; custoAcumulado[celulaDeOrigem] = 0; celulaAnterior[celulaDeOrigem] = -1; fechado[celulaDeOrigem] = 0; empurrar(celulaDeOrigem, estimativaAteODestino(celulaDeOrigem));
          let achou = false;
          while (heap.length) {
            const [, celulaAtual] = tirar(); if (fechado[celulaAtual] === 2) continue; fechado[celulaAtual] = 2;
            if (celulaAtual === celulaDeDestino) { achou = true; break; }
            const colunaAtual = celulaAtual % celulasEmX, linhaAtual = (celulaAtual - colunaAtual) / celulasEmX;
            for (let variacaoDeColuna = -1; variacaoDeColuna <= 1; variacaoDeColuna++) for (let variacaoDeLinha = -1; variacaoDeLinha <= 1; variacaoDeLinha++) {
              if (!variacaoDeColuna && !variacaoDeLinha) continue; const colunaVizinha = colunaAtual + variacaoDeColuna, linhaVizinha = linhaAtual + variacaoDeLinha; if (colunaVizinha < 0 || linhaVizinha < 0 || colunaVizinha >= celulasEmX || linhaVizinha >= celulasEmZ) continue;
              const indiceDoItem = linhaVizinha * celulasEmX + colunaVizinha; if (!livreCel[indiceDoItem]) continue;
              if (variacaoDeColuna && variacaoDeLinha && (!livreCel[linhaAtual * celulasEmX + colunaVizinha] || !livreCel[linhaVizinha * celulasEmX + colunaAtual])) continue;   // sem cortar quinas
              const novoCusto = custoAcumulado[celulaAtual] + (variacaoDeColuna && variacaoDeLinha ? 1.4142 : 1);
              if (marca[indiceDoItem] !== carimbo) { marca[indiceDoItem] = carimbo; fechado[indiceDoItem] = 0; custoAcumulado[indiceDoItem] = 1e9; }
              if (novoCusto < custoAcumulado[indiceDoItem]) { custoAcumulado[indiceDoItem] = novoCusto; celulaAnterior[indiceDoItem] = celulaAtual; empurrar(indiceDoItem, novoCusto + estimativaAteODestino(indiceDoItem)); }
            }
          }
          if (!achou) return null;
          const celulas = []; for (let celula = celulaDeDestino; celula !== -1; celula = celulaAnterior[celula]) celulas.push(celula); celulas.reverse();
          const pontos = celulas.map(celula => this.centro(celula)); pontos[0] = [xDoPontoA, zDoPontoA]; pontos[pontos.length - 1] = [xDoPontoB, zDoPontoB];
          const caminhoEndireitado = [pontos[0]]; let indice = 0;
          while (indice < pontos.length - 1) { let indiceInterno = pontos.length - 1; while (indiceInterno > indice + 1 && !this.linhaLivre(pontos[indice][0], pontos[indice][1], pontos[indiceInterno][0], pontos[indiceInterno][1])) indiceInterno--; caminhoEndireitado.push(pontos[indiceInterno]); indice = indiceInterno; }
          return caminhoEndireitado.slice(1);
        }
      }
      // Quem pode andar onde: tudo que está registrado em COLISOES (menos estradas, que são caminhos) e o rio
      const NAO_BLOQUEIAM_PESSOAS = ['estrada', 'clareira'];
      const GRADE_DAS_PESSOAS = new GradeDeNavegacao(-26, -23, 55, 53, 0.6, (posicaoX, posicaoZ) =>
        posicaoX < -25 || posicaoX > 55 || posicaoZ < -22.5 || posicaoZ > 52.5 || COLISOES.bloqueia(posicaoX, posicaoZ, 0.5, NAO_BLOQUEIAM_PESSOAS) || COLISOES.rio(posicaoX, posicaoZ, 5.2));
      // ---- Comportamento: caminhar até um destino, parar, olhar em volta, escolher outro caminho ----
      const normalizarAngulo = angulo => { while (angulo > Math.PI) angulo -= 2 * Math.PI; while (angulo < -Math.PI) angulo += 2 * Math.PI; return angulo; };
      // Mark 8.2: a equipe é só o fazendeiro inicial e os contratados (seção 29). Os três fazendeiros decorativos gratuitos não
      // são mais criados (QUANTIDADE_DE_FAZENDEIROS_DECORATIVOS = 0); o modelo e a navegação abaixo continuam em uso.
      const QUANTIDADE_DE_FAZENDEIROS_DECORATIVOS = 0;
      const fazendeiros = FAZENDEIROS.slice(0, QUANTIDADE_DE_FAZENDEIROS_DECORATIVOS).map((configuracao, indiceDoFazendeiro) => {
        const modelo = criarFazendeiro(configuracao), inicio = GRADE_DAS_PESSOAS.maisProxima(configuracao.inicio[0], configuracao.inicio[1]), [posicaoX, posicaoZ] = GRADE_DAS_PESSOAS.centro(inicio);
        cena.add(modelo.raiz);
        return { ...modelo, cfg: configuracao, x: posicaoX, z: posicaoZ, rot: Math.random() * 6.28, vel: 0, velAlvo: 0, velMax: configuracao.velocidade, estado: 'parado', espera: 1 + indiceDoFazendeiro * 1.3, caminho: [], indice: 0,
                 passo: 0, olhar: 0, olharAlvo: 0, olharEm: 1, fase: indiceDoFazendeiro * 2.1, ultimaX: posicaoX, ultimaZ: posicaoZ, relogioDeTravamento: 0 };
      });
      // Sorteia um destino alcançável (metade das vezes sobre os caminhos de terra) e calcula o trajeto com A*.
      // Se não achar, espera um pouco e tenta de novo.
      const planejarCaminho = function planejarCaminho(fazendeiro) {
        const lista = GRADE_DAS_PESSOAS.celulasPrincipais();
        for (let tentativa = 0; tentativa < 14; tentativa++) {
          const [diferencaX, diferencaZ] = GRADE_DAS_PESSOAS.centro(lista[Math.floor(Math.random() * lista.length)]);
          if (Math.hypot(diferencaX - fazendeiro.x, diferencaZ - fazendeiro.z) < 7) continue;
          if (Math.random() < 0.55 && !estaSobreCaminho(diferencaX, diferencaZ, -0.3)) continue;                // metade das viagens prefere os caminhos de terra
          const caminho = GRADE_DAS_PESSOAS.acharCaminho(fazendeiro.x, fazendeiro.z, diferencaX, diferencaZ);
          if (caminho && caminho.length) { fazendeiro.caminho = caminho; fazendeiro.indice = 0; fazendeiro.estado = 'andando'; fazendeiro.relogioDeTravamento = 0; fazendeiro.ultimaX = fazendeiro.x; fazendeiro.ultimaZ = fazendeiro.z; return; }
        }
        fazendeiro.espera = 1;
      };
      // Máquina de estados dos fazendeiros: parado (olha em volta) → anda pelo trajeto (gira aos poucos,
      // acelera/freia) → para. Não atravessa células bloqueadas, replaneja se travar e se afasta de outros
      // fazendeiros.
      const atualizarFazendeiros = function atualizarFazendeiros(segundosDesdeUltimoFrame, tempo) {
        for (const fazendeiro of fazendeiros) {
          if (fazendeiro.estado === 'parado') {
            fazendeiro.velAlvo = 0; fazendeiro.espera -= segundosDesdeUltimoFrame; fazendeiro.olharEm -= segundosDesdeUltimoFrame;
            if (fazendeiro.olharEm <= 0) { fazendeiro.olharAlvo = (Math.random() - 0.5) * 1.2; fazendeiro.olharEm = 1 + Math.random() * 2.2; }
            if (fazendeiro.espera <= 0) { if (fazendeiro.retomar) { fazendeiro.retomar = false; fazendeiro.estado = 'andando'; } else planejarCaminho(fazendeiro); }
          } else {
            let alvo = fazendeiro.caminho[fazendeiro.indice];
            if (Math.hypot(alvo[0] - fazendeiro.x, alvo[1] - fazendeiro.z) < 0.3) {
              fazendeiro.indice++;
              if (fazendeiro.indice >= fazendeiro.caminho.length) { fazendeiro.estado = 'parado'; fazendeiro.espera = 2 + Math.random() * 5; fazendeiro.olharAlvo = 0; }
              else if (Math.random() < 0.08) { fazendeiro.estado = 'parado'; fazendeiro.espera = 0.8 + Math.random() * 1.6; fazendeiro.caminho = fazendeiro.caminho.slice(fazendeiro.indice); fazendeiro.indice = 0; fazendeiro.retomar = true; }
            } else {
              const diferencaDeAngulo = normalizarAngulo(Math.atan2(alvo[0] - fazendeiro.x, alvo[1] - fazendeiro.z) - fazendeiro.rot);
              fazendeiro.rot += Math.max(-3.4 * segundosDesdeUltimoFrame, Math.min(3.4 * segundosDesdeUltimoFrame, diferencaDeAngulo));                               // gira gradualmente
              fazendeiro.velAlvo = fazendeiro.velMax * Math.max(0, Math.cos(Math.min(Math.abs(diferencaDeAngulo), 1.5)));          // curva fechada: quase para e gira
              fazendeiro.olharAlvo = Math.max(-0.5, Math.min(0.5, diferencaDeAngulo * 0.5));
            }
            fazendeiro.relogioDeTravamento += segundosDesdeUltimoFrame;
            if (fazendeiro.relogioDeTravamento > 3) {                                                          // não saiu do lugar: escolhe outro caminho
              if (Math.hypot(fazendeiro.x - fazendeiro.ultimaX, fazendeiro.z - fazendeiro.ultimaZ) < 0.4) { fazendeiro.estado = 'parado'; fazendeiro.espera = 0.2; }
              fazendeiro.relogioDeTravamento = 0; fazendeiro.ultimaX = fazendeiro.x; fazendeiro.ultimaZ = fazendeiro.z;
            }
          }
          fazendeiro.vel += Math.max(-4 * segundosDesdeUltimoFrame, Math.min(3 * segundosDesdeUltimoFrame, fazendeiro.velAlvo - fazendeiro.vel));                          // acelera e freia suavemente
          if (fazendeiro.vel > 0.001) {
            const passo = fazendeiro.vel * segundosDesdeUltimoFrame, celulasEmX = fazendeiro.x + Math.sin(fazendeiro.rot) * passo, celulasEmZ = fazendeiro.z + Math.cos(fazendeiro.rot) * passo;
            if (GRADE_DAS_PESSOAS.livre(celulasEmX, celulasEmZ)) { fazendeiro.x = celulasEmX; fazendeiro.z = celulasEmZ; }
            else if (GRADE_DAS_PESSOAS.livre(celulasEmX, fazendeiro.z)) fazendeiro.x = celulasEmX;
            else if (GRADE_DAS_PESSOAS.livre(fazendeiro.x, celulasEmZ)) fazendeiro.z = celulasEmZ;
            else { fazendeiro.vel = 0; fazendeiro.estado = 'parado'; fazendeiro.espera = 0.3; fazendeiro.retomar = false; }
          }
          for (const outroFazendeiro of fazendeiros) {                                                              // não se sobrepõem uns aos outros
            if (outroFazendeiro === fazendeiro) continue; const distancia = Math.hypot(fazendeiro.x - outroFazendeiro.x, fazendeiro.z - outroFazendeiro.z);
            if (distancia < 0.9 && distancia > 0.001) { const posicaoX = fazendeiro.x + (fazendeiro.x - outroFazendeiro.x) / distancia * 0.8 * segundosDesdeUltimoFrame, posicaoZ = fazendeiro.z + (fazendeiro.z - outroFazendeiro.z) / distancia * 0.8 * segundosDesdeUltimoFrame; if (GRADE_DAS_PESSOAS.livre(posicaoX, posicaoZ)) { fazendeiro.x = posicaoX; fazendeiro.z = posicaoZ; } }
          }
          // pose: pernas e braços acompanham a passada; parado, só respira e olha em volta
          const amplitudeDoPasso = Math.min(1, fazendeiro.vel / fazendeiro.velMax); fazendeiro.passo += fazendeiro.vel * segundosDesdeUltimoFrame * 3.9;
          const balancoDaPassada = Math.sin(fazendeiro.passo) * 0.72 * amplitudeDoPasso;
          fazendeiro.pernas[0].rotation.x = balancoDaPassada; fazendeiro.pernas[1].rotation.x = -balancoDaPassada; fazendeiro.bracos[0].rotation.x = -balancoDaPassada * 0.85; fazendeiro.bracos[1].rotation.x = balancoDaPassada * 0.85;
          fazendeiro.corpo.position.y = Math.abs(Math.sin(fazendeiro.passo)) * 0.04 * amplitudeDoPasso; fazendeiro.corpo.rotation.y = Math.sin(fazendeiro.passo) * 0.08 * amplitudeDoPasso; fazendeiro.corpo.rotation.z = Math.sin(fazendeiro.passo) * 0.025 * amplitudeDoPasso;
          fazendeiro.corpo.scale.y = 1 + Math.sin(tempo * 2 + fazendeiro.fase) * 0.008 * (1 - amplitudeDoPasso);
          fazendeiro.olhar += (fazendeiro.olharAlvo - fazendeiro.olhar) * Math.min(1, segundosDesdeUltimoFrame * 3); fazendeiro.cabeca.rotation.y = fazendeiro.olhar;
          fazendeiro.raiz.position.set(fazendeiro.x, 0, fazendeiro.z); fazendeiro.raiz.rotation.y = fazendeiro.rot;
        }
      };

      arquivoDaMontagemConcluido('22-fazendeiros-e-navegacao.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
