// ====================================================================================================
// EDIÇÃO PESSOAL — CENA DO CELEIRO · dialogos/conversas.js
// Três conversas ORIGINAIS em português do Brasil entre Tony Stark (sarcástico, rápido, confiante) e Nick Fury (sério, direto,
// estratégico). Elas conversam com o mundo da Fazenda: o laboratório dentro do celeiro, a vaca na janela, as invasões "a cada
// dois dias úteis", o disco voador que leva as vacas e a pedra que canta na floresta.
//
// Cada fala: quem (tony | fury), texto, e opcionalmente:
//   antes   → poses base antes da fala ({ tony: 'trabalhando' | 'conversando' | 'confiante', fury: 'bracosCruzados' | 'conversando' | 'analisando' })
//   gesto   → gesto de quem fala (começa junto com o texto)
//   reacao  → gesto de quem ouve (começa no meio da fala: ele está ESCUTANDO)
//   evento  → acontecimento no cenário ('vaca')
//   pausa   → silêncio extra depois da fala (segundos)
// ====================================================================================================
(() => {
  const cenaDoCeleiro = window.CenaDoCeleiro;
  cenaDoCeleiro.conversas = [
    { nome: 'O celeiro', falas: [
      { quem: 'fury', antes: { tony: 'trabalhando', fury: 'bracosCruzados' }, texto: 'Stark. Um laboratório secreto... dentro de um celeiro?' },
      { quem: 'tony', texto: 'Ninguém procura tecnologia de ponta atrás de um fardo de feno.', reacao: 'negar' },
      { quem: 'fury', texto: 'Tem uma vaca olhando pela janela.', gesto: 'olharMonitores', evento: 'vaca' },
      { quem: 'tony', antes: { tony: 'conversando' }, texto: 'Ela é da segurança. Paguei em milho.', gesto: 'darDeOmbros', reacao: 'suspirar', pausa: 0.6 },
      { quem: 'fury', antes: { fury: 'conversando' }, texto: 'As criaturas da floresta atacaram de novo. Zumbis, esqueletos, vampiros.', gesto: 'enfatizar', reacao: 'assentir' },
      { quem: 'tony', texto: 'A cada dois dias úteis, eu sei. Até os monstros respeitam o fim de semana.', gesto: 'explicar', reacao: 'encarar' },
      { quem: 'fury', texto: 'E a sua defesa é um guarda com uma enxada.', gesto: 'apontar', reacao: 'recuar' },
      { quem: 'tony', antes: { tony: 'confiante' }, texto: 'Uma enxada com upgrade. Dano, precisão e vida no nível máximo.', gesto: 'mostrarAtras', reacao: 'negar' },
      { quem: 'fury', texto: 'Eu não preciso de piadas, Stark. Preciso de um plano.', gesto: 'inclinarSe', reacao: 'impaciente' },
      { quem: 'tony', antes: { tony: 'conversando' }, texto: 'Plano A: o guarda. Plano B: eu. Plano C: o celeiro vira um robô gigante.', gesto: 'explicar', reacao: 'encarar', pausa: 0.9 },
      { quem: 'tony', texto: 'Ainda estou trabalhando no plano C.', gesto: 'acenar', reacao: 'suspirar' },
      { quem: 'fury', texto: 'Uma noite, Stark. Se a fazenda cair, a conta é sua.', gesto: 'apontar', reacao: 'assentir' },
      { quem: 'tony', antes: { tony: 'trabalhando' }, texto: 'Relaxa, Nick. Já salvei o mundo. Dou conta de umas abóboras.', reacao: 'negar' },
      { quem: 'fury', antes: { fury: 'bracosCruzados' }, texto: 'Abóboras.', pausa: 1.5 },
    ] },
    { nome: 'O trator', falas: [
      { quem: 'fury', antes: { tony: 'trabalhando', fury: 'analisando' }, texto: 'Esse gráfico subindo é bom ou ruim?' },
      { quem: 'tony', texto: 'Pra mim, ótimo. Pra quem estiver na frente do repulsor, nem tanto.', reacao: 'negar' },
      { quem: 'fury', antes: { fury: 'conversando' }, texto: 'Você dormiu esta semana?', gesto: 'encarar', reacao: 'olharEquipamento' },
      { quem: 'tony', antes: { tony: 'conversando' }, texto: 'Dormir é pra quem não tem um reator no peito e três projetos atrasados.', gesto: 'explicar', reacao: 'encarar' },
      { quem: 'fury', texto: 'O conselho quer saber o que você está construindo aqui.', gesto: 'enfatizar', reacao: 'ajustarManopla' },
      { quem: 'tony', antes: { tony: 'confiante' }, texto: 'Um trator. Voa. Atira. Ara a terra em quatro minutos.', gesto: 'mostrarAtras', reacao: 'suspirar' },
      { quem: 'fury', texto: 'Isso não é um trator, Stark.', gesto: 'apontar', reacao: 'recuar' },
      { quem: 'tony', antes: { tony: 'conversando' }, texto: 'Com essa atitude, não mesmo.', gesto: 'darDeOmbros', reacao: 'negar', pausa: 0.6 },
      { quem: 'fury', antes: { fury: 'bracosCruzados' }, texto: 'Relatório na minha mesa até sexta.', reacao: 'impaciente' },
      { quem: 'tony', antes: { tony: 'trabalhando' }, texto: 'Sexta é fim de semana pros monstros. Pra mim também.', gesto: 'acenar', reacao: 'suspirar', pausa: 1.2 },
    ] },
    { nome: 'O disco voador', falas: [
      { quem: 'fury', antes: { tony: 'trabalhando', fury: 'bracosCruzados' }, texto: 'Recebi um relatório estranho. Um disco voador. Levando vacas.' },
      { quem: 'tony', antes: { tony: 'conversando' }, texto: 'Ah, o Gerson. Ele devolve. Às vezes até mais limpinha.', gesto: 'explicar', reacao: 'encarar' },
      { quem: 'fury', antes: { fury: 'conversando' }, texto: 'Você chama o alienígena pelo nome?', gesto: 'inclinarSe', reacao: 'recuar' },
      { quem: 'tony', texto: 'Ele aparece quando alguém clica demais nas vacas. Educado. Péssimo pra estacionar.', gesto: 'darDeOmbros', reacao: 'negar' },
      { quem: 'fury', texto: 'Stark, isso é uma ameaça de nível planetário.', gesto: 'enfatizar', reacao: 'impaciente' },
      { quem: 'tony', antes: { tony: 'confiante' }, texto: 'Nível planetário é a pedra da floresta que canta quando você clica. Essa me tira o sono.', gesto: 'mostrarAtras', reacao: 'olharMonitores', pausa: 0.8 },
      { quem: 'fury', texto: '... Uma pedra que canta.', gesto: 'suspirar', pausa: 0.6 },
      { quem: 'tony', antes: { tony: 'conversando' }, texto: 'Fica pra próxima reunião. Traz pipoca.', gesto: 'acenar', reacao: 'negar' },
      { quem: 'fury', antes: { fury: 'bracosCruzados' }, texto: 'Não vai ter próxima reunião, Stark.', reacao: 'olharEquipamento' },
      { quem: 'tony', antes: { tony: 'trabalhando' }, texto: 'Sempre tem. Você sempre volta.', reacao: 'assentir', pausa: 1.2 },
    ] },
  ];
})();
