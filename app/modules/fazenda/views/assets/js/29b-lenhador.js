// ====================================================================================================
// FARMEDU 3D — 29b-lenhador.js
// SEÇÃO 29b — LENHADOR E ACAMPAMENTO DE EXPLORAÇÃO MADEIREIRA
// O lenhador é um NPC independente: NÃO entra em estado.trabalhadores, não ocupa vagas da casa, não luta, não é alvo de monstros
// nem de invasões. Ele fica PARADO no posto de trabalho do acampamento (ACAMPAMENTO_DO_LENHADOR, seção 09), na floresta depois
// da ponte, fora da grade de navegação da equipe. Só anda quando o jogador pede uma coleta, e só dentro do acampamento.
// Ciclo de uma coleta (máquina de estados em lenhador.fase):
//   parado → indo (até a árvore escolhida) → cortando (golpes de machado) → derrubando (a árvore tomba; a madeira é creditada
//   UMA vez e a árvore vira toco) → voltando (com uma tora no ombro) → parado no posto.
// Cada árvore guarda em estado.arvoresColetaveis[id] o instante (relógio do jogo) em que rebrota: recarregar a página mantém
// os tocos e os tempos. A madeira coletada respeita LENHADOR_CONFIG.limiteDiarioDeMadeira mais a reserva de 1 dia (estado.madeiraHoje).
// Leve de propósito: só QUATRO árvores do acampamento são interativas; a floresta continua instanciada (seção 11b).
// ====================================================================================================
      const dialogoDoLenhador = selecionar('#janela-lenhador');
      const botaoDeColetarMadeira = selecionar('#coletar-madeira');
      const grupoDoAcampamento = new THREE.Group();
      grupoDoAcampamento.position.set(ACAMPAMENTO_DO_LENHADOR.x, 0, ACAMPAMENTO_DO_LENHADOR.z);
      grupoDoAcampamento.userData.nome = 'acampamento-do-lenhador';
      cena.add(grupoDoAcampamento);
      // Coordenadas LOCAIS do acampamento (o grupo não é girado: +z = sul, para onde ficam as árvores de corte).
      const POSTO_DO_LENHADOR = { x: 1.0, z: -1.0, giro: 0 };
      // Correção do lenhador: 10 árvores (antes 4). As 4 primeiras continuam no mesmo lugar e com os mesmos ids (arvore-1..4), então
      // os tempos de rebrota salvos valem como antes; as 6 novas (arvore-5..10) formam um segundo arco na beira da clareira.
      // Posições escolhidas por medição: dentro da clareira (raio 7,2), ≥ 1,6 dos troncos da floresta, ≥ 2,4 das outras árvores de
      // corte e com o caminho reto do posto até cada uma passando a ≥ 1,2 de qualquer outro tronco (o lenhador anda em linha reta).
      const POSICOES_DAS_ARVORES_DE_CORTE = [[-3.6, 2.9, 0.95], [-0.9, 4.7, 1.05], [2.3, 4.5, 0.9], [4.5, 2.1, 1.0],
        [-6.7, 1.4, 1.0], [6.3, -2.8, 0.95], [6.9, 0.5, 1.05], [-3.4, 6.0, 0.9], [0.2, 6.9, 1.0], [4.8, 4.7, 0.95]];

      // ---- Cenário do acampamento: chão batido, trilha, posto de trabalho, toras, telheiro, tocos e placa ----
      const materialDoChaoBatido = new THREE.MeshLambertMaterial({ color: 0xb48c5c, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      const chaoDoAcampamento = new THREE.Mesh(new THREE.CircleGeometry(4.9, 28), materialDoChaoBatido);
      chaoDoAcampamento.rotation.x = -Math.PI / 2; chaoDoAcampamento.position.set(0, 0.025, -0.2); chaoDoAcampamento.receiveShadow = true;
      grupoDoAcampamento.add(chaoDoAcampamento);
      {
        // trilha de terra do fim da estrada oeste até a entrada do acampamento (coordenadas do mundo, seção 09)
        const [[xInicial, zInicial], [xFinal, zFinal]] = ACAMPAMENTO_DO_LENHADOR.trilha, comprimento = Math.hypot(xFinal - xInicial, zFinal - zInicial);
        const trilha = new THREE.Mesh(new THREE.PlaneGeometry(1.3, comprimento + 1.2), materialDoChaoBatido);
        // Plano deitado (rotation.x = −90°): o comprimento (eixo Y local) aponta no mundo para (−sen θ, −cos θ). Para seguir o
        // segmento (dx, dz), θ = atan2(−dx, −dz). (Antes o sinal de dx estava invertido e a faixa ficava espelhada, solta no chão.)
        trilha.rotation.x = -Math.PI / 2; trilha.rotation.z = Math.atan2(-(xFinal - xInicial), -(zFinal - zInicial));
        trilha.position.set((xInicial + xFinal) / 2, 0.024, (zInicial + zFinal) / 2); trilha.receiveShadow = true; cena.add(trilha);
      }
      // cepo de rachar lenha com um machado cravado e lascas em volta
      criarCilindro(0.42, 0.48, 0.55, 0x8a5a2e, 0.2, 0.28, -1.9, grupoDoAcampamento, 10);
      criarCilindro(0.4, 0.4, 0.02, 0xd8b27a, 0.2, 0.56, -1.9, grupoDoAcampamento, 10);
      { const cabo = criarCaixa(0.05, 0.7, 0.05, 0x6b4a2e, 0.3, 0.85, -1.9, grupoDoAcampamento); cabo.rotation.z = -0.5; criarCaixa(0.24, 0.12, 0.04, 0x9aa3a3, 0.14, 0.6, -1.9, grupoDoAcampamento).rotation.z = -0.5; }
      for (let indice = 0; indice < 7; indice++) { const lasca = criarCaixa(0.16, 0.03, 0.07, 0xd8b27a, 0.2 + Math.cos(indice * 2.1) * 0.75, 0.04, -1.9 + Math.sin(indice * 2.1) * 0.6, grupoDoAcampamento); lasca.rotation.y = indice; }
      // cavalete com uma tora atravessada
      const cavalete = new THREE.Group(); cavalete.position.set(-1.5, 0, -2.5); cavalete.rotation.y = 0.3; grupoDoAcampamento.add(cavalete);
      for (const lado of [-0.55, 0.55]) for (const inclinacao of [-0.35, 0.35]) criarCaixa(0.07, 0.8, 0.07, 0x6b4a2e, lado, 0.38, 0, cavalete).rotation.x = inclinacao;
      criarCilindro(0.17, 0.17, 1.6, 0x8a5a2e, 0, 0.78, 0, cavalete, 9).rotation.z = Math.PI / 2;
      // telheiro de tábuas sobre a pilha de toras
      const telheiro = new THREE.Group(); telheiro.position.set(-3.1, 0, -0.9); telheiro.rotation.y = 0.5; grupoDoAcampamento.add(telheiro);
      for (const [x, z, altura] of [[-1.1, -0.7, 2.0], [1.1, -0.7, 2.0], [-1.1, 0.7, 1.55], [1.1, 0.7, 1.55]]) criarCaixa(0.12, altura, 0.12, 0x5e3b1c, x, altura / 2, z, telheiro);
      criarCaixa(2.6, 0.08, 1.8, 0x7a4a26, 0, 1.82, 0, telheiro).rotation.x = 0.26;
      for (const z of [-0.6, 0, 0.6]) criarCaixa(2.6, 0.05, 0.12, 0x5e3b1c, 0, 1.88 - z * 0.27, z, telheiro);
      // pilha de toras em pirâmide (3 + 2 + 1)
      [[-0.5, 0.18], [0, 0.18], [0.5, 0.18], [-0.25, 0.5], [0.25, 0.5], [0, 0.82]].forEach(([deslocamento, altura], indice) => {
        const tora = criarCilindro(0.18, 0.18, 1.9, indice % 2 ? 0x8a5a2e : 0x7a4f28, 0, altura, deslocamento, telheiro, 9); tora.rotation.z = Math.PI / 2;
        criarCilindro(0.15, 0.15, 1.92, 0xd8b27a, 0, altura, deslocamento, telheiro, 9).rotation.z = Math.PI / 2;   // pontas claras (madeira cortada)
      });
      criarBarril(grupoDoAcampamento, -1.6, -3.6); criarCaixote(grupoDoAcampamento, -0.9, -3.9);
      // tocos antigos de árvores já exploradas
      for (const [x, z, raio] of [[3.7, 0.2, 0.26], [-4.4, 1.0, 0.3], [4.1, -2.4, 0.22]]) { criarCilindro(raio, raio * 1.15, 0.38, 0x7a4f28, x, 0.19, z, grupoDoAcampamento, 8); criarCilindro(raio * 0.92, raio * 0.92, 0.02, 0xd8b27a, x, 0.39, z, grupoDoAcampamento, 8); }
      // placa na entrada da trilha e lampião (acende à noite com os mesmos materiais dos outros postes)
      {
        const placa = new THREE.Group(); placa.position.set(3.3, 0, -3.6); placa.rotation.y = -0.6; grupoDoAcampamento.add(placa);
        for (const lado of [-0.6, 0.6]) criarCaixa(0.1, 1.5, 0.1, 0x5e3b1c, lado, 0.75, 0, placa);
        const quadro = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 0.07), new THREE.MeshLambertMaterial({ map: criarTexturaDeTexto('LENHADOR', '#3b2410', '#f2dfb4', 'acampamento da floresta') }));
        quadro.position.set(0, 1.3, 0); quadro.castShadow = true; placa.add(quadro);
        criarPosteDeLampiao(grupoDoAcampamento, 2.3, -2.9, Math.PI / 2, 3.6);
      }

      // ---- Árvores de corte (poucas e com estado próprio) ----
      const arvoresDeMadeira = POSICOES_DAS_ARVORES_DE_CORTE.map(([x, z, escala], indice) => {
        const id = 'arvore-' + (indice + 1);
        const raiz = new THREE.Group(); raiz.position.set(x, 0, z); grupoDoAcampamento.add(raiz);
        const copa = criarArvore(raiz, 0, 0, escala);                                                       // tronco + 3 cones (a parte que cai)
        const toco = new THREE.Group(); raiz.add(toco);
        criarCilindro(0.17 * escala, 0.21 * escala, 0.32, 0x6b4a2b, 0, 0.16, 0, toco, 7);
        criarCilindro(0.15 * escala, 0.15 * escala, 0.02, 0xd8b27a, 0, 0.33, 0, toco, 7);
        // ponto de corte: um pouco à frente da árvore, do lado do posto de trabalho
        const direcaoX = POSTO_DO_LENHADOR.x - x, direcaoZ = POSTO_DO_LENHADOR.z - z, distancia = Math.hypot(direcaoX, direcaoZ);
        const pontoDeCorte = [x + direcaoX / distancia * 1.0, z + direcaoZ / distancia * 1.0];
        const salvo = estado.arvoresColetaveis[id] || 0, cortada = salvo > agoraNoJogo();
        copa.visible = !cortada; toco.visible = cortada;
        return { id, x, z, raiz, copa, toco, pontoDeCorte, disponivelEm: cortada ? salvo : 0, emUso: false, crescimento: 1, queda: 0, eixoDaQueda: new THREE.Vector3(-direcaoZ / distancia, 0, direcaoX / distancia) };
      });

      // ---- Modelo do lenhador (parado no posto; machado na mão direita; tora no ombro só na volta) ----
      const lenhador = {
        modelo: criarFazendeiro({
          pele: 0xc58b62, camisa: 0xa8322a, camisaLinha: 0x5e1a14, xadrez: true, mangaLonga: true, calca: 0x3d4a5c,
          bota: 0x2a1a10, cabelo: 0x3a2616, barba: 0x3a2616, chapeu: 'vaqueiro', corChapeu: 0x7a4a2a, fita: 0xd5b56d,
        }),
        x: POSTO_DO_LENHADOR.x, z: POSTO_DO_LENHADOR.z, rot: POSTO_DO_LENHADOR.giro, fase: 'parado', destino: null,
        arvoreAlvo: null, tempoDaFase: 0, passo: 0,
      };
      grupoDoAcampamento.add(lenhador.modelo.raiz);
      {
        const mao = lenhador.modelo.bracos[1];
        criarCaixa(0.05, 0.85, 0.05, 0x6b4a2e, 0, -0.62, 0.32, mao).rotation.x = Math.PI / 2;           // cabo do machado (para a frente)
        criarCaixa(0.05, 0.28, 0.22, 0x9aa3a3, 0, -0.62, 0.72, mao);                                     // lâmina
      }
      const toraNoOmbro = criarCilindro(0.13, 0.13, 1.1, 0x8a5a2e, 0.2, 1.55, 0, lenhador.modelo.corpo, 8);
      toraNoOmbro.rotation.x = Math.PI / 2; toraNoOmbro.visible = false;
      criarPlacaDeInteracaoNpc('LENHADOR', 'Madeira · clique para falar', lenhador.modelo.raiz, 2.7);
      registrarCliqueDeNpc(criarAreaDeCliqueDoNpc(lenhador.modelo.raiz, 1.3, 2.4, 1.1), () => abrirDialogoDoLenhador());
      selecionar('#madeira-por-arvore').textContent = String(LENHADOR_CONFIG.madeiraPorArvore);

      // ---- Regras ----
      // Etapa 1.1 — RESERVA DE MADEIRA (mesma regra das cotas de XP, RESERVA_DE_COTA_EM_DIAS): na virada do dia, o que sobrou do
      // limite do último dia jogado (e o limite inteiro dos dias sem jogar) fica guardado, até 1 limite. Quem joga todo dia e
      // coleta tudo não ganha nada a mais; quem joga em dias alternados não perde a madeira do dia em que não entrou.
      // Capacidade de hoje = limite do dia + reserva; a coleta gasta primeiro o limite e depois a reserva.
      const renovarMadeiraDoDia = function renovarMadeiraDoDia() {
        const hoje = diaDoCalendario(Date.now()), registro = estado.madeiraHoje, limite = LENHADOR_CONFIG.limiteDiarioDeMadeira;
        if (registro.dia === hoje) return registro;
        let reserva = 0;
        if (Number.isInteger(registro.dia) && hoje > registro.dia) {
          const diasSemJogar = Math.min(RESERVA_DE_COTA_EM_DIAS, hoje - registro.dia - 1);
          const sobraDoLimite = Math.max(0, limite - registro.total), sobraDaReserva = Math.max(0, (registro.reserva || 0) - Math.max(0, registro.total - limite));
          reserva = Math.min(limite * RESERVA_DE_COTA_EM_DIAS, sobraDaReserva + sobraDoLimite + diasSemJogar * limite);
        }
        registro.dia = hoje; registro.total = 0; registro.reserva = reserva;   // dia novo: o limite renova
        return registro;
      };
      const capacidadeDeMadeiraHoje = () => LENHADOR_CONFIG.limiteDiarioDeMadeira + renovarMadeiraDoDia().reserva;
      const madeiraRestanteHoje = function madeiraRestanteHoje() {
        const registro = renovarMadeiraDoDia();
        return Math.max(0, LENHADOR_CONFIG.limiteDiarioDeMadeira + registro.reserva - registro.total);
      };
      const arvoreDisponivel = arvore => !arvore.emUso && arvore.disponivelEm <= agoraNoJogo();
      // ---- Seiva da Floresta (poção, seção 28c): as árvores que estão rebrotando voltam na hora ----
      // Em duas partes, para a transação da poção poder desfazer: primeiro só o ESTADO (tira o instante de rebrota salvo) e, depois
      // que o salvamento der certo, a CENA (o laço abaixo faz a árvore crescer de novo). Árvore em corte não é tocada. O limite
      // diário de madeira continua valendo normalmente.
      const arvoresQueEstaoRebrotando = () => arvoresDeMadeira.filter(arvore => !arvore.emUso && arvore.disponivelEm > agoraNoJogo());
      const arvoresDoAcampamentoRebrotando = () => arvoresQueEstaoRebrotando().length;
      const liberarRebrotaNoEstado = function liberarRebrotaNoEstado() {
        const ids = arvoresQueEstaoRebrotando().map(arvore => arvore.id);
        for (const id of ids) delete estado.arvoresColetaveis[id];
        return ids;
      };
      const rebrotarArvoresDoAcampamento = function rebrotarArvoresDoAcampamento(ids) {
        for (const arvore of arvoresDeMadeira) if (ids.includes(arvore.id) && !arvore.emUso) arvore.disponivelEm = agoraNoJogo();   // o laço mostra a rebrota
      };
      const quantidadeDeArvoresDisponiveis = () => arvoresDeMadeira.filter(arvoreDisponivel).length;
      let coletaDeMadeiraEmAndamento = false, intervaloDeAtualizacaoDoDialogo = 0, mensagemDoLenhador = '';
      const formatarTempo = milissegundos => { const segundos = Math.max(0, Math.ceil(milissegundos / 1000)); return Math.floor(segundos / 60) + ':' + String(segundos % 60).padStart(2, '0'); };

      // ---- Diálogo ----
      const atualizarDialogoDoLenhador = function atualizarDialogoDoLenhador() {
        const restante = madeiraRestanteHoje(), disponiveis = quantidadeDeArvoresDisponiveis(), agora = agoraNoJogo();
        selecionar('#arvores-disponiveis').textContent = disponiveis + ' de ' + arvoresDeMadeira.length;
        selecionar('#madeira-por-arvore').textContent = String(LENHADOR_CONFIG.madeiraPorArvore);   // sobe com o nível da ponte (8 → 10)
        selecionar('#estoque-madeira-lenhador').textContent = String(estado.recursos.madeira);
        const capacidade = capacidadeDeMadeiraHoje(), reservaDeHoje = estado.madeiraHoje.reserva;
        const campoDaMadeiraDeHoje = selecionar('#madeira-hoje-lenhador');
        campoDaMadeiraDeHoje.textContent = (capacidade - restante) + ' / ' + capacidade + (reservaDeHoje ? ' (+' + reservaDeHoje + ' de ontem)' : '');
        campoDaMadeiraDeHoje.title = 'Limite de hoje: ' + LENHADOR_CONFIG.limiteDiarioDeMadeira + ' (ponte nível ' + (estado.niveis.ponte | 0) + ')' + (reservaDeHoje ? ' + ' + reservaDeHoje + ' guardadas do dia anterior' : '') + '. A madeira não coletada fica guardada por mais um dia.';   // o limite sobe com a ponte
        selecionar('#arvores-do-acampamento').innerHTML = arvoresDeMadeira.map((arvore, indice) => {
          const estadoDaArvore = arvore.emUso ? ['cortando', '🪓', 'em corte'] : arvoreDisponivel(arvore) ? ['pronta', '🌲', 'pronta'] : ['toco', '🪵', 'volta em ' + formatarTempo(arvore.disponivelEm - agora)];
          return `<li class="arvore-${estadoDaArvore[0]}"><span aria-hidden="true">${estadoDaArvore[1]}</span><b>Árvore ${indice + 1}</b><small>${estadoDaArvore[2]}</small></li>`;
        }).join('');
        const textos = { indo: '🚶 Indo até a árvore…', cortando: '🪓 Cortando · ' + Math.max(0, Math.ceil(LENHADOR_CONFIG.segundosDeCorte - lenhador.tempoDaFase)) + ' s', derrubando: '🌲 Madeira caindo!', voltando: '🪵 Levando a madeira para o posto…' };
        selecionar('#estado-lenhador').textContent = textos[lenhador.fase]
          || (restante <= 0 ? 'Já entreguei toda a madeira de hoje (' + capacidadeDeMadeiraHoje() + '). Volte amanhã!'
            : disponiveis ? 'Pronto para trabalhar. Cada árvore rende ' + LENHADOR_CONFIG.madeiraPorArvore + ' madeiras.'
              : 'Todas as árvores estão rebrotando. Espere um pouco.');
        selecionar('#erro-lenhador').textContent = mensagemDoLenhador;
        botaoDeColetarMadeira.disabled = coletaDeMadeiraEmAndamento || disponiveis === 0 || restante <= 0;
      };
      const abrirDialogoDoLenhador = function abrirDialogoDoLenhador() {
        fecharMenuEPaineis();
        mensagemDoLenhador = '';
        dialogoDoLenhador.hidden = false;
        atualizarDialogoDoLenhador();
        tocarEfeito('Enter');
        (botaoDeColetarMadeira.disabled ? selecionar('#dispensar-lenhador') : botaoDeColetarMadeira).focus();
      };
      const fecharDialogoDoLenhador = () => { dialogoDoLenhador.hidden = true; };
      selecionar('#fechar-lenhador').addEventListener('click', fecharDialogoDoLenhador);
      selecionar('#dispensar-lenhador').addEventListener('click', fecharDialogoDoLenhador);
      dialogoDoLenhador.addEventListener('click', evento => { if (evento.target === dialogoDoLenhador) fecharDialogoDoLenhador(); });
      addEventListener('keydown', evento => { if (evento.key === 'Escape' && !dialogoDoLenhador.hidden) fecharDialogoDoLenhador(); });

      // ---- Ordem de coleta: escolhe UMA árvore disponível (a mais próxima do posto) e a reserva ----
      const ordenarColetaDeMadeira = function ordenarColetaDeMadeira() {
        if (coletaDeMadeiraEmAndamento) return false;                       // trava contra cliques repetidos
        if (madeiraRestanteHoje() <= 0) { mensagemDoLenhador = 'O limite diário de madeira já foi atingido.'; atualizarDialogoDoLenhador(); return false; }
        const escolhida = arvoresDeMadeira.filter(arvoreDisponivel)
          .sort((a, b) => Math.hypot(a.x - POSTO_DO_LENHADOR.x, a.z - POSTO_DO_LENHADOR.z) - Math.hypot(b.x - POSTO_DO_LENHADOR.x, b.z - POSTO_DO_LENHADOR.z))[0];
        if (!escolhida) { mensagemDoLenhador = 'Não há árvore disponível agora. Espere uma rebrotar.'; atualizarDialogoDoLenhador(); return false; }
        coletaDeMadeiraEmAndamento = true;
        escolhida.emUso = true;
        lenhador.arvoreAlvo = escolhida; lenhador.destino = escolhida.pontoDeCorte; lenhador.fase = 'indo'; lenhador.tempoDaFase = 0;
        mensagemDoLenhador = '';
        registrarAtividade();
        atualizarDialogoDoLenhador();
        return true;
      };
      botaoDeColetarMadeira.addEventListener('click', ordenarColetaDeMadeira);

      // Crédito da madeira: acontece UMA vez por árvore, no fim da queda. A árvore vira toco e a rebrota é salva junto.
      // Se o salvamento falhar, tudo volta como antes (a árvore continua em pé e nenhuma madeira entra).
      const concluirCorteDaArvore = function concluirCorteDaArvore(arvore) {
        const madeira = Math.min(LENHADOR_CONFIG.madeiraPorArvore, madeiraRestanteHoje());
        const antes = { madeira: estado.recursos.madeira, hoje: { ...estado.madeiraHoje }, rebrota: estado.arvoresColetaveis[arvore.id] };
        const rebrotaEm = agoraNoJogo() + LENHADOR_CONFIG.minutosParaRebrotar * 60000;
        estado.recursos.madeira += madeira; estado.madeiraHoje.total += madeira; estado.arvoresColetaveis[arvore.id] = rebrotaEm;
        if (!salvarProgresso()) {
          estado.recursos.madeira = antes.madeira; estado.madeiraHoje = antes.hoje;
          if (antes.rebrota === undefined) delete estado.arvoresColetaveis[arvore.id]; else estado.arvoresColetaveis[arvore.id] = antes.rebrota;
          arvore.copa.visible = true; arvore.copa.quaternion.identity(); arvore.toco.visible = false;
          mensagemDoLenhador = 'Não foi possível salvar. A madeira não foi creditada; tente de novo.';
          return false;
        }
        arvore.disponivelEm = rebrotaEm; arvore.copa.visible = false; arvore.copa.quaternion.identity(); arvore.toco.visible = true;
        atualizarResumoDeRecursos(); desenharCards(); tocarEfeito('colher');
        mostrarAviso('🪵 O lenhador entregou ' + madeira + ' madeiras. A árvore rebrota em ' + LENHADOR_CONFIG.minutosParaRebrotar + ' min.');
        avisarObjetivos('arvore', { madeira });   // Etapa 2: quadro de objetivos (seção 30e)
        return true;
      };

      // ---- Animação e movimento (só dentro do acampamento, em linha reta: o caminho entre o posto e as árvores é livre) ----
      const andarAte = function andarAte(destino, segundosDesdeUltimoFrame) {
        const diferencaX = destino[0] - lenhador.x, diferencaZ = destino[1] - lenhador.z, distancia = Math.hypot(diferencaX, diferencaZ);
        const giroAlvo = Math.atan2(diferencaX, diferencaZ);
        lenhador.rot += normalizarAngulo(giroAlvo - lenhador.rot) * Math.min(1, segundosDesdeUltimoFrame * 8);
        const passo = Math.min(distancia, LENHADOR_CONFIG.velocidadeDeCaminhada * segundosDesdeUltimoFrame);
        if (distancia > 0.001) { lenhador.x += diferencaX / distancia * passo; lenhador.z += diferencaZ / distancia * passo; }
        lenhador.passo += passo * 3.9;
        return distancia - passo < 0.02;
      };
      const posarLenhador = function posarLenhador(andando, tempo) {
        const modelo = lenhador.modelo, balanco = andando ? Math.sin(lenhador.passo) * 0.7 : 0;
        modelo.pernas[0].rotation.x = balanco; modelo.pernas[1].rotation.x = -balanco;
        if (lenhador.fase === 'cortando') {                                     // golpes: ergue o machado e desce com força
          const golpe = (lenhador.tempoDaFase * 1.4) % 1, angulo = golpe < 0.6 ? -2.4 * (golpe / 0.6) : -2.4 + 2.6 * ((golpe - 0.6) / 0.4);
          modelo.bracos[1].rotation.x = angulo; modelo.bracos[0].rotation.x = angulo * 0.8; modelo.corpo.rotation.x = golpe < 0.6 ? -0.05 : 0.12;
        } else if (lenhador.fase === 'voltando') {
          modelo.bracos[0].rotation.x = -2.6; modelo.bracos[1].rotation.x = balanco * 0.6; modelo.corpo.rotation.x = 0;   // segura a tora no ombro
        } else {
          modelo.bracos[0].rotation.x = -balanco * 0.8; modelo.bracos[1].rotation.x = andando ? balanco * 0.8 : -0.25;     // parado: machado à frente
          modelo.corpo.rotation.x = 0;
        }
        modelo.corpo.position.y = andando ? Math.abs(Math.sin(lenhador.passo)) * 0.04 : 0;
        modelo.corpo.scale.y = andando ? 1 : 1 + Math.sin(tempo * 1.8) * 0.008;   // respiração
        if (lenhador.fase === 'parado') modelo.cabeca.rotation.y = Math.sin(tempo * 0.4) * 0.4;
        else modelo.cabeca.rotation.y = 0;
        toraNoOmbro.visible = lenhador.fase === 'voltando';
        modelo.raiz.position.set(lenhador.x, 0, lenhador.z); modelo.raiz.rotation.y = lenhador.rot;
      };
      // Chamada a cada quadro pelo loop (seção 30b).
      const atualizarLenhador = function atualizarLenhador(segundosDesdeUltimoFrame, tempo = 0) {
        const agora = agoraNoJogo();
        // rebrota: a árvore volta a crescer quando o tempo salvo passa (animação curta de crescimento)
        for (const arvore of arvoresDeMadeira) {
          if (!arvore.emUso && arvore.disponivelEm > 0 && arvore.disponivelEm <= agora) {
            arvore.disponivelEm = 0; arvore.toco.visible = false; arvore.copa.visible = true; arvore.crescimento = 0.25;
            if (!dialogoDoLenhador.hidden) atualizarDialogoDoLenhador();
          }
          if (arvore.crescimento < 1) { arvore.crescimento = Math.min(1, arvore.crescimento + segundosDesdeUltimoFrame / 1.5); arvore.copa.scale.setScalar(arvore.crescimento); }
        }
        let andando = false;
        lenhador.tempoDaFase += segundosDesdeUltimoFrame;
        const arvore = lenhador.arvoreAlvo;
        if (lenhador.fase === 'indo') {
          andando = true;
          if (andarAte(lenhador.destino, segundosDesdeUltimoFrame)) { lenhador.fase = 'cortando'; lenhador.tempoDaFase = 0; }
        } else if (lenhador.fase === 'cortando') {
          lenhador.rot += normalizarAngulo(Math.atan2(arvore.x - lenhador.x, arvore.z - lenhador.z) - lenhador.rot) * Math.min(1, segundosDesdeUltimoFrame * 8);
          arvore.copa.rotation.z = Math.sin(lenhador.tempoDaFase * 9) * 0.012;      // a árvore treme com os golpes
          if (lenhador.tempoDaFase >= LENHADOR_CONFIG.segundosDeCorte) { arvore.copa.rotation.z = 0; lenhador.fase = 'derrubando'; lenhador.tempoDaFase = 0; arvore.toco.visible = true; }
        } else if (lenhador.fase === 'derrubando') {
          // a árvore tomba para longe do lenhador (gira em torno da base), acelerando como uma queda de verdade
          const fracao = Math.min(1, lenhador.tempoDaFase / LENHADOR_CONFIG.segundosDaQueda);
          arvore.copa.quaternion.setFromAxisAngle(arvore.eixoDaQueda, fracao * fracao * Math.PI * 0.48);
          if (fracao >= 1) {
            const entregou = concluirCorteDaArvore(arvore);
            if (!entregou) { arvore.toco.visible = false; }
            arvore.emUso = false; lenhador.arvoreAlvo = null;
            lenhador.fase = 'voltando'; lenhador.tempoDaFase = 0; lenhador.destino = [POSTO_DO_LENHADOR.x, POSTO_DO_LENHADOR.z];
            if (!dialogoDoLenhador.hidden) atualizarDialogoDoLenhador();
          }
        } else if (lenhador.fase === 'voltando') {
          andando = true;
          if (andarAte(lenhador.destino, segundosDesdeUltimoFrame)) {
            lenhador.fase = 'parado'; lenhador.tempoDaFase = 0; coletaDeMadeiraEmAndamento = false;
            if (!dialogoDoLenhador.hidden) atualizarDialogoDoLenhador();
          }
        } else {
          lenhador.rot += normalizarAngulo(POSTO_DO_LENHADOR.giro - lenhador.rot) * Math.min(1, segundosDesdeUltimoFrame * 3);   // volta a olhar para a frente
        }
        posarLenhador(andando, tempo);
        intervaloDeAtualizacaoDoDialogo -= segundosDesdeUltimoFrame;
        if (!dialogoDoLenhador.hidden && intervaloDeAtualizacaoDoDialogo <= 0) { intervaloDeAtualizacaoDoDialogo = 0.5; atualizarDialogoDoLenhador(); }
      };
      Object.assign(window, { farmEduLenhador: { ordenarColetaDeMadeira, abrirDialogoDoLenhador, estado: () => ({ fase: lenhador.fase, x: lenhador.x, z: lenhador.z, arvores: arvoresDeMadeira.map(arvore => ({ id: arvore.id, disponivelEm: arvore.disponivelEm, emUso: arvore.emUso, emPe: arvore.copa.visible })) }) } });

      arquivoDaMontagemConcluido('29b-lenhador.js');
