      // ====================================================================================================
      // FARMEDU 3D — 30j-caverna-secreta.js (EDIÇÃO PESSOAL: a caverna secreta dos personagens)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA), depois da seção 30i e antes do loop.
      // ====================================================================================================
      // Clicar na BOCA DA CAVERNA (a entrada natural no morro a noroeste, a mesma dos trilhos da mina — seção 11a) leva a uma
      // cena 2D em pixel art: um esconderijo subterrâneo onde oito personagens existem e se mexem, SEM diálogos.
      // Esta seção é só a PORTA, no mesmo molde da cena do celeiro (seção 30i, da qual reaproveita a íris, a suspensão da
      // Fazenda e a pausa dos sons, sem alterá-la): alvo de clique, condições, transições e carregamento sob demanda. A cena
      // (sprites, cenário, personagens, luz e o laço próprio) fica em views/assets/easter-eggs/caverna/ e só é baixada na
      // PRIMEIRA entrada (usa também easter-eggs/vingadores/pixel.js, as ferramentas de pixel art do celeiro).
      // Estado preservado: diferente do celeiro, a Fazenda fica suspensa ANTES da íris fechar e só volta DEPOIS da íris abrir
      // (as íris passam sobre o último quadro desenhado): o tempo do jogo não anda nada durante a visita, nem nas transições.
      // ====================================================================================================
      const CAVERNA_SECRETA_CONFIG = {
        ativa: true,
        segundosDaIrisFechando: 1.0, segundosDaIrisAbrindo: 1.1, segundosDaIrisNaVolta: 0.8,
        // arquivos da cena, em ordem (relativos a views/assets/easter-eggs/)
        arquivos: ['caverna/configuracao.js',
          'caverna/sprites.js', 'caverna/efeitos.js', 'caverna/cenario/caverna.js', 'caverna/personagens/ator.js', 'caverna/personagens/boneco.js',
          'caverna/personagens/ultron.js', 'caverna/personagens/coringa.js', 'caverna/personagens/venom.js', 'caverna/personagens/hulk.js',
          'caverna/personagens/destino.js', 'caverna/personagens/batman.js', 'caverna/personagens/slenderman.js', 'caverna/personagens/freddy.js', 'caverna/falas.js',
          'caverna/motor.js'],
        personagens: [],   // os oito são bonecos articulados desenhados por código (personagens/boneco.js): nenhum atlas de sprite a baixar
      };
      const CAVERNA_SECRETA = { estado: 'fechada', carregamento: null, centroDaEntrada: null, entradas: 0 };   // fechada | abrindo | aberta | fechando

      // ---- elementos (criados aqui: o HTML da equipe não muda). Nenhum texto dentro da cena: só o botão de volta. ----
      const camadaDaCaverna = document.createElement('div'); camadaDaCaverna.id = 'caverna-secreta'; camadaDaCaverna.hidden = true;
      camadaDaCaverna.setAttribute('role', 'dialog'); camadaDaCaverna.setAttribute('aria-label', 'Caverna secreta');
      camadaDaCaverna.innerHTML = '<canvas id="tela-da-caverna" aria-hidden="true"></canvas>'
        + '<button id="sair-da-caverna" type="button" title="Voltar à fazenda (Esc)">⟵ Fazenda <kbd>Esc</kbd></button>';
      document.body.appendChild(camadaDaCaverna);

      // ---- endereço dos arquivos (servidor PHP → rota fazenda/arquivo; file:// → pasta), relativo a assets/easter-eggs/ ----
      const enderecoDaCaverna = function enderecoDaCaverna(caminho) {
        const endereco = new URL(ENDERECO_DO_SCRIPT_PRINCIPAL || location.href);
        if (endereco.protocol === 'file:' || !ENDERECO_DO_SCRIPT_PRINCIPAL) return new URL('../easter-eggs/' + caminho, endereco).href;
        const partes = ('easter-eggs/' + caminho).split('/'), arquivo = partes.pop();
        return new URL('arquivo?type=' + encodeURIComponent(partes.join('/')) + '&file=' + encodeURIComponent(arquivo), endereco).href;
      };
      // Baixa os arquivos UMA vez (em ordem), depois os PNGs dos sprites, e prepara a cena; chamadas seguintes reutilizam.
      const carregarCavernaSecreta = function carregarCavernaSecreta() {
        if (CAVERNA_SECRETA.carregamento) return CAVERNA_SECRETA.carregamento;
        if (!document.querySelector('link[data-fonte-do-celeiro]')) { const fonte = document.createElement('link'); fonte.rel = 'stylesheet'; fonte.href = CENA_DO_CELEIRO_CONFIG.fonte; fonte.dataset.fonteDoCeleiro = '1'; document.head.appendChild(fonte); }   // fonte pixelada dos balões de fala (a mesma do celeiro)
        const scripts = (window.CenaDoCeleiro && window.CenaDoCeleiro.pixel ? [] : ['vingadores/pixel.js']).concat(CAVERNA_SECRETA_CONFIG.arquivos);
        (window.CavernaSecreta = window.CavernaSecreta || {}).endereco = enderecoDaCaverna;
        CAVERNA_SECRETA.carregamento = scripts.reduce((anterior, caminho) => anterior.then(() => new Promise((resolver, rejeitar) => {
          const script = document.createElement('script'); script.src = enderecoDaCaverna(caminho); script.async = false;
          script.onload = resolver; script.onerror = () => rejeitar(new Error('arquivo da caverna não carregou: ' + caminho));
          document.head.appendChild(script);
        })), Promise.resolve())
          .then(() => window.CavernaSecreta.sprites.carregar(CAVERNA_SECRETA_CONFIG.personagens))
          .then(() => { window.CavernaSecreta.motor.iniciar({ tela: selecionar('#tela-da-caverna') }); });
        CAVERNA_SECRETA.carregamento.catch(erro => { console.error('[FarmEdu] Caverna secreta:', erro); CAVERNA_SECRETA.carregamento = null; });
        return CAVERNA_SECRETA.carregamento;
      };

      // ---- alvo de clique: a abertura em arco da boca da caverna (mesmo contorno da seção 11a), um pouco à frente da rocha ----
      // Não entra na cena 3D (não é desenhado): só serve ao raio do clique. Nada do mapa muda de lugar.
      const alvoDaCaverna = (() => {
        const meiaLargura = 1.35, alturaDaParede = 1.15, pontos = [new THREE.Vector2(meiaLargura, 0)];
        for (let passo = 0; passo <= 18; passo++) { const angulo = passo / 18 * Math.PI; pontos.push(new THREE.Vector2(Math.cos(angulo) * meiaLargura, alturaDaParede + Math.sin(angulo) * meiaLargura)); }
        pontos.push(new THREE.Vector2(-meiaLargura, 0));
        const geometria = new THREE.ShapeGeometry(new THREE.Shape(pontos)); geometria.translate(0, 0, 0.02);
        const malha = new THREE.Mesh(geometria, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
        entradaDaCaverna.updateMatrixWorld(true); malha.matrixAutoUpdate = false; malha.matrixWorld.copy(entradaDaCaverna.matrixWorld);
        return malha;
      })();
      // Pista discreta: lá no fundo do túnel, um brilho fraco que muda de cor devagar (vermelho, verde, roxo, âmbar) — quem
      // olha a boca da caverna percebe que há algo lá dentro, sem placa nem texto. Material próprio, sem névoa nem ciclo do dia.
      const pistaDaCaverna = (() => {
        const material = new THREE.MeshBasicMaterial({ color: 0xff3322, transparent: true, opacity: 0.0, depthWrite: false, fog: false, blending: THREE.AdditiveBlending });
        material.userData.ignorarCiclo = true;
        const malha = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55), material);
        malha.position.set(0, 0.85, -(1.4 + MINA_GEOMETRIA.profundidadeDoTunel) + 0.12); malha.userData.nome = 'pista-da-caverna-secreta'; malha.renderOrder = 2;
        const cores = [new THREE.Color(0xff3322), new THREE.Color(0x39ff6a), new THREE.Color(0x9b3dff), new THREE.Color(0xffb45a)], cor = new THREE.Color();
        malha.onBeforeRender = () => {
          const segundos = performance.now() / 1000, fase = (segundos / 4) % cores.length, indiceDaCor = Math.floor(fase), transicao = fase - indiceDaCor;
          cor.copy(cores[indiceDaCor]).lerp(cores[(indiceDaCor + 1) % cores.length], transicao * transicao * (3 - 2 * transicao)); material.color.copy(cor);
          material.opacity = 0.32 + 0.1 * Math.sin(segundos * 1.7) + (Math.sin(segundos * 23) > 0.96 ? 0.15 : 0);
        };
        entradaDaCaverna.add(malha);
        return malha;
      })();
      const raioDaCaverna = new THREE.Raycaster(), pontoDaCaverna = new THREE.Vector2();
      // Verdadeiro se o raio acerta a abertura e NADA clicável está na frente dela (pórtico/carrinho da mina, Guardião, pedra).
      // A seção 23 (clique na mina) consulta esta função para não abrir o painel da mina quando o clique é na boca da caverna.
      const raioAcertaAEntradaDaCaverna = function raioAcertaAEntradaDaCaverna(raio) {
        if (!CAVERNA_SECRETA_CONFIG.ativa) return false;
        const acerto = raio.intersectObject(alvoDaCaverna, false)[0]; if (!acerto) return false;
        const naFrente = objeto => { const outro = objeto && raio.intersectObject(objeto, true)[0]; return !!outro && outro.distance < acerto.distance - 0.05; };
        if (estado.niveis.mina && naFrente(grupoDaArea.mina)) return false;
        if (typeof NPCS_CLICAVEIS !== 'undefined' && NPCS_CLICAVEIS.some(npc => naFrente(npc.areaDeClique))) return false;
        if (naFrente(pedraSecreta.hitbox)) return false;
        return true;
      };
      const centroDaEntradaNaTela = function centroDaEntradaNaTela() {
        const ponto = new THREE.Vector3(0, 1.2, 0).applyMatrix4(entradaDaCaverna.matrixWorld).project(camera), retangulo = canvas.getBoundingClientRect();
        return [Math.min(retangulo.right, Math.max(retangulo.left, retangulo.left + (ponto.x + 1) / 2 * retangulo.width)), Math.min(retangulo.bottom, Math.max(retangulo.top, retangulo.top + (1 - ponto.y) / 2 * retangulo.height))];
      };

      // ---- condições para entrar (vazio = pode) ----
      const motivoParaNaoEntrarNaCaverna = function motivoParaNaoEntrarNaCaverna() {
        if (!CAVERNA_SECRETA_CONFIG.ativa || CAVERNA_SECRETA.estado !== 'fechada' || CENA_DO_CELEIRO.estado !== 'fechada') return 'ocupado';
        if (INVASAO_EM_CURSO.fase !== 'nenhuma') return 'Agora não: há uma invasão acontecendo lá fora!';
        try { if (eventoEspecialEmAndamento()) return 'cena especial'; } catch (erro) { }
        for (const seletor of ['#tutorial', '#painel-do-guardiao', '#janela-nome-da-fazenda', '#janela-defesa', '#tela-de-carregamento']) { const elemento = document.querySelector(seletor); if (elemento && !elemento.hidden) return seletor; }
        return '';
      };

      // ---- entrar e sair ----
      const suspenderFazendaPelaCaverna = function suspenderFazendaPelaCaverna() { FAZENDA_SUSPENSA.ativa = true; FAZENDA_SUSPENSA.motivo = 'caverna'; pausarSonsDaFazenda(); };
      const retomarFazendaDepoisDaCaverna = function retomarFazendaDepoisDaCaverna() { FAZENDA_SUSPENSA.ativa = false; FAZENDA_SUSPENSA.motivo = ''; retomarSonsDaFazenda(); };
      const entrarNaCaverna = async function entrarNaCaverna() {
        const motivo = motivoParaNaoEntrarNaCaverna();
        if (motivo) { if (motivo.startsWith('Agora')) mostrarAviso('🧟 ' + motivo); return false; }
        CAVERNA_SECRETA.estado = 'abrindo'; CAVERNA_SECRETA.entradas++;
        registrarAtividade(); fecharPainelDaEstrutura && fecharPainelDaEstrutura(false);
        CAVERNA_SECRETA.centroDaEntrada = centroDaEntradaNaTela();
        suspenderFazendaPelaCaverna();                                      // o tempo da Fazenda para JÁ (a íris passa sobre o último quadro)
        const carregando = carregarCavernaSecreta();                         // começa a baixar enquanto a íris fecha
        await animarIris(CAVERNA_SECRETA.centroDaEntrada, 1, 0, CAVERNA_SECRETA_CONFIG.segundosDaIrisFechando);
        try { await carregando; }
        catch (erro) { await animarIris(CAVERNA_SECRETA.centroDaEntrada, 0, 1, 0.6); irisDoCeleiro.hidden = true; retomarFazendaDepoisDaCaverna(); CAVERNA_SECRETA.estado = 'fechada'; mostrarAviso('Não foi possível abrir a caverna agora.'); return false; }
        camadaDaCaverna.hidden = false; document.body.classList.add('dentro-da-caverna');
        window.CavernaSecreta.motor.retomar();
        const retanguloDaCena = selecionar('#tela-da-caverna').getBoundingClientRect();
        await animarIris([retanguloDaCena.left + retanguloDaCena.width * 0.5, retanguloDaCena.top + retanguloDaCena.height * 0.55], 0, 1, CAVERNA_SECRETA_CONFIG.segundosDaIrisAbrindo);
        irisDoCeleiro.hidden = true; CAVERNA_SECRETA.estado = 'aberta';
        selecionar('#sair-da-caverna').focus({ preventScroll: true });
        return true;
      };
      const sairDaCaverna = async function sairDaCaverna() {
        if (CAVERNA_SECRETA.estado !== 'aberta') return false;
        CAVERNA_SECRETA.estado = 'fechando';
        const retanguloDaCena = selecionar('#tela-da-caverna').getBoundingClientRect();
        await animarIris([retanguloDaCena.left + retanguloDaCena.width * 0.5, retanguloDaCena.top + retanguloDaCena.height * 0.55], 1, 0, CAVERNA_SECRETA_CONFIG.segundosDaIrisNaVolta);
        window.CavernaSecreta.motor.suspender();
        camadaDaCaverna.hidden = true; document.body.classList.remove('dentro-da-caverna');
        renderizador.render(cena, camera);                                    // só redesenha (sem simular): vale se a janela mudou de tamanho
        await animarIris(centroDaEntradaNaTela(), 0, 1, CAVERNA_SECRETA_CONFIG.segundosDaIrisFechando);
        irisDoCeleiro.hidden = true; retomarFazendaDepoisDaCaverna(); CAVERNA_SECRETA.estado = 'fechada';
        return true;
      };
      selecionar('#sair-da-caverna').addEventListener('click', () => { sairDaCaverna(); });
      // teclado: enquanto a caverna (ou uma transição dela) está na tela, nenhuma tecla chega à Fazenda; Esc sai
      const teclasDaCaverna = evento => {
        if (CAVERNA_SECRETA.estado === 'fechada') return;
        if (evento.type === 'keydown' && evento.key === 'Escape') sairDaCaverna();
        if (evento.key !== 'Tab') { evento.stopImmediatePropagation(); if (evento.key === 'Escape') evento.preventDefault(); }
      };
      addEventListener('keydown', teclasDaCaverna, true); addEventListener('keyup', teclasDaCaverna, true);

      // ---- clique na boca da caverna: toque curto (sem arrastar a câmera) ----
      let toqueNaCaverna = null;
      canvas.addEventListener('pointerdown', evento => { toqueNaCaverna = evento.isPrimary ? { x: evento.clientX, y: evento.clientY, instante: performance.now() } : null; });
      canvas.addEventListener('pointerup', evento => {
        const inicio = toqueNaCaverna; toqueNaCaverna = null;
        if (!inicio || Math.hypot(evento.clientX - inicio.x, evento.clientY - inicio.y) > 6 || performance.now() - inicio.instante > 500) return;
        const retangulo = canvas.getBoundingClientRect();
        pontoDaCaverna.set(((evento.clientX - retangulo.left) / retangulo.width) * 2 - 1, -((evento.clientY - retangulo.top) / retangulo.height) * 2 + 1);
        raioDaCaverna.setFromCamera(pontoDaCaverna, camera);
        if (raioAcertaAEntradaDaCaverna(raioDaCaverna)) entrarNaCaverna();
      });
      Object.assign(window, { farmEduCaverna: { entrar: entrarNaCaverna, sair: sairDaCaverna, estado: () => CAVERNA_SECRETA.estado, motivo: motivoParaNaoEntrarNaCaverna, centro: centroDaEntradaNaTela, acertaEntrada: raioAcertaAEntradaDaCaverna, pista: pistaDaCaverna } });

      arquivoDaMontagemConcluido('30j-caverna-secreta.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
