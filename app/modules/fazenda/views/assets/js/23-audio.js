      // ====================================================================================================
      // FARMEDU 3D — 23-audio.js (Fase 3B da refatoração: seção 23)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================

      // ====================================================================================================
      // SEÇÃO 23 — ÁUDIO: MÚSICA, ANIMAIS, AMBIENTES E SEGREDO
      // Nada toca antes do primeiro clique em "Ativar áudio" (regra de autoplay). Cada som usa um único elemento <audio>; arquivos ausentes não quebram o jogo.
      // Os caminhos dos arquivos ficam em AUDIO_CONFIG (bloco "CONFIGURAÇÃO DOS ÁUDIOS", logo depois da seção 02).
      // ====================================================================================================
      // Os caminhos ficam em AUDIO_CONFIG (início do arquivo). Nada toca antes do primeiro clique em "Ativar áudio" (regra de autoplay).
      // Cada som usa um único elemento <audio> reutilizado. Arquivo ausente = o som é marcado como indisponível e o jogo segue normalmente.
      const CHAVE_DO_AUDIO = 'fazenda3d-audio-v1';
      const TIPOS_DE_ANIMAL_COM_SOM = Object.keys(AUDIO_CONFIG.animais).filter(chave => chave !== 'global');
      const ESTADO_DO_AUDIO = {
        liberado: false,
        musica: { ligado: true, volume: AUDIO_CONFIG.volumesIniciais.musica, querTocar: true },
        animais: { ligado: true, volume: AUDIO_CONFIG.volumesIniciais.animais, individuais: Object.fromEntries(TIPOS_DE_ANIMAL_COM_SOM.map(tipo => [tipo, true])) },
        cachoeira: { ligado: true, volume: AUDIO_CONFIG.volumesIniciais.cachoeira },
        fonte: { ligado: true, volume: AUDIO_CONFIG.volumesIniciais.fonte },
      };
      try { // preferências salvas (apenas valores válidos)
        const salvo = JSON.parse(localStorage.getItem(CHAVE_DO_AUDIO));
        if (salvo) for (const categoria of ['musica', 'animais', 'cachoeira', 'fonte']) if (salvo[categoria]) {
          if (typeof salvo[categoria].ligado === 'boolean') ESTADO_DO_AUDIO[categoria].ligado = salvo[categoria].ligado;
          if (Number.isFinite(salvo[categoria].volume)) ESTADO_DO_AUDIO[categoria].volume = Math.min(1, Math.max(0, salvo[categoria].volume));
          if (categoria === 'animais' && salvo[categoria].individuais) for (const tipo of TIPOS_DE_ANIMAL_COM_SOM) if (typeof salvo[categoria].individuais[tipo] === 'boolean') ESTADO_DO_AUDIO.animais.individuais[tipo] = salvo[categoria].individuais[tipo];
        }
      } catch (erro) { }
      // Grava no localStorage (chave fazenda3d-audio-v1) o que está ligado e os volumes de cada categoria.
      const salvarPreferenciasDeAudio = function salvarPreferenciasDeAudio() { try { localStorage.setItem(CHAVE_DO_AUDIO, JSON.stringify({ musica: ESTADO_DO_AUDIO.musica, animais: ESTADO_DO_AUDIO.animais, cachoeira: ESTADO_DO_AUDIO.cachoeira, fonte: ESTADO_DO_AUDIO.fonte })); } catch (erro) { } };

      // Mantém o volume entre 0 e 1 (limite do elemento <audio>).
      const limitarVolume = volume => Math.min(1, Math.max(0, volume));
      // Ganchos chamados quando o estado de algum som muda; é trocada por atualizarPainelDeAudio mais adiante.
      let aoMudarOAudio = () => { };
      // Cria o elemento <audio> de um som (uma única vez). O arquivo só é carregado quando necessário; erros de
      // carga marcam o som como indisponível.
      const criarFonteDeSom = function criarFonteDeSom(arquivo, repetirEmLoop) {
        const fonteDeSom = { arquivo, estado: 'ocioso', el: new Audio() }; // estado: ocioso | carregando | erro
        fonteDeSom.el.preload = 'none'; fonteDeSom.el.loop = repetirEmLoop;
        fonteDeSom.el.addEventListener('error', () => { fonteDeSom.estado = 'erro'; aoMudarOAudio(); });
        fonteDeSom.el.addEventListener('playing', () => { fonteDeSom.estado = 'ok'; aoMudarOAudio(); });
        fonteDeSom.el.addEventListener('pause', () => aoMudarOAudio());
        return fonteDeSom;
      };
      const FONTES_DE_SOM = { musica: criarFonteDeSom(AUDIO_CONFIG.musica.arquivo, true), cachoeira: criarFonteDeSom(AUDIO_CONFIG.ambiente.cachoeira.arquivo, true),
                   fonte: criarFonteDeSom(AUDIO_CONFIG.ambiente.fonte.arquivo, true), pedraSecreta: criarFonteDeSom(AUDIO_CONFIG.segredos.pedraSecreta.arquivo, false), animais: {} };
      for (const tipo of TIPOS_DE_ANIMAL_COM_SOM) FONTES_DE_SOM.animais[tipo] = criarFonteDeSom(AUDIO_CONFIG.animais[tipo].arquivo, false);

      // Para o som e esquece o arquivo, permitindo uma nova tentativa de carga (útil se o arquivo foi adicionado
      // depois).
      const reiniciarFonteDeSom = function reiniciarFonteDeSom(fonteDeSom) { try { fonteDeSom.el.pause(); fonteDeSom.el.removeAttribute('src'); fonteDeSom.el.load(); } catch (erro) { } fonteDeSom.estado = 'ocioso'; };
      // Toca um som com o volume dado. Devolve uma Promise<boolean> e nunca lança erro: bloqueio do navegador
      // gera aviso, arquivo ausente marca o som como indisponível.
      const tocarSom = function tocarSom(fonteDeSom, volume) { // devolve uma Promise<boolean>; nunca lança erro
        try {
          if (fonteDeSom.estado === 'erro') return Promise.resolve(false);
          if (!fonteDeSom.el.getAttribute('src')) { fonteDeSom.el.src = fonteDeSom.arquivo; fonteDeSom.estado = 'carregando'; }
          fonteDeSom.el.volume = limitarVolume(volume);
          const promessa = fonteDeSom.el.play();
          if (!promessa || !promessa.then) return Promise.resolve(true);
          return promessa.then(() => true, erro => {
            if (erro && erro.name === 'NotAllowedError') mostrarAviso('O navegador bloqueou o som. Toque em "Ativar áudio" no painel de áudio.');
            else if (erro && erro.name !== 'AbortError') fonteDeSom.estado = 'erro';
            aoMudarOAudio(); return false;
          });
        } catch (erro) { fonteDeSom.estado = 'erro'; aoMudarOAudio(); return Promise.resolve(false); }
      };
      // Pausa o som (sem perder a posição).
      const pararSom = function pararSom(fonteDeSom) { try { fonteDeSom.el.pause(); } catch (erro) { } };
      // Verdadeiro se o som está em reprodução.
      const tocando = fonteDeSom => !fonteDeSom.el.paused && !fonteDeSom.el.ended;

      // Volume final da música = volume do painel × volume da configuração.
      const volumeDaMusica = () => limitarVolume(ESTADO_DO_AUDIO.musica.volume * AUDIO_CONFIG.musica.volume);
      const FONTES_DOS_AMBIENTES = { cachoeira: () => [CENTRO_X_DA_CACHOEIRA, Z_DA_FRENTE_DA_CACHOEIRA], fonte: () => [PRACA_CENTRAL.x, PRACA_CENTRAL.z] };   // chafariz no centro da praça central
      // Volume de cachoeira/fonte: volume do painel × configuração × fator de distância entre a câmera e a fonte
      // do som (nunca abaixo do mínimo configurado).
      const volumeDoAmbiente = function volumeDoAmbiente(nome) {
        const configuracao = AUDIO_CONFIG.ambiente[nome], [posicaoX, posicaoZ] = FONTES_DOS_AMBIENTES[nome](), distancia = Math.hypot(alvoAtualDaCamera.x - posicaoX, alvoAtualDaCamera.z - posicaoZ);
        return limitarVolume(ESTADO_DO_AUDIO[nome].volume * configuracao.volume * Math.max(configuracao.volumeMinimoDeLonge, 1 - distancia / configuracao.distanciaMaxima));
      };
      // Liga ou pausa a música conforme o estado (áudio liberado, categoria ligada, jogador quer tocar, arquivo
      // disponível) e ajusta o volume.
      const sincronizarMusica = function sincronizarMusica() {
        const fonteDeSom = FONTES_DE_SOM.musica, deveEstarTocando = ESTADO_DO_AUDIO.liberado && ESTADO_DO_AUDIO.musica.ligado && ESTADO_DO_AUDIO.musica.querTocar && fonteDeSom.estado !== 'erro';
        if (deveEstarTocando && fonteDeSom.el.paused) tocarSom(fonteDeSom, volumeDaMusica());
        else if (!deveEstarTocando && !fonteDeSom.el.paused) pararSom(fonteDeSom);
        else if (deveEstarTocando) fonteDeSom.el.volume = volumeDaMusica();
        aoMudarOAudio();
      };
      // Igual a sincronizarMusica, mas para os sons contínuos (cachoeira e fonte), com volume dependente da
      // distância.
      const sincronizarAmbiente = function sincronizarAmbiente(nome) {
        const fonteDeSom = FONTES_DE_SOM[nome], deveEstarTocando = ESTADO_DO_AUDIO.liberado && ESTADO_DO_AUDIO[nome].ligado && ESTADO_DO_AUDIO[nome].volume > 0.001 && fonteDeSom.estado !== 'erro';
        if (deveEstarTocando && fonteDeSom.el.paused) tocarSom(fonteDeSom, volumeDoAmbiente(nome));
        else if (!deveEstarTocando && !fonteDeSom.el.paused) pararSom(fonteDeSom);
        else if (deveEstarTocando) fonteDeSom.el.volume = volumeDoAmbiente(nome);
      };
      // Chamada dentro de um clique do jogador (exigência de autoplay dos navegadores): libera o áudio, inicia
      // música e ambientes e "destrava" os demais sons, tocando-os mudos por um instante (necessário no iOS).
      const liberarAudio = function liberarAudio() { // chamado dentro de um clique do jogador: é o que permite o navegador tocar
        ESTADO_DO_AUDIO.liberado = true;
        sincronizarMusica(); sincronizarAmbiente('cachoeira'); sincronizarAmbiente('fonte');
        for (const fonteDeSom of [...Object.values(FONTES_DE_SOM.animais), FONTES_DE_SOM.pedraSecreta]) { // "destrava" os demais elementos (necessário no iOS); mudo e só por um instante
          try {
            fonteDeSom.el.src = fonteDeSom.arquivo; fonteDeSom.estado = 'carregando'; fonteDeSom.el.muted = true;
            const promessa = fonteDeSom.el.play();
            const soltar = () => { fonteDeSom.el.muted = false; };
            if (promessa && promessa.then) promessa.then(() => { fonteDeSom.el.pause(); try { fonteDeSom.el.currentTime = 0; } catch (erro) { } soltar(); }, () => { soltar(); }); else soltar();
          } catch (erro) { fonteDeSom.el.muted = false; }
        }
        aoMudarOAudio();
      };
      // Botão play/pause da música. O primeiro clique libera o áudio e já inicia a música.
      const alternarMusica = function alternarMusica() {
        if (!ESTADO_DO_AUDIO.liberado) { ESTADO_DO_AUDIO.musica.ligado = true; ESTADO_DO_AUDIO.musica.querTocar = true; liberarAudio(); salvarPreferenciasDeAudio(); return; } // o primeiro clique já inicia a música
        if (FONTES_DE_SOM.musica.estado === 'erro') reiniciarFonteDeSom(FONTES_DE_SOM.musica);   // nova tentativa
        ESTADO_DO_AUDIO.musica.querTocar = !(ESTADO_DO_AUDIO.musica.ligado && ESTADO_DO_AUDIO.musica.querTocar && tocando(FONTES_DE_SOM.musica));
        if (!ESTADO_DO_AUDIO.musica.ligado) ESTADO_DO_AUDIO.musica.ligado = true;
        sincronizarMusica(); salvarPreferenciasDeAudio();
      };
      // Liga/desliga uma categoria (música, animais, cachoeira, fonte). Ao religar, tenta de novo arquivos que
      // falharam.
      const definirCategoriaDeAudio = function definirCategoriaDeAudio(categoria, ligado) {
        ESTADO_DO_AUDIO[categoria].ligado = ligado;
        if (ligado) { // religar tenta de novo arquivos que falharam
          if (categoria === 'musica') reiniciarFonteDeSom(FONTES_DE_SOM.musica); else if (categoria === 'animais') Object.values(FONTES_DE_SOM.animais).forEach(fonteDeSom => { if (fonteDeSom.estado === 'erro') reiniciarFonteDeSom(fonteDeSom); }); else reiniciarFonteDeSom(FONTES_DE_SOM[categoria]);
        }
        if (categoria === 'musica') sincronizarMusica(); else if (categoria !== 'animais') sincronizarAmbiente(categoria);
        aoMudarOAudio(); salvarPreferenciasDeAudio();
      };
      // Define o volume de uma categoria e aplica na hora aos sons que já tocam.
      const definirVolumeDaCategoria = function definirVolumeDaCategoria(categoria, volume) {
        ESTADO_DO_AUDIO[categoria].volume = limitarVolume(volume);
        if (categoria === 'musica') sincronizarMusica(); else if (categoria !== 'animais') sincronizarAmbiente(categoria);
        salvarPreferenciasDeAudio();
      };

      // ---- sons dos animais: intervalos aleatórios por tipo, sem sobreposição excessiva, mais baixos quando a câmera está longe ----
      const agendaDosAnimais = { proximo: {}, ultimoSom: -999 };
      const vetorDoSom = new THREE.Vector3();
      // Sorteia o próximo intervalo (em segundos) entre dois sons de um mesmo animal.
      const sortearIntervalo = configuracao => configuracao.intervaloMin + Math.random() * (configuracao.intervaloMax - configuracao.intervaloMin);
      // A cada quadro desconta o tempo de cada tipo de animal; quando zera, sorteia um animal do tipo, calcula o
      // volume pela distância da câmera e toca. Respeita intervalo mínimo e máximo de sons simultâneos.
      const atualizarSonsDosAnimais = function atualizarSonsDosAnimais(segundosDesdeUltimoFrame, tempo) {
        if (!ESTADO_DO_AUDIO.liberado || !ESTADO_DO_AUDIO.animais.ligado || ESTADO_DO_AUDIO.animais.volume <= 0.001) return;
        const limitesGlobais = AUDIO_CONFIG.animais.global;
        for (const tipo of TIPOS_DE_ANIMAL_COM_SOM) {
          const configuracao = AUDIO_CONFIG.animais[tipo], fonteDeSom = FONTES_DE_SOM.animais[tipo];
          if (agendaDosAnimais.proximo[tipo] === undefined) agendaDosAnimais.proximo[tipo] = 4 + Math.random() * configuracao.intervaloMax * 0.6;
          if ((agendaDosAnimais.proximo[tipo] -= segundosDesdeUltimoFrame) > 0) continue;
          agendaDosAnimais.proximo[tipo] = sortearIntervalo(configuracao);
          if (fonteDeSom.estado === 'erro' || !ESTADO_DO_AUDIO.animais.individuais[tipo]) continue;
          const candidatos = animaisParaSom.filter(registro => registro.tipo === tipo && registro.grupo.parent);
          if (!candidatos.length) continue;
          const tocandoAgora = Object.values(FONTES_DE_SOM.animais).filter(tocando).length;
          if (tempo - agendaDosAnimais.ultimoSom < limitesGlobais.intervaloMinimoEntreSons || tocandoAgora >= limitesGlobais.maximoSimultaneos || tocando(fonteDeSom)) { agendaDosAnimais.proximo[tipo] = 1.5 + Math.random() * 3; continue; }
          const bicho = candidatos[Math.floor(Math.random() * candidatos.length)];
          bicho.grupo.getWorldPosition(vetorDoSom);
          const distancia = Math.hypot(alvoAtualDaCamera.x - vetorDoSom.x, alvoAtualDaCamera.z - vetorDoSom.z);
          try { fonteDeSom.el.currentTime = 0; fonteDeSom.el.playbackRate = 0.94 + Math.random() * 0.12; } catch (erro) { }
          const volume = ESTADO_DO_AUDIO.animais.volume * configuracao.volume * Math.max(0.12, 1 - distancia / limitesGlobais.distanciaMaxima);
          agendaDosAnimais.ultimoSom = tempo;
          tocarSom(fonteDeSom, volume);
        }
      };
      let relogioDosAmbientes = 0;
      // Atualiza os sons dos animais e reajusta o volume dos ambientes (a cada 0,25 s) por causa da distância da
      // câmera. Não faz nada antes de o áudio ser liberado.
      const atualizarAudio = function atualizarAudio(segundosDesdeUltimoFrame, tempo) {
        if (!ESTADO_DO_AUDIO.liberado) return;
        atualizarSonsDosAnimais(segundosDesdeUltimoFrame, tempo);
        relogioDosAmbientes -= segundosDesdeUltimoFrame;
        if (relogioDosAmbientes <= 0) { relogioDosAmbientes = 0.25; sincronizarAmbiente('cachoeira'); sincronizarAmbiente('fonte'); }
      };

      // ---- pedra secreta: clique/toque (sem arrastar) na pedra aciona o som secreto ----
      const raioDeClique = new THREE.Raycaster(), pontoDoClique = new THREE.Vector2();
      let inicioDoToque = null;
      canvas.addEventListener('pointerdown', evento => { inicioDoToque = evento.isPrimary ? { x: evento.clientX, y: evento.clientY, t: performance.now() } : null; });
      canvas.addEventListener('pointerup', evento => {
        const inicio = inicioDoToque; inicioDoToque = null;
        if (!inicio || Math.hypot(evento.clientX - inicio.x, evento.clientY - inicio.y) > 6 || performance.now() - inicio.t > 500) return;
        const retanguloDoCanvas = canvas.getBoundingClientRect(); pontoDoClique.set(((evento.clientX - retanguloDoCanvas.left) / retanguloDoCanvas.width) * 2 - 1, -((evento.clientY - retanguloDoCanvas.top) / retanguloDoCanvas.height) * 2 + 1);
        raioDeClique.setFromCamera(pontoDoClique, camera);
        if (raioDeClique.intersectObject(pedraSecreta.hitbox, false).length) ativarPedraSecreta();
        else if (PLANTACOES_COM_CANTEIROS.some(idDaArea => {                                                   // Mark 8.2: canteiros das duas plantações
          const visual = canteirosVisuais[idDaArea]; if (!visual || !estado.niveis[idDaArea]) return false;
          const acerto = raioDeClique.intersectObject(visual.solo, false)[0] || (raioDeClique.intersectObject(grupoDaArea[idDaArea], true).length ? {} : null);
          if (acerto) abrirPainelDaFazenda(idDaArea, acerto.instanceId);
          return !!acerto;
        })) { /* painel aberto */ }
        else if (estado.niveis.mina && raioDeClique.intersectObject(grupoDaArea.mina, true).length) { abrirPainelDaFazenda(); mostrarAviso(textoDoEstadoDaMina()); }
      });
      // Reage ao clique na pedra secreta: faz os cristais pulsarem e toca o som secreto (se o arquivo existir;
      // senão só registra no console).
      const ativarPedraSecreta = function ativarPedraSecreta() {
        pedraSecreta.pulso = 1;
        const fonteDeSom = FONTES_DE_SOM.pedraSecreta, configuracao = AUDIO_CONFIG.segredos.pedraSecreta;
        if (tocando(fonteDeSom)) return;
        if (fonteDeSom.estado === 'erro') { console.info('[áudio] pedra secreta: arquivo ausente (' + fonteDeSom.arquivo + ')'); return; }
        try { fonteDeSom.el.currentTime = 0; } catch (erro) { }
        tocarSom(fonteDeSom, configuracao.volume);
      };

      arquivoDaMontagemConcluido('23-audio.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
