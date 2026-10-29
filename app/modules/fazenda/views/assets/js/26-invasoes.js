      // ====================================================================================================
      // FARMEDU 3D — 26-invasoes.js (Fase 3B da refatoração: seção 26)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 26 — INVASÕES POR INATIVIDADE (REGRA ORIGINAL DOS 5 DIAS REAIS): CONTAGEM, SEQUÊNCIA, DESTRUIÇÃO E REPARO
      // Usa timestamps reais salvos (nenhum temporizador precisa ficar rodando com a página fechada).
      // Fases: aguardando → chegando → atacando → colapsando → saindo.
      // ====================================================================================================
      // Tempo REAL: tudo é calculado com timestamps salvos (estado.atividade.ultima), então fechar o navegador não zera nada e
      // nenhum temporizador precisa ficar rodando. O ciclo visual de dia e noite NÃO participa da contagem.
      //   estado.atividade.ultima  → quando o jogador agiu pela última vez (evoluir, reparar, tocar numa área, ganhar XP)
      //   estado.danos[id]         → { destruida, em, nivel } — separado de estado.niveis (o nível e o XP são preservados)
      //   estado.invasao           → { janela, emAndamento, total, ultima }; 'janela' impede sortear de novo ao recarregar
      const registrarAtividade = function registrarAtividade() { estado.atividade.ultima = Date.now(); salvarProgresso(); };
      // Verdadeiro se a instalação está marcada como destruída em estado.danos.
      const instalacaoDestruida = idDaArea => !!(estado.danos[idDaArea] && estado.danos[idDaArea].destruida);
      // Nome de exibição de uma área, a partir do id.
      const nomeDaArea = idDaArea => AREAS.find(areaDaLista => areaDaLista.id === idDaArea).nome;
      // Custo em XP para reparar uma instalação, conforme o nível que ela tinha ao ser destruída.
      const custoDeReparo = idDaArea => INVASOES_CONFIG.custoDeReparoPorNivel[Math.min(NIVEL_MAXIMO, estado.niveis[idDaArea]) - 1];
      // Mostra a faixa de aviso das invasões (título e texto) por alguns segundos; um clique a fecha.
      const mostrarFaixaDeInvasao = function mostrarFaixaDeInvasao(titulo, texto, duracaoEmMilissegundos = 9000) {
        const faixa = selecionar('#faixa-invasao'); selecionar('#faixa-titulo').textContent = titulo; selecionar('#faixa-texto').textContent = texto;
        faixa.hidden = false; clearTimeout(mostrarFaixaDeInvasao.t); mostrarFaixaDeInvasao.t = setTimeout(() => { faixa.hidden = true; }, duracaoEmMilissegundos);
      };
      selecionar('#faixa-invasao').onclick = () => { selecionar('#faixa-invasao').hidden = true; };

      const INVASAO_EM_CURSO = { fase: 'nenhuma', mobs: [], dados: null, relogio: 0, checagem: 0, grade: null, entradas: null, infoTexto: '', infoRelogio: 0, sacudida: 0 };
      // Sorteia um número inteiro entre minimo e maximo (inclusive).
      const sortearEntre = (minimo, maximo) => minimo + Math.floor(Math.random() * (maximo - minimo + 1));
      // Sorteia um item de uma lista (aleatoriedade comum, não a do cenário).
      const sortearDaLista = lista => lista[Math.floor(Math.random() * lista.length)];

      // Grade de navegação dos mobs (criada só na primeira invasão): cobre a fazenda e a floresta ao redor, desviando de
      // construções, relevo, rio, árvores, postes, placa e da pedra secreta.
      const obterGradeDosMobs = function obterGradeDosMobs() {
        if (!INVASAO_EM_CURSO.grade) {
          INVASAO_EM_CURSO.grade = new GradeDeNavegacao(-38, -30, 74, 70, 0.7, (posicaoX, posicaoZ) =>
            COLISOES.bloqueia(posicaoX, posicaoZ, 0.5, NAO_BLOQUEIAM_PESSOAS) || COLISOES.rio(posicaoX, posicaoZ, 3.4) || REGISTRO_DE_ARVORES.perto(posicaoX, posicaoZ, 0.85));
          // entradas: células livres na floresta, a 5–14 unidades de distância da borda da fazenda
          INVASAO_EM_CURSO.entradas = INVASAO_EM_CURSO.grade.celulasPrincipais().filter(celula => {
            const [posicaoX, posicaoZ] = INVASAO_EM_CURSO.grade.centro(celula), diferencaX = Math.max(-27 - posicaoX, 0, posicaoX - 56), diferencaZ = Math.max(-24 - posicaoZ, 0, posicaoZ - 54), distancia = Math.hypot(diferencaX, diferencaZ);
            return distancia >= 4 && distancia <= 14;
          });
        }
        return INVASAO_EM_CURSO.grade;
      };
      // pontos ao redor da instalação onde cada criatura ficará para atacar (distribuídos pelo perímetro)
      const posicoesDeAtaque = function posicoesDeAtaque(idDaArea, quantidadeDeMobs, grade) {
        const area = AREAS.find(areaDaLista => areaDaLista.id === idDaArea), [metadeX, metadeZ] = METADE_DO_TAMANHO_DA_AREA[idDaArea], deslocamentoInicial = Math.random() * 6.28, pontos = [];
        for (let indice = 0; indice < quantidadeDeMobs; indice++) {
          const angulo = deslocamentoInicial + indice / quantidadeDeMobs * 6.28, cosseno = Math.cos(angulo), seno = Math.sin(angulo), distanciaAteABorda = Math.min((metadeX + 1.3) / Math.max(Math.abs(cosseno), 0.001), (metadeZ + 1.3) / Math.max(Math.abs(seno), 0.001));
          const livre = grade.maisProxima(area.posicao.x + cosseno * distanciaAteABorda, area.posicao.z + seno * distanciaAteABorda);
          pontos.push(grade.centro(livre));
        }
        return pontos;
      };
      // Cria os mobs da invasão numa entrada da floresta próxima ao alvo (que tenha caminho até ele) e calcula o
      // trajeto de cada um.
      const gerarMobs = function gerarMobs() {
        const grade = obterGradeDosMobs(), dadosDaInvasao = INVASAO_EM_CURSO.dados, area = AREAS.find(areaDaLista => areaDaLista.id === dadosDaInvasao.alvo), configuracao = INVASOES_CONFIG;
        const tipos = dadosDaInvasao.tipos.slice(0, configuracao.maximoDeMobsSimultaneos), ataque = posicoesDeAtaque(dadosDaInvasao.alvo, tipos.length, grade);
        // entradas na floresta mais próximas da instalação alvo (chegada em poucos segundos, sem atravessar a fazenda inteira)
        const distanciaAteOAlvo = celula => { const [posicaoX, posicaoZ] = grade.centro(celula); return Math.hypot(posicaoX - area.posicao.x, posicaoZ - area.posicao.z); };
        let entradasPerto = INVASAO_EM_CURSO.entradas.filter(celula => { const profundidade = distanciaAteOAlvo(celula); return profundidade >= 10 && profundidade <= 34; });
        if (entradasPerto.length < 5) entradasPerto = INVASAO_EM_CURSO.entradas.slice().sort((celulaA, celulaB) => distanciaAteOAlvo(celulaA) - distanciaAteOAlvo(celulaB)).slice(0, 60);
        for (let tentativa = 0; tentativa < 12 && !INVASAO_EM_CURSO.mobs.length; tentativa++) {
          const [extensaoX, extensaoZ] = grade.centro(sortearDaLista(entradasPerto));
          const primeiro = grade.acharCaminho(extensaoX, extensaoZ, ataque[0][0], ataque[0][1]);
          if (!primeiro) continue;                                                // entrada sem caminho até o alvo: tenta outra
          tipos.forEach((tipo, indice) => {
            const angulo = indice * 2.4, escalaX = extensaoX + Math.cos(angulo) * 0.9 * (indice > 0), escalaZ = extensaoZ + Math.sin(angulo) * 0.9 * (indice > 0);
            const ponto = grade.livre(escalaX, escalaZ) ? [escalaX, escalaZ] : [extensaoX, extensaoZ], caminho = indice === 0 ? primeiro : grade.acharCaminho(ponto[0], ponto[1], ataque[indice][0], ataque[indice][1]);
            if (!caminho) return;
            const modelo = criarMob(tipo); cena.add(modelo.raiz);
            INVASAO_EM_CURSO.mobs.push({ tipo, modelo, x: ponto[0], z: ponto[1], rot: Math.atan2(caminho[0][0] - ponto[0], caminho[0][1] - ponto[1]), vel: 0, velAlvo: 0, velMax: configuracao.velocidadeDosMobs * (0.92 + Math.random() * 0.16),
              caminho, indice: 0, passo: Math.random() * 6, fase: indice * 1.7, entrada: [ponto[0], ponto[1]], ataque: ataque[indice], chegou: false, saiu: false, parado: 0, ux: ponto[0], uz: ponto[1] });
          });
        }
        INVASAO_EM_CURSO.centro = [area.posicao.x, area.posicao.z];
      };
      // Tira o mob da cena e libera suas geometrias.
      const removerMob = function removerMob(mob) { cena.remove(mob.modelo.raiz); mob.modelo.raiz.traverse(objeto => { if (objeto.geometry) objeto.geometry.dispose(); }); };
      // Remove todos os mobs da invasão.
      const removerTodosOsMobs = function removerTodosOsMobs() { INVASAO_EM_CURSO.mobs.forEach(removerMob); INVASAO_EM_CURSO.mobs.length = 0; };

      // movimento comum (chegada e saída): gira aos poucos, acelera/freia, não atravessa células bloqueadas, replaneja se travar
      const andarMob = function andarMob(mob, segundosDesdeUltimoFrame, grade) {
        if (!mob.caminho || mob.indice >= mob.caminho.length) { mob.velAlvo = 0; return true; }
        const alvo = mob.caminho[mob.indice], diferencaX = alvo[0] - mob.x, diferencaZ = alvo[1] - mob.z;
        if (Math.hypot(diferencaX, diferencaZ) < 0.3) { mob.indice++; return mob.indice >= mob.caminho.length; }
        const diferencaDeAngulo = normalizarAngulo(Math.atan2(diferencaX, diferencaZ) - mob.rot);
        mob.rot += Math.max(-4 * segundosDesdeUltimoFrame, Math.min(4 * segundosDesdeUltimoFrame, diferencaDeAngulo)); mob.velAlvo = mob.velMax * Math.max(0, Math.cos(Math.min(Math.abs(diferencaDeAngulo), 1.5)));
        mob.parado += segundosDesdeUltimoFrame;
        if (mob.parado > 3) {                                                    // não saiu do lugar: planeja de novo a partir daqui
          if (Math.hypot(mob.x - mob.ux, mob.z - mob.uz) < 0.4) {
            const destino = mob.caminho[mob.caminho.length - 1], novoCaminho = grade.acharCaminho(mob.x, mob.z, destino[0], destino[1]);
            if (novoCaminho) { mob.caminho = novoCaminho; mob.indice = 0; } else { mob.indice = mob.caminho.length; }
          }
          mob.parado = 0; mob.ux = mob.x; mob.uz = mob.z;
        }
        return false;
      };
      // Aplica aceleração e move o mob na direção em que ele está virado, sem entrar em células bloqueadas.
      const passoDoMob = function passoDoMob(mob, segundosDesdeUltimoFrame, grade) {
        mob.vel += Math.max(-6 * segundosDesdeUltimoFrame, Math.min(4 * segundosDesdeUltimoFrame, mob.velAlvo - mob.vel));
        if (mob.vel < 0.001) return;
        const distanciaDoPasso = mob.vel * segundosDesdeUltimoFrame, celulasEmX = mob.x + Math.sin(mob.rot) * distanciaDoPasso, celulasEmZ = mob.z + Math.cos(mob.rot) * distanciaDoPasso;
        if (grade.livre(celulasEmX, celulasEmZ)) { mob.x = celulasEmX; mob.z = celulasEmZ; } else if (grade.livre(celulasEmX, mob.z)) mob.x = celulasEmX; else if (grade.livre(mob.x, celulasEmZ)) mob.z = celulasEmZ; else mob.vel = 0;
      };

      // Começa a sequência visual: mostra o aviso, foca a câmera no alvo e entra na fase "aguardando" (os mobs
      // surgem depois do atraso configurado).
      const iniciarInvasao = function iniciarInvasao(dados) {
        INVASAO_EM_CURSO.dados = dados; INVASAO_EM_CURSO.fase = 'aguardando'; INVASAO_EM_CURSO.relogio = -INVASOES_CONFIG.atrasoAposCarregarSegundos; // dá tempo de o jogador ver o aviso antes das criaturas surgirem
        const dias = Math.floor((Date.now() - estado.atividade.ultima) / DIA_EM_MS);
        mostrarFaixaDeInvasao('🧟 A fazenda está sob ataque!', 'Você ficou ' + dias + ' dias sem cuidar dela. Criaturas da floresta estão indo para: ' + nomeDaArea(dados.alvo) + '.', 12000);
        focarCameraNaArea(dados.alvo);
      };
      // aplica o resultado no estado salvo (a destruição é registrada separadamente de nível e XP)
      const aplicarDestruicao = function aplicarDestruicao(idDaArea, mensagemDeRetorno) {
        estado.danos[idDaArea] = { destruida: true, em: Date.now(), nivel: estado.niveis[idDaArea] };
        estado.invasao.emAndamento = null; estado.invasao.total = (estado.invasao.total | 0) + 1; estado.invasao.ultima = Date.now();
        salvarProgresso();
        reconstruirArea(idDaArea);
        desenharCards();
        mostrarFaixaDeInvasao('💥 ' + nomeDaArea(idDaArea) + ' foi destruído!', (mensagemDeRetorno ? 'Enquanto você estava fora, criaturas atacaram a fazenda. ' : '') + 'O nível ' + estado.niveis[idDaArea] + ' foi preservado: repare por ' + custoDeReparo(idDaArea) + ' XP.', 14000);
      };
      // Máquina de estados da invasão, chamada a cada quadro: aguardando → chegando → atacando → colapsando →
      // saindo. Com nenhuma invasão ativa, confere o relógio real a cada 30 s.
      const atualizarInvasao = function atualizarInvasao(segundosDesdeUltimoFrame, tempo) {
        PoeiraDeAtaque.atualizar(segundosDesdeUltimoFrame);
        const configuracao = INVASOES_CONFIG, invasao = INVASAO_EM_CURSO;
        if (invasao.fase === 'nenhuma') {                                              // conferência periódica com o relógio real (aba aberta por muito tempo)
          invasao.checagem += segundosDesdeUltimoFrame; if (invasao.checagem >= configuracao.intervaloDeVerificacaoSegundos) { invasao.checagem = 0; verificarInvasao(); }
        } else if (invasao.fase === 'aguardando') {
          invasao.relogio += segundosDesdeUltimoFrame;
          if (invasao.relogio >= 0) { invasao.relogio = 0; gerarMobs(); invasao.fase = invasao.mobs.length ? 'chegando' : 'colapsando'; }
        } else if (invasao.fase === 'chegando') {
          invasao.relogio += segundosDesdeUltimoFrame; let todos = true;
          for (const mob of invasao.mobs) {
            if (!mob.chegou) { mob.chegou = andarMob(mob, segundosDesdeUltimoFrame, invasao.grade); }
            if (!mob.chegou) todos = false; else { mob.velAlvo = 0; mob.rot += Math.max(-4 * segundosDesdeUltimoFrame, Math.min(4 * segundosDesdeUltimoFrame, normalizarAngulo(Math.atan2(invasao.centro[0] - mob.x, invasao.centro[1] - mob.z) - mob.rot))); }
            passoDoMob(mob, segundosDesdeUltimoFrame, invasao.grade); animarMob(mob, segundosDesdeUltimoFrame, tempo, false);
          }
          if (todos || invasao.relogio > configuracao.tempoMaximoDeChegadaSegundos) { invasao.fase = 'atacando'; invasao.relogio = 0; invasao.dica = 0; }
        } else if (invasao.fase === 'atacando') {
          invasao.relogio += segundosDesdeUltimoFrame; invasao.dica = (invasao.dica || 0) - segundosDesdeUltimoFrame;
          const grupoDaInstalacao = grupoDaArea[invasao.dados.alvo], area = AREAS.find(areaDaLista => areaDaLista.id === invasao.dados.alvo);
          for (const mob of invasao.mobs) {
            mob.velAlvo = 0; passoDoMob(mob, segundosDesdeUltimoFrame, invasao.grade);
            mob.rot += Math.max(-4 * segundosDesdeUltimoFrame, Math.min(4 * segundosDesdeUltimoFrame, normalizarAngulo(Math.atan2(invasao.centro[0] - mob.x, invasao.centro[1] - mob.z) - mob.rot)));
            animarMob(mob, segundosDesdeUltimoFrame, tempo, true);
          }
          if (invasao.dica <= 0) {                                                      // poeira e impacto discretos, no máximo a cada 0,4 s
            invasao.dica = 0.4;
            for (const mob of invasao.mobs) { const distancia = Math.hypot(invasao.centro[0] - mob.x, invasao.centro[1] - mob.z) || 1; PoeiraDeAtaque.emitir(mob.x + (invasao.centro[0] - mob.x) / distancia * 1.0, 0.2, mob.z + (invasao.centro[1] - mob.z) / distancia * 1.0, 2, 0.8); }
          }
          grupoDaInstalacao.position.x = area.posicao.x + Math.sin(tempo * 45) * 0.04 * Math.min(1, invasao.relogio / 2); grupoDaInstalacao.position.z = area.posicao.z + Math.cos(tempo * 38) * 0.04 * Math.min(1, invasao.relogio / 2);
          if (invasao.relogio >= configuracao.duracaoDoAtaqueSegundos) { invasao.fase = 'colapsando'; invasao.relogio = 0; invasao.estourou = false; }
        } else if (invasao.fase === 'colapsando') {
          invasao.relogio += segundosDesdeUltimoFrame;
          const grupoDaInstalacao = grupoDaArea[invasao.dados.alvo], area = AREAS.find(areaDaLista => areaDaLista.id === invasao.dados.alvo), [metadeX, metadeZ] = METADE_DO_TAMANHO_DA_AREA[invasao.dados.alvo];
          if (!invasao.estourou) { invasao.estourou = true; for (let indice = 0; indice < 8; indice++) PoeiraDeAtaque.emitir(area.posicao.x + (Math.random() - 0.5) * metadeX * 1.4, 0.3, area.posicao.z + (Math.random() - 0.5) * metadeZ * 1.4, 4, 1.4); }
          grupoDaInstalacao.scale.y = Math.max(0.15, 1 - invasao.relogio / 0.9 * 0.85); grupoDaInstalacao.position.x = area.posicao.x + Math.sin(tempo * 60) * 0.06; grupoDaInstalacao.position.z = area.posicao.z;
          for (const mob of invasao.mobs) { mob.velAlvo = 0; passoDoMob(mob, segundosDesdeUltimoFrame, invasao.grade); animarMob(mob, segundosDesdeUltimoFrame, tempo, true); }
          if (invasao.relogio >= 0.9) {
            grupoDaInstalacao.position.set(area.posicao.x, 0, area.posicao.z);
            aplicarDestruicao(invasao.dados.alvo, false);
            grupoDaInstalacao.scale.set(1, 1, 1);                                                // a ruína já foi construída; sem "pulo" de evolução
            invasao.mobs.forEach(mob => { mob.estado = 'saindo'; mob.chegou = false; mob.indice = 0; mob.caminho = invasao.grade.acharCaminho(mob.x, mob.z, mob.entrada[0], mob.entrada[1]); mob.parado = 0; });
            invasao.fase = 'saindo'; invasao.relogio = 0;
          }
        } else if (invasao.fase === 'saindo') {
          invasao.relogio += segundosDesdeUltimoFrame; let restantes = 0;
          for (const mob of invasao.mobs) {
            if (mob.saiu) continue;
            if (!mob.chegou) mob.chegou = !mob.caminho || andarMob(mob, segundosDesdeUltimoFrame, invasao.grade);
            if (mob.chegou) mob.velAlvo = 0;                                    // chegou à saída: para e some
            passoDoMob(mob, segundosDesdeUltimoFrame, invasao.grade); animarMob(mob, segundosDesdeUltimoFrame, tempo, false);
            if (mob.chegou && mob.vel < 0.05 || invasao.relogio > 40) { mob.saiu = true; removerMob(mob); } else restantes++;
          }
          if (!restantes) { removerTodosOsMobs(); invasao.fase = 'nenhuma'; invasao.dados = null; }
        }
        invasao.infoRelogio -= segundosDesdeUltimoFrame;
        if (invasao.infoRelogio <= 0) { invasao.infoRelogio = 1; atualizarInformacaoDeInatividade(); }
      };

      // Decide se uma invasão começa AGORA (usa só o relógio real e o que está salvo; seguro para chamar várias vezes)
      const verificarInvasao = function verificarInvasao(forcar = false) {
        if (!INVASOES_CONFIG.ativas) return false;   // Mark 8.2: monstros não destroem construções (sistema desligado)
        if (INVASAO_EM_CURSO.fase !== 'nenhuma' || estado.invasao.emAndamento) return false;
        const agora = Date.now(), configuracao = INVASOES_CONFIG, limite = configuracao.diasDeInatividade * DIA_EM_MS, inativo = agora - estado.atividade.ultima;
        if (!forcar && inativo < limite) return false;
        const janela = Math.max(0, Math.floor((inativo - limite) / (configuracao.intervaloEntreInvasoesDias * DIA_EM_MS))), chave = estado.atividade.ultima + ':' + janela;
        if (!forcar && estado.invasao.janela === chave) return false;           // esta janela já foi avaliada: recarregar a página não sorteia de novo
        estado.invasao.janela = chave;
        const alvos = configuracao.instalacoesElegiveis.filter(idDaArea => AREAS.some(areaDaLista => areaDaLista.id === idDaArea) && estado.niveis[idDaArea] > 0 && !instalacaoDestruida(idDaArea));   // Mark 8.2: lotes não construídos (nível 0) não são alvo
        if (!alvos.length || (!forcar && Math.random() > configuracao.probabilidadeDeAtaque)) { salvarProgresso(); return false; }
        const quantidade = Math.min(configuracao.maximoDeMobsSimultaneos, sortearEntre(configuracao.mobsPorInvasao[0], configuracao.mobsPorInvasao[1]));
        estado.invasao.emAndamento = { id: agora, alvo: sortearDaLista(alvos), tipos: Array.from({ length: quantidade }, () => sortearDaLista(configuracao.tiposDeMob)), iniciadaEm: agora };
        salvarProgresso();                                                     // salvo ANTES da animação: recarregar não duplica nem perde a invasão
        iniciarInvasao(estado.invasao.emAndamento);
        return true;
      };
      // Chamado uma vez ao abrir a fazenda
      const iniciarSistemaDeInvasoes = function iniciarSistemaDeInvasoes() {
        if (!INVASOES_CONFIG.ativas) return;           // Mark 8.2: desligado (ver INVASOES_CONFIG)
        const andamento = estado.invasao.emAndamento;
        if (andamento) {                                                       // a página foi fechada no meio de uma invasão: conclui sem repetir a animação
          if (AREAS.some(areaDaLista => areaDaLista.id === andamento.alvo) && !instalacaoDestruida(andamento.alvo)) aplicarDestruicao(andamento.alvo, true);
          else { estado.invasao.emAndamento = null; salvarProgresso(); }
          return;
        }
        if (!verificarInvasao()) {
          const dias = (Date.now() - estado.atividade.ultima) / DIA_EM_MS, limite = INVASOES_CONFIG.diasDeInatividade;
          if (dias >= limite - 1 && dias < limite) mostrarFaixaDeInvasao('⚠️ A fazenda está sozinha', 'Faz ' + dias.toFixed(1).replace('.', ',') + ' dias sem atividade. Depois de ' + limite + ' dias, criaturas podem atacar uma instalação.', 9000);
        }
      };
      document.addEventListener('visibilitychange', () => { if (!document.hidden) verificarInvasao(); });

      // ---- reparo ----
      const repararArea = function repararArea(idDaArea) {
        if (!instalacaoDestruida(idDaArea)) return;
        const custo = custoDeReparo(idDaArea);
        if (estado.xp < custo) { mostrarAviso('XP insuficiente para reparar (' + custo + ' XP).'); return; }
        estado.xp -= custo; delete estado.danos[idDaArea];
        registrarAtividade();                                                 // também salva
        reconstruirArea(idDaArea); focarCameraNaArea(idDaArea); desenharCards();
        mostrarAviso(nomeDaArea(idDaArea) + ' reconstruído! Nível ' + estado.niveis[idDaArea] + ' mantido. 🔧');
      };

      // ---- ferramentas de teste (painel "Tempo") e API para o console ----
      const atualizarInformacaoDeInatividade = function atualizarInformacaoDeInatividade() {
        if (!INVASOES_CONFIG.ativas) return;           // o texto do painel agora descreve os monstros noturnos (seção 30)
        const dias = (Date.now() - estado.atividade.ultima) / DIA_EM_MS, destruidas = Object.keys(estado.danos).length;
        const texto = 'Sem atividade há ' + dias.toFixed(dias < 1 ? 2 : 1).replace('.', ',') + ' dia(s) · limite ' + INVASOES_CONFIG.diasDeInatividade + ' · destruídas: ' + destruidas + (INVASAO_EM_CURSO.fase !== 'nenhuma' ? ' · invasão em curso' : '');
        if (texto !== INVASAO_EM_CURSO.infoTexto) { INVASAO_EM_CURSO.infoTexto = texto; selecionar('#invasao-info').textContent = texto; }
      };
      // Ferramenta de teste: volta a última atividade no tempo e força a verificação da invasão. Só funciona sem
      // outra invasão em curso.
      const simularInatividade = function simularInatividade(dias = INVASOES_CONFIG.diasDeInatividade) {
        if (INVASAO_EM_CURSO.fase !== 'nenhuma') return false;
        estado.atividade.ultima = Date.now() - dias * DIA_EM_MS - 1000; estado.invasao.janela = null; salvarProgresso();
        return verificarInvasao(true);
      };
      selecionar('#teste-invasao').onclick = () => { if (!simularInatividade()) mostrarAviso(INVASAO_EM_CURSO.fase !== 'nenhuma' ? 'Já há uma invasão em curso.' : 'Nenhuma instalação elegível para atacar.'); };
      selecionar('#teste-reparar').onclick = () => { for (const idDaArea of Object.keys(estado.danos)) { delete estado.danos[idDaArea]; reconstruirArea(idDaArea); } registrarAtividade(); desenharCards(); mostrarAviso('Todas as instalações foram reparadas (teste).'); };
      window.FarmEduInvasoes = { simular: simularInatividade, verificar: verificarInvasao, estado: () => ({ atividade: estado.atividade, danos: estado.danos, invasao: estado.invasao }), config: INVASOES_CONFIG };
      atualizarInformacaoDeInatividade();
      // (iniciarSistemaDeInvasoes() é chamada na seção 28, só depois que a tela de carregamento some: assim o aviso e as
      //  criaturas aparecem para o jogador, e não escondidos atrás da tela.)

      arquivoDaMontagemConcluido('26-invasoes.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
