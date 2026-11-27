# Entrega da Fazenda 3D — 18/11 (e preparação para 30/11)

Guia curto para **rodar, testar, liberar e apresentar** a Fazenda. Os detalhes de cada sistema ficam nos documentos de referência:

| Assunto | Documento |
|---|---|
| Mapa do código, arquivo por arquivo | `app/modules/fazenda/guia-do-codigo-fazenda.md` (seção 20: missão final) |
| Economia, XP e progressão | `docs/ECONOMIA-XP-E-PROGRESSAO-DA-FAZENDA.md` |
| Invasões | `docs/INVASOES-DA-FAZENDA.md` |
| Desempenho | `docs/DESEMPENHO-DA-FAZENDA.md` |
| Áudios (lista verificada) | `app/modules/fazenda/views/assets/audio/LEIA-ME.md` |
| Backend da fazenda | `docs/The_Farmer_Edu - Backend fazenda.md` |

---

## 1. Como executar

**Requisitos:** Chrome ou Edge atualizado, com aceleração de hardware ligada, e **internet** (o Three.js r128 vem do cdnjs).

### Pela aplicação (modo normal, com login e banco)

1. XAMPP com Apache e MySQL ligados; o projeto em `htdocs/The-Farmer-Edu-main`.
2. Criar `app/core/.env` a partir de `app/core/.env.example` (DB_HOST, DB_NAME, DB_USER, DB_PASS, DB_CHARSET) e importar o banco
   (`database/`). Passo a passo e cuidados (o `schema.sql` APAGA o banco `the_farmer_edu` antes de recriá-lo):
   `docs/INSTALACAO-E-EXECUCAO.md`.
3. Entrar como **aluno** e abrir a Fazenda. Endereço local: `http://localhost/The-Farmer-Edu-main/public/fazenda`.
   - O save fica no banco (`window.FARMEDU_SERVIDOR`, seção 34 do código); o XP das atividades chega pela rota `fazenda/xp-pendente`.

### Modo local, sem servidor (para demonstrar ou testar)

Abrir `app/modules/fazenda/views/fazenda.html` direto no navegador (`file://`). O save fica no `localStorage` do navegador.
Música e sons funcionam neste modo desde a missão final.

### Modo desenvolvedor

Digitar **`pitufo`** com o jogo aberto. Libera, no menu e no painel Tempo, os botões de teste: +5000 XP, madeira e minérios,
abdução, modos do ciclo (Automático, Pausar, Dia fixo, Noite fixa), "Invasão agora", "Avançar um dia elegível", "Reparar tudo",
"Monstros agora" e "⏩ Avançar 10 min". Desligar o modo volta o ciclo ao automático e desfaz o deslocamento de teste do calendário.

---

## 2. O que mudou na missão final (18/11)

- **Integração da equipe:** branch de áudio (`squad-1/fazenda-ajustesaudios`: playlist de 5 músicas, sons do Guardião, poções,
  lenhador, disco voador, abdução e trilhas do unicórnio e dos alienígenas) e branch `squad-7/fazenda-mesclagens` (limpeza do
  `fazenda.js` e ícone novo). Aplicadas na cópia de trabalho, **sem commit**.
- **Invasões só à noite** do ciclo do jogo (data e aviso de véspera inalterados); monstros noturnos novos não surgem durante uma invasão.
- **Áudio no modo local** (`file://`) corrigido.
- `prepararPocao` com um nome inválido não quebra mais; `fecharMenuEPaineis(true)` fecha sem som (pedido da branch de áudio).

---

## 3. Como testar (roteiro de demonstração)

Com o modo local ou pela aplicação, em um save já avançado (ou com o Modo desenvolvedor para acelerar):

1. **Abertura:** tela de carregamento → fazenda; nenhum erro no console (F12).
2. **Lavoura:** construir/plantar, "⏩ Avançar 10 min", colher (XP limitado pela cota diária da Lavoura).
3. **Animais:** alimentar, avançar o tempo, coletar.
4. **Equipe:** com a casa construída, contratar um guarda no menu 👷 Equipe.
5. **Easter eggs:** clicar na pedra secreta (floresta a leste); usar a Poção Misteriosa (cena do unicórnio); clicar nas vacas (ET,
   com chance e intervalo mínimo); abdução (botão de teste).
6. **Invasão à noite:** Modo desenvolvedor → painel Tempo → "Noite fixa" → "Invasão agora" (imediata, para teste) ou deixar o ciclo
   automático chegar às 19h30 com uma invasão pendente.
7. **Salvamento:** recarregar a página e conferir que tudo permaneceu.

---

## 4. Liberar a versão (calendário das invasões)

`INVASOES_CONFIG.calendarioPausado` está em **`true`** (pausado) por decisão da equipe. Para liberar as invasões pelo calendário:

1. Em `app/modules/fazenda/views/assets/js/04-configuracao-das-invasoes.js`, trocar `calendarioPausado: true` por `false`.
2. Abrir o jogo com um save que tenha uma instalação atacável no nível 2: deve aparecer a janela "Perigo e defesa"; a primeira
   invasão vem no 2º dia útil depois de fechá-la, à noite do ciclo do jogo.

Com `true`, nenhuma invasão do calendário acontece em nenhum save; "Invasão agora" continua funcionando para testes.

---

## 5. Pendências conhecidas

| Prioridade | Pendência | O que falta |
|---|---|---|
| ~~Alta~~ feito em 23/11 | **Teste com servidor e banco** | Testado de ponta a ponta com um banco de homologação isolado (`docs/ENCERRAMENTO-TECNICO-2026-11-23.md`): cadastro e login, Fazenda aberta pelo PHP, save no banco (objetos `{}` preservados), conflito de abas 409, 401 sem login, 403 para instrutor, XP de atividade chegando ao jogo e marcado como entregue, limite de tamanho do save (413). |
| Média | `riacho.mp3` é um WAV | Converter para MP3 de verdade (veja o LEIA-ME dos áudios). |
| Média | `segredos.unicornio` sem arquivo | Enviar `SFX/segredos/unicornio.mp3` ou remover a entrada (não é tocada). |
| Média | Licença dos áudios | Registrar origem e licença no LEIA-ME dos áudios. |
| Média | Mesclagem pelo Git | As branches da equipe foram integradas só na cópia de trabalho; falta o commit/merge, decisão da equipe. |
| Baixa | Arquivos de áudio antigos sem uso | Saem com a mesclagem da branch de áudio pelo Git. |
| Baixa | Arquivo solto na raiz | `how --stat e0131b0` na raiz do projeto (já versionado no Git) parece saída de terminal salva por engano; não foi apagado. |
| Baixa | Estábulo fácil | 8/8 vitórias quase sem dano; alavanca documentada em `INVASOES-DA-FAZENDA.md`. |

## 6. Até 30/11

- Rodar o roteiro da seção 3 **pela aplicação, com banco**, num computador da escola (desempenho real e GPU real).
- Resolver as pendências Alta/Média acima.
- Conferir que a apresentação mostra só o que está aqui e nos documentos de referência (invasões à noite, cotas de XP, easter eggs).
