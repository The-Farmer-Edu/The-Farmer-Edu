// ====================================================================================================
// FARMEDU 3D — 28b-guardiao-e-pocoes.js
// SEÇÃO 28b — GUARDIÃO DA MINA E ALQUIMIA DE POÇÕES
// Substitui a antiga "troca de minérios" (1 minério = 1 XP). Agora a economia é: mina → minérios → poções → XP.
//  • O Guardião é um NPC independente, parado FORA da caverna, ao lado da entrada (POSTO_DO_GUARDIAO, seção 09), com uma
//    bancada de alquimia. Ele não faz parte da equipe, não luta e não é alvo de monstros nem de invasões.
//  • Clicar nele abre um painel de TELA CHEIA (#painel-do-guardiao) com as poções de POCOES_DO_GUARDIAO (seção 01).
//  • PREPARAR uma poção gasta minérios e guarda a poção (estado.pocoes). Preparar NUNCA depende do limite de XP.
//  • Etapa da alquimia: são 9 poções. Só a POÇÃO DE EXPERIÊNCIA concede XP (+20) e só ela usa o LIMITE DA ALQUIMIA
//    (creditarXP, origem 'fazenda', atividade 'mina' — o id antigo foi mantido por causa dos saves). Se o limite de hoje não
//    comporta os 20 XP inteiros, ela NÃO é usada e continua guardada. As outras 8 aplicam efeitos (seção 28c) e podem ser usadas
//    com o limite cheio. A mina não dá XP e não mexe no limite (seção 28).
//  • Todas as operações são transações: validam antes, aplicam, salvam e, se o salvamento falhar, restauram os saldos.
//    Uma trava (operacaoDoGuardiaoEmAndamento) impede cliques repetidos de executar a mesma operação duas vezes.
// Também define o sistema de CLIQUE DOS NPCS no mapa (registrarCliqueDeNpc), reaproveitado pelo lenhador (seção 29b).
// ====================================================================================================

      // ---- Clique dos NPCs no mapa (um único par de ouvintes para todos os personagens clicáveis) ----
      // Cada NPC registra uma caixa invisível de clique. Um teste de arrasto (até 8 px) impede abrir o painel ao girar a câmera.
      const NPCS_CLICAVEIS = [];
      const raycasterDosNpcs = new THREE.Raycaster(), pontoDoCliqueDosNpcs = new THREE.Vector2();
      let inicioDoCliqueNoNpc = null;
      const registrarCliqueDeNpc = function registrarCliqueDeNpc(areaDeClique, aoClicar) { NPCS_CLICAVEIS.push({ areaDeClique, aoClicar }); };
      const criarAreaDeCliqueDoNpc = function criarAreaDeCliqueDoNpc(objetoPai, largura, altura, profundidade) {
        const area = new THREE.Mesh(new THREE.BoxGeometry(largura, altura, profundidade),
          new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, colorWrite: false, depthWrite: false }));
        area.position.set(0, altura / 2, 0); objetoPai.add(area);
        return area;
      };
      renderizador.domElement.addEventListener('pointerdown', evento => { inicioDoCliqueNoNpc = { x: evento.clientX, y: evento.clientY }; });
      renderizador.domElement.addEventListener('pointerup', evento => {
        const inicio = inicioDoCliqueNoNpc; inicioDoCliqueNoNpc = null;
        if (!inicio || Math.hypot(evento.clientX - inicio.x, evento.clientY - inicio.y) > 8) return;
        const limites = renderizador.domElement.getBoundingClientRect();
        pontoDoCliqueDosNpcs.set((evento.clientX - limites.left) / limites.width * 2 - 1, -((evento.clientY - limites.top) / limites.height) * 2 + 1);
        raycasterDosNpcs.setFromCamera(pontoDoCliqueDosNpcs, camera);
        // o NPC mais próximo da câmera ganha o clique
        let escolhido = null, menorDistancia = Infinity;
        for (const npc of NPCS_CLICAVEIS) {
          const acerto = raycasterDosNpcs.intersectObject(npc.areaDeClique, false)[0];
          if (acerto && acerto.distance < menorDistancia) { menorDistancia = acerto.distance; escolhido = npc; }
        }
        if (escolhido) { registrarAtividade(); escolhido.aoClicar(); }
      });
      // Letreiro de madeira sobre a cabeça do NPC. Com depthTest, o letreiro não aparece através de montanhas e construções;
      // atualizarLetreirosDosNpcs o esconde quando a câmera está longe (o mapa não fica poluído de placas).
      const LETREIROS_DOS_NPCS = [];
      const criarPlacaDeInteracaoNpc = function criarPlacaDeInteracaoNpc(texto, subtitulo, objetoPai, altura) {
        const tela = document.createElement('canvas'); tela.width = 512; tela.height = 128;
        const contexto = tela.getContext('2d');
        if (!contexto) throw new Error('Não foi possível criar o letreiro do personagem.');
        contexto.fillStyle = '#5e3b1c'; contexto.beginPath(); contexto.roundRect(4, 4, 504, 120, 22); contexto.fill();
        contexto.fillStyle = '#f6ecd4'; contexto.beginPath(); contexto.roundRect(14, 14, 484, 100, 14); contexto.fill();
        contexto.textAlign = 'center'; contexto.textBaseline = 'middle';
        contexto.fillStyle = '#3b2a1a'; contexto.font = 'bold 40px Arial'; contexto.fillText(texto, 256, 50, 460);
        contexto.fillStyle = '#7a4e26'; contexto.font = 'bold 26px Arial'; contexto.fillText(subtitulo, 256, 91, 460);
        const placa = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(tela), transparent: true }));
        placa.position.set(0, altura, 0); placa.scale.set(2.9, 0.72, 1); placa.renderOrder = 4; objetoPai.add(placa);
        LETREIROS_DOS_NPCS.push(placa);
        return placa;
      };
      const posicaoDoLetreiro = new THREE.Vector3();
      const atualizarLetreirosDosNpcs = function atualizarLetreirosDosNpcs() {
        for (const placa of LETREIROS_DOS_NPCS) { placa.getWorldPosition(posicaoDoLetreiro); placa.visible = posicaoDoLetreiro.distanceTo(camera.position) < 48; }
      };

      // ---- Modelo do Guardião e bancada de alquimia (fora da caverna, ao lado da entrada) ----
      const modeloDoGuardiao = criarFazendeiro({
        pele: 0xe2bf94, camisa: 0x3b4f7a, camisaLinha: 0x24324f, mangaLonga: true, calca: 0x2f3648, colete: 0x5a3f73,
        bota: 0x30271f, cabelo: 0xd9d4c8, barba: 0xe8e4da, chapeu: 'larga', corChapeu: 0x3a2f55, fita: 0xd3ad61,
      });
      modeloDoGuardiao.raiz.position.set(POSTO_DO_GUARDIAO.x, 0, POSTO_DO_GUARDIAO.z);
      modeloDoGuardiao.raiz.rotation.y = POSTO_DO_GUARDIAO.giro;
      cena.add(modeloDoGuardiao.raiz);
      // cajado com cristal na ponta (o cristal pulsa devagar em atualizarGuardiao)
      modeloDoGuardiao.bracos[1].rotation.x = -0.35;
      criarCilindro(0.035, 0.045, 1.6, 0x6b4a2e, 0.02, -0.35, 0.1, modeloDoGuardiao.bracos[1], 7);
      const materialDoCristal = new THREE.MeshLambertMaterial({ color: 0x9fe3ff, emissive: 0x2a7fb0 });
      const cristalDoCajado = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), materialDoCristal);
      cristalDoCajado.position.set(0.02, 0.5, 0.1); modeloDoGuardiao.bracos[1].add(cristalDoCajado);
      criarPlacaDeInteracaoNpc('GUARDIÃO DA MINA', 'Alquimia · clique para falar', modeloDoGuardiao.raiz, 2.85);
      registrarCliqueDeNpc(criarAreaDeCliqueDoNpc(modeloDoGuardiao.raiz, 1.4, 2.6, 1.2), () => abrirPainelDoGuardiao());

      // Bancada: mesa de tábuas, frascos com as cores das poções, caldeirão com líquido verde, caixote de minério e placa.
      const bancadaDoGuardiao = new THREE.Group();
      const pontoDaBancada = POSTO_DO_GUARDIAO.ponto(4.9, 3.5);
      bancadaDoGuardiao.position.set(pontoDaBancada.x, 0, pontoDaBancada.z);
      bancadaDoGuardiao.rotation.y = POSTO_DO_GUARDIAO.giroDaEntrada + 0.35;
      cena.add(bancadaDoGuardiao);
      criarCaixa(1.6, 0.08, 0.7, 0x8a5a2e, 0, 0.82, 0, bancadaDoGuardiao);                                  // tampo
      for (const [x, z] of [[-0.7, -0.28], [0.7, -0.28], [-0.7, 0.28], [0.7, 0.28]]) criarCaixa(0.08, 0.8, 0.08, 0x5e3b1c, x, 0.4, z, bancadaDoGuardiao);
      criarCaixa(1.5, 0.05, 0.6, 0x6b4a2e, 0, 0.25, 0, bancadaDoGuardiao);                                  // prateleira de baixo
      const materialDoVidro = cor => new THREE.MeshLambertMaterial({ color: cor, emissive: new THREE.Color(cor).multiplyScalar(0.25), transparent: true, opacity: 0.85 });
      // Um frasco por poção do catálogo (9), em 3 fileiras de 3 sobre o tampo, ao lado do almofariz.
      const geometriaDoFrasco = new THREE.SphereGeometry(0.07, 10, 8);
      Object.values(POCOES_DO_GUARDIAO).forEach((pocao, indice) => {
        const x = -0.66 + (indice % 3) * 0.2, z = -0.18 + Math.floor(indice / 3) * 0.17, cor = new THREE.Color(pocao.cor).getHex();
        const frasco = new THREE.Mesh(geometriaDoFrasco, materialDoVidro(cor)); frasco.position.set(x, 0.93, z); bancadaDoGuardiao.add(frasco);
        criarCilindro(0.022, 0.026, 0.08, 0xdfe8ee, x, 1.03, z, bancadaDoGuardiao, 8);                     // gargalo
        criarCilindro(0.02, 0.02, 0.03, 0x8a5a2e, x, 1.085, z, bancadaDoGuardiao, 6);                      // rolha
      });
      criarCaixa(0.3, 0.16, 0.22, 0x6f7680, 0.55, 0.94, -0.18, bancadaDoGuardiao);                            // almofariz de pedra
      const caldeirao = new THREE.Group(); caldeirao.position.set(-1.25, 0, 0.55); bancadaDoGuardiao.add(caldeirao);
      criarCilindro(0.36, 0.28, 0.48, 0x2a2a30, 0, 0.36, 0, caldeirao, 12);
      for (const [x, z] of [[-0.22, -0.16], [0.22, -0.16], [0, 0.26]]) criarCaixa(0.05, 0.14, 0.05, 0x2a2a30, x, 0.06, z, caldeirao);
      const liquidoDoCaldeirao = new THREE.Mesh(new THREE.CircleGeometry(0.32, 14), new THREE.MeshLambertMaterial({ color: 0x6fd35a, emissive: 0x2f7a22 }));
      liquidoDoCaldeirao.rotation.x = -Math.PI / 2; liquidoDoCaldeirao.position.y = 0.58; caldeirao.add(liquidoDoCaldeirao);
      const bolhasDoCaldeirao = [0, 1, 2].map(indice => { const bolha = criarEsfera(0.05, 0xa8f08f, (indice - 1) * 0.12, 0.6, (indice % 2) * 0.1 - 0.05, caldeirao); return bolha; });
      criarCaixote(bancadaDoGuardiao, 1.25, 0.45);
      for (const [x, z, cor] of [[1.15, 0.38, 0x8a8a8a], [1.32, 0.52, 0xf2c14e], [1.22, 0.58, 0x4fa3e0]]) {
        const pedra = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), material(cor)); pedra.position.set(x, 0.62, z); bancadaDoGuardiao.add(pedra);
      }
      const placaDaAlquimia = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.06), new THREE.MeshLambertMaterial({ map: criarTexturaDeTexto('ALQUIMIA', '#3b2410', '#f2dfb4', 'minérios → poções') }));
      placaDaAlquimia.position.set(0, 1.62, -0.33); bancadaDoGuardiao.add(placaDaAlquimia);
      for (const lado of [-1, 1]) criarCaixa(0.06, 0.9, 0.06, 0x5e3b1c, lado * 0.55, 1.3, -0.33, bancadaDoGuardiao);
      // Pequena animação: o Guardião respira e olha em volta; o cristal e as bolhas do caldeirão pulsam.
      const atualizarGuardiao = function atualizarGuardiao(tempo) {
        modeloDoGuardiao.corpo.scale.y = 1 + Math.sin(tempo * 1.6) * 0.01;
        modeloDoGuardiao.cabeca.rotation.y = Math.sin(tempo * 0.45) * 0.35;
        materialDoCristal.emissiveIntensity = 0.75 + Math.sin(tempo * 2.2) * 0.25;
        bolhasDoCaldeirao.forEach((bolha, indice) => { const fase = (tempo * 0.7 + indice / 3) % 1; bolha.position.y = 0.58 + fase * 0.16; bolha.scale.setScalar(1 - fase * 0.6); });
      };

      // ---- Regras das poções (funções puras sobre o estado; usadas pelo painel e pelas transações) ----
      const TIPOS_DE_POCAO = Object.keys(POCOES_DO_GUARDIAO);
      const pocaoLiberada = tipo => (estado.niveis.mina | 0) >= POCOES_DO_GUARDIAO[tipo].nivelMinimoDaMina;
      // ---- Etapa 2: a POÇÃO MISTERIOSA ----
      // Enquanto não for usada, a interface mostra "???" em tudo (nome, raridade, efeito, duração, condição, quantidade, uso,
      // mensagens), exceto o CUSTO. Depois do único uso ela fica "descoberta": o nome aparece, mas ela não pode mais ser preparada
      // nem usada (estado.eventosEspeciais.misterio.usadoEm, salvo). vistaDaPocao é o ÚNICO lugar que decide o que mostrar.
      const SEGREDO = '???';
      const pocaoMisteriosa = tipo => !!POCOES_DO_GUARDIAO[tipo].misteriosa;
      const misterioDescoberto = () => !!estado.eventosEspeciais.misterio.usadoEm;
      const vistaDaPocao = function vistaDaPocao(tipo) {
        const pocao = POCOES_DO_GUARDIAO[tipo];
        if (!pocao.misteriosa) return { ...pocao, oculta: false };
        if (misterioDescoberto()) return { ...pocao, oculta: false, duracao: 'Já usada: só podia ser usada uma vez' };
        return { ...pocao, oculta: true, nome: SEGREDO, icone: '❔', cor: '#b9b0d6', efeito: SEGREDO, duracao: SEGREDO, descricao: SEGREDO };
      };
      const quantidadeVisivel = tipo => vistaDaPocao(tipo).oculta ? SEGREDO : String(estado.pocoes[tipo]);
      // ---- Etapa 1: SELO DE LENDA DESCOBERTA (só depois do uso registrado em estado.eventosEspeciais.misterio) ----
      const TEXTO_DA_LENDA = 'Uma criatura impossível cruzou os céus desta Fazenda. Dizem que um arco-íris ainda guarda a lembrança de sua passagem.';
      const dataDaLenda = () => { const quando = estado.eventosEspeciais.misterio.usadoEm; return quando ? new Date(quando).toLocaleDateString('pt-BR') : ''; };
      const htmlDoSeloDaLenda = selecionado => `<button type="button" class="selo-da-lenda${selecionado ? ' selecionada' : ''}" data-pocao="misteriosa" data-foco="pocao-misteriosa"
          aria-pressed="${selecionado}" title="Lenda descoberta — ${TEXTO_DA_LENDA}" aria-label="Lenda descoberta. ${TEXTO_DA_LENDA}">
          <span class="brilhos-da-lenda" aria-hidden="true"></span>
          <span class="medalhao-da-lenda" aria-hidden="true"><span>🦄</span></span>
          <span class="titulo-da-lenda">Lenda descoberta</span>
          <span class="texto-da-lenda">Uma criatura impossível cruzou os céus desta Fazenda…</span>
        </button>`;
      const htmlDoBalcaoDaLenda = () => `<div class="balcao-da-lenda">
          <span class="medalhao-da-lenda grande" aria-hidden="true"><span>🦄</span></span>
          <h3>✨ Lenda descoberta</h3>
          <p class="citacao-da-lenda">“${TEXTO_DA_LENDA}”</p>
          ${dataDaLenda() ? `<p class="data-da-lenda">🌈 Registrada nesta Fazenda em ${dataDaLenda()}</p>` : ''}
          <p class="dica-do-guardiao">Este selo é uma lembrança da Poção Misteriosa do Unicórnio, que só podia ser usada uma vez. Não é uma poção: não se prepara, não se usa e não custa nada.</p>
        </div>`;
      // Devolve o motivo (texto) que impede preparar, ou '' se pode.
      const motivoParaNaoPreparar = function motivoParaNaoPreparar(tipo) {
        const pocao = POCOES_DO_GUARDIAO[tipo];
        if (pocao.misteriosa) {
          if (misterioDescoberto()) return 'Esta poção já foi descoberta. Ela só podia ser usada uma vez.';
          if (!pocaoLiberada(tipo)) return '❔ ' + SEGREDO;
          if (estado.pocoes[tipo] >= 1) return '❔ ' + SEGREDO + ' (o Guardião só prepara um frasco deste mistério)';
        }
        if (!estado.niveis.mina) return 'Construa a mina para começar a extrair minérios.';
        if (!pocaoLiberada(tipo)) return 'Receita liberada com a mina no nível ' + pocao.nivelMinimoDaMina + '.';
        if (estado.recursos.minerios < pocao.minerios) return 'Faltam ' + (pocao.minerios - estado.recursos.minerios) + ' minério(s) para preparar.';
        return '';
      };
      // Só a Poção de Experiência concede XP (e só ela usa o Limite da alquimia).
      const pocaoDeExperiencia = tipo => POCOES_DO_GUARDIAO[tipo].xp > 0;
      // Devolve o motivo que impede usar, ou '' se pode. A de experiência precisa que o LIMITE comporte TODO o XP dela; as de
      // efeito não olham o limite (seção 28c decide: efeito já ativo, ninguém ferido, nada plantado...).
      const motivoParaNaoUsar = function motivoParaNaoUsar(tipo) {
        const pocao = POCOES_DO_GUARDIAO[tipo];
        if (!pocao) return 'Poção desconhecida.';
        if (pocao.misteriosa && misterioDescoberto()) return 'Esta poção já foi usada. Ela só podia ser usada uma vez.';
        if (!(estado.pocoes[tipo] >= 1)) return 'Você não tem esta poção guardada.';
        if (pocao.misteriosa) return eventoEspecialEmAndamento() ? '❔ ' + SEGREDO : '';
        if (pocaoDeExperiencia(tipo)) return xpRestanteDaCota('mina') < pocao.xp ? textoDoLimiteQueFalta(tipo) : '';
        return motivoParaNaoUsarEfeito(tipo);
      };
      // Quanto falta no Limite da alquimia para a Poção de Experiência caber inteira hoje (0 = cabe; sempre 0 nas poções de efeito).
      const limiteQueFaltaParaPocao = tipo => pocaoDeExperiencia(tipo) ? Math.max(0, POCOES_DO_GUARDIAO[tipo].xp - xpRestanteDaCota('mina')) : 0;
      const textoDoLimiteQueFalta = function textoDoLimiteQueFalta(tipo) {
        const pocao = POCOES_DO_GUARDIAO[tipo], restante = xpRestanteDaCota('mina');
        return 'Limite da alquimia de hoje atingido: a poção dá +' + pocao.xp + ' XP e restam ' + restante + ' XP de limite (faltam ' + limiteQueFaltaParaPocao(tipo)
          + '). Ela continua guardada para quando o limite renovar, amanhã. As poções de efeito continuam liberadas.';
      };
      const duracaoCurta = pocao => !pocao.minutos ? 'na hora' : pocao.minutos >= 60 ? (pocao.minutos / 60).toLocaleString('pt-BR') + ' h' : pocao.minutos + ' min';

      // ---- Painel de tela cheia ----
      const painelDoGuardiao = selecionar('#painel-do-guardiao');
      let pocaoSelecionada = 'experiencia', confirmandoPreparo = false, operacaoDoGuardiaoEmAndamento = false;
      // Aba do painel: 'preparar' (receitas e balcão) ou 'minhas' (Minhas Poções: só as que o jogador possui, com o botão de usar).
      // As duas abas e o inventário geral (seção 27b) leem o MESMO estado.pocoes: não existe estoque separado.
      let abaDoGuardiao = 'preparar';
      let mensagemDoGuardiao = { texto: '', tipo: '' }, assinaturaDoPainelDoGuardiao = '';
      const definirMensagemDoGuardiao = (texto, tipo = 'erro') => { mensagemDoGuardiao = { texto, tipo }; };
      // Recebe a VISTA da poção (vistaDaPocao): a cor do frasco misterioso também é neutra.
      const frascoHtml = (vista, grande = false) => `<span class="frasco-de-pocao${grande ? ' grande' : ''}${vista.oculta ? ' misteriosa' : ''}" style="--cor-da-pocao:${vista.cor}" aria-hidden="true"><i></i></span>`;
      // Explicação fixa do painel (HTML): os números saem da configuração, para o texto nunca ficar diferente do jogo.
      for (const elemento of document.querySelectorAll('.valor-do-limite-da-alquimia')) elemento.textContent = String(COTAS_DIARIAS_DE_XP.mina.base);
      for (const elemento of document.querySelectorAll('.xp-da-pocao-de-experiencia')) elemento.textContent = String(POCOES_DO_GUARDIAO.experiencia.xp);
      // Texto curto do que a poção entrega, usado no cartão: "⭐ +20 XP" ou "🌾 6 h" / "❤️ na hora" (misteriosa: "???").
      const resultadoDaPocao = vista => vista.oculta ? SEGREDO : vista.misteriosa ? vista.icone + ' usada' : vista.xp > 0 ? '⭐ +' + vista.xp + ' XP' : vista.icone + ' ' + duracaoCurta(vista);
      const seloDaCategoria = vista => {
        if (vista.oculta) return `<span class="categoria-da-pocao misteriosa">❔ ${SEGREDO}</span>`;
        const categoria = CATEGORIAS_DE_POCOES[vista.categoria]; return `<span class="categoria-da-pocao ${vista.categoria}">${categoria.icone} ${categoria.nome}</span>`;
      };
      const listaDosEfeitosAtivos = () => {
        const ativos = efeitosAtivosAgora();
        return ativos.length ? `<ul class="efeitos-ativos-do-guardiao">${ativos.map(tipo => { const pocao = POCOES_DO_GUARDIAO[tipo];
          return `<li>${pocao.icone} <b>${pocao.nome}</b> · faltam ${formatarTempoDoEfeito(msRestantesDoEfeito(tipo))}</li>`; }).join('')}</ul>` : '<p class="dica-do-guardiao">Nenhum efeito ativo agora.</p>';
      };
      // Total exibido de poções: a misteriosa não entra na conta enquanto é segredo (a quantidade dela também é "???").
      const totalVisivelDePocoes = () => TIPOS_DE_POCAO.filter(tipo => !vistaDaPocao(tipo).oculta).reduce((soma, tipo) => soma + estado.pocoes[tipo], 0);
      const desenharPainelDoGuardiao = function desenharPainelDoGuardiao(forcar = false) {
        const restante = xpRestanteDaCota('mina'), limite = cotaDaAtividade('mina'), usadoHoje = estado.cotasDoDia.usado.mina, reservaDoLimite = estado.cotasDoDia.reserva.mina;
        // A assinatura inclui os motivos de cada poção e os segundos restantes dos efeitos: o painel acompanha o relógio dos efeitos
        // e as condições (alguém se feriu, uma árvore caiu, um canteiro foi plantado) sem redesenhar a cada quadro.
        const assinatura = JSON.stringify([estado.recursos.minerios, estado.pocoes, estado.xp, restante, estado.niveis.mina, pocaoSelecionada, confirmandoPreparo, operacaoDoGuardiaoEmAndamento,
          mensagemDoGuardiao, abaDoGuardiao, misterioDescoberto(), TIPOS_DE_POCAO.map(motivoParaNaoUsar), efeitosAtivosAgora().map(tipo => tipo + Math.ceil(msRestantesDoEfeito(tipo) / 1000))]);
        if (!forcar && assinatura === assinaturaDoPainelDoGuardiao) return;
        assinaturaDoPainelDoGuardiao = assinatura;
        const focado = document.activeElement && painelDoGuardiao.contains(document.activeElement) ? document.activeElement.dataset.foco : null;
        const totalDePocoes = totalVisivelDePocoes();
        selecionar('#saldos-do-guardiao').innerHTML = `
          <div class="saldo-do-guardiao"><span>🪨 Minérios</span><b>${estado.recursos.minerios}</b></div>
          <div class="saldo-do-guardiao"><span>🧪 Poções guardadas</span><b>${totalDePocoes}</b></div>
          <div class="saldo-do-guardiao"><span>⭐ XP total</span><b>${estado.xp}</b></div>
          <div class="saldo-do-guardiao cota"><span>⚗️ Limite da alquimia hoje</span><b>${usadoHoje} / ${limite}</b>
            <span class="barra-da-cota" role="progressbar" aria-label="Limite diário de XP da alquimia usado" aria-valuemin="0" aria-valuemax="${limite}" aria-valuenow="${usadoHoje}"><i style="width:${limite ? Math.min(100, usadoHoje / limite * 100) : 0}%"></i></span>
            <small>${limite ? 'Restam ' + restante + ' XP' + (reservaDoLimite ? ' (inclui ' + Math.round(reservaDoLimite) + ' guardados de ontem)' : '') + '. Só a ⭐ Poção de Experiência usa o limite.' : 'Construa a mina para liberar a alquimia.'}</small></div>`;
        selecionar('#abas-do-guardiao').innerHTML = [['preparar', '⚗️ Preparar poções'], ['minhas', '🧪 Minhas Poções (' + totalDePocoes + ')']]
          .map(([aba, rotulo]) => `<button type="button" role="tab" class="aba-do-guardiao${aba === abaDoGuardiao ? ' ativa' : ''}" data-aba-guardiao="${aba}" data-foco="aba-${aba}" aria-selected="${aba === abaDoGuardiao}">${rotulo}</button>`).join('');
        painelDoGuardiao.querySelector('.corpo-do-guardiao').classList.toggle('aba-minhas', abaDoGuardiao === 'minhas');
        if (abaDoGuardiao === 'minhas') {
          // MINHAS POÇÕES: só as poções que o jogador possui. O botão de usar só existe quando a poção pode ser usada agora;
          // senão aparece o motivo (a validação também continua em usarPocao).
          const possuidas = TIPOS_DE_POCAO.filter(tipo => estado.pocoes[tipo] > 0);
          selecionar('#prateleira-de-pocoes').innerHTML = possuidas.length ? `<ul class="minhas-pocoes">${possuidas.map(tipo => {
            const vista = vistaDaPocao(tipo), motivo = motivoParaNaoUsar(tipo);
            return `<li class="minha-pocao">${frascoHtml(vista)}
              <div class="dados-da-minha-pocao"><b>${vista.icone} ${vista.nome}</b> ${seloDaCategoria(vista)}<span>Quantidade: <b>${quantidadeVisivel(tipo)}</b> · ${vista.efeito} <small>(${vista.duracao})</small></span></div>
              ${!motivo && !operacaoDoGuardiaoEmAndamento
                ? `<button type="button" class="botao-do-guardiao uso" data-usar-pocao="${tipo}" data-foco="usar-${tipo}">🥤 Usar · ${resultadoDaPocao(vista)}</button>`
                : `<p class="aviso-da-cota" role="note">⏳ ${motivo || 'Aguarde…'}</p>`}</li>`;
          }).join('')}</ul>`
            : `<div class="sem-pocoes"><span aria-hidden="true">🧪</span><p>Você ainda não tem poções guardadas.</p><button type="button" class="botao-do-guardiao" data-aba-guardiao="preparar">⚗️ Preparar uma poção</button></div>`;
          selecionar('#balcao-do-guardiao').innerHTML = `<h3>⚗️ Limite da alquimia</h3>
            <p class="cota-em-destaque"><b>${restante}</b> XP livres hoje (limite ${limite}${reservaDoLimite ? " + " + Math.round(reservaDoLimite) + " guardados" : ""})</p>
            <p>Só a <b>⭐ Poção de Experiência</b> usa o limite, e só se ele comportar os <b>${POCOES_DO_GUARDIAO.experiencia.xp} XP</b> inteiros. As poções de efeito podem ser usadas a qualquer hora, mesmo com o limite cheio.</p>
            <h3>✨ Efeitos ativos</h3>${listaDosEfeitosAtivos()}
            <p class="dica-do-guardiao">O mesmo efeito não acumula: espere terminar para usar outra poção igual.</p>
            <p class="mensagem-do-guardiao ${mensagemDoGuardiao.tipo}" role="status">${mensagemDoGuardiao.texto}</p>`;
          if (focado) { const elemento = painelDoGuardiao.querySelector(`[data-foco="${focado}"]`); if (elemento && !elemento.disabled) elemento.focus({ preventScroll: true }); }
          return;
        }
        // PREPARAR: as 9 receitas em três fileiras, na ordem do catálogo.
        selecionar('#prateleira-de-pocoes').innerHTML = TIPOS_DE_POCAO.map(tipo => {
          // Etapa 1: depois da descoberta, o lugar da poção misteriosa (centro da grade) vira o SELO DE LENDA: decorativo, sem preparo,
          // sem uso e sem custo. Clicar nele só mostra a lenda no balcão; passar o mouse mostra o texto (title).
          if (pocaoMisteriosa(tipo) && misterioDescoberto()) return htmlDoSeloDaLenda(tipo === pocaoSelecionada);
          const vista = vistaDaPocao(tipo), liberada = pocaoLiberada(tipo), ativo = vista.minutos && efeitoAtivo(tipo);
          // a misteriosa nunca mostra "bloqueada" nem a condição (só o custo é revelado)
          const estadoDoCartao = vista.oculta ? SEGREDO : liberada ? 'Na bolsa: <b>' + estado.pocoes[tipo] + '</b>' + (ativo ? ' · ✨ ativo ' + formatarTempoDoEfeito(msRestantesDoEfeito(tipo)) : '') : '🔒 Mina nível ' + vista.nivelMinimoDaMina;
          return `<button type="button" class="cartao-de-pocao${tipo === pocaoSelecionada ? ' selecionada' : ''}${liberada || vista.oculta ? '' : ' bloqueada'}${vista.oculta ? ' misteriosa' : ''}" data-pocao="${tipo}" data-foco="pocao-${tipo}" aria-pressed="${tipo === pocaoSelecionada}">
            ${seloDaCategoria(vista)}
            ${frascoHtml(vista)}
            <span class="nome-da-pocao">${vista.nome}</span>
            <span class="troca-da-pocao"><span>🪨 ${vista.minerios}</span><span class="seta">→</span><span>${resultadoDaPocao(vista)}</span></span>
            <span class="estado-da-pocao">${estadoDoCartao}</span>
          </button>`;
        }).join('');
        if (pocaoMisteriosa(pocaoSelecionada) && misterioDescoberto()) {   // Etapa 1: balcão da lenda (nada para preparar nem usar)
          selecionar('#balcao-do-guardiao').innerHTML = htmlDoBalcaoDaLenda() + `<p class="mensagem-do-guardiao ${mensagemDoGuardiao.tipo}" role="status">${mensagemDoGuardiao.texto}</p>`;
          if (focado) { const elemento = painelDoGuardiao.querySelector(`[data-foco="${focado}"]`); if (elemento && !elemento.disabled) elemento.focus({ preventScroll: true }); }
          return;
        }
        const vista = vistaDaPocao(pocaoSelecionada), motivoPreparo = motivoParaNaoPreparar(pocaoSelecionada), motivoUso = motivoParaNaoUsar(pocaoSelecionada);
        const bloqueado = operacaoDoGuardiaoEmAndamento;
        const usaLimite = vista.oculta ? SEGREDO : pocaoDeExperiencia(pocaoSelecionada) ? '⚗️ Sim (' + vista.xp + ' XP)' : '✅ Não: pode usar com o limite cheio';
        const condicao = vista.oculta ? SEGREDO : `${pocaoLiberada(pocaoSelecionada) ? '✅' : '🔒'} Mina no nível ${vista.nivelMinimoDaMina} ou mais <small>(sua mina: nível ${estado.niveis.mina})</small>`;
        selecionar('#balcao-do-guardiao').innerHTML = `
          <div class="cabeca-do-balcao">${frascoHtml(vista, true)}<div><h3>${vista.icone} ${vista.nome}</h3>${seloDaCategoria(vista)}<p>${vista.descricao}</p></div></div>
          <dl class="ficha-da-pocao">
            <dt>Custo para preparar</dt><dd>🪨 ${vista.minerios} minérios <small>(você tem ${estado.recursos.minerios})</small></dd>
            <dt>Efeito</dt><dd>${vista.efeito}</dd>
            <dt>Duração</dt><dd>${vista.duracao}</dd>
            <dt>Usa o Limite da alquimia?</dt><dd>${usaLimite}</dd>
            <dt>Condição</dt><dd>${condicao}</dd>
            <dt>Guardadas</dt><dd>🧪 ${quantidadeVisivel(pocaoSelecionada)}</dd>
          </dl>
          ${confirmandoPreparo ? `<div class="confirmacao-do-guardiao" role="group" aria-label="Confirmar preparo">
              <p>Entregar <b>${vista.minerios} minérios</b> ao Guardião para preparar <b>1 ${vista.nome}</b>?</p>
              <div class="acoes-do-guardiao"><button type="button" class="botao-do-guardiao secundario" data-acao-guardiao="voltar" data-foco="voltar" ${bloqueado ? 'disabled' : ''}>Voltar</button>
              <button type="button" class="botao-do-guardiao" data-acao-guardiao="confirmar-preparo" data-foco="confirmar" ${bloqueado || motivoPreparo ? 'disabled' : ''}>✔ Confirmar preparo</button></div></div>`
          : `<div class="acoes-do-guardiao">
              <button type="button" class="botao-do-guardiao" data-acao-guardiao="preparar" data-foco="preparar" ${bloqueado || motivoPreparo ? 'disabled' : ''}>⚗️ Preparar · −${vista.minerios} 🪨</button>
              ${motivoUso ? '' : `<button type="button" class="botao-do-guardiao uso" data-acao-guardiao="usar" data-foco="usar" ${bloqueado ? 'disabled' : ''}>🥤 Usar · ${resultadoDaPocao(vista)}</button>`}</div>
            <ul class="motivos-do-guardiao">${motivoPreparo ? `<li>⚗️ ${motivoPreparo}</li>` : ''}${motivoUso && estado.pocoes[pocaoSelecionada] > 0 ? `<li class="aviso-da-cota">⏳ ${motivoUso}</li>` : ''}</ul>`}
          <p class="mensagem-do-guardiao ${mensagemDoGuardiao.tipo}" role="status">${mensagemDoGuardiao.texto}</p>`;
        if (focado) { const elemento = painelDoGuardiao.querySelector(`[data-foco="${focado}"]`); if (elemento && !elemento.disabled) elemento.focus({ preventScroll: true }); }
      };
      const abrirPainelDoGuardiao = function abrirPainelDoGuardiao() {
        if (typeof fecharMenuEPaineis === 'function') fecharMenuEPaineis();
        confirmandoPreparo = false; definirMensagemDoGuardiao('', '');
        painelDoGuardiao.hidden = false; document.body.classList.add('com-tela-do-guardiao');
        desenharPainelDoGuardiao(true);
        tocarEfeito('Enter');
        selecionar('#fechar-guardiao').focus();
      };
      const fecharPainelDoGuardiao = function fecharPainelDoGuardiao() {
        if (painelDoGuardiao.hidden) return;
        painelDoGuardiao.hidden = true; document.body.classList.remove('com-tela-do-guardiao'); confirmandoPreparo = false;
        tocarEfeito('Fecha');
      };

      // ---- Transações ----
      // PREPARAR: valida → desconta minérios e guarda a poção → salva. Se o salvamento falhar, volta tudo como estava.
      const prepararPocao = function prepararPocao(tipo) {
        if (operacaoDoGuardiaoEmAndamento) return false;
        const motivo = motivoParaNaoPreparar(tipo);
        if (motivo) { definirMensagemDoGuardiao(motivo); confirmandoPreparo = false; return false; }
        operacaoDoGuardiaoEmAndamento = true;
        const pocao = POCOES_DO_GUARDIAO[tipo], mineriosAntes = estado.recursos.minerios, pocoesAntes = estado.pocoes[tipo];
        estado.recursos.minerios -= pocao.minerios; estado.pocoes[tipo] += 1;
        let sucesso = salvarProgresso();
        if (!sucesso) {
          estado.recursos.minerios = mineriosAntes;
          estado.pocoes[tipo] = pocoesAntes;
          definirMensagemDoGuardiao('Não foi possível salvar. Nenhum minério foi gasto.');
        } else {
          registrarAtividade(); atualizarResumoDeRecursos(); tocarEfeito('levelUp');
          avisarObjetivos('pocao-preparada', { tipo });   // Etapa 2: quadro de objetivos (seção 30e)
          // Etapa 2: o nome vem da VISTA (a misteriosa continua "???"); a dica de uso não fala em XP para as poções de efeito.
          const vista = vistaDaPocao(tipo);
          definirMensagemDoGuardiao('⚗️ ' + vista.nome + ' preparado! −' + pocao.minerios + ' minérios. '
            + (vista.oculta ? SEGREDO : pocao.xp > 0 ? 'Use quando quiser receber +' + pocao.xp + ' XP.' : 'Use em 🧪 Minhas Poções quando precisar.'), 'sucesso');
        }
        confirmandoPreparo = false; operacaoDoGuardiaoEmAndamento = false;
        return sucesso;
      };
      // USAR: valida (motivoParaNaoUsar) → trava → aplica → salva. Qualquer falha desfaz tudo e a poção continua guardada.
      // A trava (operacaoDoGuardiaoEmAndamento) impede que cliques rápidos consumam duas poções de uma vez.
      const usarPocao = function usarPocao(tipo) {
        if (operacaoDoGuardiaoEmAndamento || !POCOES_DO_GUARDIAO[tipo]) return false;
        const motivo = motivoParaNaoUsar(tipo);
        if (motivo) { definirMensagemDoGuardiao(motivo); return false; }
        operacaoDoGuardiaoEmAndamento = true;
        let sucesso = false;
        try { sucesso = pocaoMisteriosa(tipo) ? usarPocaoMisteriosa(tipo) : pocaoDeExperiencia(tipo) ? usarPocaoDeExperiencia(tipo) : usarPocaoDeEfeito(tipo); }
        finally { operacaoDoGuardiaoEmAndamento = false; }
        if (sucesso) avisarObjetivos('pocao-usada', { tipo });   // Etapa 2: quadro de objetivos (seção 30e)
        return sucesso;
      };
      // Etapa 2 — POÇÃO MISTERIOSA (uso único). Ordem segura: tira o frasco e marca o uso (usadoEm, concluido = false) → SALVA → só
      // então começa a cena (seção 30c). Se o salvamento falhar, nada muda (o frasco volta e o uso não é marcado). Se a página
      // fechar no meio da cena, "concluido" continua false e a cena é mostrada de novo ao abrir: o frasco nunca some sem o evento,
      // e um segundo uso é impossível porque usadoEm já está salvo.
      const usarPocaoMisteriosa = function usarPocaoMisteriosa(tipo) {
        const registro = estado.eventosEspeciais.misterio, antes = { pocoes: estado.pocoes[tipo], usadoEm: registro.usadoEm, concluido: registro.concluido };
        estado.pocoes[tipo] -= 1; registro.usadoEm = Date.now(); registro.concluido = false;
        if (!salvarProgresso()) {
          estado.pocoes[tipo] = antes.pocoes; registro.usadoEm = antes.usadoEm; registro.concluido = antes.concluido;
          definirMensagemDoGuardiao('Não foi possível salvar. A poção continua guardada.'); return false;
        }
        registrarAtividade(); definirMensagemDoGuardiao('', '');
        fecharPainelDoGuardiao();
        iniciarEventoDoUnicornio();
        return true;
      };
      // Poção de Experiência: tira a poção e credita o XP no Limite da alquimia → confere se o XP entrou INTEIRO → salva.
      // Qualquer falha desfaz a poção, o XP, o limite do dia e o contador de origem.
      const usarPocaoDeExperiencia = function usarPocaoDeExperiencia(tipo) {
        const pocao = POCOES_DO_GUARDIAO[tipo];
        const antes = { xp: estado.xp, cota: { ...estado.xpDaFazendaHoje }, cotas: JSON.parse(JSON.stringify(estado.cotasDoDia)), origem: estado.xpPorOrigem.fazenda, pocoes: estado.pocoes[tipo] };
        const restaurar = () => { estado.xp = antes.xp; estado.xpDaFazendaHoje = antes.cota; estado.cotasDoDia = antes.cotas; estado.xpPorOrigem.fazenda = antes.origem; estado.pocoes[tipo] = antes.pocoes; desenharCards(); };
        estado.pocoes[tipo] -= 1;
        const xpCreditado = creditarXP(pocao.xp, 'fazenda', false, 'mina');   // Limite da alquimia (id 'mina' mantido nos saves)
        if (xpCreditado !== pocao.xp) { restaurar(); definirMensagemDoGuardiao('O Limite da alquimia de hoje mudou. A poção continua guardada.'); return false; }
        if (!salvarProgresso()) { restaurar(); definirMensagemDoGuardiao('Não foi possível salvar. A poção e o XP foram restaurados.'); return false; }
        registrarAtividade(); tocarEfeito('xp');
        definirMensagemDoGuardiao('🥤 Você usou ' + pocao.nome + ': +' + xpCreditado + ' XP!', 'sucesso');
        mostrarAviso('🥤 ' + pocao.nome + ': +' + xpCreditado + ' XP');
        atualizarPaineisDaMark82(true);
        return true;
      };
      // Poções de EFEITO: não dão XP e não tocam no Limite da alquimia. Guarda o que o efeito pode mudar (poções, efeitos ativos,
      // árvores do acampamento e vida da equipe), aplica (seção 28c), salva e, só depois do salvamento, mexe na cena.
      const usarPocaoDeEfeito = function usarPocaoDeEfeito(tipo) {
        const pocao = POCOES_DO_GUARDIAO[tipo];
        const antes = JSON.stringify({ pocoes: estado.pocoes, efeitos: estado.efeitosDasPocoes, arvores: estado.arvoresColetaveis, vidas: estado.trabalhadores.map(dados => dados.vida) });
        const restaurar = () => {
          const copia = JSON.parse(antes);
          estado.pocoes = copia.pocoes; estado.efeitosDasPocoes = copia.efeitos; estado.arvoresColetaveis = copia.arvores;
          estado.trabalhadores.forEach((dados, indice) => { dados.vida = copia.vidas[indice]; });
        };
        estado.pocoes[tipo] -= 1;
        let depoisDeSalvar = null;
        try { depoisDeSalvar = aplicarEfeitoDaPocao(tipo); }
        catch (erro) { console.error('[FarmEdu] Falha ao aplicar a poção:', erro); restaurar(); definirMensagemDoGuardiao('Não foi possível aplicar a poção. Ela continua guardada.'); return false; }
        if (!salvarProgresso()) { restaurar(); definirMensagemDoGuardiao('Não foi possível salvar. A poção continua guardada.'); return false; }
        if (depoisDeSalvar) depoisDeSalvar();
        registrarAtividade(); tocarEfeito('levelUp');
        const texto = pocao.icone + ' ' + pocao.nome + ': ' + pocao.efeito + (pocao.minutos ? ' Dura ' + duracaoCurta(pocao) + '.' : '');
        definirMensagemDoGuardiao('🥤 ' + texto, 'sucesso'); mostrarAviso('🥤 ' + texto);
        atualizarEfeitosDasPocoes(); atualizarPaineisDaMark82(true);
        return true;
      };

      // ---- Eventos do painel (delegação: o conteúdo é redesenhado) ----
      painelDoGuardiao.addEventListener('click', evento => {
        const cartao = evento.target.closest('[data-pocao]'), acao = evento.target.closest('[data-acao-guardiao]');
        const aba = evento.target.closest('[data-aba-guardiao]'), usarDaLista = evento.target.closest('[data-usar-pocao]');
        if (aba) { abaDoGuardiao = aba.dataset.abaGuardiao; confirmandoPreparo = false; definirMensagemDoGuardiao('', ''); }
        else if (usarDaLista) { if (!usarDaLista.disabled) usarPocao(usarDaLista.dataset.usarPocao); }   // usarPocao revalida a cota
        else if (cartao) { pocaoSelecionada = cartao.dataset.pocao; confirmandoPreparo = false; definirMensagemDoGuardiao('', ''); }
        else if (acao && !acao.disabled) {
          const nome = acao.dataset.acaoGuardiao;
          if (nome === 'preparar') { const motivo = motivoParaNaoPreparar(pocaoSelecionada); if (motivo) definirMensagemDoGuardiao(motivo); else { confirmandoPreparo = true; definirMensagemDoGuardiao('', ''); } }
          else if (nome === 'voltar') confirmandoPreparo = false;
          else if (nome === 'confirmar-preparo') prepararPocao(pocaoSelecionada);
          else if (nome === 'usar') usarPocao(pocaoSelecionada);
        } else return;
        desenharPainelDoGuardiao(true);
      });
      selecionar('#fechar-guardiao').addEventListener('click', fecharPainelDoGuardiao);
      addEventListener('keydown', evento => { if (evento.key === 'Escape' && !painelDoGuardiao.hidden) { evento.stopPropagation(); fecharPainelDoGuardiao(); } }, true);
      // Chamada pelo loop (seção 30b): mantém o painel atualizado se minérios chegarem da mina ou a cota mudar com ele aberto.
      const atualizarPainelDoGuardiao = function atualizarPainelDoGuardiao() { if (!painelDoGuardiao.hidden) desenharPainelDoGuardiao(false); };
      // API de teste no console (mesmo padrão das ferramentas existentes): não aparece na interface.
      Object.assign(window, { farmEduPocoes: { prepararPocao, usarPocao, abrirPainelDoGuardiao, fecharPainelDoGuardiao } });

      arquivoDaMontagemConcluido('28b-guardiao-e-pocoes.js');
