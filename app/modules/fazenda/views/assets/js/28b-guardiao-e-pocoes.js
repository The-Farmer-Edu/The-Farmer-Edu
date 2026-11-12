// ====================================================================================================
// FARMEDU 3D — 28b-guardiao-e-pocoes.js
// SEÇÃO 28b — GUARDIÃO DA MINA E ALQUIMIA DE POÇÕES
// Substitui a antiga "troca de minérios" (1 minério = 1 XP). Agora a economia é: mina → minérios → poções → XP.
//  • O Guardião é um NPC independente, parado FORA da caverna, ao lado da entrada (POSTO_DO_GUARDIAO, seção 09), com uma
//    bancada de alquimia. Ele não faz parte da equipe, não luta e não é alvo de monstros nem de invasões.
//  • Clicar nele abre um painel de TELA CHEIA (#painel-do-guardiao) com as poções de POCOES_DO_GUARDIAO (seção 01).
//  • PREPARAR uma poção gasta minérios e guarda a poção (estado.pocoes). USAR uma poção concede o XP dela, dentro do limite
//    diário da Fazenda (creditarXP, origem 'fazenda'). Se a cota de hoje não comporta todo o XP, a poção NÃO é usada.
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
      Object.values(POCOES_DO_GUARDIAO).forEach((pocao, indice) => {
        const x = -0.5 + indice * 0.45, cor = new THREE.Color(pocao.cor).getHex();
        const frasco = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), materialDoVidro(cor)); frasco.position.set(x, 0.97, 0.05); bancadaDoGuardiao.add(frasco);
        criarCilindro(0.035, 0.04, 0.12, 0xdfe8ee, x, 1.12, 0.05, bancadaDoGuardiao, 8);                    // gargalo
        criarCilindro(0.03, 0.03, 0.04, 0x8a5a2e, x, 1.2, 0.05, bancadaDoGuardiao, 6);                       // rolha
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
      // Devolve o motivo (texto) que impede preparar, ou '' se pode.
      const motivoParaNaoPreparar = function motivoParaNaoPreparar(tipo) {
        const pocao = POCOES_DO_GUARDIAO[tipo];
        if (!estado.niveis.mina) return 'Construa a mina para começar a extrair minérios.';
        if (!pocaoLiberada(tipo)) return 'Receita liberada com a mina no nível ' + pocao.nivelMinimoDaMina + '.';
        if (estado.recursos.minerios < pocao.minerios) return 'Faltam ' + (pocao.minerios - estado.recursos.minerios) + ' minério(s) para preparar.';
        return '';
      };
      // Devolve o motivo que impede usar, ou '' se pode. A cota precisa comportar TODO o XP da poção.
      const motivoParaNaoUsar = function motivoParaNaoUsar(tipo) {
        const pocao = POCOES_DO_GUARDIAO[tipo], restante = xpRestanteDaCota('mina');
        if (estado.pocoes[tipo] < 1) return 'Você não tem esta poção guardada.';
        if (restante < pocao.xp) return textoDaCotaQueFalta(tipo);
        return '';
      };
      // Quanto XP de cota falta para a poção caber inteira hoje (0 = cabe). Usado para mostrar só as ações realmente possíveis.
      const cotaQueFaltaParaPocao = tipo => Math.max(0, POCOES_DO_GUARDIAO[tipo].xp - xpRestanteDaCota('mina'));
      const textoDaCotaQueFalta = function textoDaCotaQueFalta(tipo) {
        const pocao = POCOES_DO_GUARDIAO[tipo], restante = xpRestanteDaCota('mina');
        return 'Faltam ' + cotaQueFaltaParaPocao(tipo) + ' XP de cota hoje para usar esta poção: ela dá +' + pocao.xp + ' XP e a cota de Mina e alquimia tem '
          + (restante ? 'só ' + restante + ' XP livres' : '0 XP livres') + '. A poção continua guardada e pode ser usada quando a cota renovar (amanhã).';
      };

      // ---- Painel de tela cheia ----
      const painelDoGuardiao = selecionar('#painel-do-guardiao');
      let pocaoSelecionada = 'tonico', confirmandoPreparo = false, operacaoDoGuardiaoEmAndamento = false;
      // Aba do painel: 'preparar' (receitas e balcão) ou 'minhas' (Minhas Poções: só as que o jogador possui, com o botão de usar).
      // As duas abas e o inventário geral (seção 27b) leem o MESMO estado.pocoes: não existe estoque separado.
      let abaDoGuardiao = 'preparar';
      let mensagemDoGuardiao = { texto: '', tipo: '' }, assinaturaDoPainelDoGuardiao = '';
      const definirMensagemDoGuardiao = (texto, tipo = 'erro') => { mensagemDoGuardiao = { texto, tipo }; };
      const frascoHtml = (pocao, grande = false) => `<span class="frasco-de-pocao${grande ? ' grande' : ''}" style="--cor-da-pocao:${pocao.cor}" aria-hidden="true"><i></i></span>`;
      const desenharPainelDoGuardiao = function desenharPainelDoGuardiao(forcar = false) {
        const restante = xpRestanteDaCota('mina'), limite = cotaDaAtividade('mina'), usadoHoje = estado.cotasDoDia.usado.mina, reservaDaMina = estado.cotasDoDia.reserva.mina;
        const assinatura = JSON.stringify([estado.recursos.minerios, estado.pocoes, estado.xp, restante, estado.niveis.mina, pocaoSelecionada, confirmandoPreparo, operacaoDoGuardiaoEmAndamento, mensagemDoGuardiao, abaDoGuardiao]);
        if (!forcar && assinatura === assinaturaDoPainelDoGuardiao) return;
        assinaturaDoPainelDoGuardiao = assinatura;
        const focado = document.activeElement && painelDoGuardiao.contains(document.activeElement) ? document.activeElement.dataset.foco : null;
        const totalDePocoes = TIPOS_DE_POCAO.reduce((soma, tipo) => soma + estado.pocoes[tipo], 0);
        selecionar('#saldos-do-guardiao').innerHTML = `
          <div class="saldo-do-guardiao"><span>🪨 Minérios</span><b>${estado.recursos.minerios}</b></div>
          <div class="saldo-do-guardiao"><span>🧪 Poções guardadas</span><b>${totalDePocoes}</b></div>
          <div class="saldo-do-guardiao"><span>⭐ XP total</span><b>${estado.xp}</b></div>
          <div class="saldo-do-guardiao cota"><span>⛏️ Cota de Mina e alquimia hoje</span><b>${usadoHoje} / ${limite}</b>
            <span class="barra-da-cota" role="progressbar" aria-label="Cota diária de XP usada" aria-valuemin="0" aria-valuemax="${limite}" aria-valuenow="${usadoHoje}"><i style="width:${limite ? Math.min(100, usadoHoje / limite * 100) : 0}%"></i></span>
            <small>Restam ${restante} XP (${reservaDaMina ? "inclui " + Math.round(reservaDaMina) + " guardados de ontem; " : ""}viagens do carrinho e poções). Sobe com o nível da mina.</small></div>`;
        selecionar('#abas-do-guardiao').innerHTML = [['preparar', '⚗️ Preparar poções'], ['minhas', '🧪 Minhas Poções (' + totalDePocoes + ')']]
          .map(([aba, rotulo]) => `<button type="button" role="tab" class="aba-do-guardiao${aba === abaDoGuardiao ? ' ativa' : ''}" data-aba-guardiao="${aba}" data-foco="aba-${aba}" aria-selected="${aba === abaDoGuardiao}">${rotulo}</button>`).join('');
        painelDoGuardiao.querySelector('.corpo-do-guardiao').classList.toggle('aba-minhas', abaDoGuardiao === 'minhas');
        if (abaDoGuardiao === 'minhas') {
          // MINHAS POÇÕES: só as poções que o jogador possui. O botão de usar só existe quando a cota comporta o XP inteiro;
          // senão aparece o quanto falta (a validação também continua em usarPocao).
          const possuidas = TIPOS_DE_POCAO.filter(tipo => estado.pocoes[tipo] > 0);
          selecionar('#prateleira-de-pocoes').innerHTML = possuidas.length ? `<ul class="minhas-pocoes">${possuidas.map(tipo => {
            const pocao = POCOES_DO_GUARDIAO[tipo], falta = cotaQueFaltaParaPocao(tipo);
            return `<li class="minha-pocao">${frascoHtml(pocao)}
              <div class="dados-da-minha-pocao"><b>${pocao.nome}</b><span>Quantidade: <b>${estado.pocoes[tipo]}</b> · concede <b>+${pocao.xp} XP</b></span></div>
              ${falta === 0 && !operacaoDoGuardiaoEmAndamento
                ? `<button type="button" class="botao-do-guardiao uso" data-usar-pocao="${tipo}" data-foco="usar-${tipo}">🥤 Usar · +${pocao.xp} XP</button>`
                : `<p class="aviso-da-cota" role="note">⏳ Faltam <b>${falta} XP</b> de cota hoje para usar.</p>`}</li>`;
          }).join('')}</ul>`
            : `<div class="sem-pocoes"><span aria-hidden="true">🧪</span><p>Você ainda não tem poções guardadas.</p><button type="button" class="botao-do-guardiao" data-aba-guardiao="preparar">⚗️ Preparar uma poção</button></div>`;
          selecionar('#balcao-do-guardiao').innerHTML = `<h3>⛏️ Cota de Mina e alquimia</h3>
            <p class="cota-em-destaque"><b>${restante}</b> XP livres hoje (cota ${limite}${reservaDaMina ? " + reserva " + Math.round(reservaDaMina) : ""})</p>
            <p>Cada poção só pode ser usada se a cota de hoje comportar <b>todo</b> o XP dela. Quando não comporta, o botão não aparece e a poção continua guardada.</p>
            <p>Esta cota é dividida entre as viagens do carrinho e as poções, cresce com o nível da mina e renova a cada dia. O que você não usar hoje fica guardado por mais um dia.</p>
            <p class="mensagem-do-guardiao ${mensagemDoGuardiao.tipo}" role="status">${mensagemDoGuardiao.texto}</p>`;
          if (focado) { const elemento = painelDoGuardiao.querySelector(`[data-foco="${focado}"]`); if (elemento && !elemento.disabled) elemento.focus({ preventScroll: true }); }
          return;
        }
        selecionar('#prateleira-de-pocoes').innerHTML = TIPOS_DE_POCAO.map(tipo => {
          const pocao = POCOES_DO_GUARDIAO[tipo], liberada = pocaoLiberada(tipo);
          return `<button type="button" class="cartao-de-pocao${tipo === pocaoSelecionada ? ' selecionada' : ''}${liberada ? '' : ' bloqueada'}" data-pocao="${tipo}" data-foco="pocao-${tipo}" aria-pressed="${tipo === pocaoSelecionada}">
            ${frascoHtml(pocao)}
            <span class="nome-da-pocao">${pocao.nome}</span>
            <span class="troca-da-pocao"><span>🪨 ${pocao.minerios}</span><span class="seta">→</span><span>⭐ +${pocao.xp} XP</span></span>
            <span class="estado-da-pocao">${liberada ? 'Na bolsa: <b>' + estado.pocoes[tipo] + '</b>' : '🔒 Mina nível ' + pocao.nivelMinimoDaMina}</span>
          </button>`;
        }).join('');
        const pocao = POCOES_DO_GUARDIAO[pocaoSelecionada], motivoPreparo = motivoParaNaoPreparar(pocaoSelecionada), motivoUso = motivoParaNaoUsar(pocaoSelecionada);
        const bloqueado = operacaoDoGuardiaoEmAndamento;
        selecionar('#balcao-do-guardiao').innerHTML = `
          <div class="cabeca-do-balcao">${frascoHtml(pocao, true)}<div><h3>${pocao.icone} ${pocao.nome}</h3><p>${pocao.descricao}</p></div></div>
          <dl class="ficha-da-pocao">
            <dt>Custo para preparar</dt><dd>🪨 ${pocao.minerios} minérios <small>(você tem ${estado.recursos.minerios})</small></dd>
            <dt>XP ao usar</dt><dd>⭐ +${pocao.xp} XP <small>(${(pocao.xp / pocao.minerios).toFixed(1).replace('.', ',')} XP por minério)</small></dd>
            <dt>Condição</dt><dd>${pocaoLiberada(pocaoSelecionada) ? '✅' : '🔒'} Mina no nível ${pocao.nivelMinimoDaMina} ou mais <small>(sua mina: nível ${estado.niveis.mina})</small></dd>
            <dt>Guardadas</dt><dd>🧪 ${estado.pocoes[pocaoSelecionada]}</dd>
          </dl>
          ${confirmandoPreparo ? `<div class="confirmacao-do-guardiao" role="group" aria-label="Confirmar preparo">
              <p>Entregar <b>${pocao.minerios} minérios</b> ao Guardião para preparar <b>1 ${pocao.nome}</b>?</p>
              <div class="acoes-do-guardiao"><button type="button" class="botao-do-guardiao secundario" data-acao-guardiao="voltar" data-foco="voltar" ${bloqueado ? 'disabled' : ''}>Voltar</button>
              <button type="button" class="botao-do-guardiao" data-acao-guardiao="confirmar-preparo" data-foco="confirmar" ${bloqueado || motivoPreparo ? 'disabled' : ''}>✔ Confirmar preparo</button></div></div>`
          : `<div class="acoes-do-guardiao">
              <button type="button" class="botao-do-guardiao" data-acao-guardiao="preparar" data-foco="preparar" ${bloqueado || motivoPreparo ? 'disabled' : ''}>⚗️ Preparar · −${pocao.minerios} 🪨</button>
              ${motivoUso ? '' : `<button type="button" class="botao-do-guardiao uso" data-acao-guardiao="usar" data-foco="usar" ${bloqueado ? 'disabled' : ''}>🥤 Usar · +${pocao.xp} XP</button>`}</div>
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
        if (!sucesso) { estado.recursos.minerios = mineriosAntes; estado.pocoes[tipo] = pocoesAntes; definirMensagemDoGuardiao('Não foi possível salvar. Nenhum minério foi gasto.'); }
        else {
          registrarAtividade(); atualizarResumoDeRecursos(); tocarEfeito('levelUp');
          definirMensagemDoGuardiao('⚗️ ' + pocao.nome + ' preparado! −' + pocao.minerios + ' minérios. Use quando quiser receber +' + pocao.xp + ' XP.', 'sucesso');
        }
        confirmandoPreparo = false; operacaoDoGuardiaoEmAndamento = false;
        return sucesso;
      };
      // USAR: valida (poção guardada e cota suficiente) → tira a poção e credita o XP → confere se o XP entrou INTEIRO → salva.
      // Qualquer falha desfaz a poção, o XP, a cota do dia e o contador de origem.
      const usarPocao = function usarPocao(tipo) {
        if (operacaoDoGuardiaoEmAndamento) return false;
        const motivo = motivoParaNaoUsar(tipo);
        if (motivo) { definirMensagemDoGuardiao(motivo); return false; }
        operacaoDoGuardiaoEmAndamento = true;
        const pocao = POCOES_DO_GUARDIAO[tipo];
        const antes = { xp: estado.xp, cota: { ...estado.xpDaFazendaHoje }, cotas: JSON.parse(JSON.stringify(estado.cotasDoDia)), origem: estado.xpPorOrigem.fazenda, pocoes: estado.pocoes[tipo] };
        const restaurar = () => { estado.xp = antes.xp; estado.xpDaFazendaHoje = antes.cota; estado.cotasDoDia = antes.cotas; estado.xpPorOrigem.fazenda = antes.origem; estado.pocoes[tipo] = antes.pocoes; desenharCards(); };
        estado.pocoes[tipo] -= 1;
        const xpCreditado = creditarXP(pocao.xp, 'fazenda', false, 'mina');   // cota de Mina e alquimia (a mesma dos ciclos)
        let sucesso = true;
        if (xpCreditado !== pocao.xp) { restaurar(); sucesso = false; definirMensagemDoGuardiao('A cota de XP de hoje mudou. A poção continua guardada.'); }
        else if (!salvarProgresso()) { restaurar(); sucesso = false; definirMensagemDoGuardiao('Não foi possível salvar. A poção e o XP foram restaurados.'); }
        else {
          registrarAtividade(); tocarEfeito('xp');
          definirMensagemDoGuardiao('🥤 Você usou ' + pocao.nome + ': +' + xpCreditado + ' XP!', 'sucesso');
          mostrarAviso('🥤 ' + pocao.nome + ': +' + xpCreditado + ' XP');
          atualizarPaineisDaMark82(true);
        }
        operacaoDoGuardiaoEmAndamento = false;
        return sucesso;
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
