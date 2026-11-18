# Economia, XP e progressão da Fazenda

> Documento técnico e resposta à issue **"Implementar o ganho real de XP"**.
> Versão da **Etapa 1.1** (auditoria econômica). Todos os valores abaixo são os **valores atuais do código** (pasta `app/modules/fazenda/views/assets/js`). Quando um número é estimativa de simulação, isso está indicado, com as hipóteses.
>
> Histórico: criado na etapa de rebalanceamento da economia; atualizado na etapa da alquimia (mina sem XP, 9 poções, madeira) e na Etapa 1.1 (auditoria). O arquivo tinha sumido do repositório e foi **restaurado a partir do histórico de edição** e atualizado; o texto anterior está guardado no backup da Etapa 1.1.

---

## Resposta à issue

**Problema relatado:** "possuímos um sistema de ganho de XP somente com intuitos de teste e não algo real".

**O que a auditoria encontrou:**
- As atividades da Fazenda já creditavam XP de verdade (`creditarXP`). O problema era econômico: uma cota única de 100 XP/dia era consumida quase toda pelas colheitas, e mina, monstros, equipe e evoluções não rendiam nada na prática.
- Animais, celeiro, moinho, maquinário e ponte não tinham efeito no jogo.
- O ponto de entrada das **atividades escolares**, `window.adicionarXP`, **continua sem chamador**. O XP escolar nasce da nota no servidor (`notas` → `xp_logs`) e depende do back-end.

**O que existe hoje (somente front-end):**
1. **XP por atividade, com cota diária própria:** Lavoura, Criação, Defesa e o Limite da alquimia. Cada cota cresce com as construções e a equipe.
2. **Produção dos animais:** cada animal alimentado produz itens, que o aluno coleta para ganhar XP.
3. **Funções reais** para todas as construções (seção 6).
4. **Mina → minérios → poções:** a mina só traz minérios. A **Poção de Experiência (+20 XP)** é a única poção que dá XP; as outras 8 dão efeitos temporários.
5. **`window.adicionarXP(quantidade, { id })` sem duplicação**, pronto para a integração.

Tudo usa um único saldo (`estado.xp`), uma única função de crédito (`creditarXP`) e os contadores `estado.xpPorOrigem`.

---

## 1. Objetivo do sistema de progressão

- Duas moedas: **XP** (atividades) e **madeira** (lenhador). **Minérios** são a matéria-prima das poções.
- Nenhuma atividade consome sozinha todo o XP do dia.
- Evoluir é recompensador: aumenta a cota da atividade ligada à construção.
- A madeira é exigida em toda construção, mas **não trava** a progressão de quem joga com frequência; o ritmo é dado pelo XP (seção 15).
- O XP das atividades escolares não tem limite diário e, quando integrado, acelera tudo.

## 2–4. Fontes de XP, valores, frequência e limites

| Fonte | XP | Quando | Requisitos | Cota | Função |
|---|---:|---|---|---|---|
| Colheita de trigo / milho / cenoura / abóbora | 1 / 2 / 2 / 3 por canteiro | ao colher (jogador ou trabalhador) | plantação | Lavoura | `colherCanteiro` |
| **Viagem da mina** | **0** | — | — | — | `concluirCicloDaMina` só credita minérios |
| **Poção de Experiência** | **+20** | ao usar | mina nv 1; 8 minérios | **Limite da alquimia** | `usarPocao` → `usarPocaoDeExperiencia` |
| Outras 8 poções | **0** | — | — | **nenhuma** | `usarPocaoDeEfeito` |
| Produção dos animais | 1 por item coletado | ao coletar (painel 🌾) | animais alimentados | Criação | `coletarProducao` |
| Monstro derrotado (noturno ou de invasão) | 5 | quando morre | trabalhador em campo | Defesa | `ferirMonstro` |
| Atividades escolares | definido pelo instrutor | quando o back-end chamar | integração | **sem limite** | `window.adicionarXP` (sem chamador) |
| Devolução da dispensa | 40% do investido (mín. 10) | ao dispensar | XP investido | sem limite | `dispensarTrabalhador` |
| Teste | 5000 | modo desenvolvedor | — | sem limite | só teste |

Não existe "nível do jogador": o XP é uma moeda gasta em construções, equipe e reparos.

### Cotas diárias por atividade (`COTAS_DIARIAS_DE_XP`, seção 01)

| Atividade | Fórmula | Início → máximo |
|---|---|---|
| 🌾 Lavoura | 12 + 6 × (nível da Grande + nível da Nova plantação) + bônus dos fazendeiros | 21 → 64 |
| ⚗️ Limite da alquimia (id interno `mina`) | 20 com a mina construída (0 sem mina), em qualquer nível | 0 → 20 |
| 🐄 Criação | 2 × soma dos níveis das 5 instalações de animais | 0 → 30 |
| 🛡️ Defesa | 5 + bônus dos guardas | 5 → 21 |

- **Bônus da equipe:** cada trabalhador vivo e em campo soma `3 + ⌊níveis de melhoria ÷ 5⌋` (máx. 8) na cota da especialidade (fazendeiro → Lavoura; guarda → Defesa).
- **Total do dia:** 26 XP no começo; **135 XP** com tudo no máximo.
- **Reserva:** a parte não usada fica guardada por **1 dia** por atividade (`RESERVA_DE_COTA_EM_DIAS`).
- **Limite da alquimia:** é exatamente uma Poção de Experiência por dia (duas depois de um dia sem jogar, pela reserva). A poção só é usada se o limite comportar os 20 XP inteiros; senão, continua guardada. **A mina e as poções de efeito não mexem nesse limite.**
- Passado o limite, nada é perdido: colheitas viram estoque, minérios e poções ficam guardados, itens dos animais ficam na instalação (até 4 por animal).

## 5–10. Todos os gastos

### Tabela A — Construções (XP / madeira)

| Estrutura | Construção (0→1) | 1→2 | 2→3 | Total de XP | Total de madeira |
|---|---:|---:|---:|---:|---:|
| Curral, Ovelhal, Galinheiro, Chiqueiro, Estábulo (cada) | 120 / 30 | 250 / 80 | 550 / 150 | 920 | 260 |
| Casa (base → nv 1) | 150 / 35 | 250 / 80 | 550 / 150 | 950 | 265 |
| Celeiro | 150 / 50 | 250 / 80 | 550 / 150 | 950 | 280 |
| Maquinário | 180 / 55 | 250 / 80 | 550 / 150 | 980 | 285 |
| Moinho de pedra | 200 / 60 | 250 / 80 | 550 / 150 | 1.000 | 290 |
| Ponte (quebrada → nv 1) | 100 / 20 | 250 / 80 | 550 / 150 | 900 | 250 |
| Mina | 250 / 60 | 250 / 80 | 550 / 150 | 1.050 | 290 |
| Grande plantação / Nova plantação (cada) | 150 / 35 * | 250 / 80 | 550 / 150 | 950 (800 *) | 265 (230 *) |
| **Total das 13** | | | | **12.180** | **3.455** |

\* A **primeira** plantação construída é grátis (0 XP e 0 madeira); o total já desconta.
Fórmulas: construções 1.930 − 150 = 1.780 XP; evoluções 13 × 800 = 10.400 XP. Madeira: 500 − 35 + 13 × 230 = 3.455.

### Tabela B — Equipe (XP)

Vagas da casa: 1 / 2 / 3 / 4 (base / nv 1 / nv 2 / nv 3). O Juca (fazendeiro inicial) é grátis.

| Trabalhador | Contratação | Melhorias (5 atributos × 25 · 40 · 60 · 85 · 115) | Total |
|---|---:|---:|---:|
| Juca | 0 | 1.625 | 1.625 |
| Fazendeiro | 250 | 1.625 | 1.875 |
| Guarda | 350 | 1.625 | 1.975 |

Composição de referência (Juca + 1 fazendeiro + 2 guardas): 950 + 6.500 = **7.450 XP**.

### Tabela C — Outros gastos

| Item | Custo | Observações |
|---|---|---|
| Repor animal morto | 60 XP | só sem alimentar |
| Recuperar fazendeiro / guarda | 125 / 175 XP | após cair em combate |
| Reparar instalação (nv 1/2/3) | 100 / 250 / 450 XP | calendário de invasões **pausado** |
| Alimentar animais | colheitas | trigo 12, milho 15, cenoura 15, abóbora 30 de comida (moinho: +25%/nível em trigo e milho) |
| Poções | minérios | tabela da seção 11 |

### Tabela D — Custo total da fazenda

| Item | XP | Madeira |
|---|---:|---:|
| 13 construções no nível 3 | 12.180 | 3.455 |
| Equipe completa com todas as melhorias | 7.450 | 0 |
| **Total** | **19.630** | **3.455** |

## 11. Recursos e poções

| Recurso | Como é obtido | Limite |
|---|---|---|
| 🪵 Madeira | Lenhador: **8 / 8 / 9 / 10 por árvore** (ponte 0/1/2/3), **10 árvores**, rebrota individual em 20 min | **80 / 96 / 112 / 128 por dia** (ponte 0/1/2/3) **+ reserva de 1 dia** |
| 🪨 Minérios | 3 / 5 / 8 por viagem (mina nv 1/2/3), 40 min minerando | sem limite de estoque |
| Colheitas | 4 / 3 / 3 / 2 por canteiro (+1 por nível do maquinário) | 12 / 20 / 24 canteiros por plantação |
| Produção dos animais | 1 item por animal a cada 6 h com comida | até 4 por animal; o tempo fechado conta até 8 h |

**Reserva de madeira:** na virada do dia, o que sobrou do limite do último dia jogado (e o limite inteiro dos dias sem jogar) fica guardado, até 1 limite. Exemplo na ponte 0: coletou 10 ontem → hoje pode 20 + 10 = 30; ficou 3 dias sem jogar → 20 + 20 = 40.

### As nove poções (`POCOES_DO_GUARDIAO`)

| Poção | Faixa (mina) | Minérios | Efeito | Duração | Restrições |
|---|---|---:|---|---|---|
| ⭐ Poção de Experiência | Comum (1) | 8 | **+20 XP** (a única que dá XP) | instantânea | só se o Limite comportar os 20 |
| ❤️ Tônico da Vitalidade | Comum (1) | 4 | cura a equipe viva | instantânea | precisa de alguém ferido; não revive |
| 🌾 Ração Encantada | Comum (1) | 5 | cocho gasta metade | **6 h** | precisa de instalação de animais |
| 🌲 Seiva da Floresta | Avançada (2) | 10 | árvores do lenhador rebrotam na hora | instantânea | precisa de árvore rebrotando; o limite de madeira continua |
| ❔ Poção Misteriosa (Etapa 2; substitui o Elixir da Fertilidade) | — (mina nv 1) | **60** | cena do céu: um unicórnio atravessa o céu soltando um arco-íris; sem XP | instantânea | **uso único** por jogador; na interface tudo é "???" menos o custo |
| 🛡️ Poção da Bravura | Avançada (2) | 10 | equipe causa 2× o dano e recebe ½ (também nas invasões) | 10 min | trabalhador em campo |
| ⚡ Aceleração dos Trabalhadores | Especial (3) | **16** | colheita 8× e caminhada 2× | exatamente 2 min | trabalhador em campo |
| 🌱 Crescimento Acelerado | Especial (3) | **20** | plantas crescem 6× | 5 min | canteiro crescendo; mesmos estágios |
| 🌙 Noite Serena | Especial (3) | 26 | nenhum monstro noturno novo | 10 min | não afeta invasões nem monstros já presentes |

Regras comuns:
- O **mesmo efeito não acumula nem renova** enquanto está ativo; efeitos diferentes valem juntos.
- Os efeitos usam o relógio do jogo, ficam salvos e continuam valendo com a página fechada.
- **Nenhum efeito dá XP nem passa das cotas**; o que eles aceleram continua preso às cotas, ao limite de madeira e ao máximo de itens.
- Preparar e usar são transações com trava contra clique duplo; qualquer falha desfaz tudo.

**Por que esses preços.** A Poção de Experiência usa no máximo 8 minérios por dia (o Limite é uma poção). O resto é a **sobra de minério**, e é ela que paga as poções de efeito. Com 2 viagens por dia (hipótese do perfil regular), sobram cerca de 2 minérios/dia na mina nível 2 e 8 na nível 3: uma comum custa cerca de 1 dia de sobra, uma avançada de 1,5 a 6 dias, uma especial de 2 a 3 dias.

**Poções antigas:** Tônico do Minerador, Elixir da Colheita e Essência do Guardião saíram do catálogo. Ao carregar um save antigo, elas viram de volta os minérios gastos (3 / 6 / 10 cada), uma única vez, com aviso ao jogador.

## 6. Funções das construções

| Construção | Função | Nível 1 / 2 / 3 |
|---|---|---|
| Plantações | canteiros + cota de Lavoura | 12 / 20 / 24 canteiros; +6 na cota por nível |
| Mina | minérios (sem XP) e receitas por faixa | 3 / 5 / 8 minérios; libera Comuns / + Avançadas / + Especiais |
| Casa | vagas da equipe | 2 / 3 / 4 (base 1) |
| Instalações de animais | produção + cota de Criação | +2 na cota por nível; mais animais |
| Celeiro | cocho dura mais | 7,5 / 9 / 10,5 h (base 6 h) |
| Moinho | trigo e milho rendem mais comida | +25% / +50% / +75% |
| Maquinário | colheita maior (sem XP extra) | +1 / +2 / +3 unidades por canteiro |
| Ponte | mais madeira por dia e por árvore | 96 / 112 / 128 por dia (base 80); 8 / 9 / 10 por árvore (base 8) |

## 15–16. Simulação da progressão (Etapa 1.1)

**Método:** simulador dia a dia que roda **dentro do jogo** e lê os valores das constantes do código (custos, cotas, canteiros, animais, celeiro, mina, poção, lenhador). Ele compra na ordem real dos desbloqueios, junta recursos para o próximo item e registra qual recurso travou cada visita.

**Hipóteses por perfil** (são estimativas; mudar a hipótese muda os dias):

| Hipótese | Casual | Regular | Eficiente |
|---|---|---|---|
| Visitas | 3 por semana | 1 por dia | 2 sessões por dia |
| Colheitas por visita | 1 (abóbora, 3 XP) | 2 | 3 |
| Viagens da mina por dia | 1 por visita | 2 | 4 |
| Madeira | 1 rodada (10 árvores = 80 madeiras) por visita | até o limite | até o limite |
| Criação | produção real: animais × mín(horas de cocho, 8) ÷ 6 por sessão, até 4 por animal, cocho enchido a cada sessão | idem | idem (2 sessões) |
| Defesa | 50% da cota | 100% (há uma noite a cada 10 min de jogo) | 100% |
| Reserva de 1 dia (XP e madeira) | sim | sim | sim |
| Poções de efeito | não entram no XP (não dão XP) | idem | idem |

**Resultados (dias desde o início):**

| Marco | Casual | Regular | Eficiente |
|---|---:|---:|---:|
| 2ª plantação | 9 | 5 | 5 |
| Mina | 21 | 13 | 13 |
| Todas as 13 construídas | 74 | 45 | 41 |
| Todas no nível 2 | 154 | 92 | 85 |
| Equipe completa (4) | 200 | 120 | 112 |
| Todas no nível 3 | 275 | 167 | 156 |
| **Fazenda completa** (equipe com todas as melhorias) | **361** (~12 meses) | **222** (~7,3 meses) | **208** (~6,8 meses) |

**O que limita cada perfil:**

| Perfil | Visitas travadas por XP / madeira | Maior espera entre compras | Madeira: ganha · estoque máximo · sobra ao terminar o nível 3 | Minérios: ganhos · viraram XP · sobra | XP por fonte (lavoura · alquimia · criação · defesa) |
|---|---|---|---|---|---|
| Casual | 155 / 0 | 12 dias (a mina, 250 XP) | 5.484 · 2.029 · 549 | 894 · 888 · 6 | 14.521 · 2.220 · 2.244 · 648 |
| Regular | 222 / 0 | 8 dias (a mina) | 5.908 · 2.453 · 693 | 2.580 · 1.584 · 996 | 10.487 · 3.960 · 3.248 · 2.028 |
| Eficiente | 208 / 0 | 8 dias (a mina) | 5.548 · 2.093 · 429 | 4.848 · 1.560 · 3.288 | 9.855 · 3.900 · 4.012 · 1.907 |

**Leitura:**
- **O XP é o único recurso que trava** a progressão nos três perfis. A madeira é exigida, mas chega a tempo.
- A maior espera é a **mina** (250 XP + 60 madeiras) no começo: 8 a 12 dias, quando a cota diária ainda é de ~26 XP. Depois as esperas ficam em poucos dias; cada evolução 2→3 (550 XP) leva ~5 dias para o regular.
- **Excesso que resta:** minérios para o eficiente (~3.300 de sobra). Eles só servem para poções de efeito (as 8 juntas custam 103), então ficam sobrando para quem joga muito.
- O eficiente é só ~6% mais rápido que o regular: as cotas limitam o XP por dia, e o regular já as enche quase todas. É intencional (não premiar repetição exaustiva).

**Comparação com as simulações anteriores:** o relatório da etapa da alquimia dava 258 dias para o regular. A diferença vem das **hipóteses**, não dos valores: a versão anterior supunha uma colheita, uma viagem e uma rodada de madeira por dia, além de 60% da cota de Criação. A Etapa 1.1 usa o modelo real de produção e o regular "que aproveita os limites". Com as mesmas hipóteses novas, os valores de antes da Etapa 1.1 dão os mesmos dias, mas com 4.841 madeiras sobrando, contra 693 agora.

## Auditoria da madeira (Etapa 1.1)

> **Substituída pela "Correção do lenhador" (fim deste documento):** agora são 10 árvores e o limite é 80 / 96 / 112 / 128 por dia. A tabela abaixo é o registro da Etapa 1.1.

| Alternativa (limite por dia, ponte 0→3) | Casual: dias até o nível 3 | Regular: sobra de madeira no nível 3 | Eficiente: dias até o nível 3 |
|---|---:|---:|---:|
| 40 / 48 / 56 / 64, sem reserva (antes) | 275 | 4.841 (estoque máx. 8.361) | 156 |
| 24 / 28 / 32 / 36, sem reserva | 280 | 1.365 | 156 |
| 20 / 24 / 28 / 32, sem reserva | 319 (+44) | 693 | 156 |
| 16 / 20 / 24 / 28 | 275 com reserva · 380 sem | 21 | **165 (+9)** |
| Custo de evolução em madeira 100 / 200 (limite mantido) | 298 | 3.931 | 156 |
| **20 / 24 / 28 / 32 + reserva de 1 dia (escolhida)** | **275** | **693** | **156** |

A escolhida mantém os dias de todos os perfis e reduz a sobra do regular de ~140% para ~20% do total. O rendimento por árvore (8 a 10) foi mantido: uma rodada de 4 árvores cobre o limite do dia, com pouca repetição.

## Auditoria das poções e combinações (Etapa 1.1)

| Poção | Antes | Agora | Motivo |
|---|---|---|---|
| Ração Encantada | 60 min | **6 h** | Em 1 h economizava ~8 de comida por instalação (menos de 1 trigo). Em 6 h cobre uma ausência. |
| Elixir da Fertilidade (removido na Etapa 2) | 60 min | **6 h** | Em 1 h rendia +1 item a cada 6 animais. Em 6 h rende +1 item por animal, dentro da cota de Criação. |
| Aceleração dos Trabalhadores | 24 minérios | **16** | O jogador pode "Colher tudo" na hora: o efeito economiza tempo da equipe, não dá XP. |
| Crescimento Acelerado | 30 minérios | **20** | As plantas crescem com a página fechada e a cota de Lavoura enche com uma colheita: economiza tempo dentro da visita, não dá XP. |
| Demais (Experiência 8, Vitalidade 4, Seiva 10, Bravura 10, Noite Serena 26) | — | mantidos | Proporcionais ao uso (ver seção 11). |

**Combinações testadas no jogo:**
- **Ração + Fertilidade**, 8 h com a página fechada (galinheiro com 5 galinhas, celeiro nv 2):
  - com as duas: 11,6 itens e 44% de comida no cocho;
  - sem nenhuma: 6,7 itens e 11% de comida;
  - a coleta continuou presa à cota de Criação (6 de 6).
- **Aceleração + Crescimento:**
  - 1 min de efeito deu 6 min de crescimento;
  - as 20 abóboras amadureceram, e a colheita rendeu 33 XP, exatamente a cota de Lavoura, e 40 abóboras;
  - uma segunda colheita deu 0 XP e 0 abóboras (sem duplicação).
- **Bravura** num ataque de criatura de invasão: 12 de dano viraram 6. O dano da equipe passa pelo mesmo golpe nas invasões e nas noites.
- Nenhuma combinação cria XP fora das cotas nem duplica itens.

## 17. Limites diários e prevenção de exploração

| Proteção | Como funciona |
|---|---|
| Cotas por atividade | `creditarXP` limita cada crédito da origem 'fazenda' à cota da atividade (+ reserva de 1 dia). |
| Mina | Credita só minérios, uma vez por viagem, na transição "voltando → descarregando". |
| Poção de Experiência | Só é usada se o Limite comportar os 20 XP; em falha, XP, limite, origem e poção são restaurados. |
| Poções de efeito | Mesmo efeito não acumula; estado guardado antes e restaurado se o salvamento falhar; trava contra clique duplo. |
| Colheita | Canteiro esvaziado antes do crédito; reserva por canteiro para os trabalhadores. |
| Produção | Itens saem da instalação antes do crédito; só o que cabe na cota. |
| Madeira | Uma árvore por vez; crédito único na queda; limite diário pela ponte + reserva de no máximo 1 limite. |
| Construções | XP e madeira conferidos antes de descontar; trava de 700 ms no painel. |
| `window.adicionarXP` | Recusa valores não numéricos e `id` repetido (500 mais recentes). |
| Poções antigas | Devolvidas em minérios uma única vez (os ids antigos saem do save). |

**Limitações (só se resolvem com back-end):**
- o dia das cotas e da madeira usa o relógio do aparelho;
- o save fica no `localStorage` e pode ser editado;
- `window.FarmEduMark82.estado()` expõe o estado;
- a palavra do modo desenvolvedor está no código.

## 18. Como o XP real é concedido

```
colher canteiro      → colherCanteiro      → creditarXP(xp, 'fazenda', true, 'lavoura')
coletar produção     → coletarProducao     → creditarXP(itens, 'fazenda', true, 'criacao')
usar Poção de XP     → usarPocao → usarPocaoDeExperiencia → creditarXP(20, 'fazenda', false, 'mina')   (Limite da alquimia)
monstro derrotado    → ferirMonstro        → creditarXP(5, 'fazenda', true, 'defesa')
viagem da mina       → concluirCicloDaMina → só minérios (sem creditarXP)
poções de efeito     → usarPocaoDeEfeito   → aplicarEfeitoDaPocao (seção 28c), sem XP

creditarXP: renova as cotas se o dia mudou → crédito = mín(quantidade, cota livre + reserva) → estado.xp += crédito → salva

atividades escolares (futuro) → window.adicionarXP(quantidade, { id: 'nota-123' }) → sem cota, origem 'atividades'
```

## 19. Valores antigos × valores atuais

| Elemento | Rebalanceamento | Etapa da alquimia | **Etapa 1.1 (atual)** |
|---|---|---|---|
| XP por viagem da mina | 3 / 4 / 5 | 0 | 0 |
| Cota da mina | 14 / 20 / 26 (ciclos + poções) | Limite da alquimia 20 (só a Poção de Experiência) | 20 |
| Poções | Tônico 3→5 · Elixir 6→12 · Essência 10→21 | 9 poções; Experiência 8→20 | idem; Ração e Fertilidade 6 h; Aceleração 16; Crescimento 20 |
| Madeira por árvore | 4 | 8 / 8 / 9 / 10 | 8 / 8 / 9 / 10 |
| Limite diário de madeira | 24 / 32 / 40 / 48 | 40 / 48 / 56 / 64 | **80 / 96 / 112 / 128 + reserva de 1 dia** (antes desta correção: 20 / 24 / 28 / 32) |
| Total máximo das cotas | 141 | 135 | 135 |

Os valores de antes do rebalanceamento (cota única de 100, evoluções 400/1.000, melhorias 80…440 etc.) continuam registrados nos comentários de `01-configuracoes-gerais.js`.

## 20. Fórmulas

- Canteiros: `⌊(largura − 0,6) ÷ 3,2⌋ × ⌊(15 − 0,6) ÷ 3,2⌋`, largura 11,8 / 17,4 / 20,2 → 12 / 20 / 24.
- Ciclo da mina: 40 min minerando + ida e volta nos trilhos + 4 s de descarga; com a página fechada, o carrinho termina só a viagem em andamento.
- Produção: `itens += vivos × horas com comida ÷ 6`, até `4 × vivos`; ausência limitada a 8 h.
- Consumo do cocho por hora: `100 ÷ (6 × (1 + 0,25 × nível do celeiro)) × vivos ÷ total × (0,5 na parte do intervalo com Ração)`.
- Reserva de cota (XP): `reserva = mín(cota, reserva + (cota − usado) + cota × dias sem jogar)`.
- Reserva de madeira: `reserva = mín(limite, sobra da reserva + (limite − coletado) + limite × dias sem jogar)`; capacidade do dia = limite + reserva.
- Crescimento acelerado: enquanto vale, `plantadoEm −= tempo decorrido × 5` em cada canteiro que ainda cresce.

---

## Preparação para a experiência colaborativa (somente front-end; **o multiusuário ainda não funciona**)

| O quê | Situação atual | O que a integração precisa |
|---|---|---|
| Identidade do aluno | A página não recebe o aluno | Enviar `id_aluno`, nome, curso, turma e instrutor para a página |
| Salvamento | `localStorage`, chave `fazenda3d-progresso-v3` (mesmo navegador = mesma fazenda) | Carregar e gravar `estado` por aluno; a tabela `fazendas` não tem coluna de estado |
| Ponto de troca | `05-progresso-e-salvamento.js` (leitura síncrona) e `salvarProgresso` | Dados disponíveis antes do arquivo 05 |
| XP escolar | `window.adicionarXP(quantidade, { id })` | Servidor credita a nota com `id` único (`xp_logs.id_nota`) |
| Relógio | do aparelho | data do servidor |

Campos novos do save desde o rebalanceamento: `cotasDoDia`, `recompensasRecebidas`, `animais[id].produtos`, `pocoes` (9 tipos), `efeitosDasPocoes`, `madeiraHoje.reserva`.

## Arquivos alterados na Etapa 1.1

- `01-configuracoes-gerais.js`: limite de madeira, durações e preços das poções, comentários com as justificativas.
- `05-progresso-e-salvamento.js`: campo `madeiraHoje.reserva` (opcional; saves antigos começam com 0).
- `29b-lenhador.js`: reserva de madeira (`renovarMadeiraDoDia`, `capacidadeDeMadeiraHoje`) e texto do diálogo.
- `28b-guardiao-e-pocoes.js` e `28c-efeitos-das-pocoes.js`: durações em horas no painel e no indicador.
- `32-interface.js`: função da ponte mostra também a madeira por árvore.
- `32b-tutorial.js`: textos corrigidos (mina sem XP, só a Poção de Experiência dá XP e usa o Limite, cotas por atividade, coleta dos animais, reserva de madeira).
- `docs/ECONOMIA-XP-E-PROGRESSAO-DA-FAZENDA.md`: este documento.

## Etapa 2 — Poção misteriosa e eventos especiais

**Poção Misteriosa do Unicórnio** (id interno `misteriosa`, configurada em `POCOES_DO_GUARDIAO`):
- Substitui o Elixir da Fertilidade, e o catálogo continua com 9 poções.
- Custa 60 minérios. Não dá XP e não usa o Limite da alquimia.
- **Segredo:** na interface, nome, raridade, efeito, duração, condição, quantidade e mensagens aparecem como "???". Só o custo é mostrado. Depois do único uso, a poção fica "descoberta".
- **Uso único:**
  - `estado.eventosEspeciais.misterio.usadoEm` é salvo antes de a cena começar;
  - `concluido` só vira `true` quando a cena termina; se a página fechar no meio, a cena é mostrada de novo ao abrir;
  - o Guardião prepara um frasco por vez e nenhum depois do uso.
- **Saves antigos:**
  - cada Elixir da Fertilidade guardado volta como 12 minérios;
  - um elixir que ainda fazia efeito devolve a parte que não chegou a valer, proporcional ao tempo restante e arredondada para baixo;
  - a devolução acontece uma única vez.

**Abdução alienígena** (`EVENTOS_ESPECIAIS_CONFIG.abducao`):
- **Sorteio:** acontece uma vez a cada 10 min de jogo com a página visível, com **2%** de chance, e só depois de **72 h** desde a última.
  - Estimativa: quem joga 1 h por dia vê uma abdução a cada ~12 dias; quem joga 20 min, 3× por semana, uma a cada ~2 meses.
- **Regras (Etapa 1):** exige o **curral construído** e uma vaca nele; leva uma vaca por vez e nunca começa com outra ainda fora. Não acontece durante cena, invasão, tutorial aberto ou painel do Guardião aberto.
- **Abdução temporária (Etapa 1):** a vaca **volta sozinha 20 s depois** de ser levada, trazida de volta pelo disco, **sem custo**. Nenhuma vaca se perde.
  - O registro `estado.eventosEspeciais.alienigena.vacaAusente = { saiuEm, voltaEm }` (relógio real) é salvo no mesmo passo da saída.
  - Enquanto ela está fora, `estado.animais.curral.abduzidos` vale 1: ela não aparece, não come e não produz.
  - Ao recarregar com tempo restante, a volta respeita esse tempo. Se o prazo já passou, ela volta na abertura, antes de o curral ser desenhado.
  - A volta é salva antes da animação, então nunca há duplicação.
  - Saves antigos (regra da Etapa 2, perda permanente) recebem as vacas abduzidas de volta, sem custo.
  - O "Repor" (60 XP) vale só para animais **mortos**.

**Música:** `AUDIO_CONFIG.segredos.misterio` (`assets/audio/SFX/eventos/misterio.mp3`) e `discoVoador` (`assets/audio/SFX/eventos/disco-voador.mp3`). Os arquivos ainda não existem; quando forem colocados, tocam sincronizados com as cenas.

## Correção do lenhador — 10 árvores e limite de 80 madeiras por dia

**Problema:** com 4 árvores e limite de 20 madeiras por dia, uma construção que pede 35+ madeiras exigia 2 ou mais dias de espera.

| | Antes | Agora |
|---|---|---|
| Árvores no acampamento | 4 | **10** (as 4 antigas no mesmo lugar, com os mesmos ids; 6 novas na beira da clareira) |
| Madeira por árvore | 8 / 8 / 9 / 10 (ponte 0/1/2/3) | **igual** |
| Rebrota | 20 min por árvore | **igual** (cada árvore tem o seu próprio tempo, salvo no save) |
| Limite diário | 20 / 24 / 28 / 32 | **80 / 96 / 112 / 128** (ponte 0/1/2/3; a ponte continua dando +20% por nível) |
| Reserva | até 1 limite (dias sem jogar) | **igual** (agora até 80 / 96 / 112 / 128) |

* **Uma rodada = o limite do dia.** Com a ponte nível 0, as 10 árvores × 8 = 80 madeiras.
* **O limite não bloqueia antes da hora.** A coleta só é recusada quando o restante do dia chega a 0; o último corte credita só o que falta (ex.: faltando 4, a árvore entrega 4).
* **Nada mais mudou:** preços das construções (XP e madeira), outros recursos, cotas de XP e diálogos do lenhador ficaram iguais.
* **Efeito colateral:** a **Seiva da Floresta** (faz as árvores rebrotarem na hora) passa a liberar até 10 árvores em vez de 4. O limite diário continua valendo para ela.
* **Arquivos:**
  * `01-configuracoes-gerais.js` (`FUNCOES_DAS_CONSTRUCOES.ponte`: base 80, +16 por nível);
  * `29b-lenhador.js` (10 posições);
  * `09-guardiao-e-lenhador.css` (grade de 2 × 5 árvores no diálogo, ajustada para celular).

Testes (coleta real, o lenhador anda e corta):
* **Coleta das 10 árvores:** 10 pedidos, 8 madeiras cada, 13–17 s por árvore, nenhum travado; ao chegar a **80 / 80** o 11º pedido foi recusado ("O limite diário de madeira já foi atingido").
* **Rebrota:** 10 instantes distintos (20 min depois de cada corte); logo após a 1ª rebrota, "1 de 10" prontas; depois da última, "10 de 10", e o limite continuou valendo.
* **Recarga da página:** "80 / 80", os mesmos tocos e os mesmos tempos de rebrota.
* **Virada do dia:**
  * ontem coletou 30 → "0 / 130 (+50 de ontem)";
  * ontem coletou 80 → "0 / 80";
  * 3 dias sem jogar → "0 / 160";
  * os tempos de rebrota não são zerados na virada.
* **Bordas do limite:** faltando 4 → creditou 4 e travou; com reserva, faltando 3 → creditou 3 e travou exatamente na capacidade.

## Etapa 1 — Primeira construção no primeiro dia

### Auditoria (antes da mudança)

| Item | Valor | Fonte |
|---|---|---|
| XP inicial de um save novo | **0** | `ECONOMIA_CONFIG.xpInicial` |
| 1ª plantação | grátis (0 XP, 0 madeira) | seção 32 |
| Cota de XP do 1º dia (sem integração escolar) | Lavoura 12 + 6 (plantação nível 1) + 3 (fazendeiro Juca) = **21**; Defesa 5 só à noite, se houver monstros; Criação 0; Alquimia 0 | `COTAS_DIARIAS_DE_XP` |
| Tempo para render os 21 XP | 1 rodada de milho (8 min, 12 canteiros × 2 XP) | `CULTURAS` |
| Madeira do 1º dia | até 80 (10 árvores × 8) em ~2,5 min reais | lenhador |
| Construção mais barata | ponte 100 XP + 20 madeiras | `CUSTO_DE_CONSTRUCAO` |
| Instalações de animais | 120 XP + 30 madeiras | idem |
| Plantação, casa | 150 XP + 35 madeiras | idem |

**O bloqueio era o XP, não a madeira:** com 21 XP/dia, a ponte saía no **5º dia** e o curral no **6º**. Aumentar a madeira não mudaria nada.

**Primeira construção mais adequada: o curral** (ou outra instalação de animais).
* Usa o que a plantação grátis produz (os animais comem as colheitas), ensina o ciclo plantar → alimentar → coletar e abre uma fonte nova de XP (Criação +2/dia).
* Também libera o evento da abdução.
* A ponte é mais barata, mas aumenta a madeira, que deixou de faltar depois da correção do lenhador.

### Mudança

| Valor | Antes | Agora | Justificativa |
|---|---|---|---|
| `ECONOMIA_CONFIG.xpInicial` (só saves NOVOS) | 0 | **100** | 100 + 21 do dia = 121 ≥ 120 (curral). Dá para **uma** construção no 1º dia (ponte 100, ou uma instalação de animais 120 depois de colher a cota), **nunca duas** (220). |

* **Nenhum preço mudou.** Os saves existentes não mudam.
* **Impacto no ano:** 100 XP são 0,5% dos ~20.900 XP de construções e evoluções.
* **A partir do dia 2**, a cota é de 23–28 XP/dia (Lavoura 21 + Criação 2, + Defesa 5 à noite). A 2ª construção leva de 4 a 6 dias, como antes.
* **A ponte continua útil:** mais madeira por dia (96/112/128) e por árvore (9/10 nos níveis 2 e 3), e é a construção mais barata para quem prefere começar por ela.

### Simulação (save novo de verdade, funções reais do jogo)

| Minuto de jogo | Ação | XP | Madeira |
|---|---|---|---|
| 0 | save novo | 100 | 0 |
| 0 | constrói a Nova plantação (grátis) | 100 | 0 |
| 9 | 1 rodada de milho: planta e colhe 12 canteiros (cota de Lavoura esgotada) | 121 | 0 |
| ~10 | lenhador derruba 4 árvores (51 s reais) | 121 | 32 |
| ~10 | **constrói o curral** (−120 XP, −30 madeiras) | 1 | 2 |

* **Depois do curral, no mesmo dia:** faltam 99 XP para a ponte e 119 para o galinheiro, e o dia ainda pode render no máximo 7 XP. Uma 2ª construção no 1º dia é impossível.
* **Antes desta etapa,** o mesmo aluno construía o curral só no 6º dia.

## Etapa 2 — Quadro de objetivos e easter egg do ET (impacto econômico)

**Implementado: nenhuma alteração na economia.**
* Os 27 objetivos dão só **reconhecimento**: selo no quadro, data da conquista e aviso.
* O easter egg do ET é só visual. Não tira, não move e não muda a vaca; não gasta nem dá XP, madeira ou minério.
* Custos, limites, cotas e receitas não mudaram.

### Proposta (AGUARDANDO AUTORIZAÇÃO — não implementada)

Médias de XP por dia tiradas da simulação acima (XP total ÷ dias até a fazenda completa): casual 19.633 ÷ 361 = **54/dia**; regular 19.723 ÷ 222 = **89/dia**; eficiente 19.674 ÷ 208 = **95/dia**.

| Opção | Recompensa | XP total | Impacto no ano | Impacto no começo (até a mina) |
|---|---|---|---|---|
| **A (implementada)** | só selo de reconhecimento | 0 | nenhum | nenhum |
| B | principais 25 XP (11) + atividades 10 XP (12); descobertas 0 | 395 | −7,3 dias casual · −4,4 regular · −4,2 eficiente (≈ −2%) | ~185 XP saem nos primeiros dias (5 principais + 6 atividades). Com a cota inicial de ~26 XP/dia, isso é **~7 dias a menos até a mina** (13 → ~6 no regular): aceleração forte justamente onde a progressão foi calibrada |
| C | só os principais, 10 XP cada (11) | 110 | ≈ −1 a −2 dias (≈ −0,6%) | ~50 XP no começo ≈ 2 dias a menos até a mina |

**Recomendação: manter a A.** Se for desejado algum XP, a C é a única que não desequilibra o começo. Mesmo ela precisa de autorização e de entrar fora das cotas diárias, como as atividades escolares.
