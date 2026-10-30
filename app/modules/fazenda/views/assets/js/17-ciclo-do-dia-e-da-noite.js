      // ====================================================================================================
      // FARMEDU 3D — 17-ciclo-do-dia-e-da-noite.js (Fase 3B da refatoração: seção 17)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 17 — CICLO DE DIA E NOITE
      // Quadros-chave por hora do dia, modos (automático, pausa, dia fixo, noite fixa), cores do céu, luzes, nuvens e lanternas.
      // É o ÚNICO ciclo do jogo; ele não participa da contagem de dias de inatividade (que usa o relógio real).
      // ====================================================================================================
      // Quadros-chave por hora do relógio do jogo (0–24). Entre dois quadros tudo é interpolado com suavização.
      //  topo/hor: céu · brilho/forca: brilho do horizonte perto do sol · hemiCeu/hemiChao/hemiInt: luz ambiente · sol: cor da luz do sol
      //  estrelas: opacidade · nuvem/nuvemEm/nuvemOp: aparência das nuvens · basico: cor multiplicadora de materiais que não reagem à luz
      const QUADROS_DO_CEU = [
        { h: 0,    topo: 0x050a1e, hor: 0x111a38, brilho: 0x000000, forca: 0,    hemiCeu: 0x6f86cf, hemiChao: 0x1d2736, hemiInt: 0.52, sol: 0xffa060, estrelas: 1,    nuvem: 0x8795bd, nuvemEm: 0x0c1428, nuvemOp: 0.5,  basico: 0x5f78b0 },
        { h: 4.8,  topo: 0x050a1e, hor: 0x111a38, brilho: 0x000000, forca: 0,    hemiCeu: 0x6f86cf, hemiChao: 0x1d2736, hemiInt: 0.52, sol: 0xffa060, estrelas: 1,    nuvem: 0x8795bd, nuvemEm: 0x0c1428, nuvemOp: 0.5,  basico: 0x5f78b0 },
        { h: 5.7,  topo: 0x1b2a66, hor: 0xc8788a, brilho: 0xff8a5a, forca: 0.55, hemiCeu: 0x8d94c8, hemiChao: 0x2c3340, hemiInt: 0.5,  sol: 0xff9a5a, estrelas: 0.45, nuvem: 0xb9a3b8, nuvemEm: 0x1c1830, nuvemOp: 0.7,  basico: 0x8a8fb8 },
        { h: 6.5,  topo: 0x5d86d0, hor: 0xffc58a, brilho: 0xff9c4a, forca: 0.9,  hemiCeu: 0xffd9bc, hemiChao: 0x6a7f48, hemiInt: 0.62, sol: 0xffb36b, estrelas: 0,    nuvem: 0xffd7c0, nuvemEm: 0x2a1810, nuvemOp: 0.9,  basico: 0xffe2cc },
        { h: 8,    topo: 0x4d9de6, hor: 0x9fd8f5, brilho: 0xffffff, forca: 0,    hemiCeu: 0xffffff, hemiChao: 0x6a8f4a, hemiInt: 0.75, sol: 0xfff2cc, estrelas: 0,    nuvem: 0xf8fbff, nuvemEm: 0x000000, nuvemOp: 1,    basico: 0xffffff },
        { h: 16,   topo: 0x4d9de6, hor: 0x9fd8f5, brilho: 0xffffff, forca: 0,    hemiCeu: 0xffffff, hemiChao: 0x6a8f4a, hemiInt: 0.75, sol: 0xfff2cc, estrelas: 0,    nuvem: 0xf8fbff, nuvemEm: 0x000000, nuvemOp: 1,    basico: 0xffffff },
        { h: 17.3, topo: 0x5592dc, hor: 0xffd9a6, brilho: 0xffb060, forca: 0.5,  hemiCeu: 0xfff0dc, hemiChao: 0x6a8a46, hemiInt: 0.72, sol: 0xffd9a0, estrelas: 0,    nuvem: 0xfff0e0, nuvemEm: 0x1a1008, nuvemOp: 1,    basico: 0xfff1e0 },
        { h: 18.2, topo: 0x3f58a6, hor: 0xff8a52, brilho: 0xff7040, forca: 1,    hemiCeu: 0xffb48c, hemiChao: 0x5c6a44, hemiInt: 0.56, sol: 0xff8a48, estrelas: 0,    nuvem: 0xffb89a, nuvemEm: 0x3a1c10, nuvemOp: 0.92, basico: 0xffc7a0 },
        { h: 19,   topo: 0x1f2c68, hor: 0x7a4f80, brilho: 0xd0607a, forca: 0.5,  hemiCeu: 0x8a86c0, hemiChao: 0x2f3446, hemiInt: 0.5,  sol: 0xc06a6a, estrelas: 0.35, nuvem: 0x9d8cb5, nuvemEm: 0x1a1430, nuvemOp: 0.75, basico: 0x9b96c8 },
        { h: 19.9, topo: 0x050a1e, hor: 0x111a38, brilho: 0x000000, forca: 0,    hemiCeu: 0x6f86cf, hemiChao: 0x1d2736, hemiInt: 0.52, sol: 0xffa060, estrelas: 1,    nuvem: 0x8795bd, nuvemEm: 0x0c1428, nuvemOp: 0.5,  basico: 0x5f78b0 },
        { h: 24,   topo: 0x050a1e, hor: 0x111a38, brilho: 0x000000, forca: 0,    hemiCeu: 0x6f86cf, hemiChao: 0x1d2736, hemiInt: 0.52, sol: 0xffa060, estrelas: 1,    nuvem: 0x8795bd, nuvemEm: 0x0c1428, nuvemOp: 0.5,  basico: 0x5f78b0 },
      ];
      for (const quadro of QUADROS_DO_CEU) for (const propriedade of ['topo', 'hor', 'brilho', 'hemiCeu', 'hemiChao', 'sol', 'nuvem', 'nuvemEm', 'basico']) quadro[propriedade] = new THREE.Color(quadro[propriedade]);
      const ESTADO_DO_CEU = {   // valores atuais (objetos reutilizados a cada quadro: nada é criado durante o jogo)
        topo: new THREE.Color(), hor: new THREE.Color(), brilho: new THREE.Color(), forca: 0, hemiCeu: new THREE.Color(), hemiChao: new THREE.Color(), hemiInt: 0.75,
        sol: new THREE.Color(), estrelas: 0, nuvem: new THREE.Color(0xf8fbff), nuvemEmissiva: new THREE.Color(0x000000), opacidadeDasNuvens: 1,
        corBasica: new THREE.Color(0xffffff), noite: 0, elevacaoDoSol: 1,
      };
      // Interpolação suave (smoothstep): devolve 0 abaixo de bordaInferior, 1 acima de bordaSuperior e uma curva
      // em S entre elas.
      const suavizar = (bordaInferior, bordaSuperior, valor) => { const tempoDecorrido = Math.min(1, Math.max(0, (valor - bordaInferior) / (bordaSuperior - bordaInferior))); return tempoDecorrido * tempoDecorrido * (3 - 2 * tempoDecorrido); };
      const CICLO_DE_DIA_E_NOITE = { modo: 'auto', hora: HORA_INICIAL_DO_CICLO, dias: 0 };
      const NOMES_DOS_MODOS = { auto: 'Automático', pausa: 'Pausado', dia: 'Dia fixo', noite: 'Noite fixa' };
      const COR_DA_LUZ_DA_LUA = new THREE.Color(0x9db4ff), COR_APAGADA_DA_LANTERNA = new THREE.Color(0xc9d9dc), COR_ACESA_DA_LANTERNA = new THREE.Color(0xffd27a);
      const COR_APAGADA_DA_CHAMA = new THREE.Color(0xd8c9a0), COR_ACESA_DA_CHAMA = new THREE.Color(0xfff1b8);
      const INTENSIDADE_DO_SOL = 0.9, INTENSIDADE_DA_LUA = 0.34;

      // Interpola entre os dois quadros-chave vizinhos da hora informada e escreve o resultado em ESTADO_DO_CEU
      // (cores do céu, luz, nuvens...).
      const amostrarQuadrosDoCeu = function amostrarQuadrosDoCeu(hora) {
        let indice = 0; while (indice < QUADROS_DO_CEU.length - 2 && hora >= QUADROS_DO_CEU[indice + 1].h) indice++;
        const quadroAnterior = QUADROS_DO_CEU[indice], quadroSeguinte = QUADROS_DO_CEU[indice + 1], fracaoLinear = Math.min(1, Math.max(0, (hora - quadroAnterior.h) / (quadroSeguinte.h - quadroAnterior.h))), fracaoSuavizada = fracaoLinear * fracaoLinear * (3 - 2 * fracaoLinear), misturar = (posicaoX, posicaoY) => posicaoX + (posicaoY - posicaoX) * fracaoSuavizada;
        ESTADO_DO_CEU.topo.copy(quadroAnterior.topo).lerp(quadroSeguinte.topo, fracaoSuavizada); ESTADO_DO_CEU.hor.copy(quadroAnterior.hor).lerp(quadroSeguinte.hor, fracaoSuavizada); ESTADO_DO_CEU.brilho.copy(quadroAnterior.brilho).lerp(quadroSeguinte.brilho, fracaoSuavizada);
        ESTADO_DO_CEU.hemiCeu.copy(quadroAnterior.hemiCeu).lerp(quadroSeguinte.hemiCeu, fracaoSuavizada); ESTADO_DO_CEU.hemiChao.copy(quadroAnterior.hemiChao).lerp(quadroSeguinte.hemiChao, fracaoSuavizada); ESTADO_DO_CEU.sol.copy(quadroAnterior.sol).lerp(quadroSeguinte.sol, fracaoSuavizada);
        ESTADO_DO_CEU.nuvem.copy(quadroAnterior.nuvem).lerp(quadroSeguinte.nuvem, fracaoSuavizada); ESTADO_DO_CEU.nuvemEmissiva.copy(quadroAnterior.nuvemEm).lerp(quadroSeguinte.nuvemEm, fracaoSuavizada); ESTADO_DO_CEU.corBasica.copy(quadroAnterior.basico).lerp(quadroSeguinte.basico, fracaoSuavizada);
        ESTADO_DO_CEU.forca = misturar(quadroAnterior.forca, quadroSeguinte.forca); ESTADO_DO_CEU.hemiInt = misturar(quadroAnterior.hemiInt, quadroSeguinte.hemiInt); ESTADO_DO_CEU.estrelas = misturar(quadroAnterior.estrelas, quadroSeguinte.estrelas); ESTADO_DO_CEU.opacidadeDasNuvens = misturar(quadroAnterior.nuvemOp, quadroSeguinte.nuvemOp);
      };
      // Aplica o horário atual ao cenário: posição do sol e da lua, luz principal, luz ambiente, neblina, céu,
      // estrelas, nuvens, lanternas e materiais que escurecem à noite.
      const aplicarCicloAoCenario = function aplicarCicloAoCenario() {
        amostrarQuadrosDoCeu(CICLO_DE_DIA_E_NOITE.hora);
        // O sol nasce a leste (+x), passa ao norte (−z) e se põe a oeste (−x); a lua faz o caminho oposto.
        const angulo = (CICLO_DE_DIA_E_NOITE.hora - 6) / 12 * Math.PI, senoDoAngulo = Math.sin(angulo);
        direcaoDoSol.set(Math.cos(angulo), senoDoAngulo * 0.766, -senoDoAngulo * 0.643).normalize(); direcaoDaLua.copy(direcaoDoSol).negate();
        const elevacaoDoSol = direcaoDoSol.y; ESTADO_DO_CEU.elevacaoDoSol = elevacaoDoSol;
        // luz principal (a única que projeta sombras): sol de dia, lua à noite; a intensidade chega a zero na troca, então não há salto
        if (elevacaoDoSol >= 0) { luzDoSol.position.copy(luzDoSol.target.position).addScaledVector(direcaoDoSol, 40); luzDoSol.color.copy(ESTADO_DO_CEU.sol); luzDoSol.intensity = suavizar(-0.02, 0.25, elevacaoDoSol) * INTENSIDADE_DO_SOL; }
        else { luzDoSol.position.copy(luzDoSol.target.position).addScaledVector(direcaoDaLua, 40); luzDoSol.color.copy(COR_DA_LUZ_DA_LUA); luzDoSol.intensity = suavizar(-0.02, 0.25, -elevacaoDoSol) * INTENSIDADE_DA_LUA; }
        luzHemisferica.color.copy(ESTADO_DO_CEU.hemiCeu); luzHemisferica.groundColor.copy(ESTADO_DO_CEU.hemiChao); luzHemisferica.intensity = ESTADO_DO_CEU.hemiInt;
        cena.background.copy(ESTADO_DO_CEU.hor); cena.fog.color.copy(ESTADO_DO_CEU.hor);
        uniformesDoCeu.uTopo.value.copy(ESTADO_DO_CEU.topo); uniformesDoCeu.uHorizonte.value.copy(ESTADO_DO_CEU.hor); uniformesDoCeu.uBrilho.value.copy(ESTADO_DO_CEU.brilho);
        uniformesDoCeu.uForcaDoBrilho.value = ESTADO_DO_CEU.forca; uniformesDoCeu.uDirecaoDoSol.value.copy(direcaoDoSol);
        uniformesDasEstrelas.uOpacidade.value = ESTADO_DO_CEU.estrelas; estrelasDoCeu.visible = ESTADO_DO_CEU.estrelas > 0.01;
        const opacidadeDoSol = suavizar(-0.12, 0.06, elevacaoDoSol);
        for (const planoDoSol of [raiosDoSol, discoDoSol]) { planoDoSol.material.opacity = opacidadeDoSol; planoDoSol.material.color.copy(ESTADO_DO_CEU.sol).lerp(corBrancaTemp, 0.35); planoDoSol.visible = opacidadeDoSol > 0.01; }
        uniformesDaLua.uOpacidade.value = suavizar(-0.04, 0.12, -elevacaoDoSol); luaDoCeu.visible = uniformesDaLua.uOpacidade.value > 0.01;
        uniformesDaLua.uLuz.value.set(0.9 * Math.sin(CICLO_DE_DIA_E_NOITE.dias * 0.8 + 0.6), 0.25, 1);    // a fase da lua muda aos poucos a cada dia
        for (const [material, base] of materiaisBasicosDoCenario) material.color.copy(base).multiply(ESTADO_DO_CEU.corBasica);   // fumaça, névoa, gotas etc. escurecem à noite
        // lanternas: acendem quando o sol se aproxima do horizonte e apagam depois do amanhecer
        const acesas = 1 - suavizar(-0.1, 0.14, elevacaoDoSol); ESTADO_DO_CEU.noite = acesas; CICLO_DE_DIA_E_NOITE.acesas = acesas;
        materialDaLanterna.color.copy(COR_APAGADA_DA_LANTERNA).lerp(COR_ACESA_DA_LANTERNA, acesas);
        materialDaChama.color.copy(COR_APAGADA_DA_CHAMA).lerp(COR_ACESA_DA_CHAMA, acesas);
        const reforcoDosBrilhos = MODO_LEVE.ativo ? MODO_LEVE.reforcoDosBrilhos : 1;   // Modo Leve compensa a falta das luzes reais
        materialDoBrilhoNoChao.opacity = Math.min(1, acesas * 0.6 * reforcoDosBrilhos); materialDoHalo.opacity = Math.min(1, acesas * 0.85 * reforcoDosBrilhos);
        materialDoBrilhoNoChao.visible = materialDoHalo.visible = acesas > 0.01;
      };
      const corBrancaTemp = new THREE.Color(0xffffff);
      // Soma "delta" horas ao relógio do jogo, dando a volta em 24h e contando os dias (usado na fase da lua).
      const avancarHora = function avancarHora(delta) {
        let novaHora = CICLO_DE_DIA_E_NOITE.hora + delta;
        while (novaHora >= 24) { novaHora -= 24; CICLO_DE_DIA_E_NOITE.dias++; }
        while (novaHora < 0) { novaHora += 24; CICLO_DE_DIA_E_NOITE.dias = Math.max(0, CICLO_DE_DIA_E_NOITE.dias - 1); }
        CICLO_DE_DIA_E_NOITE.hora = novaHora;
      };
      // Avança o relógio conforme o modo: automático corre; pausa e modos fixos (dia/noite) vão suavemente até a
      // hora fixa pelo caminho mais curto e param. Depois aplica o horário ao cenário.
      const atualizarCicloDiaNoite = function atualizarCicloDiaNoite(segundosDesdeUltimoFrame) {
        if (CICLO_DE_DIA_E_NOITE.modo === 'auto') avancarHora(segundosDesdeUltimoFrame * 24 / DURACAO_DO_CICLO_SEGUNDOS);
        else if (CICLO_DE_DIA_E_NOITE.modo === 'dia' || CICLO_DE_DIA_E_NOITE.modo === 'noite') {
          // vai suavemente até a hora fixa pelo caminho mais curto e fica parado nela (o automático não mexe mais no horário)
          const alvo = CICLO_DE_DIA_E_NOITE.modo === 'dia' ? HORA_DIA_FIXO : HORA_NOITE_FIXA, falta = ((alvo - CICLO_DE_DIA_E_NOITE.hora + 36) % 24) - 12;
          if (Math.abs(falta) < 0.004) CICLO_DE_DIA_E_NOITE.hora = alvo;
          else avancarHora(Math.sign(falta) * Math.min(Math.abs(falta), Math.min(VELOCIDADE_MAXIMA_DE_TRANSICAO, Math.max(0.8, Math.abs(falta) * 1.8)) * segundosDesdeUltimoFrame));
        }
        aplicarCicloAoCenario();
      };
      // Troca o modo do ciclo (auto, pausa, dia ou noite). Chamada pelos botões do painel "Tempo".
      const definirModoDoCiclo = function definirModoDoCiclo(modo) { if (modo in NOMES_DOS_MODOS) CICLO_DE_DIA_E_NOITE.modo = modo; };

      arquivoDaMontagemConcluido('17-ciclo-do-dia-e-da-noite.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
