// ====================================================================================================
// EDIÇÃO PESSOAL — CENA DO CELEIRO · cenario/oficina.js
// O laboratório secreto escondido DENTRO do celeiro: treliças e tábuas de madeira do celeiro + oficina de tecnologia de ponta.
// Pixel art desenhada em código na resolução da cena (384×216). O FUNDO estático é pintado UMA vez (canvas em cache); cada
// elemento animado tem seu próprio relógio e ritmo, para a cena nunca "piscar toda junta".
// Camadas: fundo (estático) → meio (animações atrás dos personagens) → personagens → frente (objetos do 1º plano, partículas,
// luzes e vinheta).
// O sorteio do cenário usa uma semente fixa (sorteioDoCenario): a ORDEM das chamadas define o desenho — ao mexer aqui,
// mantenha a ordem para o cenário continuar igual.
// ====================================================================================================
(() => {
  const cenaDoCeleiro = window.CenaDoCeleiro, ferramentasPixel = cenaDoCeleiro.pixel;
  const LARGURA = cenaDoCeleiro.LARGURA, ALTURA = cenaDoCeleiro.ALTURA;
  const CORES_DO_CENARIO = {
    teto: '#120d0a', vigaClara: '#6e4e3a', viga: '#5b4030', vigaEscura: '#33241a',
    tabua1: '#432f22', tabua2: '#3d2b1f', tabua3: '#47321f', fresta: '#24180f', noDaMadeira: '#2e2017', prego: '#6b5a4a', rodape: '#2a1d14',
    painel: '#1a2130', painelClaro: '#2b3650', painelJunta: '#0f141e', rebite: '#3d4b6a',
    moldura: '#0b0e14', tela: '#061018', ciano: '#49d6ff', cianoEscuro: '#1d6f8c', verde: '#5cff9d', verdeEscuro: '#1f7a48',
    ambar: '#ffb347', vermelho: '#ff4d5e', branco: '#e8f6ff',
    rack: '#20242e', rackClaro: '#343a48', rackEscuro: '#13161c', aco: '#5c6578', acoClaro: '#8b95a8', acoEscuro: '#3a4150',
    chao: '#2a2b30', chaoJunta: '#202126', chaoClaro: '#33353c', mancha: '#24252a',
    madeira: '#6e563c', madeiraClara: '#87694a', madeiraEscura: '#3c2e20', feno: '#c9a24a', fenoClaro: '#e2c26a', fenoEscuro: '#8e6e2a',
    armadura: '#6e1a1f', armaduraClara: '#8f2a2c', dourado: '#8a6a2a', douradoClaro: '#b48c3a', perigo: '#e0b030', preto: '#0c0d10',
  };
  const cores = CORES_DO_CENARIO;
  cenaDoCeleiro.CORES_DO_CENARIO = CORES_DO_CENARIO;
  const sorteioDoCenario = ferramentasPixel.aleatorio(796);
  const suavizar = fracao => fracao * fracao * (3 - 2 * fracao);

  // ------------------------------------------------------------------ FUNDO ESTÁTICO
  const pintarFundo = () => {
    const { canvas, ctx: contexto } = ferramentasPixel.criarTela(LARGURA, ALTURA);
    // parede de tábuas do celeiro
    for (let tabuaX = 0; tabuaX < LARGURA; tabuaX += 7) {
      ferramentasPixel.ret(contexto, tabuaX, 14, 7, 112, [cores.tabua1, cores.tabua2, cores.tabua3][(tabuaX / 7) % 3 | 0]);
      ferramentasPixel.ret(contexto, tabuaX, 14, 1, 112, cores.fresta);
      for (let indiceDoNo = 0; indiceDoNo < 2; indiceDoNo++) { const noY = 24 + sorteioDoCenario() * 90 | 0; ferramentasPixel.ret(contexto, tabuaX + 2 + (sorteioDoCenario() * 3 | 0), noY, 2, 1, cores.noDaMadeira); }
      ferramentasPixel.px(contexto, tabuaX + 3, 20, cores.prego); ferramentasPixel.px(contexto, tabuaX + 3, 116, cores.prego);
    }
    contexto.save(); contexto.fillStyle = cores.teto;
    for (let faixa = 0; faixa < 4; faixa++) { contexto.globalAlpha = 0.18; contexto.fillRect(0, 14, LARGURA, 18 - faixa * 4); }   // sombra perto do teto (faixas chapadas)
    contexto.restore();
    ferramentasPixel.ret(contexto, 0, 120, LARGURA, 5, cores.rodape); ferramentasPixel.ret(contexto, 0, 120, LARGURA, 1, cores.vigaEscura);
    // teto e treliças
    ferramentasPixel.ret(contexto, 0, 0, LARGURA, 12, cores.teto);
    for (let trelicaX = -40; trelicaX < LARGURA + 40; trelicaX += 96) {
      ferramentasPixel.linha(contexto, trelicaX, 0, trelicaX + 48, 12, cores.vigaEscura, 3); ferramentasPixel.linha(contexto, trelicaX + 96, 0, trelicaX + 48, 12, cores.vigaEscura, 3);
      ferramentasPixel.linha(contexto, trelicaX, -1, trelicaX + 48, 11, cores.viga, 2);
    }
    ferramentasPixel.ret(contexto, 0, 11, LARGURA, 5, cores.viga); ferramentasPixel.ret(contexto, 0, 11, LARGURA, 1, cores.vigaClara); ferramentasPixel.ret(contexto, 0, 15, LARGURA, 1, cores.vigaEscura);
    for (let pregoX = 6; pregoX < LARGURA; pregoX += 24) ferramentasPixel.px(contexto, pregoX, 13, cores.prego);
    // janela do celeiro (noite lá fora; a vaca espia por ela de vez em quando)
    ferramentasPixel.ret(contexto, 352, 28, 26, 26, cores.madeiraEscura); ferramentasPixel.ret(contexto, 354, 30, 22, 22, '#0b1426');
    ferramentasPixel.pontilhar(contexto, 354, 30, 22, 22, '#14213d', 0.35);
    ferramentasPixel.px(contexto, 358, 34, '#cfe0ff'); ferramentasPixel.px(contexto, 369, 37, '#9fb6e6'); ferramentasPixel.px(contexto, 372, 32, '#cfe0ff');   // estrelas
    ferramentasPixel.ret(contexto, 364, 30, 2, 22, cores.madeiraEscura); ferramentasPixel.ret(contexto, 354, 40, 22, 2, cores.madeiraEscura); ferramentasPixel.ret(contexto, 352, 54, 26, 2, cores.madeira);
    // painel de aço com a parede de monitores
    ferramentasPixel.ret(contexto, 104, 20, 178, 84, cores.painel); ferramentasPixel.ret(contexto, 104, 20, 178, 1, cores.painelClaro);
    for (let juntaX = 104; juntaX < 282; juntaX += 30) ferramentasPixel.ret(contexto, juntaX, 20, 1, 84, cores.painelJunta);
    for (let rebiteX = 107; rebiteX < 282; rebiteX += 30) { ferramentasPixel.px(contexto, rebiteX, 23, cores.rebite); ferramentasPixel.px(contexto, rebiteX, 100, cores.rebite); }
    ferramentasPixel.ret(contexto, 104, 103, 178, 2, cores.painelJunta);
    for (const [monitorX, monitorY] of cenaDoCeleiro.MONITORES) {
      ferramentasPixel.ret(contexto, monitorX - 2, monitorY - 2, 52, 30, cores.moldura); ferramentasPixel.ret(contexto, monitorX, monitorY, 48, 26, cores.tela);
      ferramentasPixel.px(contexto, monitorX + 45, monitorY + 27, cores.verdeEscuro);
    }
    // cabos saindo do painel para o chão
    ferramentasPixel.linha(contexto, 112, 104, 108, 126, cores.preto, 2); ferramentasPixel.linha(contexto, 274, 104, 280, 126, cores.preto, 2);
    // racks de servidores (esquerda)
    for (const rackX of [6, 38]) {
      ferramentasPixel.ret(contexto, rackX, 34, 28, 92, cores.rack); ferramentasPixel.ret(contexto, rackX, 34, 28, 1, cores.rackClaro);
      ferramentasPixel.ret(contexto, rackX, 34, 1, 92, cores.rackClaro); ferramentasPixel.ret(contexto, rackX + 27, 34, 1, 92, cores.rackEscuro);
      for (let gavetaY = 38; gavetaY < 122; gavetaY += 7) {
        ferramentasPixel.ret(contexto, rackX + 2, gavetaY, 24, 5, cores.rackEscuro);
        for (let ventilacaoX = rackX + 12; ventilacaoX < rackX + 25; ventilacaoX += 2) ferramentasPixel.ret(contexto, ventilacaoX, gavetaY + 1, 1, 3, '#0a0b0e');
      }
    }
    // quadro de ferramentas (pegboard)
    ferramentasPixel.ret(contexto, 70, 30, 30, 40, cores.madeiraEscura); ferramentasPixel.ret(contexto, 71, 31, 28, 38, '#5d4a35');
    for (let furoY = 33; furoY < 68; furoY += 4) for (let furoX = 73; furoX < 98; furoX += 4) ferramentasPixel.px(contexto, furoX, furoY, '#3f3122');
    ferramentasPixel.linha(contexto, 75, 36, 75, 50, cores.acoClaro, 2); ferramentasPixel.ret(contexto, 74, 50, 3, 5, '#b3202a');          // chave de fenda
    ferramentasPixel.linha(contexto, 82, 35, 82, 52, cores.aco, 2); ferramentasPixel.ret(contexto, 80, 34, 6, 3, cores.aco);                // chave inglesa
    ferramentasPixel.ret(contexto, 89, 36, 8, 3, cores.acoEscuro); ferramentasPixel.linha(contexto, 92, 39, 92, 52, '#8a5a2a', 2);         // martelo
    ferramentasPixel.linha(contexto, 76, 58, 80, 66, '#d6a334', 2); ferramentasPixel.linha(contexto, 84, 58, 80, 66, '#d6a334', 2);        // alicate
    ferramentasPixel.ret(contexto, 88, 58, 9, 7, '#b3202a'); ferramentasPixel.ret(contexto, 89, 59, 7, 1, '#d93b3f');                       // caixinha
    // pórtico da armadura reserva (direita)
    ferramentasPixel.ret(contexto, 290, 22, 4, 102, cores.acoEscuro); ferramentasPixel.ret(contexto, 342, 22, 4, 102, cores.acoEscuro);
    ferramentasPixel.ret(contexto, 290, 22, 56, 4, cores.aco); ferramentasPixel.ret(contexto, 290, 22, 56, 1, cores.acoClaro);
    ferramentasPixel.linha(contexto, 318, 26, 318, 34, cores.preto, 1);
    desenharArmaduraReserva(contexto, 318, 116);
    for (let faixaX = 288; faixaX < 348; faixaX += 4) { ferramentasPixel.ret(contexto, faixaX, 120, 2, 4, cores.perigo); ferramentasPixel.ret(contexto, faixaX + 2, 120, 2, 4, cores.preto); }
    ferramentasPixel.ret(contexto, 296, 114, 44, 3, cores.acoEscuro);
    // escada encostada (direita)
    ferramentasPixel.linha(contexto, 352, 124, 364, 60, cores.madeira, 2); ferramentasPixel.linha(contexto, 368, 124, 378, 62, cores.madeira, 2);
    for (let degrau = 0; degrau < 8; degrau++) {
      const fracaoDaAltura = degrau / 8, degrauY = 118 - degrau * 8;
      ferramentasPixel.linha(contexto, 353 + fracaoDaAltura * 11, degrauY, 369 + fracaoDaAltura * 10, degrauY, cores.madeiraClara, 1);
    }
    // ---- chão de concreto em perspectiva ----
    ferramentasPixel.ret(contexto, 0, 125, LARGURA, ALTURA - 125, cores.chao);
    for (const juntaY of [131, 139, 150, 165, 186]) ferramentasPixel.ret(contexto, 0, juntaY, LARGURA, 1, cores.chaoJunta);
    for (let indiceDaJunta = -8; indiceDaJunta <= 8; indiceDaJunta++) { const juntaNaBordaX = 192 + indiceDaJunta * 64; ferramentasPixel.linha(contexto, 192 + indiceDaJunta * 8, 125, juntaNaBordaX, ALTURA, cores.chaoJunta, 1); }
    for (let mancha = 0; mancha < 70; mancha++) ferramentasPixel.px(contexto, sorteioDoCenario() * LARGURA, 127 + sorteioDoCenario() * 89, sorteioDoCenario() < 0.5 ? cores.mancha : cores.chaoClaro);
    ferramentasPixel.elipse(contexto, 250, 196, 14, 3, cores.mancha); ferramentasPixel.elipse(contexto, 120, 205, 9, 2, '#26272d');           // manchas de óleo
    ferramentasPixel.pontilhar(contexto, 104, 126, 178, 6, '#2a4a5a', 0.22);                                                                // reflexo dos monitores no chão
    // cabos pelo chão
    ferramentasPixel.linha(contexto, 50, 125, 70, 150, cores.preto, 2); ferramentasPixel.linha(contexto, 70, 150, 150, 158, cores.preto, 2); ferramentasPixel.linha(contexto, 150, 158, 186, 160, cores.preto, 2);
    ferramentasPixel.linha(contexto, 280, 126, 262, 148, cores.preto, 2); ferramentasPixel.linha(contexto, 262, 148, 206, 160, cores.preto, 2);
    // bancada (esquerda): madeira de celeiro com tampo e pernas
    ferramentasPixel.ret(contexto, 30, 146, 108, 4, cores.madeiraClara); ferramentasPixel.ret(contexto, 30, 150, 108, 5, cores.madeira); ferramentasPixel.ret(contexto, 30, 155, 108, 1, cores.madeiraEscura);
    for (const pernaX of [34, 128]) ferramentasPixel.ret(contexto, pernaX, 156, 5, 18, cores.madeiraEscura);
    ferramentasPixel.ret(contexto, 38, 166, 92, 3, cores.madeiraEscura);
    ferramentasPixel.ret(contexto, 44, 160, 22, 6, '#2c3038'); ferramentasPixel.ret(contexto, 46, 161, 18, 1, cores.acoEscuro);                // gaveteiro
    // objetos fixos da bancada: manopla desmontada, osciloscópio, luminária, caneca, ferramentas
    ferramentasPixel.ret(contexto, 64, 141, 12, 5, '#7d141b'); ferramentasPixel.ret(contexto, 65, 141, 10, 2, '#b3202a'); ferramentasPixel.ret(contexto, 72, 140, 4, 3, '#d6a334'); ferramentasPixel.px(contexto, 67, 143, '#9fefff');
    ferramentasPixel.ret(contexto, 100, 132, 22, 14, '#2a2e36'); ferramentasPixel.ret(contexto, 100, 132, 22, 1, '#3d424d'); ferramentasPixel.ret(contexto, 102, 134, 14, 9, cores.tela);
    ferramentasPixel.px(contexto, 119, 136, cores.ambar); ferramentasPixel.px(contexto, 119, 139, cores.verde);
    ferramentasPixel.linha(contexto, 86, 146, 86, 136, cores.acoEscuro, 1); ferramentasPixel.linha(contexto, 86, 136, 92, 131, cores.acoEscuro, 1); ferramentasPixel.ret(contexto, 90, 129, 6, 3, '#d6a334');
    ferramentasPixel.ret(contexto, 124, 141, 5, 5, '#d8d8d8'); ferramentasPixel.ret(contexto, 124, 141, 5, 1, '#f0f0f0'); ferramentasPixel.px(contexto, 129, 143, '#d8d8d8');
    ferramentasPixel.linha(contexto, 44, 144, 54, 144, cores.aco, 1); ferramentasPixel.ret(contexto, 40, 143, 4, 3, '#2f6fb3');
    // base do braço robótico (o braço anda: camada do meio)
    ferramentasPixel.ret(contexto, 48, 138, 10, 8, cores.acoEscuro); ferramentasPixel.ret(contexto, 49, 138, 8, 1, cores.aco); ferramentasPixel.px(contexto, 52, 141, cores.ambar);
    // mesa holográfica (centro)
    ferramentasPixel.poligono(contexto, [[180, 162], [206, 162], [202, 150], [184, 150]], cores.acoEscuro); ferramentasPixel.ret(contexto, 184, 150, 18, 1, cores.aco);
    ferramentasPixel.ret(contexto, 176, 147, 34, 4, '#2a303d'); ferramentasPixel.ret(contexto, 176, 147, 34, 1, cores.acoClaro); ferramentasPixel.ret(contexto, 180, 148, 26, 2, '#163c4a');
    // carrinho de ferramentas (direita)
    ferramentasPixel.ret(contexto, 300, 142, 30, 26, '#8f1d22'); ferramentasPixel.ret(contexto, 300, 142, 30, 2, '#b3202a');
    for (let gavetaY = 147; gavetaY < 166; gavetaY += 6) { ferramentasPixel.ret(contexto, 302, gavetaY, 26, 4, '#6e1a1f'); ferramentasPixel.ret(contexto, 312, gavetaY + 1, 6, 1, cores.acoClaro); }
    ferramentasPixel.ret(contexto, 302, 168, 3, 3, cores.preto); ferramentasPixel.ret(contexto, 325, 168, 3, 3, cores.preto);
    ferramentasPixel.ret(contexto, 304, 138, 8, 4, cores.acoEscuro); ferramentasPixel.ret(contexto, 316, 139, 10, 3, '#d6a334');
    // ---- detalhes do chão no primeiro plano (o celeiro continua sendo celeiro) ----
    // planta técnica aberta no chão, com uma caneca segurando a ponta
    ferramentasPixel.poligono(contexto, [[198, 196], [240, 194], [244, 209], [201, 211]], '#2f5f8f'); ferramentasPixel.poligono(contexto, [[198, 196], [240, 194], [241, 197], [199, 199]], '#3f77ab');
    for (let tracado = 0; tracado < 4; tracado++) ferramentasPixel.linha(contexto, 204 + tracado * 9, 198, 206 + tracado * 9, 208, '#7fb0dc', 1);
    ferramentasPixel.linha(contexto, 203, 203, 238, 201, '#7fb0dc', 1); ferramentasPixel.elipse(contexto, 222, 203, 4, 2, '#7fb0dc'); ferramentasPixel.elipse(contexto, 222, 203, 3, 1, '#2f5f8f');
    ferramentasPixel.ret(contexto, 236, 198, 5, 5, '#b3202a'); ferramentasPixel.ret(contexto, 236, 198, 5, 1, '#e0484a');
    // balde de leite (é um celeiro, afinal)
    ferramentasPixel.poligono(contexto, [[150, 193], [162, 193], [160, 207], [152, 207]], '#8b95a8'); ferramentasPixel.ret(contexto, 150, 193, 13, 2, '#e8ecf2'); ferramentasPixel.ret(contexto, 151, 196, 1, 9, '#c4ccd8');
    ferramentasPixel.linha(contexto, 150, 193, 156, 188, '#5c6578', 1); ferramentasPixel.linha(contexto, 162, 193, 156, 188, '#5c6578', 1);
    // caixa de ferramentas aberta e parafusos espalhados
    ferramentasPixel.ret(contexto, 112, 198, 24, 10, '#b3202a'); ferramentasPixel.ret(contexto, 112, 198, 24, 2, '#e0484a'); ferramentasPixel.ret(contexto, 112, 205, 24, 1, '#7d141b'); ferramentasPixel.ret(contexto, 110, 194, 28, 4, '#8f1d22');
    ferramentasPixel.linha(contexto, 116, 197, 124, 192, '#8b95a8', 2); ferramentasPixel.ret(contexto, 126, 193, 6, 3, '#d6a334'); ferramentasPixel.ret(contexto, 120, 210, 10, 1, '#18191d');
    for (const [parafusoX, parafusoY] of [[172, 205], [176, 209], [184, 203], [261, 207], [268, 203], [190, 212]]) { ferramentasPixel.px(contexto, parafusoX, parafusoY, '#8b95a8'); ferramentasPixel.px(contexto, parafusoX + 1, parafusoY, '#5c6578'); }
    // vinheta (profundidade): faixas chapadas translúcidas nas bordas, sem ruído
    contexto.save(); contexto.fillStyle = '#05060a';
    for (let faixa = 0; faixa < 5; faixa++) {
      contexto.globalAlpha = 0.09;
      contexto.fillRect(0, 0, LARGURA, 3 + faixa * 3); contexto.fillRect(0, ALTURA - 2 - faixa * 3, LARGURA, 2 + faixa * 3);
      contexto.fillRect(0, 0, 4 + faixa * 4, ALTURA); contexto.fillRect(LARGURA - 4 - faixa * 4, 0, 4 + faixa * 4, ALTURA);
    }
    contexto.restore();
    return canvas;
  };
  // armadura reserva no pórtico (mais escura: fica na penumbra); centroX = meio da armadura, pisoY = onde ela se apoia
  function desenharArmaduraReserva(contexto, centroX, pisoY) {
    ferramentasPixel.ret(contexto, centroX - 5, pisoY - 18, 4, 18, cores.armadura); ferramentasPixel.ret(contexto, centroX + 1, pisoY - 18, 4, 18, cores.armadura);
    ferramentasPixel.ret(contexto, centroX - 5, pisoY - 10, 4, 2, cores.dourado); ferramentasPixel.ret(contexto, centroX + 1, pisoY - 10, 4, 2, cores.dourado);
    ferramentasPixel.poligono(contexto, [[centroX - 7, pisoY - 34], [centroX + 7, pisoY - 34], [centroX + 5, pisoY - 18], [centroX - 5, pisoY - 18]], cores.armadura);
    ferramentasPixel.ret(contexto, centroX - 4, pisoY - 24, 8, 6, cores.dourado); ferramentasPixel.ret(contexto, centroX - 1, pisoY - 31, 3, 3, '#3a7f95');
    ferramentasPixel.elipse(contexto, centroX - 8, pisoY - 32, 2, 2, cores.armaduraClara); ferramentasPixel.elipse(contexto, centroX + 8, pisoY - 32, 2, 2, cores.armaduraClara);
    ferramentasPixel.ret(contexto, centroX - 10, pisoY - 31, 3, 13, cores.armadura); ferramentasPixel.ret(contexto, centroX + 8, pisoY - 31, 3, 13, cores.armadura);
    ferramentasPixel.elipse(contexto, centroX, pisoY - 39, 4, 5, cores.armadura); ferramentasPixel.ret(contexto, centroX - 3, pisoY - 41, 6, 6, cores.dourado);
    ferramentasPixel.ret(contexto, centroX - 2, pisoY - 39, 2, 1, '#1d3b45'); ferramentasPixel.ret(contexto, centroX + 1, pisoY - 39, 2, 1, '#1d3b45');
  }

  // ------------------------------------------------------------------ PRIMEIRO PLANO ESTÁTICO (por cima dos personagens)
  const pintarFrente = () => {
    const { canvas, ctx: contexto } = ferramentasPixel.criarTela(LARGURA, ALTURA);
    // fardo de feno (canto inferior esquerdo) com notebook em cima
    ferramentasPixel.ret(contexto, -4, 188, 60, 30, cores.feno); ferramentasPixel.ret(contexto, -4, 188, 60, 2, cores.fenoClaro);
    for (let palha = 0; palha < 120; palha++) ferramentasPixel.px(contexto, -4 + sorteioDoCenario() * 60, 190 + sorteioDoCenario() * 26, sorteioDoCenario() < 0.5 ? cores.fenoEscuro : cores.fenoClaro);
    ferramentasPixel.ret(contexto, -4, 198, 60, 1, cores.fenoEscuro); ferramentasPixel.ret(contexto, -4, 208, 60, 1, cores.fenoEscuro);
    for (const amarracaoX of [14, 40]) ferramentasPixel.ret(contexto, amarracaoX, 188, 2, 28, '#7a4a20');
    ferramentasPixel.ret(contexto, 12, 186, 30, 2, '#2a2e36'); ferramentasPixel.poligono(contexto, [[14, 186], [40, 186], [37, 172], [17, 172]], '#2a2e36');
    ferramentasPixel.poligono(contexto, [[16, 185], [38, 185], [36, 174], [18, 174]], cores.tela);
    // carretel de cabo
    ferramentasPixel.elipse(contexto, 84, 204, 13, 13, cores.madeiraEscura); ferramentasPixel.elipse(contexto, 84, 204, 11, 11, '#1d1f24');
    for (let volta = 0; volta < 4; volta++) ferramentasPixel.elipse(contexto, 84, 204, 9 - volta * 2, 9 - volta * 2, volta % 2 ? '#2c2f36' : '#202227');
    ferramentasPixel.elipse(contexto, 84, 204, 2, 2, cores.madeira);
    // engradados de madeira e tambor de óleo (direita)
    ferramentasPixel.ret(contexto, 296, 190, 40, 28, cores.madeira); ferramentasPixel.ret(contexto, 296, 190, 40, 2, cores.madeiraClara);
    ferramentasPixel.linha(contexto, 298, 192, 334, 214, cores.madeiraEscura, 2); ferramentasPixel.ret(contexto, 296, 203, 40, 1, cores.madeiraEscura);
    ferramentasPixel.texto(contexto, 'FRAGIL', 304, 196, '#2b1f14');
    ferramentasPixel.ret(contexto, 344, 170, 30, 48, '#8a2a1e'); ferramentasPixel.ret(contexto, 344, 170, 30, 3, '#a8402c');
    ferramentasPixel.ret(contexto, 346, 182, 26, 2, '#5e1c14'); ferramentasPixel.ret(contexto, 346, 202, 26, 2, '#5e1c14');
    ferramentasPixel.ret(contexto, 352, 188, 14, 10, cores.perigo); ferramentasPixel.poligono(contexto, [[359, 189], [364, 197], [354, 197]], cores.preto); ferramentasPixel.px(contexto, 359, 194, cores.perigo);
    for (const frisoX of [344, 345, 372, 373]) ferramentasPixel.ret(contexto, frisoX, 170, 1, 48, '#5e1c14');
    ferramentasPixel.contornar(canvas, cores.preto);
    return canvas;
  };

  // ------------------------------------------------------------------ ELEMENTOS ANIMADOS (cada um com seu relógio)
  // LEDs dos racks: período e fase próprios
  const leds = [];
  for (const rackX of [6, 38]) for (let ledY = 39; ledY < 122; ledY += 7) for (let coluna = 0; coluna < 3; coluna++) {
    leds.push({ x: rackX + 3 + coluna * 3, y: ledY + 2, periodo: 0.4 + sorteioDoCenario() * 3.5, fase: sorteioDoCenario() * 10, cor: [cores.verde, cores.verde, cores.ciano, cores.ambar][sorteioDoCenario() * 4 | 0], fixo: sorteioDoCenario() < 0.3 });
  }
  // monitores (posição do canto da tela 48×26)
  const monitores = cenaDoCeleiro.MONITORES.map((posicao, indice) => ({ x: posicao[0], y: posicao[1], tipo: ['grafico', 'radar', 'codigo', 'arame', 'mapa', 'energia'][indice], falha: 0, proximaFalha: 8 + sorteioDoCenario() * 20, dados: [], rolagem: 0, linhas: [] }));
  const monitorDoTipo = tipo => monitores.find(monitor => monitor.tipo === tipo);
  for (let ponto = 0; ponto < 48; ponto++) monitorDoTipo('grafico').dados.push(13 + Math.sin(ponto / 3) * 6);
  const TRECHOS_DE_CODIGO = ['REATOR OK', 'ARC 3.2 GJ', 'SCAN 98%', 'CELEIRO>LAB', 'NOITE: SIM', 'ZUMBIS: 0', 'PESO 2.1T', 'ALVO: SILO', 'VACA: OK', 'MILHO 84', 'DRONE 2 ON', 'TESTE 17'];
  for (let linha = 0; linha < 6; linha++) monitorDoTipo('codigo').linhas.push(TRECHOS_DE_CODIGO[linha]);
  // braço robótico: ciclo com fases (ir, soldar, voltar, girar); ângulos em radianos
  const bracoRobotico = { tempo: 0, fase: 'parado', duracao: 3, anguloDaBase: -1.2, anguloDoCotovelo: 1.6, proximaFaisca: 0 };
  const BASE_DO_BRACO_X = 53, BASE_DO_BRACO_Y = 138, COMPRIMENTO_DO_BRACO = 13, COMPRIMENTO_DA_GARRA = 11;
  const faiscas = [], poeira = [], vapor = [];
  for (let indice = 0; indice < 16; indice++) poeira.push({ x: 0, y: 0, vida: 0, cone: indice % 3 });
  const LUMINARIAS_X = [64, 192, 320];
  const drone = { tempo: sorteioDoCenario() * 20 };
  const roboAspirador = { x: -20, direcao: 1, ativo: false, espera: 12 + sorteioDoCenario() * 10, pausa: 0 };
  const rato = { x: -10, ativo: false, espera: 25 + sorteioDoCenario() * 20 };
  const vaca = { visivel: 0, alvo: 0, espera: 30 + sorteioDoCenario() * 30 };
  const luzes = { piscadaDireita: 0, proximaPiscada: 6 + sorteioDoCenario() * 10, alertaAte: 0, proximoAlerta: 20 + sorteioDoCenario() * 20 };
  const holograma = { angulo: 0, falha: 0 };

  const atualizar = (segundosDoQuadro, tempo) => {
    // monitores: falhas raras e independentes
    for (const monitor of monitores) {
      monitor.proximaFalha -= segundosDoQuadro;
      if (monitor.proximaFalha <= 0) { monitor.falha = 0.18 + sorteioDoCenario() * 0.2; monitor.proximaFalha = 12 + sorteioDoCenario() * 25; }
      monitor.falha = Math.max(0, monitor.falha - segundosDoQuadro);
    }
    const grafico = monitorDoTipo('grafico'); grafico.rolagem += segundosDoQuadro * 14;
    while (grafico.rolagem >= 1) {
      grafico.rolagem -= 1; grafico.dados.shift();
      const ultimo = grafico.dados[grafico.dados.length - 1];
      grafico.dados.push(Math.max(3, Math.min(23, ultimo + (sorteioDoCenario() - 0.5) * 6 + (13 - ultimo) * 0.08)));
    }
    const codigo = monitorDoTipo('codigo'); codigo.rolagem += segundosDoQuadro * 1.6;
    if (codigo.rolagem >= 1) { codigo.rolagem = 0; codigo.linhas.shift(); codigo.linhas.push(TRECHOS_DE_CODIGO[sorteioDoCenario() * TRECHOS_DE_CODIGO.length | 0]); }
    // braço robótico
    bracoRobotico.tempo += segundosDoQuadro;
    if (bracoRobotico.tempo >= bracoRobotico.duracao) {
      bracoRobotico.tempo = 0;
      bracoRobotico.fase = { parado: 'indo', indo: 'soldando', soldando: 'voltando', voltando: 'parado' }[bracoRobotico.fase];
      bracoRobotico.duracao = { parado: 2 + sorteioDoCenario() * 4, indo: 1.4, soldando: 2.2 + sorteioDoCenario() * 1.5, voltando: 1.4 }[bracoRobotico.fase];
    }
    const fracaoDaFase = Math.min(1, bracoRobotico.tempo / bracoRobotico.duracao);
    if (bracoRobotico.fase === 'indo') { bracoRobotico.anguloDaBase = -1.2 + 0.75 * suavizar(fracaoDaFase); bracoRobotico.anguloDoCotovelo = 1.6 + 0.35 * suavizar(fracaoDaFase); }
    else if (bracoRobotico.fase === 'voltando') { bracoRobotico.anguloDaBase = -0.45 - 0.75 * suavizar(fracaoDaFase); bracoRobotico.anguloDoCotovelo = 1.95 - 0.35 * suavizar(fracaoDaFase); }
    else if (bracoRobotico.fase === 'soldando') {
      bracoRobotico.anguloDaBase = -0.45 + Math.sin(tempo * 9) * 0.03; bracoRobotico.proximaFaisca -= segundosDoQuadro;
      if (bracoRobotico.proximaFaisca <= 0) {
        bracoRobotico.proximaFaisca = 0.05 + sorteioDoCenario() * 0.12;
        const [pontaX, pontaY] = pontaDoBracoRobotico();
        for (let faisca = 0; faisca < 2 + (sorteioDoCenario() * 3 | 0); faisca++) faiscas.push({ x: pontaX, y: pontaY, vx: (sorteioDoCenario() - 0.5) * 50, vy: -20 - sorteioDoCenario() * 35, vida: 0.4 + sorteioDoCenario() * 0.4 });
      }
    }
    // faíscas (x, y = posição; vx, vy = velocidade em px/s) caem e quicam no tampo da bancada
    for (let indice = faiscas.length - 1; indice >= 0; indice--) {
      const faisca = faiscas[indice]; faisca.vida -= segundosDoQuadro; faisca.vy += 120 * segundosDoQuadro; faisca.x += faisca.vx * segundosDoQuadro; faisca.y += faisca.vy * segundosDoQuadro;
      if (faisca.y > 146) { faisca.y = 146; faisca.vy *= -0.3; faisca.vx *= 0.5; }
      if (faisca.vida <= 0) faiscas.splice(indice, 1);
    }
    // poeira iluminada nos cones das luminárias (max = vida inicial, para o brilho subir e descer)
    for (const grao of poeira) {
      grao.vida -= segundosDoQuadro;
      if (grao.vida <= 0) {
        const luminariaX = LUMINARIAS_X[grao.cone];
        grao.x = luminariaX - 16 + sorteioDoCenario() * 32; grao.y = 40 + sorteioDoCenario() * 70; grao.vx = (sorteioDoCenario() - 0.5) * 3; grao.vy = 1 + sorteioDoCenario() * 2; grao.vida = 4 + sorteioDoCenario() * 6; grao.max = grao.vida;
      }
      grao.x += grao.vx * segundosDoQuadro; grao.y += grao.vy * segundosDoQuadro;
    }
    // vapor da caneca
    if (sorteioDoCenario() < segundosDoQuadro * 1.6) vapor.push({ x: 126 + (sorteioDoCenario() - 0.5) * 2, y: 140, vida: 1.6 });
    for (let indice = vapor.length - 1; indice >= 0; indice--) {
      const fio = vapor[indice]; fio.vida -= segundosDoQuadro; fio.y -= segundosDoQuadro * 7; fio.x += Math.sin(tempo * 2 + indice) * segundosDoQuadro * 2;
      if (fio.vida <= 0) vapor.splice(indice, 1);
    }
    // holograma
    holograma.angulo += segundosDoQuadro * 0.7; holograma.falha = Math.max(0, holograma.falha - segundosDoQuadro);
    if (sorteioDoCenario() < segundosDoQuadro * 0.15) holograma.falha = 0.12;
    // drone
    drone.tempo += segundosDoQuadro;
    // robô aspirador: atravessa o primeiro plano de tempos em tempos, para, bate no engradado e volta
    if (!roboAspirador.ativo) { roboAspirador.espera -= segundosDoQuadro; if (roboAspirador.espera <= 0) { roboAspirador.ativo = true; roboAspirador.x = -16; roboAspirador.direcao = 1; } }
    else if (roboAspirador.pausa > 0) roboAspirador.pausa -= segundosDoQuadro;
    else {
      roboAspirador.x += roboAspirador.direcao * 16 * segundosDoQuadro;
      if (roboAspirador.direcao > 0 && roboAspirador.x > 284) { roboAspirador.direcao = -1; roboAspirador.pausa = 1.2; }
      if (roboAspirador.direcao < 0 && roboAspirador.x < -18) { roboAspirador.ativo = false; roboAspirador.espera = 35 + sorteioDoCenario() * 30; }
      if (sorteioDoCenario() < segundosDoQuadro * 0.25) roboAspirador.pausa = 0.6 + sorteioDoCenario();
    }
    // ratinho do celeiro: corre pelo rodapé de vez em quando
    if (!rato.ativo) { rato.espera -= segundosDoQuadro; if (rato.espera <= 0) { rato.ativo = true; rato.x = LARGURA + 6; } }
    else { rato.x -= segundosDoQuadro * 55; if (rato.x < -10) { rato.ativo = false; rato.espera = 30 + sorteioDoCenario() * 40; } }
    // a vaca espia pela janela
    vaca.espera -= segundosDoQuadro;
    if (vaca.espera <= 0 && !vaca.alvo) { vaca.alvo = 1; vaca.espera = 5 + sorteioDoCenario() * 4; }
    else if (vaca.espera <= 0 && vaca.alvo) { vaca.alvo = 0; vaca.espera = 35 + sorteioDoCenario() * 35; }
    vaca.visivel += (vaca.alvo - vaca.visivel) * Math.min(1, segundosDoQuadro * 2.5);
    // luminária da direita falha às vezes; giroflex âmbar do pórtico em ciclos
    luzes.proximaPiscada -= segundosDoQuadro;
    if (luzes.proximaPiscada <= 0) { luzes.piscadaDireita = 0.5; luzes.proximaPiscada = 10 + sorteioDoCenario() * 18; }
    luzes.piscadaDireita = Math.max(0, luzes.piscadaDireita - segundosDoQuadro);
    luzes.proximoAlerta -= segundosDoQuadro;
    if (luzes.proximoAlerta <= 0) { luzes.alertaAte = tempo + 6; luzes.proximoAlerta = 25 + sorteioDoCenario() * 25; }
  };
  // vaca chamada pela conversa ("tem uma vaca olhando pela janela")
  const chamarVaca = segundos => { vaca.alvo = 1; vaca.espera = segundos; };

  // ponta da garra do braço robótico (os dois segmentos são medidos a partir da vertical para CIMA)
  function pontaDoBracoRobotico() {
    const anguloDaGarra = bracoRobotico.anguloDaBase + bracoRobotico.anguloDoCotovelo;
    const cotoveloX = BASE_DO_BRACO_X - Math.sin(bracoRobotico.anguloDaBase) * COMPRIMENTO_DO_BRACO, cotoveloY = BASE_DO_BRACO_Y - Math.cos(bracoRobotico.anguloDaBase) * COMPRIMENTO_DO_BRACO;
    return [cotoveloX + Math.sin(anguloDaGarra) * COMPRIMENTO_DA_GARRA, cotoveloY - Math.cos(anguloDaGarra) * COMPRIMENTO_DA_GARRA];
  }

  // ------------------------------------------------------------------ DESENHO DO MEIO (atrás dos personagens)
  const desenharMeio = (contexto, tempo) => {
    // LEDs
    for (const led of leds) { const aceso = led.fixo || ((tempo + led.fase) % led.periodo) < led.periodo * 0.55; ferramentasPixel.px(contexto, led.x, led.y, aceso ? led.cor : '#1a1f1a'); }
    // monitores
    for (const monitor of monitores) desenharMonitor(contexto, monitor, tempo);
    // osciloscópio
    for (let coluna = 0; coluna < 14; coluna++) ferramentasPixel.px(contexto, 102 + coluna, 138 + Math.round(Math.sin(tempo * 6 + coluna * 0.7) * 3 * Math.sin(tempo * 0.7)), cores.verde);
    // braço robótico (dois segmentos e garra)
    {
      const cotoveloX = BASE_DO_BRACO_X - Math.sin(bracoRobotico.anguloDaBase) * COMPRIMENTO_DO_BRACO, cotoveloY = BASE_DO_BRACO_Y - Math.cos(bracoRobotico.anguloDaBase) * COMPRIMENTO_DO_BRACO;
      const [garraX, garraY] = pontaDoBracoRobotico();
      ferramentasPixel.linha(contexto, BASE_DO_BRACO_X, BASE_DO_BRACO_Y, cotoveloX, cotoveloY, '#d6a334', 3); ferramentasPixel.linha(contexto, BASE_DO_BRACO_X, BASE_DO_BRACO_Y, cotoveloX, cotoveloY, '#f2cd6a', 1);
      ferramentasPixel.linha(contexto, cotoveloX, cotoveloY, garraX, garraY, cores.acoClaro, 2); ferramentasPixel.elipse(contexto, cotoveloX, cotoveloY, 2, 2, cores.acoEscuro); ferramentasPixel.px(contexto, cotoveloX, cotoveloY, cores.ambar);
      ferramentasPixel.ret(contexto, garraX - 1, garraY - 1, 3, 3, cores.acoEscuro);
      if (bracoRobotico.fase === 'soldando' && (tempo * 20 | 0) % 3) { ferramentasPixel.px(contexto, garraX, garraY + 2, '#ffffff'); ferramentasPixel.px(contexto, garraX + 1, garraY + 2, '#bfefff'); }
    }
    // holograma da fazenda girando sobre a mesa
    desenharHolograma(contexto, tempo);
    // drone
    {
      const droneX = 268 + Math.sin(drone.tempo * 0.31) * 46, droneY = 66 + Math.sin(drone.tempo * 0.53) * 10 + Math.sin(drone.tempo * 3.1) * 1;
      ferramentasPixel.ret(contexto, droneX - 4, droneY, 9, 2, cores.acoEscuro); ferramentasPixel.ret(contexto, droneX - 1, droneY - 1, 3, 1, cores.aco);
      const helicesAlternam = (tempo * 30 | 0) % 2;
      ferramentasPixel.ret(contexto, droneX - 6, droneY - 1, 3, 1, helicesAlternam ? cores.acoClaro : cores.acoEscuro); ferramentasPixel.ret(contexto, droneX + 4, droneY - 1, 3, 1, helicesAlternam ? cores.acoEscuro : cores.acoClaro);
      ferramentasPixel.px(contexto, droneX, droneY + 2, ((drone.tempo * 2) % 1) < 0.15 ? cores.vermelho : '#401418');
      ferramentasPixel.pontilhar(contexto, droneX - 4, 176 + (droneY - 66) * 0.1, 9, 1, '#1b1c20', 0.6);   // sombra no chão
    }
    // laser de varredura na armadura reserva
    {
      const fracaoDoCiclo = (tempo % 7) / 7;
      if (fracaoDoCiclo < 0.6) { const laserY = 74 + Math.round(Math.sin(fracaoDoCiclo / 0.6 * Math.PI) * 40); ferramentasPixel.ret(contexto, 304, laserY, 28, 1, '#ff3a4a'); ferramentasPixel.pontilhar(contexto, 304, laserY - 1, 28, 3, '#ff3a4a', 0.25); }
    }
    // anéis da plataforma em sequência
    for (let anel = 0; anel < 6; anel++) ferramentasPixel.px(contexto, 300 + anel * 7, 115, ((tempo * 3) | 0) % 6 === anel ? cores.ciano : '#173844');
    // vaca na janela
    if (vaca.visivel > 0.05) { const descida = Math.round((1 - vaca.visivel) * 16); desenharVacaNaJanela(contexto, 360, 46 + descida, tempo); }
    // ratinho no rodapé
    if (rato.ativo) {
      const ratoX = Math.round(rato.x), pata = (tempo * 18 | 0) % 2;
      ferramentasPixel.ret(contexto, ratoX, 120, 4, 2, '#7a6a5e'); ferramentasPixel.px(contexto, ratoX - 1, 120, '#b39a8a'); ferramentasPixel.px(contexto, ratoX, 119, '#9a8676');
      ferramentasPixel.px(contexto, ratoX + 4, 121, '#5a4a40'); ferramentasPixel.px(contexto, ratoX + 5, 121 - pata, '#5a4a40'); ferramentasPixel.px(contexto, ratoX - 1, 121, '#000');
    }
  };
  const desenharVacaNaJanela = (contexto, cabecaX, cabecaY, tempo) => {
    contexto.save(); contexto.beginPath(); contexto.rect(354, 30, 22, 22); contexto.clip();   // só aparece dentro do vidro
    ferramentasPixel.elipse(contexto, cabecaX + 4, cabecaY, 7, 6, '#f2efe8'); ferramentasPixel.ret(contexto, cabecaX - 2, cabecaY - 3, 5, 4, '#2a2a2a'); ferramentasPixel.ret(contexto, cabecaX + 6, cabecaY + 1, 4, 3, '#2a2a2a');
    ferramentasPixel.ret(contexto, cabecaX + 1, cabecaY + 3, 7, 4, '#e7a9a0'); ferramentasPixel.px(contexto, cabecaX + 2, cabecaY + 5, '#9a5a52'); ferramentasPixel.px(contexto, cabecaX + 6, cabecaY + 5, '#9a5a52');
    const piscando = (tempo % 4) < 0.15;
    ferramentasPixel.px(contexto, cabecaX + 1, cabecaY - 1, piscando ? '#f2efe8' : '#000'); ferramentasPixel.px(contexto, cabecaX + 7, cabecaY - 1, piscando ? '#f2efe8' : '#000');
    ferramentasPixel.ret(contexto, cabecaX - 4, cabecaY - 5, 3, 2, '#d8d0c0'); ferramentasPixel.ret(contexto, cabecaX + 9, cabecaY - 5, 3, 2, '#d8d0c0');   // chifres
    contexto.restore();
    ferramentasPixel.ret(contexto, 364, 30, 2, 22, cores.madeiraEscura); ferramentasPixel.ret(contexto, 354, 40, 22, 2, cores.madeiraEscura);   // caixilho por cima da vaca
  };
  const desenharMonitor = (contexto, monitor, tempo) => {
    const { x: telaX, y: telaY } = monitor;
    if (monitor.falha > 0) {   // chiado (sorteio não semeado: a falha nunca se repete igual)
      for (let linha = 0; linha < 26; linha += 1) for (let coluna = 0; coluna < 48; coluna += 2) if (Math.random() < 0.3) ferramentasPixel.px(contexto, telaX + coluna + (linha % 2), telaY + linha, Math.random() < 0.5 ? '#2a4a5a' : '#88b0c0');
      return;
    }
    if (monitor.tipo === 'grafico') {
      ferramentasPixel.texto(contexto, 'ARC', telaX + 2, telaY + 2, cores.cianoEscuro);
      for (let coluna = 0; coluna < 47; coluna++) ferramentasPixel.linha(contexto, telaX + coluna, telaY + 25 - monitor.dados[coluna], telaX + coluna + 1, telaY + 25 - monitor.dados[coluna + 1], cores.ciano, 1);
      for (let coluna = 0; coluna < 48; coluna += 8) ferramentasPixel.px(contexto, telaX + coluna, telaY + 24, cores.cianoEscuro);
    } else if (monitor.tipo === 'radar') {
      const centroX = telaX + 24, centroY = telaY + 13;
      ferramentasPixel.elipse(contexto, centroX, centroY, 11, 11, '#0a2414'); ferramentasPixel.elipse(contexto, centroX, centroY, 10, 10, cores.tela);
      ferramentasPixel.elipse(contexto, centroX, centroY, 6, 6, '#0a2414'); ferramentasPixel.elipse(contexto, centroX, centroY, 5, 5, cores.tela);
      const anguloDaVarredura = tempo * 2.2;
      ferramentasPixel.linha(contexto, centroX, centroY, centroX + Math.cos(anguloDaVarredura) * 10, centroY + Math.sin(anguloDaVarredura) * 10, cores.verde, 1);
      ferramentasPixel.linha(contexto, centroX, centroY, centroX + Math.cos(anguloDaVarredura - 0.25) * 10, centroY + Math.sin(anguloDaVarredura - 0.25) * 10, cores.verdeEscuro, 1);
      for (const [alvoX, alvoY, fase] of [[centroX - 6, centroY + 3, 0], [centroX + 4, centroY - 6, 2], [centroX + 7, centroY + 5, 4]]) if (((tempo * 0.7 + fase) % 3) < 1.2) ferramentasPixel.px(contexto, alvoX, alvoY, cores.verde);
      ferramentasPixel.texto(contexto, 'N', telaX + 2, telaY + 2, cores.verdeEscuro);
    } else if (monitor.tipo === 'codigo') {
      contexto.save(); contexto.beginPath(); contexto.rect(telaX, telaY, 48, 26); contexto.clip();
      const linhasVisiveis = monitor.linhas.slice(-5), subida = Math.round(monitor.rolagem * 6);
      linhasVisiveis.forEach((linha, indice) => ferramentasPixel.texto(contexto, linha, telaX + 2, telaY + 2 + indice * 6 - subida, indice === linhasVisiveis.length - 1 ? cores.verde : cores.verdeEscuro));
      if ((tempo % 1) < 0.5) ferramentasPixel.ret(contexto, telaX + 42, telaY + 20, 3, 5, cores.verde);   // cursor
      contexto.restore();
    } else if (monitor.tipo === 'arame') {
      desenharArame(contexto, telaX + 24, telaY + 13, tempo * 0.9, VERTICES_DA_ARMADURA, ARESTAS_DA_ARMADURA, cores.ambar, 0.9);
      ferramentasPixel.texto(contexto, 'MK', telaX + 2, telaY + 2, '#7a5520');
    } else if (monitor.tipo === 'mapa') {
      ferramentasPixel.ret(contexto, telaX + 4, telaY + 4, 40, 18, '#0b2018'); ferramentasPixel.linha(contexto, telaX + 14, telaY + 4, telaX + 10, telaY + 21, '#1d5a8c', 2);   // rio
      for (const [quadraX, quadraY] of [[22, 8], [30, 8], [22, 14], [30, 14], [38, 10]]) ferramentasPixel.ret(contexto, telaX + quadraX, telaY + quadraY, 4, 3, '#2a5a3a');
      for (let ameaca = 0; ameaca < 4; ameaca++) if (((tempo * 1.3 + ameaca * 0.7) % 2) < 1) ferramentasPixel.px(contexto, telaX + 6 + ameaca * 9 + (ameaca % 2) * 3, telaY + 5 + (ameaca % 3) * 6, cores.vermelho);
      ferramentasPixel.texto(contexto, 'NOITE', telaX + 2, telaY + 1, '#6a3030');
    } else {
      ferramentasPixel.texto(contexto, 'ENERGIA', telaX + 2, telaY + 2, cores.cianoEscuro);
      const porcentagem = 70 + Math.round(Math.sin(tempo * 0.4) * 12 + Math.sin(tempo * 1.7) * 4);
      ferramentasPixel.texto(contexto, porcentagem + '%', telaX + 30, telaY + 9, cores.ciano);
      for (let barra = 0; barra < 6; barra++) {
        const alturaDaBarra = 3 + Math.round((Math.sin(tempo * (1.1 + barra * 0.37) + barra) * 0.5 + 0.5) * 9);
        ferramentasPixel.ret(contexto, telaX + 3 + barra * 4, telaY + 23 - alturaDaBarra, 3, alturaDaBarra, barra === 5 ? cores.ambar : cores.ciano);
      }
    }
  };
  // projeção de arame 3D (pixel a pixel): gira em torno do eixo vertical e inclina um pouco para mostrar o topo
  const desenharArame = (contexto, centroX, centroY, angulo, vertices, arestas, cor, escala = 1) => {
    const cossenoDoGiro = Math.cos(angulo), senoDoGiro = Math.sin(angulo), inclinacao = 0.35, cossenoDaInclinacao = Math.cos(inclinacao), senoDaInclinacao = Math.sin(inclinacao);
    const projetados = vertices.map(([verticeX, verticeY, verticeZ]) => {
      const giradoX = verticeX * cossenoDoGiro - verticeZ * senoDoGiro, giradoZ = verticeX * senoDoGiro + verticeZ * cossenoDoGiro;
      const inclinadoY = verticeY * cossenoDaInclinacao - giradoZ * senoDaInclinacao;
      return [centroX + giradoX * escala, centroY + inclinadoY * escala];
    });
    for (const [inicio, fim] of arestas) ferramentasPixel.linha(contexto, projetados[inicio][0], projetados[inicio][1], projetados[fim][0], projetados[fim][1], cor, 1);
  };
  // armadura em arame no monitor "MK" (cubo com a ponta da cabeça)
  const VERTICES_DA_ARMADURA = [[-6, -6, -6], [6, -6, -6], [6, 6, -6], [-6, 6, -6], [-6, -6, 6], [6, -6, 6], [6, 6, 6], [-6, 6, 6], [0, -11, 0]];
  const ARESTAS_DA_ARMADURA = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7], [8, 0], [8, 1], [8, 4], [8, 5]];
  // celeiro em arame sobre a mesa holográfica (o próprio celeiro onde a cena acontece)
  const VERTICES_DO_CELEIRO = [[-9, 0, -6], [9, 0, -6], [9, 0, 6], [-9, 0, 6], [-9, -10, -6], [9, -10, -6], [9, -10, 6], [-9, -10, 6], [-9, -17, 0], [9, -17, 0], [-3, 0, 6.01], [3, 0, 6.01], [-3, -7, 6.01], [3, -7, 6.01]];
  const ARESTAS_DO_CELEIRO = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7], [4, 8], [7, 8], [5, 9], [6, 9], [8, 9], [10, 12], [12, 13], [13, 11], [10, 13], [11, 12]];
  const desenharHolograma = (contexto, tempo) => {
    const visivelNestaFalha = holograma.falha > 0 ? (Math.random() < 0.5) : true;   // falhando, o holograma pisca
    contexto.save(); contexto.globalCompositeOperation = 'lighter'; contexto.globalAlpha = 0.16 + (holograma.falha > 0 ? 0.08 : 0);   // feixe do projetor (chapado)
    ferramentasPixel.poligono(contexto, [[184, 147], [202, 147], [208, 106], [178, 106]], '#1d6f8c'); contexto.restore();
    if (visivelNestaFalha) desenharArame(contexto, 193, 136, holograma.angulo, VERTICES_DO_CELEIRO, ARESTAS_DO_CELEIRO, '#7fe8ff', 1.1);
    for (let varreduraY = 108; varreduraY < 144; varreduraY += 3) if (((tempo * 20 + varreduraY) | 0) % 7 === 0) ferramentasPixel.ret(contexto, 182, varreduraY, 22, 1, '#bff6ff');   // linha de varredura
    ferramentasPixel.ret(contexto, 180, 148, 26, 1, (tempo * 4 | 0) % 2 ? '#49d6ff' : '#2a9cc0');
  };

  // ------------------------------------------------------------------ FRENTE: objetos animados do 1º plano, partículas, luzes
  const desenharFrente = (contexto, tempo, telaDaFrente) => {
    // robô aspirador (atrás do feno e dos engradados, na frente dos personagens)
    if (roboAspirador.ativo) {
      const roboX = Math.round(roboAspirador.x);
      ferramentasPixel.elipse(contexto, roboX, 182, 6, 2, '#2c3038'); ferramentasPixel.ret(contexto, roboX - 6, 180, 13, 2, '#3a3f4a');
      ferramentasPixel.px(contexto, roboX + 3 * roboAspirador.direcao, 180, (tempo * 4 | 0) % 2 ? cores.verde : '#1a3a26');
      ferramentasPixel.pontilhar(contexto, roboX - 6, 184, 13, 1, '#18191d', 0.6);
    }
    contexto.drawImage(telaDaFrente, 0, 0);
    // tela do notebook no feno
    for (let linha = 0; linha < 4; linha++) ferramentasPixel.ret(contexto, 20, 176 + linha * 2, 6 + ((tempo * 2 + linha * 3) % 10 | 0), 1, linha === 3 ? cores.verde : cores.verdeEscuro);
    // faíscas da solda (esfriam: branco → âmbar → vermelho)
    for (const faisca of faiscas) ferramentasPixel.px(contexto, faisca.x, faisca.y, faisca.vida > 0.35 ? '#fff6c0' : faisca.vida > 0.15 ? '#ffb347' : '#a0401a');
    // vapor da caneca
    for (const fio of vapor) if (fio.vida > 0.4 || Math.random() < 0.5) ferramentasPixel.px(contexto, fio.x, fio.y, fio.vida > 1 ? '#9aa3ad' : '#6b737c');
    // poeira nos cones de luz
    for (const grao of poeira) { const brilho = Math.sin(Math.PI * grao.vida / grao.max); if (brilho > 0.35) ferramentasPixel.px(contexto, grao.x, grao.y, brilho > 0.7 ? '#e8dcb0' : '#9a8f70'); }
    // cones de luz das luminárias: formas CHAPADAS translúcidas (núcleo mais forte + borda fraca) e poça de luz no chão
    const luminariaFalhando = indice => indice === 2 && luzes.piscadaDireita > 0 && ((tempo * 25) | 0) % 3 !== 0;
    contexto.save(); contexto.globalCompositeOperation = 'lighter';
    LUMINARIAS_X.forEach((luminariaX, indice) => {
      if (luminariaFalhando(indice)) return;
      contexto.globalAlpha = 0.07; ferramentasPixel.poligono(contexto, [[luminariaX - 6, 31], [luminariaX + 7, 31], [luminariaX + 34, 176], [luminariaX - 33, 176]], '#ffe2a0');
      contexto.globalAlpha = 0.06; ferramentasPixel.poligono(contexto, [[luminariaX - 3, 31], [luminariaX + 4, 31], [luminariaX + 18, 176], [luminariaX - 17, 176]], '#ffe2a0');
      contexto.globalAlpha = 0.09; ferramentasPixel.elipse(contexto, luminariaX, 177, 30, 5, '#ffe2a0'); contexto.globalAlpha = 0.07; ferramentasPixel.elipse(contexto, luminariaX, 177, 16, 3, '#fff0c8');
    });
    // brilho do giroflex âmbar (varre de um lado para o outro)
    if (tempo < luzes.alertaAte) { const ladoDoBrilho = (tempo * 4 | 0) % 2; contexto.globalAlpha = 0.18; ferramentasPixel.poligono(contexto, ladoDoBrilho ? [[318, 16], [370, 4], [370, 40]] : [[318, 16], [266, 4], [266, 40]], '#ffb030'); }
    contexto.restore();
    LUMINARIAS_X.forEach((luminariaX, indice) => {
      ferramentasPixel.linha(contexto, luminariaX, 16, luminariaX, 24, cores.preto, 1);
      ferramentasPixel.poligono(contexto, [[luminariaX - 7, 30], [luminariaX + 7, 30], [luminariaX + 3, 24], [luminariaX - 3, 24]], '#2b3240'); ferramentasPixel.ret(contexto, luminariaX - 7, 30, 15, 1, '#48536b');
      ferramentasPixel.ret(contexto, luminariaX - 3, 31, 7, 1, luminariaFalhando(indice) ? '#5a5040' : '#ffe9b0');
    });
    // giroflex no topo do pórtico
    const alertaAceso = tempo < luzes.alertaAte;
    ferramentasPixel.ret(contexto, 315, 18, 6, 4, '#3a3a3a'); ferramentasPixel.ret(contexto, 316, 15, 4, 3, alertaAceso ? ((tempo * 8 | 0) % 2 ? '#ffcf5a' : '#c07818') : '#5a4020');
  };

  cenaDoCeleiro.cenario = { criar: () => ({ fundo: pintarFundo(), frente: pintarFrente() }), atualizar, desenharMeio, desenharFrente, chamarVaca };
})();
