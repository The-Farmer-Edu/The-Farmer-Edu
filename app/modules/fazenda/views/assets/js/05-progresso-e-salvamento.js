      // ====================================================================================================
      // FARMEDU 3D — 05-progresso-e-salvamento.js (Fase 3B da refatoração: seção 05)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 05 — PROGRESSO E SALVAMENTO (XP, NÍVEIS, RECURSOS, LAVOURA, ANIMAIS, MINA E TRABALHADORES)
      // O objeto "estado" é a única fonte de verdade: xp, niveis (0 = não construído), recursos, lavoura, animais, mina, trabalhadores,
      // candidatos, atividade, danos e invasao. A versão 4 (Mark 8.2) migra saves antigos sem apagar o progresso evoluído.
      // É gravado no localStorage (chave fazenda3d-progresso-v3); campos que faltam em saves antigos são criados sem perder o progresso.
      // ====================================================================================================
      const CHAVE_SALVAMENTO = 'fazenda3d-progresso-v3';
      // 4 = Mark 8.2 · 5 = Mark 8.2 corrigida (casa começa na base, ponte evolutiva, duas plantações com canteiros próprios,
      // trabalhadores com atributos completos e melhorias, fazendeiro inicial único). A chave do localStorage não muda.
      const VERSAO_DO_SALVAMENTO = 5;
      const nivelInicialDaArea = () => 0;   // todas as áreas começam no nível 0 (a casa no nível 0 é a "base", que já existe)
      let estado = { versao: VERSAO_DO_SALVAMENTO, xp: 0, niveis: Object.fromEntries(AREAS.map(area => [area.id, 0])) };
      const avisosDaMigracao = [];   // mensagens mostradas uma vez ao abrir (seção 33)
      let existiaSalvamento = false; // false = fazenda nova (a seção 32 pergunta o nome da fazenda)
      try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE_SALVAMENTO));
        if (salvo && salvo.niveis) { estado = salvo; existiaSalvamento = true; }
      } catch (erro) { }
      if (!estado.niveis || typeof estado.niveis !== 'object') estado.niveis = {};
      if (!Number.isFinite(estado.xp)) estado.xp = 0;
      const versaoCarregada = Number.isFinite(estado.versao) ? estado.versao : 0;
      // Migração de saves anteriores à Mark 8.2 (versão < 4), mantida como estava:
      //  • construções no nível 1 vinham PRONTAS de graça → passam a "não construídas" (nível 0); níveis 2 e 3 (pagos) ficam;
      //  • a plantação pequena virou o moinho: o XP gasto nas evoluções dela é devolvido;
      //  • danos antigos de invasões são desfeitos (a regra dos 5 dias volta a valer daqui em diante).
      if (versaoCarregada < 4) {
        let reorganizou = false;
        for (const idDaArea of Object.keys(estado.niveis)) {
          const nivelAntigo = Math.min(NIVEL_MAXIMO, Math.max(1, estado.niveis[idDaArea] | 0));
          if (idDaArea === 'plantacao') {
            const reembolso = CUSTO_PARA_PROXIMO_NIVEL.slice(0, nivelAntigo - 1).reduce((soma, custo) => soma + custo, 0);
            estado.xp += reembolso; delete estado.niveis.plantacao;
            avisosDaMigracao.push('A plantação pequena deu lugar ao moinho de pedra' + (reembolso ? ': ' + reembolso + ' XP devolvidos.' : '.'));
            continue;
          }
          if (!['casa', 'ponte'].includes(idDaArea) && nivelAntigo === 1) { estado.niveis[idDaArea] = 0; reorganizou = true; }
          else estado.niveis[idDaArea] = nivelAntigo;
        }
        if (reorganizou) avisosDaMigracao.push('Mark 8.2: a fazenda foi reorganizada. Construções que vinham prontas agora são construídas por você; as que você evoluiu foram mantidas.');
        if (estado.danos && Object.keys(estado.danos).length) avisosDaMigracao.push('As instalações danificadas antes da atualização foram restauradas.');
        estado.danos = {}; estado.invasao = {};
      }
      // Migração da versão 4 para a 5: a casa e a ponte no nível 1 eram as iniciais GRATUITAS → casa base (0) e lote da ponte
      // com passarela (0). Níveis 2 e 3 (pagos) são mantidos. Os atributos dos trabalhadores são reescalados mais abaixo.
      if (versaoCarregada < 5) {
        if ((estado.niveis.casa | 0) <= 1) estado.niveis.casa = 0;
        if ((estado.niveis.ponte | 0) <= 1) estado.niveis.ponte = 0;
        if (versaoCarregada === 4) avisosDaMigracao.push('Ajustes da Mark 8.2: a casa agora começa na base (capacidade para 1 trabalhador) e a ponte é construída por você; o que você evoluiu foi mantido.');
      }
      for (const area of AREAS) {
        const nivelSalvo = Number(estado.niveis[area.id]);
        estado.niveis[area.id] = Number.isFinite(nivelSalvo) ? Math.min(NIVEL_MAXIMO, Math.max(0, nivelSalvo | 0)) : nivelInicialDaArea(area.id);
      }
      for (const idDaArea of Object.keys(estado.niveis)) if (!AREAS.some(area => area.id === idDaArea)) delete estado.niveis[idDaArea];
      // Campos do sistema de inatividade e invasões. Saves antigos não têm esses campos: são criados aqui, sem tocar em xp/niveis.
      const AGORA_AO_CARREGAR = Date.now();
      if (!estado.atividade || !Number.isFinite(estado.atividade.ultima)) estado.atividade = { ultima: AGORA_AO_CARREGAR };   // save antigo: a contagem começa agora
      estado.atividade.ultima = Math.min(estado.atividade.ultima, AGORA_AO_CARREGAR);                                           // relógio ajustado para trás não gera tempo negativo
      if (!estado.danos || typeof estado.danos !== 'object') estado.danos = {};
      for (const idDaArea of Object.keys(estado.danos)) if (!AREAS.some(area => area.id === idDaArea) || !estado.danos[idDaArea] || !estado.danos[idDaArea].destruida) delete estado.danos[idDaArea];
      if (!estado.invasao || typeof estado.invasao !== 'object') estado.invasao = {};
      if (estado.invasao.emAndamento && !AREAS.some(area => area.id === estado.invasao.emAndamento.alvo)) estado.invasao.emAndamento = null;
      // ---- Campos da Mark 8.2 (criados aqui para saves antigos e para jogos novos; valores inválidos são corrigidos) ----
      // Relógio do jogo: Date.now() mais um deslocamento usado SÓ pelo botão de teste "Avançar 10 min" (painel Tempo).
      // Plantações, alimentação e mina usam este relógio. A regra dos 5 dias usa SEMPRE o relógio real (Date.now()).
      estado.tempoDeTesteMs = Number.isFinite(estado.tempoDeTesteMs) && estado.tempoDeTesteMs >= 0 ? estado.tempoDeTesteMs : 0;
      const agoraNoJogo = () => Date.now() + estado.tempoDeTesteMs;
      const numeroValido = (valor, padrao = 0) => Number.isFinite(valor) && valor >= 0 ? valor : padrao;
      estado.recursos = estado.recursos && typeof estado.recursos === 'object' ? estado.recursos : {};
      for (const recurso of ['trigo', 'milho', 'cenoura', 'abobora', 'minerios']) estado.recursos[recurso] = Math.floor(numeroValido(estado.recursos[recurso]));
      // Plantações: cada uma tem a PRÓPRIA lista de canteiros (estado.lavouras[id].canteiros). A lista antiga (estado.lavoura, só da
      // Nova plantação) é migrada para a Nova plantação, com o progresso preservado.
      const normalizarCanteiros = lista => Array.from({ length: LAVOURA_CONFIG.maximoDeCanteiros }, (_, indice) => {
        const salvo = Array.isArray(lista) ? lista[indice] : null;
        return salvo && CULTURAS[salvo.cultura] && Number.isFinite(salvo.plantadoEm) ? { cultura: salvo.cultura, plantadoEm: Math.min(salvo.plantadoEm, agoraNoJogo()) } : { cultura: null, plantadoEm: 0 };
      });
      const lavourasSalvas = estado.lavouras && typeof estado.lavouras === 'object' ? estado.lavouras : {};
      if (estado.lavoura && Array.isArray(estado.lavoura.canteiros) && !lavourasSalvas.novaPlantacao) lavourasSalvas.novaPlantacao = { canteiros: estado.lavoura.canteiros };
      delete estado.lavoura;
      estado.lavouras = Object.fromEntries(PLANTACOES_COM_CANTEIROS.map(idDaArea => [idDaArea, { canteiros: normalizarCanteiros(lavourasSalvas[idDaArea] && lavourasSalvas[idDaArea].canteiros) }]));
      estado.animais = estado.animais && typeof estado.animais === 'object' ? estado.animais : {};
      for (const idDaArea in ANIMAIS_DAS_AREAS) {
        const salvo = estado.animais[idDaArea] || {}, limite = ANIMAIS_DAS_AREAS[idDaArea].porNivel[NIVEL_MAXIMO - 1];
        estado.animais[idDaArea] = { comida: Math.min(100, numeroValido(salvo.comida, 100)), saude: Math.min(100, numeroValido(salvo.saude, 100)), mortos: Math.min(limite, Math.floor(numeroValido(salvo.mortos))),
          atualizadoEm: Math.min(numeroValido(salvo.atualizadoEm, agoraNoJogo()), agoraNoJogo()), avisouFome: !!salvo.avisouFome };
      }
      const FASES_DA_MINA = ['parado', 'indo', 'minerando', 'voltando', 'descarregando'];
      const minaSalva = estado.mina || {};
      estado.mina = { fase: FASES_DA_MINA.includes(minaSalva.fase) ? minaSalva.fase : 'parado', inicioDaFase: Math.min(numeroValido(minaSalva.inicioDaFase), agoraNoJogo()), ciclos: Math.floor(numeroValido(minaSalva.ciclos)) };
      // Trabalhadores: atributos-base completos (velocidade, vidaMaxima, precisao, dano, velocidadeDeTarefa) + níveis de melhoria.
      // Saves da versão 4 tinham trabalhadores lentos e frágeis: os valores são reescalados para as novas faixas da classe,
      // mantendo a posição relativa de cada um (quem era o mais rápido continua o mais rápido).
      const FAIXAS_DA_VERSAO_4 = { fazendeiro: { velocidade: [1.2, 1.5], vidaMaxima: [40, 60] }, guarda: { velocidade: [0.85, 1.05], vidaMaxima: [100, 140] } };
      const normalizarTrabalhador = function normalizarTrabalhador(dados, reescalar) {
        const classe = CLASSES_DE_TRABALHADORES[dados.classe], meio = faixa => (faixa[0] + faixa[1]) / 2;
        for (const atributo of Object.keys(classe.atributos)) {
          const faixa = classe.atributos[atributo], antiga = reescalar && FAIXAS_DA_VERSAO_4[dados.classe][atributo];
          if (antiga && Number.isFinite(dados[atributo])) dados[atributo] = faixa[0] + Math.max(0, Math.min(1, (dados[atributo] - antiga[0]) / (antiga[1] - antiga[0]))) * (faixa[1] - faixa[0]);
          if (!Number.isFinite(dados[atributo]) || dados[atributo] <= 0) dados[atributo] = meio(faixa);
          dados[atributo] = atributo === 'velocidade' || atributo === 'velocidadeDeTarefa' ? +dados[atributo].toFixed(2) : Math.round(dados[atributo]);
        }
        const melhorias = dados.melhorias && typeof dados.melhorias === 'object' ? dados.melhorias : {};
        dados.melhorias = Object.fromEntries(Object.keys(MELHORIAS_DOS_TRABALHADORES.atributos).map(atributo => [atributo, Math.min(MELHORIAS_DOS_TRABALHADORES.nivelMaximo, Math.floor(numeroValido(melhorias[atributo])))]));
        dados.xpInvestido = Math.floor(numeroValido(dados.xpInvestido, dados.inicial ? 0 : classe.custo));
        return dados;
      };
      estado.trabalhadores = Array.isArray(estado.trabalhadores) ? estado.trabalhadores.filter(dados => dados && CLASSES_DE_TRABALHADORES[dados.classe]) : [];
      for (const dados of estado.trabalhadores) {
        const fracaoDeVida = Number.isFinite(dados.vida) && dados.vidaMaxima > 0 ? Math.max(0, Math.min(1, dados.vida / dados.vidaMaxima)) : 1;
        normalizarTrabalhador(dados, versaoCarregada < 5);
        if (versaoCarregada < 5) dados.vida = Math.round(fracaoDeVida * dados.vidaMaxima);   // vida na mesma proporção de antes
        dados.estado = dados.estado === 'morto' || !(dados.vida > 0) ? 'morto' : 'ativo';
      }
      estado.candidatos = versaoCarregada < 5 || !Array.isArray(estado.candidatos) ? [] : estado.candidatos.filter(dados => dados && CLASSES_DE_TRABALHADORES[dados.classe]).map(dados => normalizarTrabalhador(dados, false));
      estado.proximoIdDeTrabalhador = Math.max(numeroValido(estado.proximoIdDeTrabalhador, 1), 1 + Math.max(0, ...estado.trabalhadores.map(dados => dados.id | 0), ...estado.candidatos.map(dados => dados.id | 0)));
      // Fazendeiro inicial: concedido uma única vez. Saves que já têm equipe apenas marcam a concessão (nenhum trabalhador extra).
      if (!estado.fazendeiroInicialConcedido) {
        if (!estado.trabalhadores.length) estado.trabalhadores.push(normalizarTrabalhador({ ...FAZENDEIRO_INICIAL, id: estado.proximoIdDeTrabalhador++, inicial: true, xpInvestido: 0, vida: FAZENDEIRO_INICIAL.vidaMaxima, estado: 'ativo' }, false));
        estado.fazendeiroInicialConcedido = true;
      }
      // Mark 8.3: nome da fazenda escolhido pelo jogador (placa "BEM-VINDO À ..."). Campo novo: saves antigos ficam com o padrão.
      const NOME_PADRAO_DA_FAZENDA = 'FarmEdu', LIMITE_DE_CARACTERES_DO_NOME = 28;
      // Limpa o nome digitado: tira caracteres de controle, junta espaços repetidos e corta no limite. Acentos são preservados.
      const limparNomeDaFazenda = texto => String(texto || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, LIMITE_DE_CARACTERES_DO_NOME).trim();
      estado.nomeDaFazenda = limparNomeDaFazenda(estado.nomeDaFazenda) || NOME_PADRAO_DA_FAZENDA;
      estado.versao = VERSAO_DO_SALVAMENTO;
      // Quantos animais a instalação tem no nível atual, e quantos estão vivos (os mortos de fome só voltam se forem repostos).
      const totalDeAnimais = function totalDeAnimais(idDaArea) { const nivel = estado.niveis[idDaArea]; return nivel ? ANIMAIS_DAS_AREAS[idDaArea].porNivel[nivel - 1] : 0; };
      const animaisVivosDaArea = function animaisVivosDaArea(idDaArea) { return Math.max(0, totalDeAnimais(idDaArea) - Math.min(estado.animais[idDaArea].mortos, totalDeAnimais(idDaArea))); };
      // Grava o objeto "estado" (xp, niveis, atividade, danos e invasao) no localStorage. Falhas de
      // armazenamento (modo privado, cota cheia) são ignoradas para não travar o jogo.
      const salvarProgresso = function salvarProgresso() { try { localStorage.setItem(CHAVE_SALVAMENTO, JSON.stringify(estado)); } catch (erro) { } };
      salvarProgresso();   // grava os campos novos de saves antigos uma única vez

      arquivoDaMontagemConcluido('05-progresso-e-salvamento.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
