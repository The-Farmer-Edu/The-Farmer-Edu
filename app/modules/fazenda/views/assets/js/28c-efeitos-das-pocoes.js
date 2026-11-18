// ====================================================================================================
// FARMEDU 3D — 28c-efeitos-das-pocoes.js
// SEÇÃO 28c — EFEITOS DAS POÇÕES DE ALQUIMIA (etapa da alquimia)
// Script clássico carregado em sequência por fazenda.js, logo depois do Guardião (seção 28b). As funções daqui são chamadas
// só durante o jogo (laço principal e ações do jogador), nunca durante a montagem, então os módulos anteriores (27) também
// podem usá-las.
//  • Efeitos COM DURAÇÃO (POCOES_DO_GUARDIAO[tipo].minutos) ficam em estado.efeitosDasPocoes[tipo] = { inicio, fim, aplicadoAte },
//    em ms do relógio do jogo (agoraNoJogo). São salvos: recarregar a página não cancela nem prolonga o efeito.
//  • NÃO ACUMULA: o mesmo efeito não pode ser usado de novo enquanto está ativo (nem renovado). Efeitos diferentes valem juntos.
//  • Efeitos INSTANTÂNEOS (vitalidade, seiva) mudam o estado uma vez e não deixam registro.
//  • Nenhum efeito concede XP. O que eles aceleram continua preso às regras de sempre: cotas diárias das atividades, limite
//    diário de madeira, máximo de itens guardados por animal e estágios das plantas.
// Ganchos usados pelos outros módulos (todos devolvem o valor "normal" quando o efeito não está ativo):
//   multiplicadorDaColheitaDosTrabalhadores / multiplicadorDaCaminhadaDosTrabalhadores (29) · multiplicadorDoDanoDaEquipe e
//   multiplicadorDoDanoRecebidoPelaEquipe (29) · monstrosNoturnosAfastados (30a) · consumoDoCochoNoIntervalo (27) ·
//   aplicarCrescimentoAcelerado (chamada por atualizarEfeitosDasPocoes, no laço 30b).
// ====================================================================================================

      const efeitoDaPocao = tipo => estado.efeitosDasPocoes[tipo] || null;
      const efeitoAtivo = tipo => { const efeito = efeitoDaPocao(tipo); return !!efeito && agoraNoJogo() < efeito.fim; };
      const msRestantesDoEfeito = tipo => { const efeito = efeitoDaPocao(tipo); return efeito ? Math.max(0, efeito.fim - agoraNoJogo()) : 0; };
      // "1:05" (minutos:segundos) abaixo de 1 hora; "5h59" (horas e minutos) a partir de 1 hora (a Ração Encantada dura 6 h).
      const formatarTempoDoEfeito = milissegundos => {
        const segundos = Math.max(0, Math.ceil(milissegundos / 1000));
        if (segundos >= 3600) return Math.floor(segundos / 3600) + 'h' + String(Math.floor(segundos % 3600 / 60)).padStart(2, '0');
        return Math.floor(segundos / 60) + ':' + String(segundos % 60).padStart(2, '0');
      };
      // Fração (0 a 1) do intervalo [inicio, fim] em que o efeito esteve ativo. Usada pela alimentação, que pode aplicar várias horas
      // de uma vez (página fechada): só a parte do intervalo coberta pelo efeito recebe o bônus.
      const fracaoDoIntervaloComEfeito = function fracaoDoIntervaloComEfeito(tipo, inicio, fim) {
        const efeito = efeitoDaPocao(tipo);
        if (!efeito || !(fim > inicio)) return 0;
        const sobreposicao = Math.min(fim, efeito.fim) - Math.max(inicio, efeito.inicio);
        return sobreposicao > 0 ? Math.min(1, sobreposicao / (fim - inicio)) : 0;
      };

      // ---- Ganchos (valores lidos pelos outros sistemas) ----
      const multiplicadorDaColheitaDosTrabalhadores = () => efeitoAtivo('aceleracao') ? POCOES_DO_GUARDIAO.aceleracao.colheita : 1;
      const multiplicadorDaCaminhadaDosTrabalhadores = () => efeitoAtivo('aceleracao') ? POCOES_DO_GUARDIAO.aceleracao.caminhada : 1;
      const multiplicadorDoDanoDaEquipe = () => efeitoAtivo('bravura') ? POCOES_DO_GUARDIAO.bravura.dano : 1;
      const multiplicadorDoDanoRecebidoPelaEquipe = () => efeitoAtivo('bravura') ? POCOES_DO_GUARDIAO.bravura.danoRecebido : 1;
      const monstrosNoturnosAfastados = () => efeitoAtivo('serenidade');
      // Consumo do cocho entre "inicio" e "fim" (ms): 1 = normal; com a Ração Encantada a parte coberta pelo efeito gasta metade.
      const consumoDoCochoNoIntervalo = (inicio, fim) => 1 - (1 - POCOES_DO_GUARDIAO.racao.consumoDoCocho) * fracaoDoIntervaloComEfeito('racao', inicio, fim);

      // ---- Crescimento acelerado ----
      // As plantações calculam o progresso por (agora − plantadoEm) / duração. Enquanto o efeito vale, cada canteiro que ainda está
      // crescendo tem o plantadoEm recuado em (fator − 1) × o tempo que passou: a planta cresce "fator" vezes mais rápido, passando
      // pelos mesmos estágios e sem colher nada sozinha. aplicadoAte guarda até onde o efeito já foi aplicado (vale também para o
      // tempo com a página fechada, sem aplicar duas vezes). Canteiros já prontos não mudam.
      const aplicarCrescimentoAcelerado = function aplicarCrescimentoAcelerado() {
        const efeito = efeitoDaPocao('crescimento');
        if (!efeito || efeito.aplicadoAte >= efeito.fim) return;
        const ate = Math.min(agoraNoJogo(), efeito.fim), passou = ate - efeito.aplicadoAte;
        if (passou <= 0) return;
        const recuo = passou * (POCOES_DO_GUARDIAO.crescimento.crescimento - 1);
        for (const idDaArea of PLANTACOES_COM_CANTEIROS) {
          const canteiros = canteirosDaArea(idDaArea);
          for (let indice = 0; indice < quantidadeDeCanteiros(idDaArea); indice++) {
            const canteiro = canteiros[indice];
            if (canteiro.cultura && estagioDoCanteiro(canteiro) < 3) canteiro.plantadoEm -= recuo;
          }
        }
        efeito.aplicadoAte = ate; marcarParaSalvar();
      };

      // ---- Validação e aplicação (chamadas pela transação usarPocao, seção 28b) ----
      const temTrabalhadorEmCampo = () => estado.trabalhadores.some(dados => dados.estado === 'ativo' && !dados.emCasa);
      const trabalhadoresFeridos = () => estado.trabalhadores.filter(dados => dados.estado === 'ativo' && dados.vida < atributosDoTrabalhador(dados).vidaMaxima);
      const canteirosCrescendo = () => PLANTACOES_COM_CANTEIROS.reduce((soma, idDaArea) => soma + canteirosDaArea(idDaArea).slice(0, quantidadeDeCanteiros(idDaArea)).filter(canteiro => canteiro.cultura && estagioDoCanteiro(canteiro) < 3).length, 0);
      // Motivo que impede usar uma poção de EFEITO agora ('' = pode). Nunca depende do Limite da alquimia.
      const motivoParaNaoUsarEfeito = function motivoParaNaoUsarEfeito(tipo) {
        const pocao = POCOES_DO_GUARDIAO[tipo];
        if (pocao.minutos && efeitoAtivo(tipo)) return pocao.nome + ' já está fazendo efeito (faltam ' + formatarTempoDoEfeito(msRestantesDoEfeito(tipo)) + '). O mesmo efeito não acumula: espere terminar.';
        if (tipo === 'vitalidade' && !trabalhadoresFeridos().length) return 'Ninguém da equipe está ferido agora. Guarde o tônico para depois.';
        if (tipo === 'seiva' && !arvoresDoAcampamentoRebrotando()) return 'Todas as árvores do acampamento já estão de pé.';
        if (tipo === 'racao' && !Object.keys(ANIMAIS_DAS_AREAS).some(idDaArea => estado.niveis[idDaArea] > 0)) return 'Construa uma instalação de animais antes de usar esta poção.';
        if ((tipo === 'aceleracao' || tipo === 'bravura') && !temTrabalhadorEmCampo()) return 'Não há trabalhadores em campo para receber o efeito.';
        if (tipo === 'crescimento' && !canteirosCrescendo()) return 'Nenhum canteiro está crescendo agora. Plante antes de usar.';
        return '';
      };
      // Aplica o efeito no ESTADO (ainda sem salvar) e devolve o que fazer na cena depois que o salvamento der certo (ou null).
      // A transação (seção 28b) guarda o estado antes e o restaura se o salvamento falhar.
      const aplicarEfeitoDaPocao = function aplicarEfeitoDaPocao(tipo) {
        const pocao = POCOES_DO_GUARDIAO[tipo], agora = agoraNoJogo();
        if (pocao.minutos) { estado.efeitosDasPocoes[tipo] = { inicio: agora, fim: agora + pocao.minutos * 60000, aplicadoAte: agora }; return null; }
        if (tipo === 'vitalidade') { for (const dados of trabalhadoresFeridos()) dados.vida = atributosDoTrabalhador(dados).vidaMaxima; return null; }
        if (tipo === 'seiva') { const ids = liberarRebrotaNoEstado(); return () => rebrotarArvoresDoAcampamento(ids); }
        return null;
      };

      // ---- Indicador na tela e fim dos efeitos (chamado pelo laço, seção 30b) ----
      const indicadorDosEfeitos = selecionar('#efeitos-das-pocoes');
      let textoDoIndicadorDosEfeitos = null;
      const efeitosAtivosAgora = () => Object.keys(estado.efeitosDasPocoes).filter(efeitoAtivo);
      const atualizarEfeitosDasPocoes = function atualizarEfeitosDasPocoes() {
        aplicarCrescimentoAcelerado();
        for (const tipo of Object.keys(estado.efeitosDasPocoes)) {
          if (efeitoAtivo(tipo)) continue;
          if (tipo === 'crescimento') aplicarCrescimentoAcelerado();   // aplica até o último instante antes de encerrar
          delete estado.efeitosDasPocoes[tipo]; salvarProgresso();
          mostrarAviso(POCOES_DO_GUARDIAO[tipo].icone + ' O efeito de ' + POCOES_DO_GUARDIAO[tipo].nome + ' terminou.');
        }
        const html = efeitosAtivosAgora().map(tipo => {
          const pocao = POCOES_DO_GUARDIAO[tipo];
          return `<span class="efeito-ativo" style="--cor-da-pocao:${pocao.cor}" title="${pocao.nome}: ${pocao.efeito}">${pocao.icone} ${formatarTempoDoEfeito(msRestantesDoEfeito(tipo))}</span>`;
        }).join('');
        if (html !== textoDoIndicadorDosEfeitos) { textoDoIndicadorDosEfeitos = html; indicadorDosEfeitos.innerHTML = html; indicadorDosEfeitos.hidden = !html; }
      };

      arquivoDaMontagemConcluido('28c-efeitos-das-pocoes.js');   // avisa o carregador (fazenda.js) que este arquivo rodou até o fim
