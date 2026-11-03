      // ====================================================================================================
      // FARMEDU 3D — 26-invasoes.js (Fase 3B da refatoração: seção 26)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 26 — INVASÕES PELO CALENDÁRIO: LIBERAÇÃO, AVISO, SEQUÊNCIA, DESTRUIÇÃO E REPARO
      // Usa só o que está salvo e a data do aparelho (nenhum temporizador precisa ficar rodando com a página fechada).
      // Fases: aguardando → chegando → atacando → colapsando → saindo.
      // ====================================================================================================
      // Fazenda 8.4.1: as invasões seguem o calendário (dias úteis), não a atividade do jogador. O ciclo visual de dia e noite
      // NÃO participa da contagem.
      //   estado.calendarioDasInvasoes → liberação, último dia de invasão cumprido, avisos já mostrados e o deslocamento de teste
      //   estado.danos[id]             → { destruida, em, nivel } — separado de estado.niveis (o nível e o XP são preservados)
      //   estado.invasao               → { emAndamento, total, ultima }; emAndamento é salvo antes da animação
      //   estado.atividade.ultima      → última ação do jogador; continua registrada, mas não decide mais as invasões
      // DEFESA (8.4.1, etapa da defesa). Regras:
      //   · O calendário só libera e só ataca depois que o jogador viu o aviso do perigo e da defesa (janela #janela-defesa,
      //     estado.calendarioDasInvasoes.avisoDeDefesaVistoEm). A contagem dos dias de invasão começa no dia desse aviso.
      //   · As criaturas vão até a instalação e batem nela; a que tiver um trabalhador EM CAMPO a até defesa.raioDeReacaoDosMobs
      //     larga a instalação e o ataca (e o persegue até defesa.raioDePerseguicaoDosMobs). Quem é atacado revida.
      //   · Guardas em campo acorrem à invasão de qualquer ponto da fazenda. Fazendeiros lutam só com criaturas dentro do raio
      //     de defesa da classe (o mesmo usado contra os monstros noturnos). Quem foi mandado para casa (seção 29) não luta e
      //     não é atacado.
      //   · Dano da instalação: avança só com criaturas batendo nela (proporção do total da invasão); 100% → desaba (destruição e
      //     reparo como antes). Todas as criaturas derrotadas → invasão repelida, nada é destruído.
      //   · Trabalhador derrotado fica "morto" como nos combates noturnos (recuperação no menu Equipe).
      //   · Fechar a página no meio: a invasão continua ao reabrir, com as criaturas que restavam e o dano já acumulado
      //     (estado.invasao.emAndamento.derrotados / .progresso). Antes da defesa, ela era dada como perdida ao reabrir.
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
        // defesa: as criaturas já derrotadas (invasão retomada ao reabrir) não voltam; cada uma guarda o índice do seu tipo
        const tipos = dadosDaInvasao.tipos.slice(0, configuracao.maximoDeMobsSimultaneos).map((tipo, indiceDoTipo) => ({ tipo, indiceDoTipo })).filter(({ indiceDoTipo }) => !(dadosDaInvasao.derrotados || []).includes(indiceDoTipo));
        if (!tipos.length) return;
        const ataque = posicoesDeAtaque(dadosDaInvasao.alvo, tipos.length, grade);
        // entradas na floresta mais próximas da instalação alvo (chegada em poucos segundos, sem atravessar a fazenda inteira)
        const distanciaAteOAlvo = celula => { const [posicaoX, posicaoZ] = grade.centro(celula); return Math.hypot(posicaoX - area.posicao.x, posicaoZ - area.posicao.z); };
        let entradasPerto = INVASAO_EM_CURSO.entradas.filter(celula => { const profundidade = distanciaAteOAlvo(celula); return profundidade >= 10 && profundidade <= 34; });
        if (entradasPerto.length < 5) entradasPerto = INVASAO_EM_CURSO.entradas.slice().sort((celulaA, celulaB) => distanciaAteOAlvo(celulaA) - distanciaAteOAlvo(celulaB)).slice(0, 60);
        for (let tentativa = 0; tentativa < 12 && !INVASAO_EM_CURSO.mobs.length; tentativa++) {
          const [extensaoX, extensaoZ] = grade.centro(sortearDaLista(entradasPerto));
          const primeiro = grade.acharCaminho(extensaoX, extensaoZ, ataque[0][0], ataque[0][1]);
          if (!primeiro) continue;                                                // entrada sem caminho até o alvo: tenta outra
          tipos.forEach(({ tipo, indiceDoTipo }, indice) => {
            const angulo = indice * 2.4, escalaX = extensaoX + Math.cos(angulo) * 0.9 * (indice > 0), escalaZ = extensaoZ + Math.sin(angulo) * 0.9 * (indice > 0);
            const ponto = grade.livre(escalaX, escalaZ) ? [escalaX, escalaZ] : [extensaoX, extensaoZ], caminho = indice === 0 ? primeiro : grade.acharCaminho(ponto[0], ponto[1], ataque[indice][0], ataque[indice][1]);
            if (!caminho) return;
            const modelo = criarMob(tipo); cena.add(modelo.raiz);
            INVASAO_EM_CURSO.mobs.push({ tipo, modelo, x: ponto[0], z: ponto[1], rot: Math.atan2(caminho[0][0] - ponto[0], caminho[0][1] - ponto[1]), vel: 0, velAlvo: 0, velMax: configuracao.velocidadeDosMobs * (0.92 + Math.random() * 0.16),
              caminho, indice: 0, passo: Math.random() * 6, fase: indice * 1.7, entrada: [ponto[0], ponto[1]], ataque: ataque[indice], chegou: false, saiu: false, parado: 0, ux: ponto[0], uz: ponto[1],
              // defesa: atributos de combate dos monstros noturnos do mesmo tipo; daInvasao liga os ganchos de ferirMonstro (seção 30a)
              daInvasao: true, indiceDoTipo, vida: MONSTROS_NOTURNOS_CONFIG.tipos[tipo].vida, vidaMaxima: MONSTROS_NOTURNOS_CONFIG.tipos[tipo].vida, morto: false, tempoMorto: 0,
              alvo: null, decisao: Math.random() * 0.5, recarga: 0.6, chamadoPeloTeste: !!dadosDaInvasao.teste, barra: criarBarraDeVida(0xe74c3c) });
          });
        }
        INVASAO_EM_CURSO.centro = [area.posicao.x, area.posicao.z];
      };
      // Tira o mob da cena e libera suas geometrias.
      const removerMob = function removerMob(mob) { cena.remove(mob.modelo.raiz); mob.modelo.raiz.traverse(objeto => { if (objeto.geometry) objeto.geometry.dispose(); }); };
      // Tira da cena uma criatura da invasão (modelo e barra de vida), uma vez só.
      const removerMobDaInvasao = function removerMobDaInvasao(mob) { if (mob.removido) return; removerMob(mob); if (mob.barra) removerBarraDeVida(mob.barra); mob.removido = true; mob.saiu = true; };
      // Remove todos os mobs da invasão.
      const removerTodosOsMobs = function removerTodosOsMobs() { INVASAO_EM_CURSO.mobs.forEach(removerMobDaInvasao); INVASAO_EM_CURSO.mobs.length = 0; };

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

      // ---- defesa: combate das criaturas da invasão ----
      // Há combate enquanto as criaturas chegam ou batem na instalação (não ao desabar nem ao irem embora).
      const invasaoComCombate = () => INVASAO_EM_CURSO.fase === 'chegando' || INVASAO_EM_CURSO.fase === 'atacando';
      // Criatura da invasão viva mais próxima do ponto (a até "raio"); usada pelos trabalhadores (seção 29).
      const mobDaInvasaoMaisProximo = function mobDaInvasaoMaisProximo(posicaoX, posicaoZ, raio) {
        if (!invasaoComCombate()) return null;
        let melhor = null, menor = raio;
        for (const mob of INVASAO_EM_CURSO.mobs) { if (mob.morto || mob.removido) continue; const distancia = Math.hypot(mob.x - posicaoX, mob.z - posicaoZ); if (distancia < menor) { menor = distancia; melhor = mob; } }
        return melhor;
      };
      const criaturasRestantesDaInvasao = () => INVASAO_EM_CURSO.mobs.filter(mob => !mob.morto).length;
      // Larga o trabalhador e volta para o seu ponto de ataque da instalação.
      const largarAlvoDoMob = function largarAlvoDoMob(mob) {
        mob.alvo = null; mob.chegou = false; mob.indice = 0; mob.parado = 0; mob.ux = mob.x; mob.uz = mob.z;
        mob.caminho = INVASAO_EM_CURSO.grade.acharCaminho(mob.x, mob.z, mob.ataque[0], mob.ataque[1]) || [mob.ataque];
      };
      // Chamado por ferirMonstro (seção 30a) quando uma criatura da invasão é derrotada: fica registrada no save, para não voltar.
      const registrarMobDaInvasaoDerrotado = function registrarMobDaInvasaoDerrotado(mob) {
        const andamento = estado.invasao.emAndamento;
        if (andamento && andamento.id === INVASAO_EM_CURSO.dados.id && !andamento.derrotados.includes(mob.indiceDoTipo)) { andamento.derrotados.push(mob.indiceDoTipo); salvarProgresso(); }
        atualizarPaineisDaMark82(false);
      };
      // Uma criatura derrotada cai e some (o modelo sai da cena; ela continua na lista como derrotada).
      const animarQuedaDoMob = function animarQuedaDoMob(mob, segundosDesdeUltimoFrame) {
        if (mob.removido) return;
        mob.tempoMorto += segundosDesdeUltimoFrame; mob.modelo.corpo.rotation.x = -Math.min(1, mob.tempoMorto * 2.5) * Math.PI / 2;
        if (mob.tempoMorto > 1.4) removerMobDaInvasao(mob);
      };
      // Um quadro de uma criatura viva na fase de combate. Devolve 'lutando', 'andando' (indo para a instalação) ou 'batendo'.
      const atualizarMobDaInvasao = function atualizarMobDaInvasao(mob, segundosDesdeUltimoFrame, tempo, invasao) {
        const atributos = MONSTROS_NOTURNOS_CONFIG.tipos[mob.tipo], noturnos = MONSTROS_NOTURNOS_CONFIG, defesa = INVASOES_CONFIG.defesa, grade = invasao.grade;
        if (mob.alvo && (!trabalhadorDisponivel(mob.alvo) || Math.hypot(mob.alvo.x - mob.x, mob.alvo.z - mob.z) > defesa.raioDePerseguicaoDosMobs)) largarAlvoDoMob(mob);
        mob.decisao -= segundosDesdeUltimoFrame;
        if (mob.decisao <= 0) {
          mob.decisao = noturnos.segundosEntreDecisoes;
          if (!mob.alvo) mob.alvo = trabalhadorMaisProximo(mob.x, mob.z, defesa.raioDeReacaoDosMobs);
          const alvo = mob.alvo, destino = mob.caminho && mob.caminho[mob.caminho.length - 1];
          if (alvo && Math.hypot(alvo.x - mob.x, alvo.z - mob.z) > noturnos.alcanceDoAtaque && (!mob.caminho || mob.indice >= mob.caminho.length || !destino || Math.hypot(destino[0] - alvo.x, destino[1] - alvo.z) > 1.5)) {
            mob.caminho = grade.acharCaminho(mob.x, mob.z, alvo.x, alvo.z) || [[alvo.x, alvo.z]]; mob.indice = 0;
          }
        }
        let situacao = 'andando', golpeando = false;
        if (mob.alvo) {
          const alvo = mob.alvo; situacao = 'lutando';
          if (Math.hypot(alvo.x - mob.x, alvo.z - mob.z) <= noturnos.alcanceDoAtaque) {        // ao alcance: golpeia (a precisão decide o acerto)
            golpeando = true; mob.velAlvo = 0; mob.rot += normalizarAngulo(Math.atan2(alvo.x - mob.x, alvo.z - mob.z) - mob.rot) * Math.min(1, segundosDesdeUltimoFrame * 8);
            mob.recarga -= segundosDesdeUltimoFrame;
            if (mob.recarga <= 0) { mob.recarga = noturnos.segundosEntreAtaques; if (Math.random() < atributos.precisao) ferirTrabalhador(alvo, Math.round(sortearReal(...atributos.dano)), mob); }
          } else andarMob(mob, segundosDesdeUltimoFrame, grade);
        } else if (!mob.chegou) { mob.chegou = andarMob(mob, segundosDesdeUltimoFrame, grade); if (mob.chegou) situacao = 'batendo'; }
        else situacao = 'batendo';
        if (situacao === 'batendo') {                                                  // no ponto de ataque: encara a instalação
          mob.velAlvo = 0; golpeando = invasao.fase === 'atacando';
          mob.rot += Math.max(-4 * segundosDesdeUltimoFrame, Math.min(4 * segundosDesdeUltimoFrame, normalizarAngulo(Math.atan2(invasao.centro[0] - mob.x, invasao.centro[1] - mob.z) - mob.rot)));
        }
        passoDoMob(mob, segundosDesdeUltimoFrame, grade); animarMob(mob, segundosDesdeUltimoFrame, tempo, golpeando);
        posicionarBarraDeVida(mob.barra, mob.x, 2.15, mob.z, mob.vida / mob.vidaMaxima);
        return situacao;
      };
      // Todas as criaturas derrotadas: nada é destruído. A invasão conta como cumprida (estado.invasao.repelidas).
      const repelirInvasao = function repelirInvasao() {
        const invasao = INVASAO_EM_CURSO, idDaArea = invasao.dados.alvo, area = AREAS.find(areaDaLista => areaDaLista.id === idDaArea);
        grupoDaArea[idDaArea].position.set(area.posicao.x, 0, area.posicao.z);
        estado.invasao.emAndamento = null; estado.invasao.total = (estado.invasao.total | 0) + 1; estado.invasao.repelidas = (estado.invasao.repelidas | 0) + 1; estado.invasao.ultima = Date.now();
        salvarProgresso();
        invasao.fase = 'repelida'; invasao.relogio = 0;
        mostrarFaixaDeInvasao('🛡️ Invasão repelida!', 'A equipe derrotou todas as criaturas. ' + nomeDaArea(idDaArea) + ' não foi destruído.', 12000);
        desenharCards(); atualizarPaineisDaMark82(true); tocarEfeito('invasaoRepelida');   // 8.4.1: efeito sonoro
      };
      // Texto da invasão em curso para o painel Equipe (vazio sem combate).
      const textoDaInvasaoEmCurso = function textoDaInvasaoEmCurso() {
        if (!invasaoComCombate() && INVASAO_EM_CURSO.fase !== 'aguardando') return '';
        return '⚔️ Invasão em ' + nomeDaArea(INVASAO_EM_CURSO.dados.alvo) + ': ' + (INVASAO_EM_CURSO.fase === 'aguardando' ? 'as criaturas estão chegando' : criaturasRestantesDaInvasao() + ' criatura(s) · dano da instalação ' + Math.floor(INVASAO_EM_CURSO.progresso * 100) + '%');
      };

      // Começa a sequência visual: mostra o aviso, foca a câmera no alvo e entra na fase "aguardando" (os mobs
      // surgem depois do atraso configurado). Com "retomada", é uma invasão que estava em andamento quando a página fechou.
      const iniciarInvasao = function iniciarInvasao(dados, retomada) {
        INVASAO_EM_CURSO.dados = dados; INVASAO_EM_CURSO.fase = 'aguardando'; INVASAO_EM_CURSO.relogio = -INVASOES_CONFIG.atrasoAposCarregarSegundos; // dá tempo de o jogador ver o aviso antes das criaturas surgirem
        INVASAO_EM_CURSO.total = Math.min(INVASOES_CONFIG.maximoDeMobsSimultaneos, dados.tipos.length); INVASAO_EM_CURSO.progresso = dados.progresso || 0;
        if (retomada) mostrarFaixaDeInvasao('🧟 A invasão continua!', 'As criaturas que restavam voltaram para: ' + nomeDaArea(dados.alvo) + ' (dano ' + Math.floor(INVASAO_EM_CURSO.progresso * 100) + '%). Defenda a instalação!', 12000);
        else mostrarFaixaDeInvasao('🧟 A fazenda está sob ataque!', (dados.teste ? 'Invasão de teste. ' : 'Hoje é dia de invasão. ') + 'Criaturas da floresta estão indo para: ' + nomeDaArea(dados.alvo) + '. Guardas em campo vão defender.', 12000);
        focarCameraNaArea(dados.alvo); tocarEfeito('alarmeDeInvasao');   // 8.4.1: efeito sonoro
      };
      // aplica o resultado no estado salvo (a destruição é registrada separadamente de nível e XP)
      const aplicarDestruicao = function aplicarDestruicao(idDaArea, mensagemDeRetorno) {
        estado.danos[idDaArea] = { destruida: true, em: Date.now(), nivel: estado.niveis[idDaArea] };
        estado.invasao.emAndamento = null; estado.invasao.total = (estado.invasao.total | 0) + 1; estado.invasao.ultima = Date.now();
        salvarProgresso();
        reconstruirArea(idDaArea); tocarEfeito('desabamento');   // 8.4.1: efeito sonoro
        desenharCards();
        mostrarFaixaDeInvasao('💥 ' + nomeDaArea(idDaArea) + ' foi destruído!', (mensagemDeRetorno ? 'Enquanto você estava fora, criaturas atacaram a fazenda. ' : '') + 'O nível ' + estado.niveis[idDaArea] + ' foi preservado: repare por ' + custoDeReparo(idDaArea) + ' XP.', 14000);
      };
      // Máquina de estados da invasão, chamada a cada quadro: aguardando → chegando → atacando → colapsando →
      // saindo. Com nenhuma invasão ativa, confere o calendário a cada 30 s.
      const atualizarInvasao = function atualizarInvasao(segundosDesdeUltimoFrame, tempo) {
        PoeiraDeAtaque.atualizar(segundosDesdeUltimoFrame);
        const configuracao = INVASOES_CONFIG, invasao = INVASAO_EM_CURSO;
        if (invasao.fase === 'nenhuma') {                                              // conferência periódica do calendário (aba aberta na virada do dia)
          invasao.checagem += segundosDesdeUltimoFrame; if (invasao.checagem >= configuracao.intervaloDeVerificacaoSegundos) { invasao.checagem = 0; verificarInvasao(); }
        } else if (invasao.fase === 'aguardando') {
          invasao.relogio += segundosDesdeUltimoFrame;
          if (invasao.relogio >= 0) {
            invasao.relogio = 0; gerarMobs();
            if (invasao.mobs.length) invasao.fase = 'chegando';
            else if ((invasao.dados.derrotados || []).length >= invasao.total) repelirInvasao();   // retomada sem criaturas restantes
            else invasao.fase = 'colapsando';                                                     // nenhuma entrada com caminho: comportamento original
          }
        } else if (invasao.fase === 'chegando' || invasao.fase === 'atacando') {
          // defesa: cada criatura luta, anda até a instalação ou bate nela; o dano só avança com criaturas batendo
          invasao.relogio += segundosDesdeUltimoFrame; invasao.dica = (invasao.dica || 0) - segundosDesdeUltimoFrame;
          const grupoDaInstalacao = grupoDaArea[invasao.dados.alvo], area = AREAS.find(areaDaLista => areaDaLista.id === invasao.dados.alvo), batendo = [];
          let andando = 0;
          for (const mob of invasao.mobs) {
            if (mob.morto) { animarQuedaDoMob(mob, segundosDesdeUltimoFrame); continue; }
            const situacao = atualizarMobDaInvasao(mob, segundosDesdeUltimoFrame, tempo, invasao);
            if (situacao === 'batendo') batendo.push(mob); else if (situacao === 'andando') andando++;
          }
          if (!criaturasRestantesDaInvasao()) repelirInvasao();
          else {
            if (invasao.fase === 'chegando' && (!andando || invasao.relogio > configuracao.tempoMaximoDeChegadaSegundos)) {
              invasao.fase = 'atacando'; invasao.relogio = 0; invasao.dica = 0;
              for (const mob of invasao.mobs) if (!mob.morto && !mob.alvo && !mob.chegou) { mob.chegou = true; mob.velAlvo = 0; }   // travada no caminho: ataca de onde está (como antes)
            }
            if (invasao.fase === 'atacando') {
              invasao.progresso = Math.min(1, invasao.progresso + segundosDesdeUltimoFrame / configuracao.duracaoDoAtaqueSegundos * batendo.length / invasao.total);
              if (estado.invasao.emAndamento) { estado.invasao.emAndamento.progresso = invasao.progresso; marcarParaSalvar(); }
              if (invasao.dica <= 0) {                                                    // poeira e impacto discretos, no máximo a cada 0,4 s
                invasao.dica = 0.4;
                for (const mob of batendo) { const distancia = Math.hypot(invasao.centro[0] - mob.x, invasao.centro[1] - mob.z) || 1; PoeiraDeAtaque.emitir(mob.x + (invasao.centro[0] - mob.x) / distancia * 1.0, 0.2, mob.z + (invasao.centro[1] - mob.z) / distancia * 1.0, 2, 0.8); }
              }
              const tremor = batendo.length ? 0.04 * Math.min(1, invasao.relogio / 2) : 0;
              grupoDaInstalacao.position.x = area.posicao.x + Math.sin(tempo * 45) * tremor; grupoDaInstalacao.position.z = area.posicao.z + Math.cos(tempo * 38) * tremor;
              if (invasao.progresso >= 1) { invasao.fase = 'colapsando'; invasao.relogio = 0; invasao.estourou = false; }
            }
          }
        } else if (invasao.fase === 'repelida') {                                        // as derrotadas terminam de cair; depois a invasão acaba
          invasao.relogio += segundosDesdeUltimoFrame;
          for (const mob of invasao.mobs) animarQuedaDoMob(mob, segundosDesdeUltimoFrame);
          if (invasao.relogio > 1.6) { removerTodosOsMobs(); invasao.fase = 'nenhuma'; invasao.dados = null; }
        } else if (invasao.fase === 'colapsando') {
          invasao.relogio += segundosDesdeUltimoFrame;
          const grupoDaInstalacao = grupoDaArea[invasao.dados.alvo], area = AREAS.find(areaDaLista => areaDaLista.id === invasao.dados.alvo), [metadeX, metadeZ] = METADE_DO_TAMANHO_DA_AREA[invasao.dados.alvo];
          if (!invasao.estourou) { invasao.estourou = true; for (let indice = 0; indice < 8; indice++) PoeiraDeAtaque.emitir(area.posicao.x + (Math.random() - 0.5) * metadeX * 1.4, 0.3, area.posicao.z + (Math.random() - 0.5) * metadeZ * 1.4, 4, 1.4); }
          grupoDaInstalacao.scale.y = Math.max(0.15, 1 - invasao.relogio / 0.9 * 0.85); grupoDaInstalacao.position.x = area.posicao.x + Math.sin(tempo * 60) * 0.06; grupoDaInstalacao.position.z = area.posicao.z;
          for (const mob of invasao.mobs) { if (mob.morto) { animarQuedaDoMob(mob, segundosDesdeUltimoFrame); continue; } mob.velAlvo = 0; passoDoMob(mob, segundosDesdeUltimoFrame, invasao.grade); animarMob(mob, segundosDesdeUltimoFrame, tempo, true); }
          if (invasao.relogio >= 0.9) {
            grupoDaInstalacao.position.set(area.posicao.x, 0, area.posicao.z);
            aplicarDestruicao(invasao.dados.alvo, false);
            grupoDaInstalacao.scale.set(1, 1, 1);                                                // a ruína já foi construída; sem "pulo" de evolução
            invasao.mobs.forEach(mob => { if (mob.morto) { removerMobDaInvasao(mob); return; } mob.alvo = null; mob.estado = 'saindo'; mob.chegou = false; mob.indice = 0; mob.caminho = invasao.grade.acharCaminho(mob.x, mob.z, mob.entrada[0], mob.entrada[1]); mob.parado = 0; });
            invasao.fase = 'saindo'; invasao.relogio = 0;
          }
        } else if (invasao.fase === 'saindo') {
          invasao.relogio += segundosDesdeUltimoFrame; let restantes = 0;
          for (const mob of invasao.mobs) {
            if (mob.saiu) continue;
            if (mob.morto) { animarQuedaDoMob(mob, segundosDesdeUltimoFrame); if (!mob.removido) restantes++; continue; }   // derrubada por um trabalhador enquanto ia embora
            if (!mob.chegou) mob.chegou = !mob.caminho || andarMob(mob, segundosDesdeUltimoFrame, invasao.grade);
            if (mob.chegou) mob.velAlvo = 0;                                    // chegou à saída: para e some
            passoDoMob(mob, segundosDesdeUltimoFrame, invasao.grade); animarMob(mob, segundosDesdeUltimoFrame, tempo, false);
            posicionarBarraDeVida(mob.barra, mob.x, 2.15, mob.z, mob.vida / mob.vidaMaxima);
            if (mob.chegou && mob.vel < 0.05 || invasao.relogio > 40) removerMobDaInvasao(mob); else restantes++;
          }
          if (!restantes) { removerTodosOsMobs(); invasao.fase = 'nenhuma'; invasao.dados = null; }
        }
        invasao.infoRelogio -= segundosDesdeUltimoFrame;
        if (invasao.infoRelogio <= 0) { invasao.infoRelogio = 1; atualizarInformacaoDasInvasoes(); }
      };

      // ---- Calendário (Fazenda 8.4.1) ----
      // Os dias são números inteiros: dias desde 01/01/1970 no calendário LOCAL do aparelho (a virada é à meia-noite local).
      const diaDoCalendario = momento => { const data = new Date(momento); return Math.round(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()) / DIA_EM_MS); };
      // "Hoje" das invasões: a data real mais o deslocamento do botão de teste (o relógio das plantações não entra aqui).
      const hojeNoCalendario = () => diaDoCalendario(Date.now()) + estado.calendarioDasInvasoes.deslocamentoDeTesteDias;
      const ehDiaUtil = dia => { const diaDaSemana = ((dia + 4) % 7 + 7) % 7; return diaDaSemana >= 1 && diaDaSemana <= 5; };   // 01/01/1970 foi uma quinta-feira
      const diasUteisEntre = (depoisDe, ate) => { let total = 0; for (let dia = depoisDe + 1; dia <= ate; dia++) if (ehDiaUtil(dia)) total++; return total; };
      const enesimoDiaUtilDepois = (depoisDe, quantidade) => { let dia = depoisDe; while (quantidade > 0) { dia++; if (ehDiaUtil(dia)) quantidade--; } return dia; };
      const NOMES_DOS_DIAS_DA_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
      const textoDoDia = dia => { const data = new Date(dia * DIA_EM_MS); return NOMES_DOS_DIAS_DA_SEMANA[data.getUTCDay()] + ', ' + String(data.getUTCDate()).padStart(2, '0') + '/' + String(data.getUTCMonth() + 1).padStart(2, '0'); };
      // Dias de invasão: o 2º, o 4º, o 6º... dia útil depois da liberação. Devolve o mais recente até "hoje" (null se ainda
      // não houve nenhum) e o próximo depois de "hoje".
      const diasDeInvasaoAoRedor = function diasDeInvasaoAoRedor(hoje) {
        const liberadoEm = estado.calendarioDasInvasoes.liberadoEm, passo = INVASOES_CONFIG.diasUteisEntreInvasoes, cumpridos = Math.floor(diasUteisEntre(liberadoEm, hoje) / passo);
        return { ultimo: cumpridos ? enesimoDiaUtilDepois(liberadoEm, cumpridos * passo) : null, proximo: enesimoDiaUtilDepois(liberadoEm, (cumpridos + 1) * passo) };
      };
      // Há invasão pendente quando o dia de invasão mais recente ainda não foi cumprido. Dias de invasão anteriores que o
      // jogador perdeu com o jogo fechado não se acumulam: no máximo UMA fica pendente.
      const invasaoPendente = function invasaoPendente(hoje) {
        const calendario = estado.calendarioDasInvasoes, { ultimo } = diasDeInvasaoAoRedor(hoje);
        return ultimo !== null && ultimo > (calendario.ultimoDiaAtendido === null ? calendario.liberadoEm : calendario.ultimoDiaAtendido) ? ultimo : null;
      };
      // ---- Pausa do calendário (rebalanceamento, etapa 1; chave INVASOES_CONFIG.calendarioPausado) ----
      // Com a pausa, o calendário não libera, não avisa e não ataca; as invasões de teste, os reparos e a conclusão de uma invasão
      // já em andamento não dependem dele e continuam valendo. Um save que JÁ estava liberado guarda em "pausadoEm" o primeiro dia
      // em que foi aberto em pausa. Ao retomar (chave em false), os dias de invasão que caíram durante a pausa são dados como
      // cumpridos: ultimoDiaAtendido passa a ser hoje, então nada é cobrado de forma retroativa e o próximo dia de invasão segue a
      // grade original (o 2º, o 4º... dia útil depois da liberação). Saves que chegaram ao nível 2 durante a pausa são liberados
      // no dia em que o jogo for aberto já sem pausa (mesma regra dos saves de antes do calendário, em iniciarSistemaDeInvasoes).
      const calendarioPausado = () => INVASOES_CONFIG.calendarioPausado === true;
      // Registra a pausa ou aplica a retomada num save liberado. Devolve true enquanto o calendário estiver pausado.
      const acompanharPausaDoCalendario = function acompanharPausaDoCalendario(hoje) {
        const calendario = estado.calendarioDasInvasoes;
        if (calendarioPausado()) {
          if (calendario.liberadoEm !== null && calendario.pausadoEm === null) { calendario.pausadoEm = hoje; salvarProgresso(); }
          return true;
        }
        if (calendario.pausadoEm !== null) {                                   // retomada: a pausa terminou desde a última verificação
          calendario.ultimoDiaAtendido = Math.max(calendario.ultimoDiaAtendido ?? calendario.liberadoEm, hoje);
          calendario.pausadoEm = null; salvarProgresso();
        }
        return false;
      };
      // ---- Aviso do perigo e da defesa (8.4.1, etapa da defesa) ----
      // Aparece no momento em que as invasões seriam liberadas (ou, num save já liberado antes desta versão, na primeira
      // conferência do calendário sem pausa). Fechar a janela, por qualquer botão ou pela tecla Esc, conta como aviso recebido:
      // só então o calendário libera, e a contagem dos dias de invasão começa nesse dia (a 1ª invasão vem 2 dias úteis depois,
      // com o aviso de véspera). "Invasão agora" (Modo desenvolvedor) é teste e não depende deste aviso.
      const janelaDaDefesa = selecionar('#janela-defesa');
      const textoDoAvisoDeDefesa = () => {
        const guarda = CLASSES_DE_TRABALHADORES.guarda, fazendeiro = CLASSES_DE_TRABALHADORES.fazendeiro, configuracao = INVASOES_CONFIG;
        return `<p>A fazenda cresceu e chamou a atenção das criaturas da floresta. A cada <b>${configuracao.diasUteisEntreInvasoes} dias úteis</b>, ${configuracao.mobsPorInvasao[0]} a ${configuracao.mobsPorInvasao[1]} criaturas atacam uma instalação (criações, celeiro ou maquinário). Você é avisado no dia útil anterior.</p>`
          + `<p>Se a instalação desabar, o nível é mantido, mas ela fica destruída até ser reparada (${configuracao.custoDeReparoPorNivel.join(' / ')} XP, conforme o nível).</p>`
          + `<h4>Como se defender</h4><ul class="tutorial-lista"><li><b>${guarda.icone} Guardas</b> (${guarda.custo} XP, no menu 👷 Equipe) correm até a instalação atacada, de qualquer ponto da fazenda.</li>`
          + `<li><b>${fazendeiro.icone} Fazendeiros</b> só lutam com criaturas que chegam perto deles.</li>`
          + `<li>Quem for mandado <b>🏠 para casa</b> fica protegido, mas não defende.</li>`
          + `<li>Derrote todas as criaturas e nada é destruído. Enquanto elas lutam com a equipe, não batem na instalação.</li>`
          + `<li>Trabalhador derrotado pode ser recuperado com XP; melhorar vida, dano e precisão ajuda a vencer.</li></ul>`;
      };
      const abrirAvisoDeDefesa = function abrirAvisoDeDefesa() {
        if (!janelaDaDefesa.hidden) return;
        selecionar('#texto-defesa').innerHTML = textoDoAvisoDeDefesa(); janelaDaDefesa.hidden = false;
        if (document.querySelector(':focus-visible')) selecionar('#defesa-entendi').focus();
      };
      // Registra o aviso, (re)começa a contagem do calendário hoje e libera as invasões. "abrirEquipe" leva ao menu Equipe.
      const confirmarAvisoDeDefesa = function confirmarAvisoDeDefesa(abrirEquipe) {
        if (janelaDaDefesa.hidden) return;
        janelaDaDefesa.hidden = true;
        const calendario = estado.calendarioDasInvasoes;
        Object.assign(calendario, { avisoDeDefesaVistoEm: hojeNoCalendario(), liberadoEm: null, ultimoDiaAtendido: null, avisoMostradoPara: null, esperaAvisadaEm: null, pausadoEm: null });
        salvarProgresso(); liberarInvasoes();
        if (abrirEquipe) { if (painelDaEquipe.hidden) alternarPainel(painelDaEquipe, botaoDaEquipe); atualizarPaineisDaMark82(true); }
      };
      selecionar('#defesa-entendi').onclick = () => confirmarAvisoDeDefesa(false);
      selecionar('#fechar-defesa').onclick = () => confirmarAvisoDeDefesa(false);
      selecionar('#defesa-equipe').onclick = () => confirmarAvisoDeDefesa(true);
      janelaDaDefesa.addEventListener('keydown', evento => { evento.stopPropagation(); if (evento.key === 'Escape') confirmarAvisoDeDefesa(false); });
      const avisoDeDefesaVisto = () => estado.calendarioDasInvasoes.avisoDeDefesaVistoEm !== null;

      // Libera as invasões (uma vez só). A contagem começa no dia da liberação: nada é cobrado retroativamente.
      // Defesa: sem o aviso do perigo e da defesa, mostra o aviso e NÃO libera (a liberação acontece ao fechar o aviso).
      const liberarInvasoes = function liberarInvasoes() {
        const calendario = estado.calendarioDasInvasoes;
        if (!INVASOES_CONFIG.ativas || calendarioPausado() || calendario.liberadoEm !== null) return;
        if (!avisoDeDefesaVisto()) { abrirAvisoDeDefesa(); return; }
        const hoje = hojeNoCalendario();
        calendario.liberadoEm = hoje; calendario.ultimoDiaAtendido = hoje; salvarProgresso();
        mostrarFaixaDeInvasao('🧟 Invasões liberadas', 'A fazenda cresceu e chamou a atenção das criaturas da floresta. A cada ' + INVASOES_CONFIG.diasUteisEntreInvasoes + ' dias úteis elas atacam uma instalação, com aviso no dia útil anterior. A primeira será na ' + textoDoDia(diasDeInvasaoAoRedor(hoje).proximo) + '.', 14000);
      };
      // Chamado pela seção 32 sempre que uma área sobe de nível: a primeira evolução do nível 1 para o 2 libera as invasões.
      const aoEvoluirArea = function aoEvoluirArea(idDaArea, nivelAnterior) { if (nivelAnterior === 1) liberarInvasoes(); };
      // Sorteia o alvo e as criaturas, salva a invasão ANTES da animação (recarregar não duplica nem perde) e começa a sequência.
      const comecarInvasao = function comecarInvasao(teste) {
        const configuracao = INVASOES_CONFIG, agora = Date.now();
        const alvos = configuracao.instalacoesElegiveis.filter(idDaArea => AREAS.some(areaDaLista => areaDaLista.id === idDaArea) && estado.niveis[idDaArea] > 0 && !instalacaoDestruida(idDaArea));   // Mark 8.2: lotes não construídos (nível 0) não são alvo
        if (!alvos.length) { salvarProgresso(); return false; }
        const quantidade = Math.min(configuracao.maximoDeMobsSimultaneos, sortearEntre(configuracao.mobsPorInvasao[0], configuracao.mobsPorInvasao[1]));
        estado.invasao.emAndamento = { id: agora, alvo: sortearDaLista(alvos), tipos: Array.from({ length: quantidade }, () => sortearDaLista(configuracao.tiposDeMob)), iniciadaEm: agora, teste: !!teste, derrotados: [], progresso: 0 };
        salvarProgresso();
        iniciarInvasao(estado.invasao.emAndamento);
        return true;
      };
      // Confere o calendário (seguro para chamar várias vezes): cumpre a invasão pendente em dia útil, adia a do fim de semana e
      // mostra o aviso no dia útil anterior ao próximo dia de invasão. Devolve true se uma invasão começou.
      const verificarInvasao = function verificarInvasao() {
        const calendario = estado.calendarioDasInvasoes;
        if (!INVASOES_CONFIG.ativas || calendario.liberadoEm === null || INVASAO_EM_CURSO.fase !== 'nenhuma' || estado.invasao.emAndamento) return false;
        const hoje = hojeNoCalendario();
        if (acompanharPausaDoCalendario(hoje)) return false;                  // pausado: sem aviso, sem ataque e sem pendência
        if (!avisoDeDefesaVisto()) { abrirAvisoDeDefesa(); return false; }     // save liberado antes da defesa: primeiro o aviso, sem ataque
        const pendente = invasaoPendente(hoje);
        if (pendente !== null) {
          if (!ehDiaUtil(hoje)) {                                              // fim de semana: a pendente espera o próximo dia útil
            if (calendario.esperaAvisadaEm !== hoje) {
              calendario.esperaAvisadaEm = hoje; salvarProgresso();
              mostrarFaixaDeInvasao('⏳ Invasão adiada', 'Uma invasão ficou pendente. As criaturas não atacam no fim de semana: ela acontece na ' + textoDoDia(enesimoDiaUtilDepois(hoje, 1)) + '.', 10000);
            }
            return false;
          }
          calendario.ultimoDiaAtendido = pendente;                           // cumprida (sem alvo possível, o dia passa sem ataque)
          if (comecarInvasao(false)) return true;
          mostrarFaixaDeInvasao('🌲 As criaturas foram embora', 'Hoje era dia de invasão, mas as criaturas da floresta não encontraram nenhuma instalação para atacar.', 9000);
          return false;
        }
        const { proximo } = diasDeInvasaoAoRedor(hoje);
        if (ehDiaUtil(hoje) && enesimoDiaUtilDepois(hoje, 1) === proximo && calendario.avisoMostradoPara !== proximo) {   // hoje é o dia útil anterior
          calendario.avisoMostradoPara = proximo; salvarProgresso();
          mostrarFaixaDeInvasao('⚠️ Invasão a caminho', 'As criaturas da floresta vão atacar uma instalação ' + (proximo === hoje + 1 ? 'amanhã' : 'na ' + textoDoDia(proximo)) + '.', 12000);
        }
        return false;
      };
      // Chamado uma vez ao abrir a fazenda
      const iniciarSistemaDeInvasoes = function iniciarSistemaDeInvasoes() {
        if (!INVASOES_CONFIG.ativas) return;           // desligado (ver INVASOES_CONFIG)
        // pausa/retomada do calendário registrada já ao abrir: o caminho da invasão em andamento (abaixo) não passa por verificarInvasao
        if (estado.calendarioDasInvasoes.liberadoEm !== null) acompanharPausaDoCalendario(hojeNoCalendario());
        // save de antes do calendário que já passou do nível 1 para o 2: libera a partir de hoje (sem invasões retroativas)
        const liberarSaveAntigo = estado.calendarioDasInvasoes.liberadoEm === null && AREAS.some(areaDaLista => estado.niveis[areaDaLista.id] >= 2);
        if (liberarSaveAntigo) liberarInvasoes();
        const andamento = estado.invasao.emAndamento;
        if (andamento) {                                                       // a página foi fechada no meio de uma invasão: ela continua (defesa)
          if (AREAS.some(areaDaLista => areaDaLista.id === andamento.alvo) && estado.niveis[andamento.alvo] > 0 && !instalacaoDestruida(andamento.alvo)) iniciarInvasao(andamento, true);
          else { estado.invasao.emAndamento = null; salvarProgresso(); }
          return;
        }
        if (!liberarSaveAntigo) verificarInvasao();
      };
      document.addEventListener('visibilitychange', () => { if (!document.hidden) verificarInvasao(); });

      // ---- reparo ----
      const repararArea = function repararArea(idDaArea) {
        if (!instalacaoDestruida(idDaArea)) return;
        const custo = custoDeReparo(idDaArea);
        if (estado.xp < custo) { mostrarAviso('XP insuficiente para reparar (' + custo + ' XP).'); return; }
        estado.xp -= custo; delete estado.danos[idDaArea];
        registrarAtividade();                                                 // também salva
        reconstruirArea(idDaArea); focarCameraNaArea(idDaArea); desenharCards(); tocarEfeito('construir');   // 8.4.1: efeito sonoro
        mostrarAviso(nomeDaArea(idDaArea) + ' reconstruído! Nível ' + estado.niveis[idDaArea] + ' mantido. 🔧');
      };

      // ---- ferramentas de teste (painel "Tempo") e API para o console ----
      // Linha de estado do calendário no painel Tempo (visível só no Modo desenvolvedor).
      const atualizarInformacaoDasInvasoes = function atualizarInformacaoDasInvasoes() {
        if (!INVASOES_CONFIG.ativas) return;
        const calendario = estado.calendarioDasInvasoes, hoje = hojeNoCalendario(), destruidas = Object.keys(estado.danos).length;
        let texto = 'Hoje: ' + textoDoDia(hoje) + (calendario.deslocamentoDeTesteDias ? ' (+' + calendario.deslocamentoDeTesteDias + ' dia(s) de teste)' : '') + ' · ';
        if (calendarioPausado()) texto += 'calendário PAUSADO (sem invasões periódicas até a defesa; "Invasão agora" continua valendo)';
        else if (calendario.liberadoEm === null) texto += 'invasões ainda não liberadas (primeira evolução do nível 1 para o 2)';
        else texto += invasaoPendente(hoje) !== null ? 'invasão pendente (próximo dia útil)' : 'próxima invasão: ' + textoDoDia(diasDeInvasaoAoRedor(hoje).proximo);
        texto += ' · destruídas: ' + destruidas + ' · repelidas: ' + (estado.invasao.repelidas | 0) + (calendarioPausado() || avisoDeDefesaVisto() ? '' : ' · aviso da defesa ainda não visto') + (INVASAO_EM_CURSO.fase !== 'nenhuma' ? ' · invasão em curso' : '');
        if (texto !== INVASAO_EM_CURSO.infoTexto) { INVASAO_EM_CURSO.infoTexto = texto; selecionar('#invasao-info').textContent = texto; }
      };
      // Teste "Invasão agora": força uma invasão já, sem mexer no calendário (não cumpre nem adia o próximo dia de invasão).
      // Os dois testes só funcionam com o Modo desenvolvedor ligado (seção 32), também pela API do console.
      const invasaoAgora = function invasaoAgora() {
        if (!modoDesenvolvedorAtivo || !INVASOES_CONFIG.ativas || INVASAO_EM_CURSO.fase !== 'nenhuma' || estado.invasao.emAndamento) return false;
        return comecarInvasao(true);
      };
      // Teste "Avançar um dia elegível": leva SÓ o calendário das invasões ao próximo dia útil e o confere (aviso, pendente ou
      // invasão). O relógio das plantações, animais e mina (estado.tempoDeTesteMs) não muda.
      const avancarDiaElegivel = function avancarDiaElegivel() {
        if (!modoDesenvolvedorAtivo) return false;
        const calendario = estado.calendarioDasInvasoes, hoje = hojeNoCalendario();
        calendario.deslocamentoDeTesteDias += enesimoDiaUtilDepois(hoje, 1) - hoje; salvarProgresso();
        const comecou = verificarInvasao(); atualizarInformacaoDasInvasoes();
        return comecou;
      };
      selecionar('#teste-invasao').onclick = () => { if (!modoDesenvolvedorAtivo) return; if (!invasaoAgora()) mostrarAviso(INVASAO_EM_CURSO.fase !== 'nenhuma' || estado.invasao.emAndamento ? 'Já há uma invasão em curso.' : 'Nenhuma instalação elegível para atacar.'); };
      selecionar('#teste-dia-elegivel').onclick = () => {
        if (!modoDesenvolvedorAtivo) return;
        const comecou = avancarDiaElegivel();
        if (!comecou) mostrarAviso('📅 Calendário de teste: hoje é ' + textoDoDia(hojeNoCalendario()) + (calendarioPausado() ? ' (calendário pausado: sem invasões periódicas).' : estado.calendarioDasInvasoes.liberadoEm === null ? ' (invasões ainda não liberadas).' : '.'));
      };
      selecionar('#teste-reparar').onclick = () => { for (const idDaArea of Object.keys(estado.danos)) { delete estado.danos[idDaArea]; reconstruirArea(idDaArea); } registrarAtividade(); desenharCards(); mostrarAviso('Todas as instalações foram reparadas (teste).'); };
      // API do console: "simular" mantém o nome antigo e agora força uma invasão (como o botão "Invasão agora").
      window.FarmEduInvasoes = { simular: invasaoAgora, verificar: verificarInvasao, avancarDia: avancarDiaElegivel, estado: () => ({ atividade: estado.atividade, danos: estado.danos, invasao: estado.invasao, calendario: estado.calendarioDasInvasoes }), config: INVASOES_CONFIG };
      atualizarInformacaoDasInvasoes();
      // (iniciarSistemaDeInvasoes() é chamada na seção 28, só depois que a tela de carregamento some: assim o aviso e as
      //  criaturas aparecem para o jogador, e não escondidos atrás da tela.)

      arquivoDaMontagemConcluido('26-invasoes.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
