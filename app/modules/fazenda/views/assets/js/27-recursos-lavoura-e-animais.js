      // ====================================================================================================
      // FARMEDU 3D — 27-recursos-lavoura-e-animais.js (Fase 3B da refatoração: seção 27)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 27 — RECURSOS, PLANTAÇÕES (GRANDE E NOVA) E ALIMENTAÇÃO DOS ANIMAIS (MARK 8.2)
      // Recursos do jogador (colheitas e minérios); as DUAS plantações têm canteiros próprios (estado.lavouras[id]) com o ciclo
      // plantar → crescer → colher em tempo real; a colheita é feita por trabalhadores (escolhidos pelo jogador ou automática,
      // seção 29) com reserva por canteiro, para ninguém colher o mesmo canteiro duas vezes. Também controla a comida dos
      // animais: sem comida a saúde cai devagar e, se chegar a zero, um animal morre (com avisos antes).
      // ====================================================================================================
      const ICONES_DOS_RECURSOS = { trigo: '🌾', milho: '🌽', cenoura: '🥕', abobora: '🎃', minerios: '🪨' };
      let houveMudancaParaSalvar = false;
      const marcarParaSalvar = () => { houveMudancaParaSalvar = true; };
      // Credita XP de ganhos AUTOMÁTICOS (colheita por trabalhador, mina, monstro derrotado). NÃO conta como atividade do jogador:
      // só ações feitas pelo jogador renovam o contador da regra dos 5 dias reais de inatividade (seção 26).
      const creditarXP = function creditarXP(quantidade) { if (quantidade > 0) { estado.xp += quantidade; salvarProgresso(); desenharCards(); } };
      let ultimoResumoDeRecursos = '';
      const atualizarResumoDeRecursos = function atualizarResumoDeRecursos() {
        const texto = Object.entries(ICONES_DOS_RECURSOS).map(([recurso, icone]) => icone + ' ' + estado.recursos[recurso]).join('  ');
        if (texto !== ultimoResumoDeRecursos) { ultimoResumoDeRecursos = texto; selecionar('#recursos-resumo').textContent = texto; }
      };
      // Estado inicial de uma instalação recém-construída (nível 0 → 1).
      const aoConstruirArea = function aoConstruirArea(idDaArea) {
        if (ANIMAIS_DAS_AREAS[idDaArea]) estado.animais[idDaArea] = { comida: 100, saude: 100, mortos: 0, atualizadoEm: agoraNoJogo(), avisouFome: false };
        if (idDaArea === 'mina') estado.mina = { fase: 'parado', inicioDaFase: agoraNoJogo(), ciclos: estado.mina.ciclos };
      };

      // ---- Plantações com canteiros (Grande e Nova, cada uma com seus próprios dados) ----
      const canteirosDaArea = idDaArea => estado.lavouras[idDaArea].canteiros;
      const quantidadeDeCanteiros = idDaArea => instalacaoDestruida(idDaArea) ? 0 : quantidadeDeCanteirosNoNivel(estado.niveis[idDaArea]).total;
      const nomeDaPlantacao = idDaArea => nomeDaArea(idDaArea);
      // Fazendeiros vivos aceleram um pouco o crescimento (conforme a velocidade de tarefa de cada um), até 35%.
      const aceleracaoDaLavoura = function aceleracaoDaLavoura() {
        let total = 0;
        for (const dados of estado.trabalhadores) if (dados.estado === 'ativo') total += CLASSES_DE_TRABALHADORES[dados.classe].aceleracaoDaLavoura * atributosDoTrabalhador(dados).velocidadeDeTarefa;
        return Math.min(0.35, total);
      };
      const progressoDoCanteiro = function progressoDoCanteiro(canteiro) {
        if (!canteiro.cultura) return 0;
        const duracao = CULTURAS[canteiro.cultura].minutosParaCrescer * 60000 * (1 - aceleracaoDaLavoura());
        return Math.max(0, Math.min(1, (agoraNoJogo() - canteiro.plantadoEm) / duracao));
      };
      // −1 vazio · 0 semente · 1 broto · 2 crescendo · 3 pronto para colher
      const estagioDoCanteiro = function estagioDoCanteiro(canteiro) { if (!canteiro.cultura) return -1; const progresso = progressoDoCanteiro(canteiro); return progresso >= 1 ? 3 : progresso >= 0.6 ? 2 : progresso >= 0.25 ? 1 : 0; };
      let culturaSelecionada = 'cenoura';
      // Reservas de colheita: "idDaArea:indice" → id do trabalhador que vai colher (evita dois no mesmo canteiro). Não é salvo.
      const reservasDeColheita = new Map();
      const chaveDoCanteiro = (idDaArea, indice) => idDaArea + ':' + indice;
      const plantarNoCanteiro = function plantarNoCanteiro(idDaArea, indice, cultura = culturaSelecionada, silencioso = false) {
        if (!estado.niveis[idDaArea]) { if (!silencioso) mostrarAviso('Construa ' + nomeDaPlantacao(idDaArea) + ' antes de plantar.'); return false; }
        const canteiro = canteirosDaArea(idDaArea)[indice];
        if (!canteiro || indice >= quantidadeDeCanteiros(idDaArea) || !CULTURAS[cultura]) return false;
        if (canteiro.cultura) { if (!silencioso) mostrarAviso('Este canteiro já está plantado.'); return false; }
        canteiro.cultura = cultura; canteiro.plantadoEm = agoraNoJogo();
        marcarParaSalvar(); atualizarVisualDaLavoura();
        return true;
      };
      // Colhe só o que está maduro. O canteiro é esvaziado ANTES de creditar e a reserva é liberada: não há colheita dupla.
      const colherCanteiro = function colherCanteiro(idDaArea, indice, silencioso = false) {
        const canteiro = canteirosDaArea(idDaArea)[indice];
        if (!canteiro || !canteiro.cultura || indice >= quantidadeDeCanteiros(idDaArea)) return false;
        if (estagioDoCanteiro(canteiro) < 3) { if (!silencioso) mostrarAviso(CULTURAS[canteiro.cultura].nome + ' ainda não está pronta para a colheita (' + Math.floor(progressoDoCanteiro(canteiro) * 100) + '%).'); return false; }
        const cultura = CULTURAS[canteiro.cultura], recurso = canteiro.cultura;
        canteiro.cultura = null; canteiro.plantadoEm = 0; reservasDeColheita.delete(chaveDoCanteiro(idDaArea, indice));
        estado.recursos[recurso] += cultura.colheita;
        creditarXP(cultura.xp);                     // também salva
        atualizarVisualDaLavoura();
        if (!silencioso) mostrarAviso('Colheita em ' + nomeDaPlantacao(idDaArea) + ': +' + cultura.colheita + ' ' + cultura.icone + ' · +' + cultura.xp + ' XP');
        return true;
      };
      const plantarEmTodosOsVazios = function plantarEmTodosOsVazios(idDaArea) {
        let plantados = 0; for (let indice = 0; indice < quantidadeDeCanteiros(idDaArea); indice++) if (plantarNoCanteiro(idDaArea, indice, culturaSelecionada, true)) plantados++;
        mostrarAviso(plantados ? plantados + ' canteiro(s) de ' + nomeDaPlantacao(idDaArea) + ' plantado(s) com ' + CULTURAS[culturaSelecionada].nome + '.' : 'Não há canteiros vazios em ' + nomeDaPlantacao(idDaArea) + '.');
      };
      // Canteiros maduros e ainda não reservados (para a colheita automática da seção 29).
      const canteirosMadurosLivres = function canteirosMadurosLivres() {
        const lista = [];
        for (const idDaArea of PLANTACOES_COM_CANTEIROS) for (let indice = 0; indice < quantidadeDeCanteiros(idDaArea); indice++)
          if (estagioDoCanteiro(canteirosDaArea(idDaArea)[indice]) === 3 && !reservasDeColheita.has(chaveDoCanteiro(idDaArea, indice))) lista.push([idDaArea, indice]);
        return lista;
      };
      // Ponto do canteiro no mundo (centro), considerando o deslocamento do campo da Nova plantação.
      const posicaoDoCanteiroNoMundo = function posicaoDoCanteiroNoMundo(idDaArea, indice) {
        const area = AREAS.find(areaDaLista => areaDaLista.id === idDaArea).posicao, visual = canteirosVisuais[idDaArea];
        if (!visual || !visual.posicoes[indice]) return [area.x, area.z];
        return [area.x + visual.deslocamentoX + visual.posicoes[indice][0], area.z + visual.posicoes[indice][1]];
      };


      // ---- Modelos 3D das culturas: peças instanciadas por canteiro (poucas chamadas de desenho) ----
      const geometriasDasCulturas = { esfera: new THREE.SphereGeometry(1, 8, 6), cone: new THREE.ConeGeometry(1, 1, 5), cilindro: new THREE.CylinderGeometry(1, 1, 1, 6), caixa: new THREE.BoxGeometry(1, 1, 1), disco: new THREE.CylinderGeometry(1, 1, 1, 7) };
      for (const geometria of Object.values(geometriasDasCulturas)) geometriasCompartilhadas.add(geometria);   // a reconstrução da área não as descarta
      const materialDasCulturas = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const CORES_DAS_BANDEIRINHAS = { trigo: 0xf1c40f, milho: 0x9be15d, cenoura: 0xf07c1e, abobora: 0xd35400 };
      // Lista de peças [geometria, cor, x, y, z, escalaX, escalaY, escalaZ, giroX, giroY, giroZ] de um canteiro (2,6 × 2,6).
      // Lista de peças [geometria, cor, x, y, z, escalaX, escalaY, escalaZ, giroX, giroY, giroZ] de um canteiro (2,6 × 2,6), já
      // deslocadas para a posição do canteiro (origemX, origemZ) dentro da plantação.
      const pecasDaCultura = function pecasDaCultura(cultura, estagio, origemX = 0, origemZ = 0) {
        const pecas = [], adicionar = (nome, cor, posicaoX, ...resto) => pecas.push([nome, cor, origemX + posicaoX, resto[0], origemZ + resto[1], ...resto.slice(2)]);
        const pontos = cultura === 'abobora' ? [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]] : [-0.8, 0, 0.8].flatMap(posicaoX => [-0.8, 0, 0.8].map(posicaoZ => [posicaoX, posicaoZ]));
        adicionar('cilindro', 0x8a5a2a, 1.1, 0.3, 1.1, 0.02, 0.6, 0.02, 0, 0, 0);                                   // bandeirinha que identifica a cultura
        adicionar('caixa', CORES_DAS_BANDEIRINHAS[cultura], 1.21, 0.52, 1.1, 0.2, 0.13, 0.012, 0, 0, 0);
        pontos.forEach(([posicaoX, posicaoZ], indice) => {
          const giro = indice * 1.7;
          if (estagio === 0) { adicionar('esfera', 0x4a301b, posicaoX, 0.02, posicaoZ, 0.16, 0.07, 0.16, 0, 0, 0); return; }
          if (estagio === 1) { adicionar('esfera', 0x4a301b, posicaoX, 0.01, posicaoZ, 0.12, 0.05, 0.12, 0, 0, 0); for (const lado of [-1, 1]) adicionar('cone', 0x7ccf4a, posicaoX + lado * 0.04, 0.09, posicaoZ, 0.04, 0.16, 0.04, 0, giro, lado * 0.4); return; }
          const pronto = estagio === 3;
          if (cultura === 'trigo') for (const [deslocamentoX, deslocamentoZ] of [[-0.09, 0], [0.08, 0.07], [0.02, -0.09]]) {
            const alturaDoCaule = pronto ? 0.75 : 0.5;
            adicionar('cilindro', pronto ? 0xd8b64a : 0x9ccf5a, posicaoX + deslocamentoX, alturaDoCaule / 2, posicaoZ + deslocamentoZ, 0.022, alturaDoCaule, 0.022, 0, 0, 0);
            if (pronto) adicionar('esfera', 0xe0b03a, posicaoX + deslocamentoX, alturaDoCaule + 0.06, posicaoZ + deslocamentoZ, 0.05, 0.13, 0.05, 0, 0, 0);
          }
          if (cultura === 'milho') {
            const alturaDoCaule = pronto ? 1.3 : 0.8;
            adicionar('cilindro', 0x5fae3a, posicaoX, alturaDoCaule / 2, posicaoZ, 0.045, alturaDoCaule, 0.045, 0, 0, 0);
            for (const [lado, posicaoY] of [[-1, 0.45], [1, 0.7]]) adicionar('cone', 0x6cc046, posicaoX + lado * 0.12, posicaoY, posicaoZ, 0.05, 0.42, 0.05, 0, giro, lado * 0.9);
            if (pronto) { adicionar('esfera', 0xf2c83a, posicaoX + 0.09, 0.85, posicaoZ, 0.06, 0.16, 0.06, 0, 0, -0.3); adicionar('cone', 0x8fc45a, posicaoX + 0.11, 0.78, posicaoZ, 0.05, 0.24, 0.05, 0, 0, -0.35); }
          }
          if (cultura === 'cenoura') {
            const alturaDasFolhas = pronto ? 0.38 : 0.26, quantidadeDeFolhas = pronto ? 4 : 3;
            for (let folha = 0; folha < quantidadeDeFolhas; folha++) adicionar('cone', 0x4fa83a, posicaoX, alturaDasFolhas / 2 + 0.02, posicaoZ, 0.04, alturaDasFolhas, 0.04, 0, giro + folha * 1.6, (folha - 1.5) * 0.25);
            if (pronto) adicionar('cone', 0xf07c1e, posicaoX, -0.08, posicaoZ, 0.075, 0.28, 0.075, Math.PI, 0, 0);       // raiz laranja aparecendo no solo
          }
          if (cultura === 'abobora') {
            for (const lado of [-1, 1]) adicionar('disco', 0x4f9a3a, posicaoX + lado * 0.22, 0.03, posicaoZ + lado * 0.1, 0.22, 0.02, 0.22, 0, 0, 0);
            if (!pronto) adicionar('esfera', 0x8bb34a, posicaoX, 0.09, posicaoZ, 0.13, 0.11, 0.13, 0, 0, 0);
            else {
              for (let gomo = 0; gomo < 6; gomo++) { const angulo = gomo / 6 * Math.PI * 2; adicionar('esfera', 0xf08a24, posicaoX + Math.cos(angulo) * 0.1, 0.18, posicaoZ + Math.sin(angulo) * 0.1, 0.13, 0.17, 0.17, 0, -angulo, 0); }
              adicionar('cilindro', 0x3e6b2a, posicaoX, 0.38, posicaoZ, 0.03, 0.12, 0.03, 0, 0, 0.2);
            }
          }
        });
        return pecas;
      };
      const objetoAuxiliarDasCulturas = new THREE.Object3D(), corAuxiliarDasCulturas = new THREE.Color();
      // Redesenha as plantas de UMA plantação inteira: uma InstancedMesh por tipo de peça (5 desenhos no máximo por plantação).
      const desenharPlantasDaArea = function desenharPlantasDaArea(idDaArea) {
        const visual = canteirosVisuais[idDaArea]; if (!visual) return;
        while (visual.plantas.children.length) { const malha = visual.plantas.children[0]; visual.plantas.remove(malha); if (malha.dispose) malha.dispose(); }
        const porGeometria = {};
        visual.posicoes.forEach(([posicaoX, posicaoZ], indice) => {
          const canteiro = canteirosDaArea(idDaArea)[indice], estagio = estagioDoCanteiro(canteiro);
          if (estagio >= 0) for (const peca of pecasDaCultura(canteiro.cultura, estagio, posicaoX, posicaoZ)) (porGeometria[peca[0]] = porGeometria[peca[0]] || []).push(peca);
        });
        for (const nomeDaGeometria in porGeometria) {
          const lista = porGeometria[nomeDaGeometria], malha = new THREE.InstancedMesh(geometriasDasCulturas[nomeDaGeometria], materialDasCulturas, lista.length);
          lista.forEach(([, cor, posicaoX, posicaoY, posicaoZ, escalaX, escalaY, escalaZ, giroX, giroY, giroZ], indiceDaPeca) => {
            objetoAuxiliarDasCulturas.position.set(posicaoX, posicaoY, posicaoZ); objetoAuxiliarDasCulturas.rotation.set(giroX, giroY, giroZ); objetoAuxiliarDasCulturas.scale.set(escalaX, escalaY, escalaZ); objetoAuxiliarDasCulturas.updateMatrix();
            malha.setMatrixAt(indiceDaPeca, objetoAuxiliarDasCulturas.matrix); malha.setColorAt(indiceDaPeca, corAuxiliarDasCulturas.setHex(cor));
          });
          malha.instanceMatrix.needsUpdate = true; if (malha.instanceColor) malha.instanceColor.needsUpdate = true;
          malha.frustumCulled = false; malha.castShadow = nomeDaGeometria !== 'disco'; malha.receiveShadow = true; visual.plantas.add(malha);
        }
      };
      // Confere (1×/s) se algum canteiro mudou de estágio ou de cultura e redesenha só a plantação que mudou.
      const atualizarVisualDaLavoura = function atualizarVisualDaLavoura() {
        for (const idDaArea of PLANTACOES_COM_CANTEIROS) {
          const visual = canteirosVisuais[idDaArea]; if (!visual) continue;
          const assinatura = visual.posicoes.map((_, indice) => { const canteiro = canteirosDaArea(idDaArea)[indice]; return (canteiro.cultura || '-') + estagioDoCanteiro(canteiro); }).join(',');
          if (assinatura !== visual.assinaturaDesenhada) { visual.assinaturaDesenhada = assinatura; desenharPlantasDaArea(idDaArea); }
        }
      };

      // ---- Alimentação dos animais ----
      // Aplica o tempo passado desde a última atualização: o cocho esvazia proporcional aos animais vivos; com comida a saúde
      // se recupera; sem comida ela cai devagar e, ao chegar a zero, UM animal morre e os demais seguem (o jogador é avisado
      // antes, quando o cocho fica baixo). O tempo com a página fechada conta até ALIMENTACAO_CONFIG.limiteDeTempoAusenteHoras.
      const atualizarAlimentacao = function atualizarAlimentacao() {
        const agora = agoraNoJogo(), configuracao = ALIMENTACAO_CONFIG;
        for (const idDaArea in ANIMAIS_DAS_AREAS) {
          const situacao = estado.animais[idDaArea], total = totalDeAnimais(idDaArea), vivos = animaisVivosDaArea(idDaArea);
          let horas = (agora - situacao.atualizadoEm) / 3600000;
          situacao.atualizadoEm = agora;
          if (!total || vivos <= 0 || horas <= 0 || instalacaoDestruida(idDaArea)) continue;   // em ruínas (regra dos 5 dias): sem animais para alimentar
          horas = Math.min(horas, configuracao.limiteDeTempoAusenteHoras);
          const consumoPorHora = 100 / configuracao.horasParaAComidaAcabar * (vivos / total), horasComComida = Math.min(horas, situacao.comida / consumoPorHora);
          situacao.comida = Math.max(0, situacao.comida - consumoPorHora * horas);
          situacao.saude = Math.min(100, situacao.saude + configuracao.recuperacaoDeSaudePorHora * horasComComida);
          situacao.saude -= configuracao.perdaDeSaudePorHoraSemComida * (horas - horasComComida);
          let mortes = 0;
          while (situacao.saude <= 0 && animaisVivosDaArea(idDaArea) > 0) { situacao.mortos++; mortes++; situacao.saude += configuracao.saudeDepoisDeUmaMorte; }
          situacao.saude = Math.max(0, situacao.saude);
          const informacao = ANIMAIS_DAS_AREAS[idDaArea];
          if (situacao.comida < configuracao.avisoDeFomeAbaixoDe && !situacao.avisouFome) { situacao.avisouFome = true; mostrarAviso(informacao.icone + ' Os animais de ' + nomeDaArea(idDaArea) + ' precisam de comida! Abra 🌾 Fazenda para alimentá-los.'); }
          if (situacao.comida >= configuracao.avisoDeFomeAbaixoDe) situacao.avisouFome = false;
          if (mortes) { reconstruirArea(idDaArea); desenharCards(); mostrarAviso('💀 ' + mortes + ' ' + informacao.nome + (mortes > 1 ? 's' : '') + ' de ' + nomeDaArea(idDaArea) + ' morreu de fome. Alimente os outros e reponha no painel 🌾 Fazenda.'); salvarProgresso(); }
          marcarParaSalvar();
        }
      };
      // Enche o cocho usando as colheitas na ordem de preferência do animal (só o necessário).
      const alimentarAnimais = function alimentarAnimais(idDaArea) {
        const informacao = ANIMAIS_DAS_AREAS[idDaArea], situacao = estado.animais[idDaArea];
        if (!informacao || !estado.niveis[idDaArea]) { mostrarAviso('Construa ' + nomeDaArea(idDaArea) + ' primeiro.'); return; }
        if (animaisVivosDaArea(idDaArea) <= 0) { mostrarAviso('Não há animais vivos em ' + nomeDaArea(idDaArea) + '. Reponha os animais primeiro.'); return; }
        atualizarAlimentacao();
        if (situacao.comida >= 99) { mostrarAviso('O cocho de ' + nomeDaArea(idDaArea) + ' já está cheio.'); return; }
        const usados = {};
        for (const recurso of informacao.come) while (situacao.comida < 99 && estado.recursos[recurso] > 0) { estado.recursos[recurso]--; situacao.comida = Math.min(100, situacao.comida + ALIMENTACAO_CONFIG.comidaPorUnidade[recurso]); usados[recurso] = (usados[recurso] || 0) + 1; }
        if (!Object.keys(usados).length) { mostrarAviso('Sem alimento para ' + informacao.nome + 's! Colha ' + informacao.come.map(recurso => CULTURAS[recurso].icone + ' ' + CULTURAS[recurso].nome).join(', ') + ' na Nova plantação.'); return; }
        situacao.avisouFome = situacao.comida < ALIMENTACAO_CONFIG.avisoDeFomeAbaixoDe;
        registrarAtividade(); desenharCards();
        mostrarAviso(informacao.icone + ' Animais alimentados (' + Object.entries(usados).map(([recurso, quantidade]) => quantidade + ' ' + CULTURAS[recurso].icone).join(' ') + '). Cocho: ' + Math.floor(situacao.comida) + '%');
      };
      const reporAnimal = function reporAnimal(idDaArea) {
        const situacao = estado.animais[idDaArea], custo = ALIMENTACAO_CONFIG.custoParaReporAnimal;
        if (!situacao || situacao.mortos <= 0 || animaisVivosDaArea(idDaArea) >= totalDeAnimais(idDaArea)) return;
        if (estado.xp < custo) { mostrarAviso('XP insuficiente para repor o animal: faltam ' + (custo - estado.xp) + ' XP.'); return; }
        estado.xp -= custo; situacao.mortos--; situacao.saude = Math.max(situacao.saude, 70);
        registrarAtividade(); reconstruirArea(idDaArea); desenharCards();
        mostrarAviso(ANIMAIS_DAS_AREAS[idDaArea].icone + ' Animal reposto em ' + nomeDaArea(idDaArea) + '.');
      };
      // Placa flutuante "🍽 Fome!" sobre a instalação com cocho baixo ou saúde baixa (sinal visível no mapa).
      const sinaisDeFome = {};
      const atualizarSinaisDeFome = function atualizarSinaisDeFome() {
        for (const idDaArea in ANIMAIS_DAS_AREAS) {
          const situacao = estado.animais[idDaArea], precisaDeComida = estado.niveis[idDaArea] > 0 && animaisVivosDaArea(idDaArea) > 0 && (situacao.comida < ALIMENTACAO_CONFIG.avisoDeFomeAbaixoDe || situacao.saude < 50);
          if (precisaDeComida && !sinaisDeFome[idDaArea]) {
            const area = AREAS.find(areaDaLista => areaDaLista.id === idDaArea), placa = new THREE.Sprite(new THREE.SpriteMaterial({ map: criarTexturaDeTexto('🍽 Fome!', '#ffffff', '#c0392b'), depthWrite: false }));
            placa.scale.set(2.2, 1.1, 1); placa.position.set(area.posicao.x, 4.4, area.posicao.z); cena.add(placa); sinaisDeFome[idDaArea] = placa;
          }
          if (sinaisDeFome[idDaArea]) sinaisDeFome[idDaArea].visible = precisaDeComida;
        }
      };

      arquivoDaMontagemConcluido('27-recursos-lavoura-e-animais.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
