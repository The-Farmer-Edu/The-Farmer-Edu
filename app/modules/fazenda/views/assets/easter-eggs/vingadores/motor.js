// ====================================================================================================
// EDIÇÃO PESSOAL — CENA DO CELEIRO · motor.js
// ====================================================================================================
(() => {
  const cenaDoCeleiro = window.CenaDoCeleiro, LARGURA = cenaDoCeleiro.LARGURA, ALTURA = cenaDoCeleiro.ALTURA;
  let iniciado = false, ativo = false, quadroPedido = 0, ultimoInstante = 0, tempo = 0, tempoDesdeAEntrada = 0;
  let tela, contexto, camadas, tony, fury, balao, nomeDoBalao, textoDoBalao;
  const diretor = { estado: 'pausa', espera: 2.2, conversa: null, indice: 0, fala: null, digitado: 0, leitura: 0, ultimaConversa: -1, reacaoDisparada: false, ordem: [] };
  const VELOCIDADE_DE_DIGITACAO = 34;

  const tocarFalaDoPersonagem = quem => {
    if (typeof tocarSegredo !== 'function') return;
    const chave = quem === 'tony' ? 'tonyFala' : 'furyFala';
    pararSegredo('tonyFala');
    pararSegredo('furyFala');
    tocarSegredo(chave);
  };

  const pararFalasDosPersonagens = () => {
    if (typeof pararSegredo !== 'function') return;
    pararSegredo('tonyFala');
    pararSegredo('furyFala');
  };

  const iniciar = elementos => {
    if (iniciado) return; iniciado = true;
    tela = elementos.tela; tela.width = LARGURA; tela.height = ALTURA; contexto = tela.getContext('2d'); contexto.imageSmoothingEnabled = false;
    balao = elementos.balao; nomeDoBalao = elementos.nome; textoDoBalao = elementos.texto;
    camadas = cenaDoCeleiro.cenario.criar();
    tony = cenaDoCeleiro.criarHomemDeFerro(146, 176);
    fury = cenaDoCeleiro.criarNickFury(240, 176);
  };
  const atorChamado = quem => quem === 'tony' ? tony : fury, outroAtor = quem => quem === 'tony' ? fury : tony;

  const proximaConversa = () => {
    if (!diretor.ordem.length) {
      diretor.ordem = cenaDoCeleiro.conversas.map((_, indice) => indice).sort(() => Math.random() - 0.5);
      if (diretor.ordem[0] === diretor.ultimaConversa && diretor.ordem.length > 1) diretor.ordem.push(diretor.ordem.shift());
    }
    const indice = diretor.ordem.shift(); diretor.ultimaConversa = indice;
    return cenaDoCeleiro.conversas[indice];
  };
  const comecarFala = () => {
    const fala = diretor.conversa.falas[diretor.indice]; diretor.fala = fala;
    let atraso = 0;
    if (fala.antes) for (const quem of ['tony', 'fury']) if (fala.antes[quem] && atorChamado(quem).poseBase !== fala.antes[quem]) { atorChamado(quem).mudarPoseBase(fala.antes[quem], 0.7); atraso = 0.8; }
    diretor.estado = 'preparando'; diretor.espera = atraso + 0.15;
  };
  const atualizarDiretor = segundosDoQuadro => {
    diretor.espera -= segundosDoQuadro;
    if (diretor.estado === 'pausa') {
      if (diretor.espera <= 0) { diretor.conversa = proximaConversa(); diretor.indice = 0; comecarFala(); }
    } else if (diretor.estado === 'preparando') {
      if (diretor.espera <= 0) {
        const fala = diretor.fala, quemFala = atorChamado(fala.quem);
        diretor.estado = 'digitando'; diretor.digitado = 0; diretor.reacaoDisparada = false;
        quemFala.falando = true; if (fala.gesto) quemFala.fazerGesto(fala.gesto);
        if (fala.evento === 'vaca') cenaDoCeleiro.cenario.chamarVaca(6);
        mostrarBalao(fala);
        tocarFalaDoPersonagem(fala.quem);
      }
    } else if (diretor.estado === 'digitando') {
      const fala = diretor.fala; diretor.digitado += segundosDoQuadro * VELOCIDADE_DE_DIGITACAO;
      textoDoBalao.textContent = fala.texto.slice(0, Math.floor(diretor.digitado));
      if (!diretor.reacaoDisparada && diretor.digitado > fala.texto.length * 0.45) { diretor.reacaoDisparada = true; if (fala.reacao) outroAtor(fala.quem).fazerGesto(fala.reacao); }
      if (diretor.digitado >= fala.texto.length) {
        textoDoBalao.textContent = fala.texto;
        atorChamado(fala.quem).falando = false;
        pararFalasDosPersonagens();
        diretor.estado = 'lendo';
        diretor.espera = 1.3 + fala.texto.length * 0.045;
      }
    } else if (diretor.estado === 'lendo') {
      if (diretor.espera <= 0) {
        esconderBalao(); const fala = diretor.fala;
        diretor.indice++;
        if (diretor.indice >= diretor.conversa.falas.length) { diretor.estado = 'pausa'; diretor.espera = 7 + Math.random() * 6 + (fala.pausa || 0); voltarAsAtividades(); }
        else { diretor.estado = 'respiro'; diretor.espera = 0.35 + Math.random() * 0.5 + (fala.pausa || 0); }
      }
    } else if (diretor.estado === 'respiro') {
      if (diretor.espera <= 0) comecarFala();
    }
  };
  const voltarAsAtividades = () => { tony.mudarPoseBase('trabalhando', 0.8); fury.mudarPoseBase(Math.random() < 0.5 ? 'analisando' : 'bracosCruzados', 0.9); };

  let escala = 3, cantoDaTela = [0, 0];
  const mostrarBalao = fala => {
    balao.dataset.quem = fala.quem; nomeDoBalao.textContent = fala.quem === 'tony' ? 'TONY STARK' : 'NICK FURY'; textoDoBalao.textContent = '';
    balao.hidden = false; balao.classList.remove('saindo'); posicionarBalao();
  };
  const esconderBalao = () => { balao.classList.add('saindo'); setTimeout(() => { if (balao.classList.contains('saindo')) balao.hidden = true; }, 180); };
  const posicionarBalao = () => {
    if (balao.hidden || !diretor.fala) return;
    const [cabecaX, cabecaY] = atorChamado(diretor.fala.quem).cabeca();
    const balaoX = cantoDaTela[0] + cabecaX * escala, balaoY = cantoDaTela[1] + (cabecaY - 4) * escala;
    balao.style.left = Math.round(balaoX) + 'px'; balao.style.top = Math.round(balaoY) + 'px';
    balao.classList.toggle('a-esquerda', diretor.fala.quem === 'tony');
  };
  const ajustarTamanho = () => {
    escala = Math.max(1, Math.floor(Math.min(innerWidth / LARGURA, innerHeight / ALTURA)));
    tela.style.width = LARGURA * escala + 'px'; tela.style.height = ALTURA * escala + 'px';
    const caixaDaTela = tela.getBoundingClientRect(); cantoDaTela = [caixaDaTela.left, caixaDaTela.top];
    document.documentElement.style.setProperty('--escala-do-celeiro', escala);
    posicionarBalao();
  };

  const quadro = instante => {
    if (!ativo) return;
    quadroPedido = requestAnimationFrame(quadro);
    const segundosDoQuadro = Math.min(0.1, (instante - ultimoInstante) / 1000 || 0); ultimoInstante = instante; tempo += segundosDoQuadro; tempoDesdeAEntrada += segundosDoQuadro;
    cenaDoCeleiro.cenario.atualizar(segundosDoQuadro, tempo); tony.atualizar(segundosDoQuadro, tempo); fury.atualizar(segundosDoQuadro, tempo); atualizarDiretor(segundosDoQuadro);
    const deslocamentoDaCamera = Math.round(Math.max(0, 1 - tempoDesdeAEntrada / 1.6) ** 2 * 6);
    contexto.fillStyle = '#000'; contexto.fillRect(0, 0, LARGURA, ALTURA);
    contexto.save(); contexto.translate(0, deslocamentoDaCamera);
    contexto.drawImage(camadas.fundo, 0, 0);
    cenaDoCeleiro.cenario.desenharMeio(contexto, tempo);
    tony.desenhar(contexto, tempo); fury.desenhar(contexto, tempo);
    cenaDoCeleiro.cenario.desenharFrente(contexto, tempo, camadas.frente);
    contexto.restore();
    if (deslocamentoDaCamera) posicionarBalao();
    cenaDoCeleiro.estatisticas.quadros++;
  };
  cenaDoCeleiro.estatisticas = { quadros: 0, lacosAtivos: 0 };
  const retomar = () => {
    if (ativo) return; ativo = true; tempoDesdeAEntrada = 0; ultimoInstante = performance.now(); cenaDoCeleiro.estatisticas.lacosAtivos++;
    ajustarTamanho(); addEventListener('resize', ajustarTamanho);
    quadroPedido = requestAnimationFrame(quadro);
  };
  const suspender = () => {
    if (!ativo) return; ativo = false; cancelAnimationFrame(quadroPedido); cenaDoCeleiro.estatisticas.lacosAtivos--;
    removeEventListener('resize', ajustarTamanho);
    pararFalasDosPersonagens();
    balao.hidden = true;
    if (diretor.estado === 'digitando' || diretor.estado === 'lendo') { atorChamado(diretor.fala.quem).falando = false; diretor.estado = 'respiro'; diretor.espera = 0.8; }
  };
  cenaDoCeleiro.motor = {
    iniciar, retomar, suspender, ajustarTamanho, ativo: () => ativo,
    diretor: () => ({ estado: diretor.estado, conversa: diretor.conversa && diretor.conversa.nome, fala: diretor.indice }),
    atores: () => ({ tony, fury }), quadroUnico: () => quadro(performance.now()),
  };
})();