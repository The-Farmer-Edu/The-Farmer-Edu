      // ====================================================================================================
      // FARMEDU 3D — 30a-monstros-noturnos.js (Fase 3B da refatoração: seção 30 — monstros noturnos e combate)
      // Script clássico carregado em sequência por fazenda.js (lista MONTAGEM_DA_FAZENDA); não é aberto sozinho. É um trecho do
      // antigo corpo de iniciarFarmEdu(), copiado sem alterações, exceto que cada função de nível superior foi escrita como
      // "const nome = function nome(...) {...};": as declarações deste arquivo ficam no escopo global compartilhado entre os
      // arquivos da fazenda, e const, let e class não criam propriedades em window (o recuo original foi mantido).
      // ====================================================================================================
      // ====================================================================================================
      // SEÇÃO 30 — MONSTROS NOTURNOS E COMBATE; INTEGRAÇÃO E PAINÉIS DA MARK 8.2
      // À noite (ciclo da seção 17), monstros surgem PERTO DA EQUIPE (a uma distância configurável de um guarda ou de outro
      // trabalhador, em células livres) e atacam SOMENTE trabalhadores: nunca construções, plantações ou animais. Este sistema é
      // independente da regra dos 5 dias reais de inatividade (seção 26), que continua valendo. Reaproveitam os modelos, a animação e o movimento dos mobs (seções 25 e 26) e a
      // grade de navegação deles. Decisões a cada 0,5 s, quantidade limitada (menor no Modo Leve) e sem criação por quadro.
      // Ao amanhecer, os sobreviventes voltam para a floresta e somem.
      // ====================================================================================================
      const monstrosNoturnos = [];
      let monstrosNestaNoite = 0, temporizadorDeSurgimento = 4, eraNoite = false;
      const ehNoiteParaMonstros = function ehNoiteParaMonstros() { const hora = CICLO_DE_DIA_E_NOITE.hora; return hora >= MONSTROS_NOTURNOS_CONFIG.horaDeInicio || hora < MONSTROS_NOTURNOS_CONFIG.horaDeFim; };
      const trabalhadoresAtacaveis = () => [...trabalhadoresNaCena.values()].filter(entidade => entidade.estado !== 'caido' && entidade.estado !== 'saindo' && !entidade.removido);
      // Mark 8.3 — quantidade de monstros proporcional à equipe disponível (regras em MONSTROS_NOTURNOS_CONFIG.quantidade).
      // Decisão: contam os trabalhadores VIVOS e EM CAMPO (fazendeiros e guardas). Mortos, caídos e quem ainda está saindo da
      // casa não contam; sem ninguém em campo não surge monstro (não há quem defender nem quem atacar).
      const limiteDeMonstrosSimultaneos = function limiteDeMonstrosSimultaneos() {
        const regra = MONSTROS_NOTURNOS_CONFIG.quantidade, disponiveis = trabalhadoresAtacaveis().length;
        if (!disponiveis) return 0;
        return Math.min(MODO_LEVE.ativo ? regra.teto.leve : regra.teto.normal, Math.max(regra.minimo, regra.porTrabalhadorDisponivel * disponiveis));
      };
      const limiteDeMonstrosPorNoite = () => limiteDeMonstrosSimultaneos() * MONSTROS_NOTURNOS_CONFIG.quantidade.multiplicadorPorNoite;
      const monstrosVivos = () => monstrosNoturnos.filter(monstro => !monstro.morto).length;
      const monstroMaisProximo = function monstroMaisProximo(posicaoX, posicaoZ, raio) {
        let melhor = null, menor = raio;
        for (const monstro of monstrosNoturnos) { if (monstro.morto || monstro.estado === 'fugindo') continue; const distancia = Math.hypot(monstro.x - posicaoX, monstro.z - posicaoZ); if (distancia < menor) { menor = distancia; melhor = monstro; } }
        return melhor;
      };
      const trabalhadorMaisProximo = function trabalhadorMaisProximo(posicaoX, posicaoZ, raio) {
        let melhor = null, menor = raio;
        for (const entidade of trabalhadoresAtacaveis()) { const distancia = Math.hypot(entidade.x - posicaoX, entidade.z - posicaoZ); if (distancia < menor) { menor = distancia; melhor = entidade; } }
        return melhor;
      };
      // Ponto de surgimento perto da equipe: anel de MONSTROS_NOTURNOS_CONFIG.distanciaDeSurgimento em volta de um guarda (ou de
      // outro trabalhador), numa célula livre da grade dos monstros (fora de construções, plantações, árvores e obstáculos) e
      // não colado em ninguém. Sem equipe em campo, usa as entradas da floresta.
      const pontoDeSurgimento = function pontoDeSurgimento(grade) {
        const equipe = trabalhadoresAtacaveis(), configuracao = MONSTROS_NOTURNOS_CONFIG;
        if (equipe.length) {
          const guardas = equipe.filter(entidade => entidade.dados.classe === 'guarda'), referencias = guardas.length ? guardas : equipe;
          for (let tentativa = 0; tentativa < 24; tentativa++) {
            const referencia = referencias[Math.floor(Math.random() * referencias.length)], angulo = Math.random() * Math.PI * 2, distancia = sortearReal(...configuracao.distanciaDeSurgimento);
            const posicaoX = referencia.x + Math.cos(angulo) * distancia, posicaoZ = referencia.z + Math.sin(angulo) * distancia;
            if (posicaoX < -25 || posicaoX > 55 || posicaoZ < -22.5 || posicaoZ > 53 || !grade.livre(posicaoX, posicaoZ)) continue;
            if (trabalhadorMaisProximo(posicaoX, posicaoZ, configuracao.distanciaMinimaDosTrabalhadoresAoSurgir)) continue;
            if (!grade.acharCaminho(posicaoX, posicaoZ, referencia.x, referencia.z)) continue;                  // precisa conseguir chegar à equipe
            return [posicaoX, posicaoZ];
          }
        }
        const entradas = INVASAO_EM_CURSO.entradas;
        for (let tentativa = 0; entradas && entradas.length && tentativa < 12; tentativa++) {
          const ponto = grade.centro(entradas[Math.floor(Math.random() * entradas.length)]);
          if (!trabalhadorMaisProximo(ponto[0], ponto[1], configuracao.distanciaMinimaDosTrabalhadoresAoSurgir)) return ponto;
        }
        return null;
      };
      const surgirMonstro = function surgirMonstro() {
        const grade = obterGradeDosMobs();
        for (let tentativa = 0; tentativa < 1; tentativa++) {
          const ponto = pontoDeSurgimento(grade); if (!ponto) return null;
          const [posicaoX, posicaoZ] = ponto;
          const tipos = Object.keys(MONSTROS_NOTURNOS_CONFIG.tipos), tipo = tipos[Math.floor(Math.random() * tipos.length)], atributos = MONSTROS_NOTURNOS_CONFIG.tipos[tipo];
          const modelo = criarMob(tipo); cena.add(modelo.raiz);
          const monstro = { modelo, tipo, x: posicaoX, z: posicaoZ, rot: Math.random() * 6.28, vel: 0, velAlvo: 0, velMax: atributos.velocidade, caminho: null, indice: 0, parado: 0, ux: posicaoX, uz: posicaoZ,
            passo: 0, fase: Math.random() * 6, vida: atributos.vida, vidaMaxima: atributos.vida, morto: false, tempoMorto: 0, decisao: 0, recarga: 0.6, alvo: null, estado: 'entrando', tempoFugindo: 0, barra: criarBarraDeVida(0xe74c3c) };
          animarMob(monstro, 0, 0, false);
          monstrosNoturnos.push(monstro); monstrosNestaNoite++;
          return monstro;
        }
        return null;
      };
      const removerMonstro = function removerMonstro(indice) { const monstro = monstrosNoturnos[indice]; removerMob(monstro); removerBarraDeVida(monstro.barra); monstro.removido = true; monstrosNoturnos.splice(indice, 1); };
      // Golpe de um trabalhador num monstro. Monstro derrotado deixa de agir imediatamente e dá um pouco de XP.
      const ferirMonstro = function ferirMonstro(monstro, dano, atacante) {
        if (monstro.morto) return;
        monstro.vida -= dano;
        if (monstro.vida > 0) return;
        monstro.vida = 0; monstro.morto = true; monstro.alvo = null; monstro.vel = monstro.velAlvo = 0; monstro.barra.grupo.visible = false;
        if (atacante) atacante.alvo = null;
        creditarXP(TRABALHADORES_CONFIG.xpPorMonstroDerrotado);
      };
      const decidirMonstro = function decidirMonstro(monstro, noite, grade) {
        if (!noite) {                                                              // amanheceu: volta para a floresta
          if (monstro.estado !== 'fugindo') {
            monstro.estado = 'fugindo'; monstro.alvo = null;
            const entradas = INVASAO_EM_CURSO.entradas, [destinoX, destinoZ] = grade.centro(entradas[Math.floor(Math.random() * entradas.length)]);
            monstro.caminho = grade.acharCaminho(monstro.x, monstro.z, destinoX, destinoZ) || [[destinoX, destinoZ]]; monstro.indice = 0;
          }
          return;
        }
        const alvo = trabalhadorMaisProximo(monstro.x, monstro.z, 70);
        if (alvo) {
          monstro.alvo = alvo; monstro.estado = 'perseguindo';
          const distancia = Math.hypot(alvo.x - monstro.x, alvo.z - monstro.z), destino = monstro.caminho && monstro.caminho[monstro.caminho.length - 1];
          if (distancia > MONSTROS_NOTURNOS_CONFIG.alcanceDoAtaque && (!monstro.caminho || monstro.indice >= monstro.caminho.length || !destino || Math.hypot(destino[0] - alvo.x, destino[1] - alvo.z) > 1.5)) {
            monstro.caminho = grade.acharCaminho(monstro.x, monstro.z, alvo.x, alvo.z) || [[alvo.x, alvo.z]]; monstro.indice = 0;
          }
          return;
        }
        monstro.alvo = null;                                                       // ninguém para atacar: vaga pela fazenda (sem tocar em construções)
        if (!monstro.caminho || monstro.indice >= monstro.caminho.length) {
          const celulas = grade.celulasPrincipais();
          for (let tentativa = 0; tentativa < 8; tentativa++) {
            const [destinoX, destinoZ] = grade.centro(celulas[Math.floor(Math.random() * celulas.length)]);
            if (destinoX < -24 || destinoX > 54 || destinoZ < -21 || destinoZ > 52) continue;
            const caminho = grade.acharCaminho(monstro.x, monstro.z, destinoX, destinoZ);
            if (caminho) { monstro.caminho = caminho; monstro.indice = 0; monstro.estado = 'vagando'; break; }
          }
        }
      };
      const atualizarMonstrosNoturnos = function atualizarMonstrosNoturnos(segundosDesdeUltimoFrame, tempo) {
        const noite = ehNoiteParaMonstros(), configuracao = MONSTROS_NOTURNOS_CONFIG;
        if (noite && !eraNoite) { monstrosNestaNoite = 0; temporizadorDeSurgimento = 4; }   // começou uma noite nova
        eraNoite = noite;
        if (noite) {
          temporizadorDeSurgimento -= segundosDesdeUltimoFrame;
          if (temporizadorDeSurgimento <= 0) {
            temporizadorDeSurgimento = configuracao.segundosEntreSurgimentos;
            if (monstrosVivos() < limiteDeMonstrosSimultaneos() && monstrosNestaNoite < limiteDeMonstrosPorNoite()) surgirMonstro();   // um por vez, nunca acima dos limites
          }
        }
        if (!monstrosNoturnos.length) return;
        const grade = obterGradeDosMobs();
        for (let indice = monstrosNoturnos.length - 1; indice >= 0; indice--) {
          const monstro = monstrosNoturnos[indice], atributos = configuracao.tipos[monstro.tipo];
          if (monstro.morto) {                                                      // cai e some
            monstro.tempoMorto += segundosDesdeUltimoFrame; monstro.modelo.corpo.rotation.x = -Math.min(1, monstro.tempoMorto * 2.5) * Math.PI / 2;
            if (monstro.tempoMorto > 1.4) removerMonstro(indice);
            continue;
          }
          monstro.decisao -= segundosDesdeUltimoFrame;
          if (monstro.decisao <= 0) { monstro.decisao = configuracao.segundosEntreDecisoes; decidirMonstro(monstro, noite, grade); }
          let atacando = false;
          const alvo = monstro.alvo;
          if (alvo && !alvo.removido && alvo.estado !== 'caido') {
            const distancia = Math.hypot(alvo.x - monstro.x, alvo.z - monstro.z);
            if (distancia <= configuracao.alcanceDoAtaque) {                         // só ataca quem está ao alcance
              atacando = true; monstro.velAlvo = 0; monstro.rot += normalizarAngulo(Math.atan2(alvo.x - monstro.x, alvo.z - monstro.z) - monstro.rot) * Math.min(1, segundosDesdeUltimoFrame * 8);
              monstro.recarga -= segundosDesdeUltimoFrame;
              if (monstro.recarga <= 0) { monstro.recarga = configuracao.segundosEntreAtaques; if (Math.random() < atributos.precisao) ferirTrabalhador(alvo, Math.round(sortearReal(...atributos.dano)), monstro); }
            } else andarMob(monstro, segundosDesdeUltimoFrame, grade);
          } else if (andarMob(monstro, segundosDesdeUltimoFrame, grade) && monstro.estado === 'fugindo') { removerMonstro(indice); continue; }
          if (monstro.estado === 'fugindo' && (monstro.tempoFugindo += segundosDesdeUltimoFrame) > 30) { removerMonstro(indice); continue; }
          passoDoMob(monstro, segundosDesdeUltimoFrame, grade);
          animarMob(monstro, segundosDesdeUltimoFrame, tempo, atacando);
          posicionarBarraDeVida(monstro.barra, monstro.x, 2.15, monstro.z, monstro.vida / monstro.vidaMaxima);
        }
      };

      arquivoDaMontagemConcluido('30a-monstros-noturnos.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
