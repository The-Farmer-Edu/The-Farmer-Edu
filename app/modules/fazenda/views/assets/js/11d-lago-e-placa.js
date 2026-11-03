      // ====================================================================================================
      // FARMEDU 3D — 11d-lago-e-placa.js (Fase 3B da refatoração: seção 11 — lago e placa)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // (antigo) Detalhes naturais da floresta — substituído pela vegetação instanciada acima.
      // ---- Lago em destaque: margem irregular, chafariz animado, vitórias-régias, ondulações, pedras, juncos e flores ----
      // Fica no centro da praça central (seção 10) e usa o mesmo contorno ondulado do jardim (LAGO_DA_PRACA). Mudou só a posição:
      // tamanho, chafariz, animações e a sequência de sorteios continuam os mesmos.
      const lagoDestaque = function lagoDestaque(centroX, centroZ) {
        const raioNoEixoX = LAGO_DA_PRACA.raioX, raioNoEixoZ = LAGO_DA_PRACA.raioZ, grupoDoLago = new THREE.Group();
        grupoDoLago.position.set(centroX, 0, centroZ); grupoDoLago.userData.nome = 'lago-do-chafariz'; cena.add(grupoDoLago);
        const raio = LAGO_DA_PRACA.contorno; // contorno natural
        // A forma é desenhada no plano XY e depois deitada (rotation.x = −π/2), o que inverte o eixo Z. Por isso o "y" da forma
        // usa −seno: assim a água segue o MESMO contorno que as pedras, juncos e plantas da margem (posicionados direto no mundo).
        const contorno = escalaDoContorno => { const forma = new THREE.Shape(); for (let indice = 0; indice <= 48; indice++) { const angulo = indice / 48 * Math.PI * 2, raioDoPonto = raio(angulo) * escalaDoContorno, posicaoX = Math.cos(angulo) * raioNoEixoX * raioDoPonto, posicaoY = -Math.sin(angulo) * raioNoEixoZ * raioDoPonto; if (indice) forma.lineTo(posicaoX, posicaoY); else forma.moveTo(posicaoX, posicaoY); } return forma; };
        const lamina = (escalaDoContorno, cor, posicaoY, opacidade = 1) => { const malha = new THREE.Mesh(new THREE.ShapeGeometry(contorno(escalaDoContorno)), new THREE.MeshLambertMaterial({ color: cor, transparent: opacidade < 1, opacity: opacidade })); malha.rotation.x = -Math.PI / 2; malha.position.y = posicaoY; malha.receiveShadow = true; grupoDoLago.add(malha); };
        lamina(1.2, 0xb9a36a, 0.05);        // lama/areia úmida na borda
        lamina(1.0, 0x7fd6e6, 0.08, 0.95);  // água rasa
        lamina(0.72, 0x3f9fc8, 0.11, 0.95); // água funda
        const plano = (geometria, materialDoObjeto, posicaoX, posicaoY, posicaoZ) => { const malha = new THREE.Mesh(geometria, materialDoObjeto); malha.rotation.x = -Math.PI / 2; malha.position.set(posicaoX, posicaoY, posicaoZ); grupoDoLago.add(malha); return malha; };
        // reflexos (riscos claros que pulsam) e ondulações (anéis que se expandem)
        const brilhos = [], aneis = [];
        for (let indice = 0; indice < 7; indice++) {
          const angulo = numeroAleatorioDoCenario() * 6.28, raioDoPonto = 0.25 + numeroAleatorioDoCenario() * 0.45;
          const malha = plano(new THREE.PlaneGeometry(0.5 + numeroAleatorioDoCenario() * 0.7, 0.05), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }), Math.cos(angulo) * raioNoEixoX * raioDoPonto, 0.125, Math.sin(angulo) * raioNoEixoZ * raioDoPonto);
          malha.rotation.z = numeroAleatorioDoCenario() * 3; brilhos.push(malha);
        }
        const anel = (posicaoX, posicaoZ, escalaInicial, escalaFinal, velocidade, fase) => aneis.push([plano(new THREE.RingGeometry(0.92, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, side: THREE.DoubleSide }), posicaoX, 0.14, posicaoZ), escalaInicial, escalaFinal, velocidade, fase]);
        for (let indice = 0; indice < 3; indice++) anel(0, 0, 1.8, 3.8, 0.3, indice / 3);
        [[-3, 1.2], [2.6, -1.4], [-1.2, -2.2]].forEach(([posicaoX, posicaoZ], indice) => anel(posicaoX, posicaoZ, 0.3, 1, 0.22, indice * 0.33));
        for (const [malhaDoAnel] of aneis) malhaDoAnel.userData.animado = true;   // a escala muda a cada quadro (não congelar a matriz)
        animacoesDoCenario.push(tempoDecorrido => {
          for (const [malha, escalaInicial, escalaFinal, velocidadeDoAnel, fase] of aneis) { const progresso = (tempoDecorrido * velocidadeDoAnel + fase) % 1, escalaAtual = escalaInicial + (escalaFinal - escalaInicial) * progresso; malha.scale.set(escalaAtual, escalaAtual, 1); malha.material.opacity = 0.45 * (1 - progresso); }
          brilhos.forEach((malha, indice) => { malha.material.opacity = 0.12 + 0.3 * Math.max(0, Math.sin(tempoDecorrido * 1.6 + indice * 2.1)); });
        });

        // chafariz: bacia de pedra, pedestal, taça superior e jatos (gotas instanciadas, animação leve)
        const corDaPedra = 0x9a9a90, clara = 0xb8b8ac;
        criarCilindro(1.6, 1.7, 0.55, corDaPedra, 0, 0.28, 0, grupoDoLago, 12);
        const aroDaBacia = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.1, 6, 16), material(clara)); aroDaBacia.rotation.x = Math.PI / 2; aroDaBacia.position.y = 0.56; grupoDoLago.add(aroDaBacia);
        criarCilindro(1.4, 1.4, 0.05, 0x7fe0f0, 0, 0.56, 0, grupoDoLago, 16);
        criarCilindro(0.3, 0.42, 0.9, corDaPedra, 0, 0.95, 0, grupoDoLago, 8);
        criarCilindro(0.8, 0.5, 0.24, clara, 0, 1.5, 0, grupoDoLago, 10);
        criarCilindro(0.68, 0.68, 0.05, 0x7fe0f0, 0, 1.63, 0, grupoDoLago, 12);
        criarCilindro(0.1, 0.18, 0.35, corDaPedra, 0, 1.8, 0, grupoDoLago, 8); criarEsfera(0.16, clara, 0, 2.02, 0, grupoDoLago);
        const gotas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 5), new THREE.MeshBasicMaterial({ color: 0xd8f4ff, transparent: true, opacity: 0.85 }), 48);
        gotas.frustumCulled = false; grupoDoLago.add(gotas);
        const objetoAuxiliar = new THREE.Object3D();
        animacoesDoCenario.push(tempoDecorrido => {
          let indice = 0;
          for (let indiceDoJato = 0; indiceDoJato < 8; indiceDoJato++) for (let indiceDaGota = 0; indiceDaGota < 5; indiceDaGota++) {      // oito jatos em arco
            const progresso = (tempoDecorrido * 0.55 + indiceDaGota / 5 + indiceDoJato * 0.05) % 1, angulo = indiceDoJato * Math.PI / 4, alcance = 1.35 * progresso;
            objetoAuxiliar.position.set(Math.cos(angulo) * alcance, 2.0 + 1.5 * progresso - 3.0 * progresso * progresso, Math.sin(angulo) * alcance); objetoAuxiliar.scale.setScalar(1 - progresso * 0.3); objetoAuxiliar.updateMatrix(); gotas.setMatrixAt(indice++, objetoAuxiliar.matrix);
          }
          for (let indiceDaGota = 0; indiceDaGota < 8; indiceDaGota++) {                                   // jato central
            const progresso = (tempoDecorrido * 0.8 + indiceDaGota / 8) % 1;
            objetoAuxiliar.position.set(Math.sin(indiceDaGota * 2.4) * 0.04, 2.1 + 1.3 * Math.sin(progresso * Math.PI), Math.cos(indiceDaGota * 2.4) * 0.04); objetoAuxiliar.scale.setScalar(1.1 - progresso * 0.4); objetoAuxiliar.updateMatrix(); gotas.setMatrixAt(indice++, objetoAuxiliar.matrix);
          }
          gotas.instanceMatrix.needsUpdate = true;
        });

        // vitórias-régias (instanciadas), algumas com flor
        const disco = new THREE.CircleGeometry(1, 14); disco.rotateX(-Math.PI / 2);
        const folhasDaVitoriaRegia = [], flores = [];
        for (let tentativas = 0; tentativas < 300 && folhasDaVitoriaRegia.length < 15; tentativas++) {
          const angulo = numeroAleatorioDoCenario() * 6.283, distanciaRelativa = Math.sqrt(numeroAleatorioDoCenario()) * 0.72, deslocamentoX = Math.cos(angulo) * raioNoEixoX * distanciaRelativa, deslocamentoZ = Math.sin(angulo) * raioNoEixoZ * distanciaRelativa;
          if (Math.hypot(deslocamentoX, deslocamentoZ) < 2.3 || folhasDaVitoriaRegia.some(vitoriaRegia => Math.hypot(vitoriaRegia[0] - centroX - deslocamentoX, vitoriaRegia[2] - centroZ - deslocamentoZ) < 1.05)) continue;
          const tamanho = 0.32 + numeroAleatorioDoCenario() * 0.38;
          folhasDaVitoriaRegia.push([centroX + deslocamentoX, 0.16, centroZ + deslocamentoZ, tamanho, 1, tamanho, escolher([0x3f9a46, 0x4aa84f, 0x58b258]), numeroAleatorioDoCenario() * 6, 0]);
          if (folhasDaVitoriaRegia.length <= 6) flores.push([centroX + deslocamentoX, 0.21, centroZ + deslocamentoZ, 0.11, 0.08, 0.11, escolher([0xff9fc4, 0xffffff, 0xf7c6de]), 0, 0]);
        }
        malhaInstanciada(disco, folhasDaVitoriaRegia, materialBranco, false); malhaInstanciada(new THREE.SphereGeometry(1, 6, 4), flores, materialBranco, false);

        // margem: pedras variadas, juncos, arbustinhos e flores; abre uma "praia" na direção da praça
        const foraDaPraca = angulo => Math.abs(Math.atan2(Math.sin(angulo - 4.44), Math.cos(angulo - 4.44))) > 0.5;
        const rochas = [], hastes = [], pontas = [], verdes = [], floresMargem = [];
        for (let indice = 0; indice < 46; indice++) {
          const angulo = indice / 46 * 6.283 + (numeroAleatorioDoCenario() - 0.5) * 0.12; if (!foraDaPraca(angulo)) continue;
          const distanciaRelativa = raio(angulo) * (1.06 + numeroAleatorioDoCenario() * 0.14), tamanho = 0.16 + numeroAleatorioDoCenario() * numeroAleatorioDoCenario() * 0.45;
          rochas.push([centroX + Math.cos(angulo) * raioNoEixoX * distanciaRelativa, tamanho * 0.35, centroZ + Math.sin(angulo) * raioNoEixoZ * distanciaRelativa, tamanho * (0.9 + numeroAleatorioDoCenario() * 0.6), tamanho * (0.55 + numeroAleatorioDoCenario() * 0.4), tamanho * (0.9 + numeroAleatorioDoCenario() * 0.6), escolher([0x777b78, 0x8a8d86, 0x686d69, 0x9a9c94]), numeroAleatorioDoCenario() * 3, 0]);
        }
        for (let indiceDoGrupo = 0; indiceDoGrupo < 9; indiceDoGrupo++) {
          const anguloDoGrupo = numeroAleatorioDoCenario() * 6.283; if (!foraDaPraca(anguloDoGrupo)) continue;
          for (let indiceDoJunco = 0; indiceDoJunco < 5; indiceDoJunco++) {
            const angulo = anguloDoGrupo + (numeroAleatorioDoCenario() - 0.5) * 0.25, distanciaRelativa = raio(angulo) * (1.04 + numeroAleatorioDoCenario() * 0.14), posicaoX = centroX + Math.cos(angulo) * raioNoEixoX * distanciaRelativa, posicaoZ = centroZ + Math.sin(angulo) * raioNoEixoZ * distanciaRelativa, altura = 0.9 + numeroAleatorioDoCenario() * 0.7;
            hastes.push([posicaoX, 0, posicaoZ, 1.2, altura, 1.2, escolher([0x5f8f3a, 0x6fa244]), numeroAleatorioDoCenario() * 3, (numeroAleatorioDoCenario() - 0.5) * 0.25]);
            pontas.push([posicaoX, altura - 0.12, posicaoZ, 1, 1, 1, 0x6b4a2b, 0, 0]);
          }
        }
        for (let indice = 0; indice < 9; indice++) {
          const angulo = numeroAleatorioDoCenario() * 6.283; if (!foraDaPraca(angulo)) continue;
          const distanciaRelativa = raio(angulo) * (1.33 + numeroAleatorioDoCenario() * 0.15), tamanho = 0.3 + numeroAleatorioDoCenario() * 0.3; // dentro do jardim (antes ia até 1,6 e invadiria o piso)
          verdes.push([centroX + Math.cos(angulo) * raioNoEixoX * distanciaRelativa, tamanho * 0.5, centroZ + Math.sin(angulo) * raioNoEixoZ * distanciaRelativa, tamanho * 1.2, tamanho * 0.7, tamanho * 1.2, escolher([0x3f8a35, 0x4a9e3a, 0x5aa844]), numeroAleatorioDoCenario() * 3, 0]);
        }
        for (let indice = 0; indice < 28; indice++) {
          const angulo = numeroAleatorioDoCenario() * 6.283; if (!foraDaPraca(angulo)) continue;
          const distanciaRelativa = raio(angulo) * (1.2 + numeroAleatorioDoCenario() * 0.35), posicaoX = centroX + Math.cos(angulo) * raioNoEixoX * distanciaRelativa, posicaoZ = centroZ + Math.sin(angulo) * raioNoEixoZ * distanciaRelativa, altura = 0.25 + numeroAleatorioDoCenario() * 0.2;
          hastes.push([posicaoX, 0, posicaoZ, 0.8, altura, 0.8, 0x4f9e3a, 0, 0]);
          floresMargem.push([posicaoX, altura, posicaoZ, 0.08, 0.08, 0.08, escolher([0xffffff, 0xffd23f, 0xff8fb1, 0xb48cf2]), 0, 0]);
        }
        const haste = new THREE.BoxGeometry(0.05, 1, 0.04); haste.translate(0, 0.5, 0);
        const espiga = new THREE.BoxGeometry(0.08, 0.28, 0.08); espiga.translate(0, 0.14, 0);
        malhaInstanciada(new THREE.DodecahedronGeometry(1), rochas, materialBranco, false); malhaInstanciada(haste, hastes, materialBranco, false); malhaInstanciada(espiga, pontas, materialBranco, false);
        malhaInstanciada(new THREE.SphereGeometry(1, 8, 6), verdes, materialBranco, false); malhaInstanciada(new THREE.SphereGeometry(1, 6, 4), floresMargem, materialBranco, false);
      };
      lagoDestaque(PRACA_CENTRAL.x, PRACA_CENTRAL.z);   // o chafariz é o centro visual da praça central

      // ---- Placa de boas-vindas: dois mourões, tábuas e moldura de madeira; o texto é uma textura aplicada na face frontal ----
      // ---- Placa de boas-vindas com o nome da fazenda (Mark 8.3) ----
      // O texto é "BEM-VINDO À" + nome escolhido pelo jogador (estado.nomeDaFazenda). O canvas é redesenhado quando o nome muda
      // (atualizarTextoDaPlaca), sem reconstruir a placa. À noite o texto ganha brilho próprio (emissivo, seção 20) e dois
      // lampiões iluminam o quadro; de dia a placa fica com a aparência natural de madeira.
      const placaDeBoasVindas = { canvas: null, textura: null, materialDoTexto: null };
      const desenharTextoDaPlaca = function desenharTextoDaPlaca() {
        const contexto2d = placaDeBoasVindas.canvas.getContext('2d'), nome = (estado.nomeDaFazenda || NOME_PADRAO_DA_FAZENDA).toLocaleUpperCase('pt-BR');
        contexto2d.fillStyle = '#a9743f'; contexto2d.fillRect(0, 0, 1024, 400);
        for (let indice = 0; indice < 5; indice++) { contexto2d.fillStyle = indice % 2 ? '#a06b38' : '#b27c46'; contexto2d.fillRect(0, indice * 80, 1024, 78); contexto2d.fillStyle = 'rgba(60,35,15,0.35)'; contexto2d.fillRect(0, indice * 80 + 78, 1024, 3); }
        contexto2d.strokeStyle = '#5e3b1e'; contexto2d.lineWidth = 18; contexto2d.strokeRect(9, 9, 1006, 382);
        contexto2d.textAlign = 'center'; contexto2d.textBaseline = 'middle'; contexto2d.lineJoin = 'round';
        const fonte = tamanhoDaFonte => `900 ${tamanhoDaFonte}px "Arial Black", Impact, Arial, sans-serif`;
        const escreverLinha = (texto, posicaoY, tamanho, larguraMaxima = 930) => {
          contexto2d.font = fonte(tamanho);
          while (contexto2d.measureText(texto).width > larguraMaxima && tamanho > 30) { tamanho -= 3; contexto2d.font = fonte(tamanho); }   // sempre cabe
          contexto2d.lineWidth = tamanho * 0.16; contexto2d.strokeStyle = '#3b2410'; contexto2d.strokeText(texto, 512, posicaoY);
          contexto2d.fillStyle = '#fff3cf'; contexto2d.fillText(texto, 512, posicaoY);
        };
        escreverLinha('BEM-VINDO À', 104, 104);
        // nome curto: uma linha grande; nome longo: quebra em duas linhas pelo espaço mais próximo do meio
        contexto2d.font = fonte(150);
        if (contexto2d.measureText(nome).width <= 930 * 1.35 || !nome.includes(' ')) escreverLinha(nome, 270, 150);
        else {
          const palavras = nome.split(' '); let melhor = 1, menorDiferenca = Infinity;
          for (let corte = 1; corte < palavras.length; corte++) { const diferenca = Math.abs(palavras.slice(0, corte).join(' ').length - palavras.slice(corte).join(' ').length); if (diferenca < menorDiferenca) { menorDiferenca = diferenca; melhor = corte; } }
          escreverLinha(palavras.slice(0, melhor).join(' '), 222, 96); escreverLinha(palavras.slice(melhor).join(' '), 318, 96);
        }
        placaDeBoasVindas.textura.needsUpdate = true;
      };
      const construirPlacaDeBoasVindas = function construirPlacaDeBoasVindas(posicaoX, posicaoZ) {
        const grupoDaPlaca = new THREE.Group();
        grupoDaPlaca.position.set(posicaoX, 0, posicaoZ); grupoDaPlaca.scale.setScalar(1.2);
        grupoDaPlaca.rotation.y = Math.atan2(-11.5 - posicaoX, 62 - posicaoZ); // de frente para a câmera inicial
        cena.add(grupoDaPlaca);
        placaDeBoasVindas.canvas = document.createElement('canvas'); placaDeBoasVindas.canvas.width = 1024; placaDeBoasVindas.canvas.height = 400;
        placaDeBoasVindas.textura = new THREE.CanvasTexture(placaDeBoasVindas.canvas);
        desenharTextoDaPlaca();
        const larguraDoQuadro = 7.4, alturaDoQuadro = 2.9, alturaDoCentro = 2.55;
        for (const lado of [-1, 1]) {
          criarCaixa(0.28, 3.7, 0.28, 0x6b4226, lado * 3.3, 1.85, 0, grupoDaPlaca);          // mourão
          criarCaixa(0.7, 0.3, 0.7, 0x8a8d86, lado * 3.3, 0.15, 0, grupoDaPlaca);            // sapata de pedra
          criarEsfera(0.2, 0xc98a4a, lado * 3.3, 3.8, 0, grupoDaPlaca);
          // lampião em braço de ferro saindo do mourão, voltado para o quadro (acende com o ciclo, como os postes)
          criarCaixa(0.6, 0.05, 0.05, 0x2c2a2e, lado * 3.55, 3.55, 0.45, grupoDaPlaca).rotation.y = lado * 0.6;
          criarCabecaDeLampiao(grupoDaPlaca, lado * 3.8, 3.3, 0.75, { escala: 0.9 });
        }
        criarCaixa(larguraDoQuadro, alturaDoQuadro, 0.16, 0x8a5a2b, 0, alturaDoCentro, 0.22, grupoDaPlaca);                        // tabuleiro (encostado na frente dos mourões)
        for (const deslocamentoY of [-1, 1]) criarCaixa(larguraDoQuadro + 0.3, 0.2, 0.26, 0x5e3b1e, 0, alturaDoCentro + deslocamentoY * (alturaDoQuadro / 2 + 0.05), 0.22, grupoDaPlaca); // moldura
        // texto: mesma textura como cor e como brilho próprio (emissiveIntensity 0 de dia → legível à noite, seção 20)
        placaDeBoasVindas.materialDoTexto = new THREE.MeshLambertMaterial({ map: placaDeBoasVindas.textura, emissive: 0xffffff, emissiveMap: placaDeBoasVindas.textura, emissiveIntensity: 0 });
        const texto = new THREE.Mesh(new THREE.PlaneGeometry(larguraDoQuadro - 0.3, (larguraDoQuadro - 0.3) * 400 / 1024), placaDeBoasVindas.materialDoTexto);
        texto.position.set(0, alturaDoCentro, 0.31); grupoDaPlaca.add(texto);
        criarManchaDeLuzNoChao(grupoDaPlaca, materialDoBrilhoNoChao, 0, 0.05, 1.6, 7.5, 2.6);                                     // luz dos lampiões no gramado à frente
        // canteiros de flores nos pés da placa (posições fixas, sem sorteio)
        for (const lado of [-1, 1]) {
          criarEsfera(0.34, 0x4a9e3a, lado * 3.3, 0.22, 0.75, grupoDaPlaca, 0.7); criarEsfera(0.26, 0x3f8a35, lado * 3.8, 0.17, 0.5, grupoDaPlaca, 0.7);
          [[-0.45, 0.95, 0xff8fb1], [0.35, 1.0, 0xffd23f], [0, 0.6, 0xffffff], [0.7, 0.7, 0xb48cf2], [-0.2, 1.25, 0xff6b6b]].forEach(([deslocamentoX, deslocamentoZ, cor]) => criarEsfera(0.1, cor, lado * 3.3 + deslocamentoX, 0.38, deslocamentoZ, grupoDaPlaca));
        }
      };
      construirPlacaDeBoasVindas(PLACA.x, PLACA.z);

      arquivoDaMontagemConcluido('11d-lago-e-placa.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
