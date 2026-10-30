      // ====================================================================================================
      // FARMEDU 3D — 29-trabalhadores.js (Fase 3B da refatoração: seção 29)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 29 — TRABALHADORES: CAPACIDADE DA CASA, CONTRATAÇÃO, MELHORIAS, DISPENSA, TAREFAS E COMBATE (MARK 8.2)
      // Dados persistentes em estado.trabalhadores: atributos-base (velocidade, vidaMaxima, precisao, dano, velocidadeDeTarefa),
      // níveis de melhoria (melhorias), vida atual, estado ('ativo' | 'morto') e xpInvestido. Os atributos EFETIVOS (base +
      // melhorias, função atributosDoTrabalhador) são lidos a cada quadro pelo movimento, pela colheita e pelo combate.
      // A equipe é limitada pela capacidade da casa (1/2/3/4 vagas). A entidade 3D reaproveita o modelo dos fazendeiros (seção 22)
      // e o movimento dos mobs (andarMob/passoDoMob, seção 26) sobre a grade das pessoas (não atravessa construções, árvores,
      // cercas nem o rio). Fazendeiros e guardas colhem e lutam; as classes mudam a eficiência por meio de modificadores reais.
      // ====================================================================================================
      const trabalhadoresNaCena = new Map();   // id → entidade (só trabalhadores vivos ou caindo)
      const pontoLivre = (posicaoX, posicaoZ) => GRADE_DAS_PESSOAS.centro(GRADE_DAS_PESSOAS.maisProxima(posicaoX, posicaoZ));
      // Pontos de ronda (bordas da floresta e caminhos), de espera perto das plantações e perto da casa (ajustados para células livres).
      const PONTOS_DE_RONDA = [[-14, -18], [0, -20], [20, -20], [40, -19], [53, -12], [53, 6], [53, 24], [53, 46], [30, 49], [12, 51], [-12, 51], [-16, 26], [-17, 8], [-24, -6]].map(([x, z]) => pontoLivre(x, z));
      const PONTOS_PERTO_DAS_PLANTACOES = [[30.6, 12], [43, 1.6], [55, 12], [30.6, 32.3], [43, 42.3], [55, 30]].map(([x, z]) => pontoLivre(x, z));
      const PONTOS_PERTO_DE_CASA = [[-8, -2.5], [-2, 2], [-3, 13.5], [8, -1.5], [0, 26]].map(([x, z]) => pontoLivre(x, z));
      const sortearReal = (minimo, maximo) => minimo + Math.random() * (maximo - minimo);
      const sortearDaListaDeTrabalho = lista => lista[Math.floor(Math.random() * lista.length)];

      // ---- atributos efetivos, capacidade e custos ----
      const atributosDoTrabalhador = function atributosDoTrabalhador(dados) {
        const efetivos = {};
        for (const [atributo, regra] of Object.entries(MELHORIAS_DOS_TRABALHADORES.atributos)) {
          const valor = dados[atributo] + (dados.melhorias[atributo] || 0) * regra.incremento;
          efetivos[atributo] = regra.maximo ? Math.min(regra.maximo, valor) : valor;
        }
        return efetivos;
      };
      const capacidadeDaCasa = () => CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA[Math.min(estado.niveis.casa, CAPACIDADE_DE_TRABALHADORES_POR_NIVEL_DA_CASA.length - 1)];
      const vagasOcupadas = () => estado.trabalhadores.length;   // mortos também ocupam vaga até serem recuperados ou dispensados
      const custoDaProximaMelhoria = (dados, atributo) => dados.melhorias[atributo] >= MELHORIAS_DOS_TRABALHADORES.nivelMaximo ? null : MELHORIAS_DOS_TRABALHADORES.custoPorNivel[dados.melhorias[atributo]];
      const recompensaPorDispensar = dados => Math.max(MELHORIAS_DOS_TRABALHADORES.recompensaMinimaAoDispensar, Math.round(dados.xpInvestido * MELHORIAS_DOS_TRABALHADORES.fracaoDevolvidaAoDispensar));
      const tempoDeColheita = dados => LAVOURA_CONFIG.segundosBaseDaColheita / (atributosDoTrabalhador(dados).velocidadeDeTarefa * CLASSES_DE_TRABALHADORES[dados.classe].eficienciaDeColheita);
      // Evita que um clique duplo contrate, melhore, recupere ou dispense duas vezes.
      let operacaoDaEquipeEmAndamento = false;
      const executarUmaVez = function executarUmaVez(operacao) { if (operacaoDaEquipeEmAndamento) return; operacaoDaEquipeEmAndamento = true; try { operacao(); } finally { setTimeout(() => { operacaoDaEquipeEmAndamento = false; }, 300); } atualizarPaineisDaMark82(true); };

      // ---- candidatos, contratação, recuperação, melhorias e dispensa ----
      const gerarCandidato = function gerarCandidato() {
        const classe = Math.random() < 0.55 ? 'fazendeiro' : 'guarda', faixas = CLASSES_DE_TRABALHADORES[classe].atributos, dados = { id: estado.proximoIdDeTrabalhador++, nome: sortearDaListaDeTrabalho(TRABALHADORES_CONFIG.nomes), classe };
        for (const atributo in faixas) dados[atributo] = sortearReal(...faixas[atributo]);
        return normalizarTrabalhador(dados, false);
      };
      const garantirCandidatos = function garantirCandidatos() { while (estado.candidatos.length < TRABALHADORES_CONFIG.candidatosNoMenu) estado.candidatos.push(gerarCandidato()); };
      const contratarTrabalhador = function contratarTrabalhador(idDoCandidato) {
        const indice = estado.candidatos.findIndex(candidato => candidato.id === idDoCandidato);
        if (indice < 0) return;
        const candidato = estado.candidatos[indice], custo = CLASSES_DE_TRABALHADORES[candidato.classe].custo;
        if (vagasOcupadas() >= capacidadeDaCasa()) { mostrarAviso('A casa está cheia (' + vagasOcupadas() + '/' + capacidadeDaCasa() + ' vagas). Evolua a casa ou dispense alguém.'); return; }
        if (estado.xp < custo) { mostrarAviso('XP insuficiente para contratar ' + candidato.nome + ': faltam ' + (custo - estado.xp) + ' XP.'); return; }
        estado.candidatos.splice(indice, 1); estado.xp -= custo;                  // retira o candidato ANTES: um segundo clique não acha mais ninguém
        const dados = { ...candidato, vida: atributosDoTrabalhador(candidato).vidaMaxima, estado: 'ativo', xpInvestido: custo };
        estado.trabalhadores.push(dados); garantirCandidatos();
        registrarAtividade(); criarEntidadeDoTrabalhador(dados, true); desenharCards();
        mostrarAviso(CLASSES_DE_TRABALHADORES[dados.classe].icone + ' ' + dados.nome + ' foi contratado(a) e está saindo da casa!');
      };
      const recuperarTrabalhador = function recuperarTrabalhador(idDoTrabalhador) {
        const dados = estado.trabalhadores.find(trabalhador => trabalhador.id === idDoTrabalhador);
        if (!dados || dados.estado !== 'morto') return;
        const custo = CLASSES_DE_TRABALHADORES[dados.classe].custoDeRecuperacao;
        if (estado.xp < custo) { mostrarAviso('XP insuficiente para recuperar ' + dados.nome + ': faltam ' + (custo - estado.xp) + ' XP.'); return; }
        estado.xp -= custo; dados.xpInvestido += custo; dados.estado = 'ativo'; dados.vida = atributosDoTrabalhador(dados).vidaMaxima;
        registrarAtividade(); criarEntidadeDoTrabalhador(dados, true); desenharCards();
        mostrarAviso('❤️ ' + dados.nome + ' foi recuperado(a) e voltou ao trabalho!');
      };
      const melhorarAtributo = function melhorarAtributo(idDoTrabalhador, atributo) {
        const dados = estado.trabalhadores.find(trabalhador => trabalhador.id === idDoTrabalhador), regra = MELHORIAS_DOS_TRABALHADORES.atributos[atributo];
        if (!dados || !regra) return;
        if (dados.estado === 'morto') { mostrarAviso('Recupere ' + dados.nome + ' antes de melhorar os atributos.'); return; }
        const custo = custoDaProximaMelhoria(dados, atributo);
        if (custo === null) { mostrarAviso(regra.nome + ' de ' + dados.nome + ' já está no nível máximo.'); return; }
        if (estado.xp < custo) { mostrarAviso('XP insuficiente para melhorar ' + regra.nome + ': faltam ' + (custo - estado.xp) + ' XP.'); return; }
        estado.xp -= custo; dados.xpInvestido += custo; dados.melhorias[atributo]++;
        if (atributo === 'vidaMaxima') dados.vida = Math.min(atributosDoTrabalhador(dados).vidaMaxima, dados.vida + regra.incremento);   // o ganho de vida vale na hora
        registrarAtividade(); desenharCards();
        mostrarAviso(regra.icone + ' ' + regra.nome + ' de ' + dados.nome + ' melhorou para o nível ' + dados.melhorias[atributo] + '.');
      };
      // Dispensa: devolve parte do XP investido (contratação, recuperações e melhorias). A confirmação fica no painel (2 cliques).
      const dispensarTrabalhador = function dispensarTrabalhador(idDoTrabalhador) {
        const indice = estado.trabalhadores.findIndex(trabalhador => trabalhador.id === idDoTrabalhador);
        if (indice < 0) return;
        const dados = estado.trabalhadores[indice], recompensa = recompensaPorDispensar(dados);
        estado.trabalhadores.splice(indice, 1);                                     // sai dos dados ANTES de creditar: não há XP duplicado
        const entidade = trabalhadoresNaCena.get(dados.id); if (entidade) cancelarTarefa(entidade);
        removerEntidadeDoTrabalhador(dados.id);
        estado.xp += recompensa; registrarAtividade(); desenharCards();
        mostrarAviso('👋 ' + dados.nome + ' foi dispensado(a): +' + recompensa + ' XP. Vagas: ' + vagasOcupadas() + '/' + capacidadeDaCasa() + '.');
      };

      // ---- modelo 3D: o mesmo fazendeiro da seção 22, com roupa e equipamento da classe ----
      const aparenciaDoTrabalhador = function aparenciaDoTrabalhador(dados) {
        const pele = [0xe8b98f, 0xc58b62, 0xf0c8a0, 0x8d5a3b][dados.id % 4];
        if (dados.classe === 'guarda') return { pele, camisa: 0x34495e, mangaLonga: true, calca: 0x2c3e50, bota: 0x1f1a17, cabelo: 0x2a1c12, chapeu: 'larga', corChapeu: 0x7f8c8d, fita: 0x7f8c8d };
        return { pele, camisa: [0xc0392b, 0x27ae60, 0x8e44ad, 0xd35400][dados.id % 4], camisaLinha: 0x5a1d16, xadrez: dados.id % 2 === 0, calca: 0x3d5f94, macacao: true, bota: 0x5a3820, cabelo: 0x4a3020, chapeu: 'palha', corChapeu: 0xe3c46d, fita: 0xb5342a };
      };
      const equiparTrabalhador = function equiparTrabalhador(modelo, classe) {
        const { caixa, esfera, cilindro } = criarFabricaDePecas();
        if (classe === 'guarda') {
          const chapeu = modelo.cabeca.children.find(objeto => objeto.isGroup); if (chapeu) modelo.cabeca.remove(chapeu);   // troca o chapéu por um elmo
          esfera(modelo.cabeca, 0.2, 0x8a9399, 0, 0.07, -0.01, 1, 0.75, 1.05); cilindro(modelo.cabeca, 0.23, 0.23, 0.03, 0x6f7a80, 0, 0.03, 0);
          cilindro(modelo.bracos[1], 0.025, 0.025, 1.5, 0x6b4a2e, 0, -0.55, 0.1); cilindro(modelo.bracos[1], 0.0, 0.05, 0.18, 0xc9ced3, 0, 0.29, 0.1);   // lança
          caixa(modelo.bracos[0], 0.05, 0.52, 0.42, 0x8e2b2b, -0.1, -0.45, 0.05); esfera(modelo.bracos[0], 0.06, 0xc9a84e, -0.13, -0.45, 0.05);        // escudo
        } else {
          cilindro(modelo.bracos[1], 0.02, 0.02, 1.0, 0x8a5a2a, 0, -0.62, 0.08); caixa(modelo.bracos[1], 0.05, 0.08, 0.24, 0x8d949b, 0, -1.1, 0.16);   // enxada
        }
      };
      // ---- barras de vida (dois sprites; usadas por trabalhadores e monstros) ----
      const materialDoFundoDaBarra = new THREE.SpriteMaterial({ color: 0x1b1b1b }), materiaisDaBarra = {};
      const direitaDaCamera = new THREE.Vector3(), paraACamera = new THREE.Vector3();
      const criarBarraDeVida = function criarBarraDeVida(cor) {
        const grupo = new THREE.Group(), fundo = new THREE.Sprite(materialDoFundoDaBarra), frente = new THREE.Sprite(materiaisDaBarra[cor] = materiaisDaBarra[cor] || new THREE.SpriteMaterial({ color: cor }));
        fundo.scale.set(0.95, 0.12, 1); frente.scale.set(0.9, 0.08, 1); grupo.add(fundo, frente); cena.add(grupo);
        return { grupo, frente };
      };
      const posicionarBarraDeVida = function posicionarBarraDeVida(barra, posicaoX, posicaoY, posicaoZ, fracao) {
        barra.grupo.position.set(posicaoX, posicaoY, posicaoZ);
        direitaDaCamera.setFromMatrixColumn(camera.matrixWorld, 0); paraACamera.copy(camera.position).sub(barra.grupo.position).normalize();
        barra.frente.scale.x = 0.9 * Math.max(0, fracao);
        barra.frente.position.copy(direitaDaCamera).multiplyScalar(-(1 - Math.max(0, fracao)) * 0.45).addScaledVector(paraACamera, 0.03);
      };
      const removerBarraDeVida = function removerBarraDeVida(barra) { cena.remove(barra.grupo); };

      // ---- entidade na cena ----
      const pontoDaPortaDaCasa = () => { const casa = AREAS.find(area => area.id === 'casa').posicao, profundidade = [3.4 * 0.8, 3.4, 3.8, 4.2][estado.niveis.casa]; return { x: casa.x, z: casa.z + profundidade / 2 + 0.1, saidaZ: casa.z + 6.0 }; };
      const criarEntidadeDoTrabalhador = function criarEntidadeDoTrabalhador(dados, saindoDaCasa) {
        removerEntidadeDoTrabalhador(dados.id);
        const modelo = criarFazendeiro(aparenciaDoTrabalhador(dados)); equiparTrabalhador(modelo, dados.classe); cena.add(modelo.raiz);
        const porta = pontoDaPortaDaCasa(), [livreX, livreZ] = saindoDaCasa ? [porta.x, porta.z] : pontoLivre(porta.x, porta.saidaZ);
        const entidade = { dados, ...modelo, barra: criarBarraDeVida(dados.classe === 'guarda' ? 0x3498db : 0x2ecc71), x: livreX, z: livreZ, rot: 0, vel: 0, velAlvo: 0, velMax: atributosDoTrabalhador(dados).velocidade,
          estado: saindoDaCasa ? 'saindo' : 'andando', tempoSaindo: 0, caminho: null, indice: 0, parado: 0, ux: livreX, uz: livreZ, passo: 0, fase: Math.random() * 6, decisao: Math.random() * 0.25,
          recarga: 0, alvo: null, espera: 0.3, tarefa: null, ordem: null, tempoCaido: 0, indiceDaRonda: Math.floor(Math.random() * PONTOS_DE_RONDA.length), ultimoAlvoPlanejado: null };
        if (saindoDaCasa) modelo.raiz.scale.setScalar(0.2);
        trabalhadoresNaCena.set(dados.id, entidade);
        return entidade;
      };
      const removerEntidadeDoTrabalhador = function removerEntidadeDoTrabalhador(idDoTrabalhador) {
        const entidade = trabalhadoresNaCena.get(idDoTrabalhador); if (!entidade) return;
        cancelarTarefa(entidade); cena.remove(entidade.raiz); removerBarraDeVida(entidade.barra); entidade.removido = true; trabalhadoresNaCena.delete(idDoTrabalhador);
      };
      const trabalhadorDisponivel = entidade => !entidade.removido && entidade.estado !== 'caido' && entidade.estado !== 'saindo';

      // ---- ORDENS DE COLHEITA (Mark 8.3) ----
      // Na 8.2 todo trabalhador ocioso procurava sozinho o próximo canteiro maduro, então uma ordem individual "virava" uma
      // colheita sem fim. Agora o trabalho é sempre uma ORDEM do jogador, com começo, meio e fim:
      //   { tipo: 'canteiro', area, indice }            → exatamente UMA colheita daquele canteiro; depois a ordem termina;
      //   { tipo: 'plantacao', area, colhidos, ignorados } → colhe, um por vez, os canteiros maduros e livres daquela plantação
      //                                                     e termina quando não resta nenhum.
      // entidade.tarefa = alvo atual { area, indice, fase: 'indo' | 'colhendo', restante, alvoX, alvoZ }, com reserva do canteiro.
      // Concluir, cancelar ou substituir uma ordem SEMPRE libera a reserva e devolve o trabalhador à exploração ('andando').
      // Estados do trabalhador: andando (explorando) · indo colher · colhendo · procurando (próximo alvo da ordem geral) ·
      // combatendo · caido · saindo. O combate interrompe a ordem e, quando termina, o trabalhador retoma de onde parou.
      const cancelarTarefa = function cancelarTarefa(entidade) {
        if (!entidade.tarefa) return;
        const chave = chaveDoCanteiro(entidade.tarefa.area, entidade.tarefa.indice);
        if (reservasDeColheita.get(chave) === entidade.dados.id) reservasDeColheita.delete(chave);
        entidade.tarefa = null;
      };
      const concluirOrdem = function concluirOrdem(entidade, mensagem) {
        cancelarTarefa(entidade); entidade.ordem = null;
        if (!entidade.alvo && entidade.estado !== 'caido') { entidade.estado = 'andando'; entidade.caminho = null; entidade.espera = 0.2; }
        if (mensagem) mostrarAviso(mensagem);
        atualizarPaineisDaMark82(false);
      };
      const cancelarOrdem = entidade => concluirOrdem(entidade, null);
      // Reserva o canteiro e calcula o caminho até a célula livre mais próxima dele (a borda da plantação: a cerca não é
      // atravessada). Devolve false se não houver caminho (a ordem decide o que fazer, sem repetir tentativas para sempre).
      const irAteOCanteiro = function irAteOCanteiro(entidade, idDaArea, indice) {
        const chave = chaveDoCanteiro(idDaArea, indice), dono = reservasDeColheita.get(chave);
        if (dono !== undefined && dono !== entidade.dados.id) { const outro = trabalhadoresNaCena.get(dono); if (outro) cancelarTarefa(outro); }   // ordem do jogador tem prioridade
        cancelarTarefa(entidade);
        const [canteiroX, canteiroZ] = posicaoDoCanteiroNoMundo(idDaArea, indice), [pontoX, pontoZ] = pontoLivre(canteiroX, canteiroZ);
        const caminho = GRADE_DAS_PESSOAS.acharCaminho(entidade.x, entidade.z, pontoX, pontoZ);
        if (!caminho) return false;
        reservasDeColheita.set(chave, entidade.dados.id);
        entidade.tarefa = { area: idDaArea, indice, fase: 'indo', restante: 0, alvoX: canteiroX, alvoZ: canteiroZ };
        entidade.caminho = caminho; entidade.indice = 0; entidade.parado = 0; entidade.ux = entidade.x; entidade.uz = entidade.z;
        if (!entidade.alvo) entidade.estado = 'indo colher';
        return true;
      };
      // Escolhe o próximo alvo da ordem atual, ou encerra a ordem quando não há mais o que fazer.
      const proximoAlvoDaOrdem = function proximoAlvoDaOrdem(entidade) {
        const ordem = entidade.ordem, nome = entidade.dados.nome;
        if (!ordem) return;
        if (ordem.tipo === 'canteiro') {
          if (estagioDoCanteiro(canteirosDaArea(ordem.area)[ordem.indice]) < 3) return concluirOrdem(entidade, ordem.silenciosa ? null : nome + ': o canteiro já foi colhido ou não está maduro. Voltou a explorar.');
          if (!irAteOCanteiro(entidade, ordem.area, ordem.indice)) return concluirOrdem(entidade, ordem.silenciosa ? null : nome + ' não consegue chegar a esse canteiro. Voltou a explorar.');
          return;
        }
        entidade.estado = 'procurando';
        const candidatos = [];
        for (let indice = 0; indice < quantidadeDeCanteiros(ordem.area); indice++) {
          const dono = reservasDeColheita.get(chaveDoCanteiro(ordem.area, indice));
          if (estagioDoCanteiro(canteirosDaArea(ordem.area)[indice]) === 3 && (dono === undefined || dono === entidade.dados.id) && !ordem.ignorados.has(indice)) {
            const [canteiroX, canteiroZ] = posicaoDoCanteiroNoMundo(ordem.area, indice); candidatos.push([Math.hypot(canteiroX - entidade.x, canteiroZ - entidade.z), indice]);
          }
        }
        candidatos.sort((primeiro, segundo) => primeiro[0] - segundo[0]);
        for (const [, indice] of candidatos) { if (irAteOCanteiro(entidade, ordem.area, indice)) return; ordem.ignorados.add(indice); }   // inalcançável: não tenta de novo nesta ordem
        concluirOrdem(entidade, ordem.colhidos ? '🧺 ' + nome + ' terminou a colheita de ' + nomeDaArea(ordem.area) + ' (' + ordem.colhidos + ' canteiro(s)) e voltou a explorar.' : nome + ': não há canteiros maduros livres em ' + nomeDaArea(ordem.area) + '. Voltou a explorar.');
      };
      const darOrdem = function darOrdem(entidade, ordem) { cancelarOrdem(entidade); entidade.ordem = ordem; proximoAlvoDaOrdem(entidade); return !!entidade.ordem; };
      // Estimativa (s) para um trabalhador chegar e colher: distância / velocidade + tempo de colheita (atributos e classe).
      const estimativaDeColheita = (entidade, idDaArea, indice) => { const [canteiroX, canteiroZ] = posicaoDoCanteiroNoMundo(idDaArea, indice); return Math.hypot(canteiroX - entidade.x, canteiroZ - entidade.z) * 1.25 / atributosDoTrabalhador(entidade.dados).velocidade + tempoDeColheita(entidade.dados); };
      const trabalhadoresLivresParaOrdens = () => [...trabalhadoresNaCena.values()].filter(entidade => trabalhadorDisponivel(entidade) && entidade.estado !== 'combatendo');
      // ORDEM INDIVIDUAL: o trabalhador indicado (ou o que terminaria mais rápido) colhe só este canteiro e volta a explorar.
      const ordenarColheitaDoCanteiro = function ordenarColheitaDoCanteiro(idDaArea, indice, idDoTrabalhador) {
        const canteiro = canteirosDaArea(idDaArea)[indice];
        if (!canteiro || estagioDoCanteiro(canteiro) < 3) { if (canteiro && canteiro.cultura) mostrarAviso(CULTURAS[canteiro.cultura].nome + ' ainda não está madura.'); return; }
        registrarAtividade();
        let escolhido = idDoTrabalhador ? trabalhadoresNaCena.get(idDoTrabalhador) : trabalhadoresLivresParaOrdens().sort((primeiro, segundo) => estimativaDeColheita(primeiro, idDaArea, indice) - estimativaDeColheita(segundo, idDaArea, indice))[0];
        if (!escolhido || !trabalhadorDisponivel(escolhido)) { mostrarAviso(idDoTrabalhador ? 'Este trabalhador não está disponível agora.' : 'Nenhum trabalhador disponível agora. Você pode colher pessoalmente.'); return; }
        if (darOrdem(escolhido, { tipo: 'canteiro', area: idDaArea, indice }))
          mostrarAviso(CLASSES_DE_TRABALHADORES[escolhido.dados.classe].icone + ' ' + escolhido.dados.nome + ' vai colher este canteiro (≈ ' + Math.ceil(estimativaDeColheita(escolhido, idDaArea, indice)) + ' s) e depois volta a explorar.');
      };
      // ORDEM GERAL: o trabalhador colhe todos os canteiros maduros e livres da plantação indicada e depois volta a explorar.
      const ordenarColheitaGeral = function ordenarColheitaGeral(idDaArea, idDoTrabalhador) {
        const entidade = trabalhadoresNaCena.get(idDoTrabalhador);
        if (!entidade || !trabalhadorDisponivel(entidade)) { mostrarAviso('Este trabalhador não está disponível agora.'); return; }
        registrarAtividade();
        if (darOrdem(entidade, { tipo: 'plantacao', area: idDaArea, colhidos: 0, ignorados: new Set() }))
          mostrarAviso(CLASSES_DE_TRABALHADORES[entidade.dados.classe].icone + ' ' + entidade.dados.nome + ' vai colher toda a ' + nomeDaArea(idDaArea) + '.');
      };
      // COLHEITA PELO JOGADOR (sem trabalhadores): um canteiro ou "COLHER TUDO" de UMA plantação. Cada canteiro é esvaziado ao
      // ser colhido (colherCanteiro), então nenhum é colhido duas vezes; canteiros imaturos ficam como estão.
      const colherCanteiroPeloJogador = function colherCanteiroPeloJogador(idDaArea, indice) { registrarAtividade(); colherCanteiro(idDaArea, indice); };
      const colherTudoPeloJogador = function colherTudoPeloJogador(idDaArea) {
        registrarAtividade();
        const recursosAntes = { ...estado.recursos }, xpAntes = estado.xp; let colhidos = 0;
        for (let indice = 0; indice < quantidadeDeCanteiros(idDaArea); indice++) if (estagioDoCanteiro(canteirosDaArea(idDaArea)[indice]) === 3 && colherCanteiro(idDaArea, indice, true)) colhidos++;
        if (!colhidos) { mostrarAviso('Nada maduro para colher em ' + nomeDaArea(idDaArea) + '.'); return; }
        const ganhos = Object.keys(CULTURAS).filter(recurso => estado.recursos[recurso] > recursosAntes[recurso]).map(recurso => '+' + (estado.recursos[recurso] - recursosAntes[recurso]) + ' ' + CULTURAS[recurso].icone).join(' ');
        mostrarAviso('🧺 Você colheu ' + colhidos + ' canteiro(s) em ' + nomeDaArea(idDaArea) + ': ' + ganhos + ' · +' + (estado.xp - xpAntes) + ' XP');
      };
      // Colheita espontânea (desligada por padrão: TRABALHADORES_CONFIG.colheitaEspontanea). Se ligada, vira uma ordem
      // individual silenciosa, com o mesmo ciclo de início e fim.
      const procurarColheitaAutomatica = function procurarColheitaAutomatica(entidade, noite) {
        if (!TRABALHADORES_CONFIG.colheitaEspontanea || (noite && !CLASSES_DE_TRABALHADORES[entidade.dados.classe].colheDeNoite)) return false;
        let melhor = null, menor = 80;
        for (const [idDaArea, indice] of canteirosMadurosLivres()) { const [canteiroX, canteiroZ] = posicaoDoCanteiroNoMundo(idDaArea, indice), distancia = Math.hypot(canteiroX - entidade.x, canteiroZ - entidade.z); if (distancia < menor) { menor = distancia; melhor = [idDaArea, indice]; } }
        return melhor ? darOrdem(entidade, { tipo: 'canteiro', area: melhor[0], indice: melhor[1], silenciosa: true }) : false;
      };

      // ---- dano recebido ----
      const ferirTrabalhador = function ferirTrabalhador(entidade, dano, atacante) {
        if (entidade.estado === 'caido' || entidade.removido) return;
        entidade.dados.vida = Math.max(0, entidade.dados.vida - dano); marcarParaSalvar();
        if (!entidade.alvo && atacante && !atacante.morto) { entidade.alvo = atacante; entidade.estado = 'combatendo'; }   // reage a quem o atacou
        if (entidade.dados.vida > 0) return;
        cancelarTarefa(entidade); entidade.ordem = null;                            // morto não continua nenhuma ordem
        entidade.dados.estado = 'morto'; entidade.estado = 'caido'; entidade.tempoCaido = 0; entidade.alvo = null; entidade.vel = entidade.velAlvo = 0;
        salvarProgresso();
        mostrarAviso('💀 ' + entidade.dados.nome + ' (' + CLASSES_DE_TRABALHADORES[entidade.dados.classe].nome + ') foi derrotado(a). Recupere-o(a) no menu 👷 Equipe.');
        atualizarPaineisDaMark82(true);
      };
      // ---- decisões (a cada TRABALHADORES_CONFIG.segundosEntreDecisoes, não a cada quadro) ----
      // Prioridade: 1) defender (monstro dentro do raio de defesa da classe) · 2) tarefa de colheita em andamento ·
      // 3) colheita automática · 4) ronda (guardas) ou espera perto das plantações/da casa (fazendeiros).
      const decidirTrabalhador = function decidirTrabalhador(entidade, noite) {
        const classe = CLASSES_DE_TRABALHADORES[entidade.dados.classe];
        const monstro = monstroMaisProximo(entidade.x, entidade.z, entidade.alvo && !entidade.alvo.morto ? classe.raioDeDefesa + 4 : classe.raioDeDefesa);
        if (monstro) {
          entidade.alvo = monstro; entidade.estado = 'combatendo';
          const distancia = Math.hypot(monstro.x - entidade.x, monstro.z - entidade.z), planejado = entidade.ultimoAlvoPlanejado;
          if (distancia > classe.alcance && (!entidade.caminho || entidade.indice >= entidade.caminho.length || !planejado || Math.hypot(planejado[0] - monstro.x, planejado[1] - monstro.z) > 1.2)) {
            const caminho = GRADE_DAS_PESSOAS.acharCaminho(entidade.x, entidade.z, monstro.x, monstro.z);
            if (caminho) { entidade.caminho = caminho; entidade.indice = 0; entidade.ultimoAlvoPlanejado = [monstro.x, monstro.z]; }
            else { entidade.caminho = [[monstro.x, monstro.z]]; entidade.indice = 0; entidade.ultimoAlvoPlanejado = [monstro.x, monstro.z]; }   // vai direto (passoDoMob não entra em células bloqueadas)
          }
          return;
        }
        if (entidade.alvo || entidade.estado === 'combatendo') {                  // fim do combate: retoma a ordem (se houver) ou volta a explorar
          entidade.alvo = null; entidade.estado = 'andando'; entidade.caminho = null;
          if (entidade.ordem) { cancelarTarefa(entidade); proximoAlvoDaOrdem(entidade); return; }
        }
        if (entidade.ordem) {
          const tarefa = entidade.tarefa;
          if (!tarefa) { proximoAlvoDaOrdem(entidade); return; }                                       // ordem geral procurando o próximo canteiro
          if (tarefa.fase === 'indo' && (estagioDoCanteiro(canteirosDaArea(tarefa.area)[tarefa.indice]) < 3 || reservasDeColheita.get(chaveDoCanteiro(tarefa.area, tarefa.indice)) !== entidade.dados.id)) {
            cancelarTarefa(entidade); proximoAlvoDaOrdem(entidade);                                    // o alvo deixou de valer no caminho (colhido por outro)
          }
          return;
        }
        if (entidade.estado === 'andando' && (!entidade.caminho || entidade.indice >= entidade.caminho.length)) {
          if (!monstroMaisProximo(entidade.x, entidade.z, 25) && procurarColheitaAutomatica(entidade, noite)) return;
          entidade.espera -= TRABALHADORES_CONFIG.segundosEntreDecisoes; if (entidade.espera > 0) return;
          let destino;
          if (entidade.dados.classe === 'guarda') { entidade.indiceDaRonda = (entidade.indiceDaRonda + 1) % PONTOS_DE_RONDA.length; destino = PONTOS_DE_RONDA[entidade.indiceDaRonda]; }
          else destino = sortearDaListaDeTrabalho(noite ? PONTOS_PERTO_DE_CASA : PONTOS_PERTO_DAS_PLANTACOES);
          const caminho = GRADE_DAS_PESSOAS.acharCaminho(entidade.x, entidade.z, destino[0], destino[1]);
          if (caminho && caminho.length) { entidade.caminho = caminho; entidade.indice = 0; entidade.parado = 0; entidade.ux = entidade.x; entidade.uz = entidade.z; }
          else entidade.espera = 0.6;
        }
      };
      // Pose de caminhada, golpe e trabalho (mesma animação dos fazendeiros).
      const animarTrabalhador = function animarTrabalhador(entidade, segundosDesdeUltimoFrame, tempo, golpeando, colhendo) {
        const amplitude = Math.min(1, entidade.vel / Math.max(0.1, entidade.velMax)); entidade.passo += entidade.vel * segundosDesdeUltimoFrame * 3.9;
        const balanco = Math.sin(entidade.passo) * 0.72 * amplitude;
        entidade.pernas[0].rotation.x = balanco; entidade.pernas[1].rotation.x = -balanco;
        entidade.bracos[0].rotation.x = colhendo ? -0.8 + Math.sin(tempo * 6 + 1) * 0.4 : -balanco * 0.85;
        entidade.bracos[1].rotation.x = golpeando ? -1.3 + Math.sin(tempo * 9 + entidade.fase) * 0.7 : colhendo ? -0.8 + Math.sin(tempo * 6) * 0.5 : balanco * 0.85;
        entidade.corpo.position.y = Math.abs(Math.sin(entidade.passo)) * 0.04 * amplitude;
        entidade.raiz.position.set(entidade.x, 0, entidade.z); entidade.raiz.rotation.y = entidade.rot;
      };
      const virarPara = (entidade, alvoX, alvoZ, segundosDesdeUltimoFrame) => { entidade.rot += normalizarAngulo(Math.atan2(alvoX - entidade.x, alvoZ - entidade.z) - entidade.rot) * Math.min(1, segundosDesdeUltimoFrame * 8); };
      const atualizarTrabalhadores = function atualizarTrabalhadores(segundosDesdeUltimoFrame, tempo) {
        const noite = ehNoiteParaMonstros(), grade = GRADE_DAS_PESSOAS;
        for (const entidade of [...trabalhadoresNaCena.values()]) {
          const dados = entidade.dados, classe = CLASSES_DE_TRABALHADORES[dados.classe], atributos = atributosDoTrabalhador(dados);
          entidade.velMax = atributos.velocidade;                                     // melhorias de velocidade valem na hora
          if (entidade.estado === 'caido') {                                           // cai, fica alguns segundos e some (continua no menu como morto)
            entidade.tempoCaido += segundosDesdeUltimoFrame;
            entidade.corpo.rotation.x = -Math.min(1, entidade.tempoCaido * 2) * Math.PI / 2; entidade.corpo.position.y = 0.15;
            entidade.barra.grupo.visible = false;
            if (entidade.tempoCaido > TRABALHADORES_CONFIG.segundosCaidoAntesDeSumir) removerEntidadeDoTrabalhador(dados.id);
            continue;
          }
          if (entidade.estado === 'saindo') {                                          // sai pela porta da casa e desce até o caminho
            const porta = pontoDaPortaDaCasa();
            entidade.tempoSaindo += segundosDesdeUltimoFrame; entidade.raiz.scale.setScalar(0.8 * Math.min(1, 0.25 + entidade.tempoSaindo / 0.6));
            entidade.vel = Math.min(1.6, atributos.velocidade); entidade.z = Math.min(porta.saidaZ, entidade.z + segundosDesdeUltimoFrame * entidade.vel); entidade.rot = 0;
            if (entidade.z >= porta.saidaZ) { [entidade.x, entidade.z] = pontoLivre(entidade.x, entidade.z); entidade.estado = 'andando'; entidade.espera = 0; entidade.raiz.scale.setScalar(0.8); }
            animarTrabalhador(entidade, segundosDesdeUltimoFrame, tempo, false, false);
            posicionarBarraDeVida(entidade.barra, entidade.x, 1.95, entidade.z, dados.vida / atributos.vidaMaxima);
            continue;
          }
          entidade.decisao -= segundosDesdeUltimoFrame;
          if (entidade.decisao <= 0) { entidade.decisao = TRABALHADORES_CONFIG.segundosEntreDecisoes; decidirTrabalhador(entidade, noite); }
          let golpeando = false, colhendo = false;
          if (entidade.alvo && !entidade.alvo.morto && !entidade.alvo.removido) {
            const alvo = entidade.alvo, distancia = Math.hypot(alvo.x - entidade.x, alvo.z - entidade.z);
            if (distancia <= classe.alcance) {                                          // ao alcance: para, encara e golpeia (a precisão decide o acerto)
              entidade.velAlvo = 0; virarPara(entidade, alvo.x, alvo.z, segundosDesdeUltimoFrame);
              golpeando = true; entidade.recarga -= segundosDesdeUltimoFrame;
              if (entidade.recarga <= 0) { entidade.recarga = classe.segundosEntreAtaques; if (Math.random() * 100 < atributos.precisao) ferirMonstro(alvo, Math.round(atributos.dano * sortearReal(0.85, 1.15)), entidade); }
            } else andarMob(entidade, segundosDesdeUltimoFrame, grade);
          } else if (entidade.tarefa && entidade.tarefa.fase === 'colhendo') {          // colhendo: o tempo depende da velocidade de tarefa e da classe
            entidade.velAlvo = 0; colhendo = true; virarPara(entidade, entidade.tarefa.alvoX, entidade.tarefa.alvoZ, segundosDesdeUltimoFrame);
            entidade.tarefa.restante -= segundosDesdeUltimoFrame;
            if (entidade.tarefa.restante <= 0) {                                         // fim da colheita: UMA colheita deste canteiro
              const { area, indice } = entidade.tarefa, ordem = entidade.ordem;
              cancelarTarefa(entidade);                                                 // libera a reserva antes de colher
              const colheu = colherCanteiro(area, indice, true);
              if (!ordem) { entidade.estado = 'andando'; entidade.espera = 0.2; }
              else if (ordem.tipo === 'canteiro') concluirOrdem(entidade, ordem.silenciosa ? null : colheu ? '🧺 ' + dados.nome + ' colheu o canteiro em ' + nomeDaArea(area) + ' e voltou a explorar.' : dados.nome + ': o canteiro já tinha sido colhido. Voltou a explorar.');
              else { if (colheu) ordem.colhidos++; proximoAlvoDaOrdem(entidade); }        // ordem geral: próximo canteiro ou fim
            }
          } else if (entidade.caminho && andarMob(entidade, segundosDesdeUltimoFrame, grade)) {
            entidade.caminho = null;
            if (entidade.tarefa) { entidade.tarefa.fase = 'colhendo'; entidade.tarefa.restante = tempoDeColheita(dados); entidade.estado = 'colhendo'; }
            else entidade.espera = 0.3 + Math.random() * 0.5;
          } else if (!entidade.caminho) entidade.velAlvo = 0;
          passoDoMob(entidade, segundosDesdeUltimoFrame, grade);
          for (const outra of trabalhadoresNaCena.values()) {                           // não se sobrepõem
            if (outra === entidade || outra.estado === 'caido') continue;
            const distancia = Math.hypot(entidade.x - outra.x, entidade.z - outra.z);
            if (distancia < 0.8 && distancia > 0.001) { const posicaoX = entidade.x + (entidade.x - outra.x) / distancia * 0.8 * segundosDesdeUltimoFrame, posicaoZ = entidade.z + (entidade.z - outra.z) / distancia * 0.8 * segundosDesdeUltimoFrame; if (grade.livre(posicaoX, posicaoZ)) { entidade.x = posicaoX; entidade.z = posicaoZ; } }
          }
          if (!noite && !entidade.alvo && dados.vida < atributos.vidaMaxima) { dados.vida = Math.min(atributos.vidaMaxima, dados.vida + TRABALHADORES_CONFIG.vidaRecuperadaPorMinutoDeDia * segundosDesdeUltimoFrame / 60); marcarParaSalvar(); }
          animarTrabalhador(entidade, segundosDesdeUltimoFrame, tempo, golpeando, colhendo);
          posicionarBarraDeVida(entidade.barra, entidade.x, 1.95, entidade.z, dados.vida / atributos.vidaMaxima);
        }
      };
      // Ao abrir o jogo: trabalhadores vivos já estão na fazenda (perto da casa). Nenhum é duplicado: cada id tem uma entidade.
      const criarTrabalhadoresSalvos = function criarTrabalhadoresSalvos() { garantirCandidatos(); for (const dados of estado.trabalhadores) if (dados.estado === 'ativo') criarEntidadeDoTrabalhador(dados, false); };

      arquivoDaMontagemConcluido('29-trabalhadores.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
