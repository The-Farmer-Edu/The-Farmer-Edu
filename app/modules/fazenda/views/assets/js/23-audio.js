// ====================================================================================================
// FARMEDU 3D — 23-audio.js (Fase 3B da refatoração: seção 23)
// Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
// antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
// "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
// arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
// ====================================================================================================

// ====================================================================================================
// SEÇÃO 23 — ÁUDIO: MÚSICA, ANIMAIS, AMBIENTES, TRATOR, EFEITOS E SEGREDOS
// Os navegadores só deixam tocar som depois de um gesto do jogador (regra de autoplay). Fazenda 8.4.1: música e sons vêm
// ligados por padrão e são liberados no PRIMEIRO gesto natural (toque, clique ou tecla em qualquer lugar da página), sem
// precisar abrir o painel de áudio; o botão 🔊 da barra e "Ativar áudio" no painel também liberam. Cada som usa um único
// elemento <audio>; arquivos ausentes não quebram o jogo.
// Os caminhos dos arquivos ficam em AUDIO_CONFIG (bloco "CONFIGURAÇÃO DOS ÁUDIOS", logo depois da seção 02).
// ====================================================================================================
// Cada som usa um único elemento <audio> reutilizado. Arquivo ausente = o som é marcado como indisponível e o jogo segue normalmente.
const CHAVE_DO_AUDIO = 'fazenda3d-audio-v1';
const TIPOS_DE_ANIMAL_COM_SOM = Object.keys(AUDIO_CONFIG.animais).filter(chave => chave !== 'global');
const TIPOS_DE_EFEITO = Object.keys(AUDIO_CONFIG.efeitos).filter(chave => chave !== 'global');
const CATEGORIAS_DE_AUDIO = ['musica', 'animais', 'cachoeira', 'fonte', 'trator', 'efeitos'];   // as que têm botão e volume no painel
const CATEGORIAS_EM_GRUPO = ['animais', 'efeitos'];                                            // vários arquivos, tocados de vez em quando
const ESTADO_DO_AUDIO = {
  liberado: false,
  musica: { ligado: true, volume: AUDIO_CONFIG.volumesIniciais.musica, querTocar: true },
  animais: { ligado: true, volume: AUDIO_CONFIG.volumesIniciais.animais, individuais: Object.fromEntries(TIPOS_DE_ANIMAL_COM_SOM.map(tipo => [tipo, true])) },
  cachoeira: { ligado: true, volume: AUDIO_CONFIG.volumesIniciais.cachoeira },
  fonte: { ligado: true, volume: AUDIO_CONFIG.volumesIniciais.fonte },
  trator: { ligado: true, volume: AUDIO_CONFIG.volumesIniciais.trator },     // 8.4.1: configurações antigas não têm o campo: ligado
  efeitos: { ligado: true, volume: AUDIO_CONFIG.volumesIniciais.efeitos },
  silenciado: false,   // Fazenda 8.4 (C4): botão global "🔇"; independente do ligado/volume de cada categoria
};
try { // preferências salvas (apenas valores válidos)
  const salvo = JSON.parse(localStorage.getItem(CHAVE_DO_AUDIO));
  if (salvo && typeof salvo.silenciado === 'boolean') ESTADO_DO_AUDIO.silenciado = salvo.silenciado;   // configurações antigas não têm o campo: som ligado
  if (salvo) for (const categoria of CATEGORIAS_DE_AUDIO) if (salvo[categoria]) {
    if (typeof salvo[categoria].ligado === 'boolean') ESTADO_DO_AUDIO[categoria].ligado = salvo[categoria].ligado;
    if (Number.isFinite(salvo[categoria].volume)) ESTADO_DO_AUDIO[categoria].volume = Math.min(1, Math.max(0, salvo[categoria].volume));
    if (categoria === 'animais' && salvo[categoria].individuais) for (const tipo of TIPOS_DE_ANIMAL_COM_SOM) if (typeof salvo[categoria].individuais[tipo] === 'boolean') ESTADO_DO_AUDIO.animais.individuais[tipo] = salvo[categoria].individuais[tipo];
  }
} catch (erro) { }
// Grava no localStorage (chave fazenda3d-audio-v1) o que está ligado e os volumes de cada categoria.
const salvarPreferenciasDeAudio = function salvarPreferenciasDeAudio() { try { localStorage.setItem(CHAVE_DO_AUDIO, JSON.stringify({ ...Object.fromEntries(CATEGORIAS_DE_AUDIO.map(categoria => [categoria, ESTADO_DO_AUDIO[categoria]])), silenciado: ESTADO_DO_AUDIO.silenciado })); } catch (erro) { } };

// Mantém o volume entre 0 e 1 (limite do elemento <audio>).
const limitarVolume = volume => Math.min(1, Math.max(0, volume));
// Ganchos chamados quando o estado de algum som muda; é trocada por atualizarPainelDeAudio mais adiante.
let aoMudarOAudio = () => { };
// Fazenda 8.4.1: endereço real de um áudio de AUDIO_CONFIG ("assets/audio/<subpasta>/<nome>"), montado a partir do endereço do
// fazenda.js, como o carregador já faz com os scripts. Pela aplicação PHP (script vindo de index.php?rota=fazenda/script) vira
// a rota fazenda/audio, porque a pasta views/ não é pública; aberto pelo arquivo (file://) é a pasta views/assets/audio.
// Caminhos fora de "assets/audio/" (ou sem o endereço do script) ficam como estão, relativos à página (comportamento antigo).
const PREFIXO_DOS_AUDIOS = 'assets/audio/';
const enderecoDoAudio = function enderecoDoAudio(caminho) {
  if (!caminho || !ENDERECO_DO_SCRIPT_PRINCIPAL || !caminho.startsWith(PREFIXO_DOS_AUDIOS)) return caminho;
  try {
    const relativo = caminho.slice(PREFIXO_DOS_AUDIOS.length), endereco = new URL(ENDERECO_DO_SCRIPT_PRINCIPAL);
    if (endereco.searchParams.get('rota') === 'fazenda/script') {
      endereco.searchParams.set('rota', 'fazenda/audio'); endereco.searchParams.set('arquivo', relativo);
      return endereco.href;
    }
    return new URL('../audio/' + relativo, endereco).href;   // assets/js/fazenda.js → assets/audio/...
  } catch (erro) { return caminho; }
};
// Cria o elemento <audio> de um som (uma única vez). O arquivo só é carregado quando necessário; erros de
// carga marcam o som como indisponível. "caminho" é o de AUDIO_CONFIG (mostrado no painel); "arquivo" é o endereço real.
const criarFonteDeSom = function criarFonteDeSom(caminho, repetirEmLoop) {
  const fonteDeSom = { caminho, arquivo: enderecoDoAudio(caminho), estado: 'ocioso', el: new Audio() }; // estado: ocioso | carregando | erro
  fonteDeSom.el.preload = 'none'; fonteDeSom.el.loop = repetirEmLoop; fonteDeSom.el.muted = ESTADO_DO_AUDIO.silenciado;
  fonteDeSom.el.addEventListener('error', () => { fonteDeSom.estado = 'erro'; aoMudarOAudio(); });
  fonteDeSom.el.addEventListener('playing', () => { fonteDeSom.estado = 'ok'; aoMudarOAudio(); });
  fonteDeSom.el.addEventListener('pause', () => aoMudarOAudio());
  return fonteDeSom;
};
const FONTES_DE_SOM = {
  musica: criarFonteDeSom(AUDIO_CONFIG.musica.arquivo, true), cachoeira: criarFonteDeSom(AUDIO_CONFIG.ambiente.cachoeira.arquivo, true),
  fonte: criarFonteDeSom(AUDIO_CONFIG.ambiente.fonte.arquivo, true), trator: criarFonteDeSom(AUDIO_CONFIG.ambiente.trator.arquivo, true), animais: {}, efeitos: {}, segredos: {}
};
for (const tipo of TIPOS_DE_ANIMAL_COM_SOM) {
  const configuracao = AUDIO_CONFIG.animais[tipo];

  FONTES_DE_SOM.animais[tipo] = (
    configuracao.arquivos || [configuracao.arquivo]
  )
    .filter(Boolean)
    .map(caminho => criarFonteDeSom(caminho, false));
}
for (const nome of TIPOS_DE_EFEITO) FONTES_DE_SOM.efeitos[nome] = criarFonteDeSom(AUDIO_CONFIG.efeitos[nome].arquivo, false);
for (const nome of Object.keys(AUDIO_CONFIG.segredos)) FONTES_DE_SOM.segredos[nome] = criarFonteDeSom(AUDIO_CONFIG.segredos[nome].arquivo, false);
FONTES_DE_SOM.pedraSecreta = FONTES_DE_SOM.segredos.pedraSecreta;   // nome antigo, mesmo objeto (todasAsFontesDeSom não o repete)

// ---- Fazenda 8.4 (C4): silenciamento global ----
// Percorre FONTES_DE_SOM inteiro (inclusive grupos como "animais"), para que fontes registradas no futuro também entrem.
const todasAsFontesDeSom = function todasAsFontesDeSom(colecao = FONTES_DE_SOM) {
  return [...new Set(Object.values(colecao).flatMap(item => item && item.el instanceof HTMLMediaElement ? [item] : item && typeof item === 'object' ? todasAsFontesDeSom(item) : []))];
};
// Usa a propriedade "muted" de cada <audio>: os sons seguem a lógica de sempre (tocar, pausar, volume pela distância) e só
// não saem no alto-falante. Assim nada das preferências individuais é tocado, e religar continua exatamente de onde estava.
const aplicarSilencioGlobal = function aplicarSilencioGlobal() { for (const fonteDeSom of todasAsFontesDeSom()) fonteDeSom.el.muted = ESTADO_DO_AUDIO.silenciado; };
const definirSilencioGlobal = function definirSilencioGlobal(silenciado) {
  ESTADO_DO_AUDIO.silenciado = silenciado; aplicarSilencioGlobal(); salvarPreferenciasDeAudio(); aoMudarOAudio();
};

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
      if (erro && erro.name === 'NotAllowedError') mostrarAviso('O navegador bloqueou o som. Toque no botão 🔊 da barra superior para ativar.');
      else if (erro && erro.name !== 'AbortError') fonteDeSom.estado = 'erro';
      aoMudarOAudio(); return false;
    });
  } catch (erro) { fonteDeSom.estado = 'erro'; aoMudarOAudio(); return Promise.resolve(false); }
};
// Pausa o som (sem perder a posição).
const pararSom = function pararSom(fonteDeSom) { try { fonteDeSom.el.pause(); } catch (erro) { } };
// Verdadeiro se o som está em reprodução. Fazenda 8.4.1: um som cujo arquivo falhou nunca conta como tocando (o <audio> com
// erro de carga fica com paused = false e, antes, ocupava as vagas de "maximoSimultaneos" dos animais para sempre).
const tocando = fonteDeSom => fonteDeSom.estado !== 'erro' && !fonteDeSom.el.paused && !fonteDeSom.el.ended;

// Volume final da música = volume do painel × volume da configuração.
const volumeDaMusica = () => limitarVolume(ESTADO_DO_AUDIO.musica.volume * AUDIO_CONFIG.musica.volume);
// Trator do Maquinário (seção 08 registra o modelo em farolDoTrator): conta como presente só se estiver na cena (o grupo antigo
// sai da cena quando a área é reconstruída) e se o Maquinário não estiver destruído.
const posicaoDoTrator = new THREE.Vector3();
const naCena = objeto => { while (objeto) { if (objeto === cena) return true; objeto = objeto.parent; } return false; };
const tratorNaFazenda = () => !!(farolDoTrator && estado.niveis.maquinario >= 2 && !(estado.danos.maquinario && estado.danos.maquinario.destruida) && naCena(farolDoTrator.trator));
const FONTES_DOS_AMBIENTES = {
  cachoeira: () => [CENTRO_X_DA_CACHOEIRA, Z_DA_FRENTE_DA_CACHOEIRA], fonte: () => [PRACA_CENTRAL.x, PRACA_CENTRAL.z],   // chafariz no centro da praça central
  trator: () => { farolDoTrator.trator.getWorldPosition(posicaoDoTrator); return [posicaoDoTrator.x, posicaoDoTrator.z]; }
};
const AMBIENTE_PRESENTE = { cachoeira: () => true, fonte: () => true, trator: tratorNaFazenda };   // o trator só toca se existir
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
  const fonteDeSom = FONTES_DE_SOM[nome], deveEstarTocando = ESTADO_DO_AUDIO.liberado && ESTADO_DO_AUDIO[nome].ligado && ESTADO_DO_AUDIO[nome].volume > 0.001 && fonteDeSom.estado !== 'erro' && AMBIENTE_PRESENTE[nome]();
  if (deveEstarTocando && fonteDeSom.el.paused) tocarSom(fonteDeSom, volumeDoAmbiente(nome));
  else if (!deveEstarTocando && !fonteDeSom.el.paused) pararSom(fonteDeSom);
  else if (deveEstarTocando) fonteDeSom.el.volume = volumeDoAmbiente(nome);
};
// Chamada dentro de um clique do jogador (exigência de autoplay dos navegadores): libera o áudio, inicia
// música e ambientes e "destrava" os demais sons, tocando-os mudos por um instante (necessário no iOS).
const liberarAudio = function liberarAudio() { // chamado dentro de um clique do jogador: é o que permite o navegador tocar
  if (ESTADO_DO_AUDIO.liberado) return;                                    // 8.4.1: vários caminhos chamam (gesto, botão 🔊, painel); só a primeira vale
  ESTADO_DO_AUDIO.liberado = true;
  sincronizarMusica(); sincronizarAmbiente('cachoeira'); sincronizarAmbiente('fonte'); sincronizarAmbiente('trator');
  const fontesDeSom = [...Object.values(FONTES_DE_SOM.efeitos), ...Object.values(FONTES_DE_SOM.segredos)];
  [...Object.values(FONTES_DE_SOM.animais)].forEach(tipo => {
    tipo.forEach(fonteDeSom => {
      fontesDeSom.push(fonteDeSom); 
    })
  })
  fontesDeSom.forEach(fonteDeSom => { // "destrava" os demais elementos (necessário no iOS); mudo e só por um instante
    try {
      fonteDeSom.el.src = fonteDeSom.arquivo; fonteDeSom.estado = 'carregando'; fonteDeSom.el.muted = true;
      const promessa = fonteDeSom.el.play();
      const soltar = () => { fonteDeSom.el.muted = ESTADO_DO_AUDIO.silenciado; };   // C4: volta ao estado global, não a "com som"
      if (promessa && promessa.then) promessa.then(() => { fonteDeSom.el.pause(); try { fonteDeSom.el.currentTime = 0; } catch (erro) { } soltar(); }, () => { soltar(); }); else soltar();
    } catch (erro) { console.error(erro); fonteDeSom.el.muted = ESTADO_DO_AUDIO.silenciado; }
  })
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
    if (categoria === 'musica') reiniciarFonteDeSom(FONTES_DE_SOM.musica); else if (CATEGORIAS_EM_GRUPO.includes(categoria)) Object.values(FONTES_DE_SOM[categoria]).forEach(fonteDeSom => { if (fonteDeSom.estado === 'erro') reiniciarFonteDeSom(fonteDeSom); }); else reiniciarFonteDeSom(FONTES_DE_SOM[categoria]);
  }
  if (categoria === 'musica') sincronizarMusica(); else if (!CATEGORIAS_EM_GRUPO.includes(categoria)) sincronizarAmbiente(categoria);
  aoMudarOAudio(); salvarPreferenciasDeAudio();
};
// Define o volume de uma categoria e aplica na hora aos sons que já tocam.
const definirVolumeDaCategoria = function definirVolumeDaCategoria(categoria, volume) {
  ESTADO_DO_AUDIO[categoria].volume = limitarVolume(volume);
  if (categoria === 'musica') sincronizarMusica(); else if (!CATEGORIAS_EM_GRUPO.includes(categoria)) sincronizarAmbiente(categoria);
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
  if (!ESTADO_DO_AUDIO.liberado ||
    !ESTADO_DO_AUDIO.animais.ligado ||
    ESTADO_DO_AUDIO.animais.volume <= 0.001) return;

  const limitesGlobais = AUDIO_CONFIG.animais.global;

  for (const tipo of TIPOS_DE_ANIMAL_COM_SOM) {
    const configuracao = AUDIO_CONFIG.animais[tipo];
    const fonteDeSom = FONTES_DE_SOM.animais[tipo];

    if (!configuracao || !fonteDeSom) continue;

    if (agendaDosAnimais.proximo[tipo] === undefined) {
      agendaDosAnimais.proximo[tipo] =
        4 + Math.random() * configuracao.intervaloMax * 0.6;
    }

    if ((agendaDosAnimais.proximo[tipo] -= segundosDesdeUltimoFrame) > 0) continue;

    agendaDosAnimais.proximo[tipo] = sortearIntervalo(configuracao);

    if (
      fonteDeSom.estado === 'erro' ||
      !ESTADO_DO_AUDIO.animais.individuais[tipo]
    ) continue;

    const candidatos = animaisParaSom.filter(
      registro => registro.tipo === tipo && registro.grupo.parent
    );

    if (!candidatos.length) continue;

    const tocandoAgora = Object.values(FONTES_DE_SOM.animais).filter(tocando).length;

    if (
      tempo - agendaDosAnimais.ultimoSom < limitesGlobais.intervaloMinimoEntreSons ||
      tocandoAgora >= limitesGlobais.maximoSimultaneos ||
      tocando(fonteDeSom)
    ) {
      agendaDosAnimais.proximo[tipo] = 1.5 + Math.random() * 3;
      continue;
    }

    const bicho = candidatos[Math.floor(Math.random() * candidatos.length)];

    bicho.grupo.getWorldPosition(vetorDoSom);

    const distancia = Math.hypot(
      alvoAtualDaCamera.x - vetorDoSom.x,
      alvoAtualDaCamera.z - vetorDoSom.z
    );

    try {
      fonteDeSom.el.currentTime = 0;
      fonteDeSom.el.playbackRate = 0.94 + Math.random() * 0.12;
    } catch (erro) { }

    const volume =
      ESTADO_DO_AUDIO.animais.volume *
      configuracao.volume *
      Math.max(0.12, 1 - distancia / limitesGlobais.distanciaMaxima);

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
  if (relogioDosAmbientes <= 0) { relogioDosAmbientes = 0.25; sincronizarAmbiente('cachoeira'); sincronizarAmbiente('fonte'); sincronizarAmbiente('trator'); }
};

// ---- Fazenda 8.4.1: efeitos das mecânicas (AUDIO_CONFIG.efeitos) ----
// Chamada pelos pontos do jogo onde a ação acontece (plantar, colher, construir, mina, contratar, combate, invasões).
// Não toca antes da liberação, com a categoria desligada ou sem arquivo; "posicao" ([x, z]) baixa o volume com a distância.
const ultimoMomentoDoEfeito = {};
const tocarEfeito = function tocarEfeito(nome, posicao) {
  const configuracao = AUDIO_CONFIG.efeitos[nome], fonteDeSom = FONTES_DE_SOM.efeitos[nome], global = AUDIO_CONFIG.efeitos.global;
  if (!configuracao || !fonteDeSom || !ESTADO_DO_AUDIO.liberado || !ESTADO_DO_AUDIO.efeitos.ligado || ESTADO_DO_AUDIO.efeitos.volume <= 0.001 || fonteDeSom.estado === 'erro') return false;
  const agora = performance.now();
  if (agora - (ultimoMomentoDoEfeito[nome] ?? -Infinity) < (configuracao.intervaloMinimo ?? global.intervaloMinimo) * 1000) return false;
  ultimoMomentoDoEfeito[nome] = agora;
  const fator = posicao ? Math.max(0.15, 1 - Math.hypot(alvoAtualDaCamera.x - posicao[0], alvoAtualDaCamera.z - posicao[1]) / global.distanciaMaxima) : 1;
  try { fonteDeSom.el.currentTime = 0; } catch (erro) { }
  tocarSom(fonteDeSom, ESTADO_DO_AUDIO.efeitos.volume * configuracao.volume * fator);
  return true;
};
// Segredos (AUDIO_CONFIG.segredos): toca o som do segredo descoberto, sem repetir enquanto ele ainda está tocando.
const tocarSegredo = function tocarSegredo(nome) {
  const fonteDeSom = FONTES_DE_SOM.segredos[nome], configuracao = AUDIO_CONFIG.segredos[nome];
  if (!fonteDeSom || tocando(fonteDeSom)) return false;
  if (fonteDeSom.estado === 'erro') { console.info('[áudio] segredo "' + nome + '": arquivo ausente (' + fonteDeSom.arquivo + ')'); return false; }
  try { fonteDeSom.el.currentTime = 0; } catch (erro) { }
  tocarSom(fonteDeSom, configuracao.volume);
  return true;
};

// ---- Fazenda 8.4.1: liberação no primeiro gesto natural ----
// Toque/clique (pointerup) ou tecla (keydown) em qualquer lugar da página contam como gesto para o navegador; o primeiro
// libera música e sons, a menos que o jogador tenha deixado o som desligado (🔇) — então só o botão 🔊 libera.
const liberarNoPrimeiroGesto = evento => {
  if (ESTADO_DO_AUDIO.liberado) { removeEventListener('pointerup', liberarNoPrimeiroGesto, true); removeEventListener('keydown', liberarNoPrimeiroGesto, true); return; }
  if (ESTADO_DO_AUDIO.silenciado || (evento.type === 'keydown' && evento.key === 'Escape')) return;   // Esc não conta como gesto para o navegador
  if (evento.target && evento.target.closest && evento.target.closest('#botao-som-global')) return;   // o próprio botão cuida da ativação
  liberarAudio();
};
addEventListener('pointerup', liberarNoPrimeiroGesto, true); addEventListener('keydown', liberarNoPrimeiroGesto, true);

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
  tocarSegredo('pedraSecreta');
};

arquivoDaMontagemConcluido('23-audio.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
