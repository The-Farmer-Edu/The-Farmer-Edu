# Invasões da Fazenda

Regras, valores e testes do sistema de invasões, na versão de entrega.

- **Código:** `app/modules/fazenda/views/assets/js/26-invasoes.js`
- **Valores ajustáveis:** `04-configuracao-das-invasoes.js` (`INVASOES_CONFIG`)
- **Mapa do código:** seção 19 do `guia-do-codigo-fazenda.md`

**Para quem chega agora:** a cada 2 dias úteis, criaturas da floresta atacam uma instalação da fazenda, sempre à noite do ciclo do jogo. Quantas vêm depende da força dos guardas. Sem nenhum guarda, elas só rondam e vão embora. Se os guardas derrotarem todas, o jogador ganha +10 XP; se a instalação desabar, ela fica em ruínas até ser reparada com XP.

---

## 1. Ativação

**Quando as invasões são liberadas.** Na primeira vez que uma **instalação atacável** passa do nível 1 para o 2.

- **Instalações atacáveis:** celeiro, estábulo, ovelhal, curral, galinheiro, chiqueiro e maquinário (`instalacoesElegiveis`).
- **Não liberam:** casa, ponte, plantações, moinho e mina (`aoEvoluirArea` confere com `ehAlvoDeInvasao`).

**O aviso da defesa.**

1. Na liberação, abre a janela "Perigo e defesa" (`#janela-defesa`). Ela explica as invasões, a ronda sem guarda, os guardas, os reparos e a recompensa.
2. Nada é liberado enquanto a janela está aberta.
3. Ao fechar a janela, por qualquer botão ou pela tecla Esc, a contagem começa naquele dia.
4. A primeira invasão é no **2º dia útil** depois disso, com aviso na véspera.

> Exemplo testado: liberado na terça 17/11 → aviso na quarta 18/11 → primeira invasão na quinta 19/11.

**Saves antigos** (`iniciarSistemaDeInvasoes`, ao abrir o jogo):

- **Com uma instalação atacável no nível 2 ou mais:** liberados naquele dia, com o aviso da defesa primeiro. Nada é cobrado de forma retroativa.
- **Liberados pela regra antiga** (qualquer área no nível 2, inclusive casa ou ponte) **sem nenhuma instalação atacável no nível 2 ou mais:** voltam a "não liberado" (`revalidarLiberacao`).
  - O aviso da defesa já visto é mantido.
  - Uma invasão já em andamento não é tocada.
- **Instalação atacável destruída:** conta como evoluída, porque o nível fica guardado.

**A chave do calendário.** `INVASOES_CONFIG.calendarioPausado` está **em `true`** (pausado), a pedido da equipe, até a versão ser liberada. **Para liberar, troque para `false`** em `04-configuracao-das-invasoes.js`. O teste de abertura com `false` passou na finalização, e a regra noturna foi testada com o calendário despausado só na memória do navegador de teste.

- `true` desliga o calendário: nada é liberado, avisado ou atacado. Os testes, os reparos e a conclusão de uma invasão em andamento continuam funcionando.
- Ao voltar para `false`, os dias de invasão que caíram durante a pausa contam como cumpridos. Nada é cobrado de forma retroativa.

---

## 2. Calendário e frequência

**Dias úteis.** Uma invasão no 2º, 4º, 6º… dia útil depois da liberação. Usa a data **local do aparelho**; o ciclo visual de dia e noite não participa.

- **Fim de semana:** a invasão pendente espera a segunda-feira, com o aviso "Invasão adiada".
- **Dias sem jogar:** no máximo **uma** invasão fica pendente. Os dias de invasão perdidos com o jogo fechado não se acumulam.
- **Feriados e férias:** não são considerados. Uma invasão pendente acontece quando o aluno volta.

**Média por semana, com o calendário real** (simulação de 52 semanas):

| Hábito de jogo | Invasões por semana |
|---|---|
| Todo dia, ou seg/qua/sex | 2,5 |
| Ter/qui | 2,0 |
| Uma vez por semana | 1,0 |

**Quando o calendário é conferido.** Ao abrir o jogo (depois da tela de carregamento), a cada 30 s e ao voltar para a aba.

**Só à noite** (`INVASOES_CONFIG.somenteANoite`, missão final). As criaturas só aparecem quando o **ciclo do jogo** está na noite, a mesma noite dos monstros noturnos: das 19h30 às 5h do relógio do jogo (`MONSTROS_NOTURNOS_CONFIG.horaDeInicio` / `horaDeFim`, `ehNoiteParaMonstros`).

- O jogo abre sempre às 8h30 do relógio do jogo, e um dia completo dura 10 minutos reais. **A primeira noite chega cerca de 4,6 minutos depois de abrir** e dura cerca de 4 minutos.
- **No dia de invasão, durante o dia:** a invasão fica pendente (a data **não muda**, nada é adiado para o dia seguinte) e aparece a faixa "🌙 Invasão ao anoitecer". Ao anoitecer, ela começa sozinha: a conferência roda a cada segundo enquanto espera.
- **Jogo fechado antes de anoitecer:** o dia continua pendente no save (`ultimoDiaAtendido` não muda) e a invasão acontece na próxima noite em que o jogo estiver aberto. Vale a regra de no máximo uma pendente.
- **Jogo fechado no meio de uma invasão:** ao reabrir (de dia), ela **não volta de dia**. A faixa avisa que "as criaturas voltam quando anoitecer", e à noite a mesma invasão continua sem as criaturas já derrotadas.
- Uma invasão salva que espera a noite **não bloqueia** a Poção Misteriosa, a cena do céu nem o convite do tutorial (`invasaoAtivaOuIminente`). Se uma cena estiver rodando ao anoitecer, a invasão espera a cena terminar.
- **Monstros noturnos:** enquanto uma invasão está em curso, **não surgem monstros noturnos novos** (`30a`). Os que já estão em campo continuam, e os outros voltam a surgir quando a invasão termina. Isso mantém o teto de 5 criaturas medido no desempenho e o equilíbrio testado.
- **Aviso de véspera:** continua igual e agora diz "quando anoitecer na fazenda".
- **"Invasão agora"** (Modo desenvolvedor) continua **imediata**, de dia ou de noite, para testes. Para testar a regra noturna, use "Avançar um dia elegível" com o ciclo automático ou com "Noite fixa".

> Testado no jogo (ciclo automático, sem forçar a noite): o relógio começou às 19h, a noite chegou 13 s depois e a invasão começou **0,5 s depois do anoitecer**. Nenhum monstro noturno surgiu durante a invasão, e eles voltaram 3,1 s depois do fim. Os casos de fechar antes da noite e no meio da invasão também passaram (veja a seção 9).

**Quando a invasão espera** (`motivoParaAdiarInvasao`):

- uma cena especial (unicórnio, disco voador, ET);
- o tutorial;
- o painel do Guardião;
- as janelas do nome da fazenda ou da defesa;
- a aba escondida.

O dia não é perdido: a conferência roda **a cada segundo** e a invasão começa assim que o jogador fica livre.

> Testado: 0,4 a 0,7 s depois de fechar o tutorial ou o painel do Guardião, e logo depois do fim da cena do céu.

**Uma invasão salva em andamento** (página fechada no meio) também espera, e então continua (à noite).

---

## 3. Dificuldade e composição

**Quem conta.** Só os **guardas contratados e vivos**.

- Os mandados para casa contam: mandar todos para casa não diminui a invasão.
- Os derrotados ainda não recuperados não contam.
- Fazendeiros e o Juca não contam. Eles só lutam dentro do próprio raio, e na simulação o peso deles na defesa foi praticamente 0.

**A fórmula** (`quantidadeDeCriaturas`):

```
F = (Σ dano por segundo dos guardas) × (Σ vida máxima dos guardas)
    dano por segundo = dano × precisão ÷ intervalo entre golpes (1 s), com as melhorias
N = floor(0,95 × √(F ÷ 230)), limitado entre 3 e 5
    230 = dano por segundo médio (3,83) × vida média (60) das três criaturas
```

| Equipe (atributos médios) | F | Criaturas |
|---|---|---|
| Nenhum guarda (só o Juca ou fazendeiros) | — | **ronda** |
| 1 guarda | 2.508 | 3 |
| 1 guarda + 3 fazendeiros | 2.508 | 3 |
| 1 guarda com vida, precisão e dano no máximo | 7.389 | 5 |
| 2 guardas | 10.032 | 5 (a fórmula daria 6) |
| 2 guardas no máximo | 29.557 | 5 (a fórmula daria 11) |

**Regras complementares:**

- **Tipos:** sorteados entre zumbi, esqueleto e vampiro, com os mesmos atributos dos monstros noturnos. Nenhum atributo foi aumentado.
- **Distância:** não reduz a quantidade. O tempo de chegada dos guardas já pesa naturalmente no resultado (seção 9).
- **Equipes muito evoluídas** vencem quase sempre. Foi uma decisão: não há ondas nem ataques a várias instalações.

**Teto de 5 criaturas (desempenho).** Medido na qualidade Baixa, com renderizador por software e CPU 4× mais lenta (um computador fraco):

| Criaturas | FPS | Quadro mais lento (p95) | Chamadas de desenho |
|---|---|---|---|
| 0 | 29–31 | 33–50 ms | ~210 |
| 3 | 25 | 50 ms | ~285 |
| 5 | 22 | 50 ms | ~360 |
| 6 | **19–20** | 67 ms | ~390–440 |

- **O 6 ficou de fora** porque, abaixo de 20 FPS, o relógio do jogo (passo máximo de 0,05 s por quadro) começa a atrasar.
- **Com a CPU normal:** 0 criaturas dá 58 FPS, e 3 ou 6 dão 50 FPS.
- **Memória:** a do JavaScript não variou (42,6 MB).

---

## 4. Comportamento das criaturas

**A sequência:**

1. A faixa de aviso aparece e a câmera vai até a instalação.
2. 3 s depois, as criaturas surgem numa entrada da floresta perto do alvo.
3. Elas andam pela grade de navegação até pontos ao redor da instalação.
4. Quando todas chegam (ou aos 45 s), começa o ataque.

**O dano à instalação:**

- Só avança com criaturas **batendo** nela, na proporção de quantas estão batendo.
- Com todas batendo, a instalação desaba em **9 s**.
- Enquanto lutam com a equipe, as criaturas não batem.

**Reação aos trabalhadores:**

- Uma criatura larga a instalação para atacar um trabalhador em campo a até 6 unidades.
- Desiste dele se ele se afastar mais de 10.
- Revida quem a atacar.

**Criaturas travadas:**

- Uma criatura que não consegue chegar ao seu ponto **não bate de longe**; ela tenta um caminho novo a cada 3 s.
- Se nenhuma criatura conseguir chegar, por falta de caminho ou por estarem travadas sem bater nem lutar por 60 s (`segundosAteDesistirSemChegar`), elas **desistem**: "🌲 As criaturas desistiram", nada é destruído e a invasão conta como concluída (`estado.invasao.semAtaque`).
- Antes, sem caminho, a instalação desabava sem nenhuma criatura chegar.

---

## 5. Participação dos guardas e da equipe

- **Guardas em campo** correm até a invasão de qualquer ponto da fazenda.
- **Fazendeiros e o Juca** só lutam com criaturas a até 8 unidades (12 se já estão lutando).
- **Quem foi mandado para casa** não luta, não é atacado e continua contando na fórmula.
- **Trabalhador derrotado** fica caído como nas noites. Recuperar custa 125 XP (fazendeiro) ou 175 XP (guarda).
- **Poção da Bravura** vale nas invasões. A **Noite Serena** não afeta invasões.

---

## 6. Ronda sem guarda

**Sem nenhum guarda contratado e vivo**, as criaturas só fazem uma ronda:

1. Aparecem (3 criaturas, só como visual).
2. Andam até a instalação e olham por 4 s.
3. Voltam para a mata.

**O que não acontece na ronda:**

- não há combate: ninguém ataca e ninguém é atacado (`invasaoComCombate()` é falso na fase `rondando`);
- não há dano, destruição nem recompensa;
- não troca a música para a de invasão.

**Como conta:**

- O dia conta como cumprido.
- A ronda é registrada **antes** da animação, no mesmo salvamento (`estado.invasao.rondas` e `total`).
- Ela não fica salva em andamento: recarregar a página no meio não a repete.
- A faixa "👀 Criaturas rondando a fazenda" explica que contratar um guarda protege a fazenda.

---

## 7. Destruição e reparo

**Na destruição:**

- A instalação vira ruína (`estado.danos[id] = { destruida, em, nivel }`).
- **O nível e o XP investido são preservados.**
- Ela não pode evoluir até ser reparada.

**O que para numa instalação destruída:**

- não conta nas cotas: a de Criação cai 2 por nível;
- celeiro, moinho e maquinário perdem o bônus;
- os animais ficam parados, sem comer, sem fome e sem produzir;
- **não é possível alimentar, coletar a produção nem repor animais** (`27`). O painel 🌾 Fazenda mostra "💥 destruído: repare no cartão (custo)" no lugar dos botões (`30b`);
- a produção guardada continua lá para depois do reparo.

**O reparo** (`repararArea`):

- Custa **100 / 250 / 450 XP**, conforme o nível.
- Não pede madeira.
- O nível é mantido e tudo volta a funcionar na hora.

> Testado: curral nível 3 → 450 XP, e o cocho voltou a encher.

**Salvamento:**

- A ruína só aparece depois que a destruição foi **salva**.
- Se o salvamento for recusado (navegador sem espaço, aba bloqueada pelo servidor):
  - nada muda e aparece "⚠️ Não foi possível salvar o resultado da invasão. Tentando de novo...";
  - a instalação fica abaixada e a gravação é tentada de novo a cada 2 s.
- O mesmo vale para a vitória e para a desistência.

---

## 8. Recompensas

- **+10 XP** (`recompensaPorRepelir`) por invasão **real** repelida, quando todas as criaturas são derrotadas.
- **Fora da cota diária de Defesa:** vale mesmo com a cota cheia.
- **Uma vez por invasão** (`estado.invasao.recompensadaId`).
- **Gravada no mesmo salvamento** do resultado. Se o salvamento falhar, o XP volta e a gravação é tentada de novo.
- **Não pagam a recompensa:**
  - invasões de teste (`teste: true`);
  - rondas;
  - desistências;
  - destruições.
- **No histórico do servidor**, entra na origem `fazenda` ("XP de colheitas, mina e monstros"). Assim o backend não precisou de mudança.
- **As criaturas derrotadas continuam dando 5 XP cada dentro da cota de Defesa**, como os monstros noturnos.
  - Nas invasões de teste, esse XP das criaturas vai para a origem `teste`, fora da cota, como já acontecia.

**Impacto calculado** (2,5 invasões por semana, ~95% de vitória na abertura): cerca de +24 XP por semana.

| Perfil | Renda semanal | Ganho com a recompensa |
|---|---|---|
| Iniciante com guarda | ~287 XP | +8% |
| Intermediário | ~553 XP | +4% |
| Avançado | ~819 XP | +3% |

---

## 9. Equilíbrio: simulação e testes no jogo

**Simulação.** Feita em C#, num script de análise fora do repositório. Ela reproduz posições, deslocamento, raios, combate e o mapa. Vitória de 1 guarda, **na abertura**, por número de criaturas e por alvo:

| Alvo | 3 | 4 | 5 |
|---|---|---|---|
| curral, maquinário, celeiro, ovelhal | 100% | 94–98% | 64–80% |
| galinheiro | 97% | 69% | 26% |
| estábulo | 92% | 49% | 9% |
| **chiqueiro** (as criaturas nascem perto: é o mais difícil) | 80% | 22% | 1% |
| **média dos 7 alvos** | **95%** | **74%** | **46%** |

Com o guarda vindo da ronda, longe da instalação, a vitória cai para cerca de 47% com 3 criaturas. O tempo de chegada pesa tanto quanto a força.

**Testes no jogo.** Combate natural no motor real, nada forçado:

Equipes saindo da casa (como na abertura), N pela fórmula, 2 invasões por equipe e alvo:

| Alvo | 1 guarda (N 3) | 1 guarda evoluída (N 5) | 2 guardas (N 5) | Avançada: 2 evoluídas + Juca + fazendeiro (N 5) | Total |
|---|---|---|---|---|---|
| celeiro (perto da casa) | 2/2 | 2/2 | 2/2 | 2/2 | **8/8** |
| curral | 2/2 | 2/2 | 2/2 | 2/2 | **8/8** |
| galinheiro | 2/2 | 2/2 | 2/2 | 2/2 | **8/8** |
| chiqueiro | 1/2 | 2/2 | 2/2 | 1/2 | **6/8** |
| **estábulo** (o mais longe; grande) | 1/2 | 0/2 | 1/2 | 1/2 | **3/8** |

**O estábulo (antes do ajuste):**

- Antes da correção do caminho dos trabalhadores (veja abaixo), foram **0 de 8**; depois, **3 de 8**.

**Ajuste do estábulo** (`ladoDeAtaquePorAlvo` em `04`, `posicoesDeAtaque` em `26`, `decidirTrabalhador` em `29`):

- **Causa, medida no jogo:** as criaturas entram pelo sul (z ≈ 59) e se espalhavam pelos 4 lados do cercado grande. Os guardas saem da casa e perseguiam a posição *atual* de criaturas ainda distantes; com isso, desciam até z ≈ 30, contornavam o estábulo pelo sul, por trás delas, e chegavam aos 32–40 s, quando o ataque já tinha começado. Todos os pontos do perímetro eram alcançáveis a pé; o problema era o trajeto.
- **Correção 1 (pontos de ataque):** no estábulo, os pontos ficam num arco de 80° no lado **norte** (portão, lado do caminho por onde a equipe chega), de x 13,4 a 24,6 em z 14,4. As criaturas continuam entrando pelo sul e dão a volta pelo lado leste. Nas outras instalações, nada muda.
- **Correção 2 (guardas):** só nos alvos com `guardasEsperamNoPontoDeAtaque`, enquanto a criatura ainda caminha e está a mais de 12 unidades, o guarda vai até o **ponto de ataque dela** e a espera ali; perto, persegue normalmente. Os guardas chegam ao portão por volta dos 18 s e as criaturas, aos 24–27 s.
- **Sem mudanças** nos atributos dos guardas, na vida das criaturas, no teto de 5, na fórmula, na economia e no salvamento.

**Resultados depois do ajuste** (mesmas condições: equipes saindo da casa, N pela fórmula, 2 invasões por equipe e alvo):

| Alvo | 1 guarda | 1 guarda evoluída | 2 guardas | Avançada | Total | Antes |
|---|---|---|---|---|---|---|
| **estábulo** | 2/2 | 2/2 | 2/2 | 2/2 | **8/8** (dano 0 em todas) | 3/8 |
| celeiro | 2/2 | 2/2 | 2/2 | 2/2 | **8/8** | 8/8 |
| curral | 1/2 | 2/2 | 2/2 | 2/2 | **7/8** | 8/8 |
| galinheiro | 2/2 | 2/2 | 2/2 | 2/2 | **8/8** | 8/8 |
| chiqueiro | 2/2 + 2/2 | 1/2 + 1/2 | 0/2 + 2/2 | 2/2 + 2/2 | **12/16** (duas rodadas: 5/8 e 7/8) | 6/8 |

- Nos outros alvos o código é o mesmo de antes (o ajuste só vale para o estábulo); as diferenças de curral e chiqueiro são variação entre rodadas.
- **O estábulo ficou fácil:** nas 8 invasões nenhuma criatura chegou a bater. Se a equipe quiser mais desafio ali, a alavanca é `guardasEsperamNoPontoDeAtaque` (desligá-la mantém só a concentração dos pontos) ou a abertura do arco.
- **Dano sem defesa:** com o guarda contratado em casa, as criaturas bateram no lado norte e o estábulo desabou em 9,9 s de ataque (2 rodadas). Nenhuma bateu de longe: a maior distância até o próprio ponto de ataque foi 0,21.
- **Desempenho** (CPU 4× mais lenta, qualidade Baixa, 5 criaturas e 2 guardas): 33,4 / 26,0 FPS com o ajuste e 28,7 FPS sem ele, no mesmo carregamento; a diferença está dentro do ruído e a memória ficou estável (61 MB).

**Resultados À NOITE** (missão final; as invasões agora são noturnas). Mesmas condições, com o ciclo na noite (21h do jogo):

| Alvo | 1 guarda (N 3) | 1 guarda evoluída (N 5) | 2 guardas (N 5) | Avançada (N 5) | Total | Dano típico |
|---|---|---|---|---|---|---|
| estábulo | 2/2 | 2/2 | 2/2 | 2/2 | **8/8** | 0 (uma vez 0,35) |
| celeiro | 2/2 | 2/2 | 2/2 | 2/2 | **8/8** | 0 a 0,59 |
| curral | 2/2 | 2/2 | 2/2 | 2/2 | **8/8** | 0 a 0,45 |
| chiqueiro | 2/2 | 2/2 | 2/2 | 2/2 | **8/8** | 0,37 a 0,96 (vitórias apertadas) |
| galinheiro | 0/2 | 2/2 | 2/2 | 2/2 | **6/8** | — |

- **Total: 38 de 40 repelidas.** Os monstros noturnos não surgiram durante as invasões (a regra da seção 2), então a disputa foi só entre a equipe e as criaturas da invasão, como nos testes de dia.
- **Decisão sobre o estábulo:** ele vence como celeiro e curral (8/8); a diferença é só o dano quase nulo. Não foi feito novo ajuste: seria mexer para atingir uma porcentagem, e o pedido era não fazer mudanças arriscadas por isso. Se a equipe quiser mais desafio ali, a alavanca segura é `guardasEsperamNoPontoDeAtaque: false` (fica só a concentração dos pontos), a testar.

**Trabalhadores derrotados:** 0 ou 1 por invasão (às vezes o Juca, que nasce perto da casa).

**Correção feita durante os testes** (`29-trabalhadores.js`, decisão do trabalhador):

- **O problema:** quando o A* não achava caminho até a criatura, o trabalhador ia em linha reta e parava na primeira cerca, longe do combate e fora do raio de reação das criaturas (6).
- **Por que acontecia:** a criatura estava numa célula livre na grade dos monstros (células de 0,7, margem do rio 3,4) e bloqueada na das pessoas (0,6 e 5,2), o que acontece nos pontos de ataque do estábulo.
- **A correção:** agora o trabalhador vai até a **célula livre mais próxima** da criatura.

---

## 10. Ferramentas de desenvolvimento

Ficam no painel Tempo e só funcionam com o Modo desenvolvedor ligado (digitar `pitufo`).

- **🧟 Invasão agora:** usa o mesmo caminho das invasões reais.
  - Mesma fórmula, ronda sem guarda, destruição real e custo real de reparo.
  - Marcada `teste: true`, **sem a recompensa**.
  - Não mexe no calendário.
- **📅 Avançar um dia elegível:** soma dias só ao calendário das invasões.
  - O deslocamento é **desfeito ao desligar o Modo desenvolvedor e ao abrir a fazenda** (`limparDeslocamentoDeTeste`).
  - Dias que ficaram no "futuro de teste" voltam para hoje. O teste não contamina o save.
- **🔧 Reparar tudo:** gratuito.
- **Linha de estado** do painel Tempo mostra:
  - situação do calendário;
  - próxima invasão;
  - **quantas criaturas viriam agora** (ou "ronda");
  - destruídas, repelidas e rondas.
- **Console:** `FarmEduInvasoes.simular()`, `.verificar()`, `.avancarDia()`, `.estado()` e `.config`.

---

## 11. Salvamento

Tudo fica no `estado` do jogo, sem mudança no backend nem no banco:

| Campo | O que guarda |
|---|---|
| `estado.calendarioDasInvasoes` | liberação, último dia cumprido, avisos, pausa e deslocamento de teste |
| `estado.danos[id]` | instalações destruídas |
| `estado.invasao.emAndamento` | invasão em curso, com criaturas derrotadas e dano acumulado |
| `estado.invasao` (contadores) | `total`, `repelidas`, `rondas`, `semAtaque`, `ultima`, `recompensadaId` |

- **Os campos novos são opcionais.** Saves antigos funcionam sem eles.
- **A invasão é salva antes da animação.** Recarregar não duplica nem perde a invasão.
- **Ao reabrir no meio:**
  - continua com as criaturas que restavam e o dano já salvo;
  - as criaturas voltam com a vida cheia;
  - o dano mais recente pode não ter sido salvo ainda: ele vai pelo salvamento periódico, e no teste ficou em 0,54 de 0,71.

---

## 12. Limitações conhecidas

- **Data do aparelho:** a data vem do aparelho do aluno, mesmo no modo servidor. Adiantar o relógio antecipa a invasão.
- **Feriados e férias** não são considerados.
- **Modo servidor:** não foi testado de ponta a ponta com o servidor (só o modo local). Num erro 409 (outra aba) ou 401 (sessão expirada), a aba fica bloqueada e o resultado da invasão não é salvo: o jogo avisa e tenta de novo, sem mostrar a ruína nem a vitória.
- **Retomada:** depende do salvamento periódico. Os últimos segundos de dano antes de fechar podem se perder, e as criaturas voltam com vida cheia.
- **Som:** não há som novo (a ronda usa o som de aparição das criaturas que já existia). O áudio fica a cargo de outra pessoa.
- **Equipes muito evoluídas** quase não são desafiadas (decisão desta etapa).
- **Estábulo:** depois do ajuste (seção 9) passou de 3 de 8 para 8 de 8 vitórias e virou o alvo mais fácil (quase sem dano). À noite, o mais difícil é o galinheiro com 1 guarda só (0 de 2) e o chiqueiro tem vitórias apertadas.
- **Só à noite:** como o jogo sempre abre às 8h30 do relógio do jogo, o aluno precisa ficar cerca de 4,6 minutos na fazenda para a invasão do dia acontecer. Quem fecha antes mantém a invasão pendente (no máximo uma).
- **Juca:** pode ser derrotado ao lutar perto da casa, e recuperá-lo custa 125 XP.
