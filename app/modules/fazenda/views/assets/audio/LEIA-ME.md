# Áudios da Fazenda

Esta pasta guarda os sons da Fazenda 3D. Os caminhos usados pelo jogo ficam em `AUDIO_CONFIG`
(`assets/js/02b-configuracao-dos-audios.js`).

## Estrutura

| Subpasta | Conteúdo |
|---|---|
| `musica/` | Música de fundo (`musica-fundo`) |
| `ambiente/` | Sons contínuos: `cachoeira`, `fonte` (chafariz da praça), `trator-motor` (trator parado com o motor ligado) |
| `animais/` | `vaca`, `galinha`, `ovelha`, `porco`, `cavalo` |
| `segredos/` | `pedra-secreta` |
| `efeitos/` | Efeitos curtos das mecânicas do jogo |

## Arquivos que o jogo procura (nenhum existe ainda)

| Arquivo | Quando toca | Tipo |
|---|---|---|
| `musica/musica-fundo.mp3` | sempre, depois do primeiro gesto do jogador | loop |
| `ambiente/cachoeira.mp3` | sempre; mais baixo longe da cachoeira | loop |
| `ambiente/fonte.mp3` | sempre; mais baixo longe do chafariz da praça | loop |
| `ambiente/trator-motor.mp3` | Maquinário nível 2 ou 3 (não destruído); marcha lenta, mais baixo longe | loop |
| `animais/vaca.mp3`, `galinha.mp3`, `ovelha.mp3`, `porco.mp3`, `cavalo.mp3` | de vez em quando, se a criação existir | curto |
| `segredos/pedra-secreta.mp3` | clique na pedra secreta da floresta | curto |
| `efeitos/plantar.mp3` | canteiro plantado | curto |
| `efeitos/colher.mp3` | canteiro colhido (jogador ou trabalhador) | curto |
| `efeitos/construir.mp3` | construção, evolução e reparo | curto |
| `efeitos/mina-carrinho.mp3` | carrinho da mina descarrega | curto |
| `efeitos/contratar.mp3` | trabalhador contratado ou recuperado | curto |
| `efeitos/golpe.mp3` | golpe que acerta em combate | curto |
| `efeitos/monstro-derrotado.mp3` | monstro noturno ou criatura da invasão derrotada | curto |
| `efeitos/alarme-invasao.mp3` | invasão começando (ou continuando ao reabrir) | curto |
| `efeitos/invasao-repelida.mp3` | todas as criaturas da invasão derrotadas | curto |
| `efeitos/desabamento.mp3` | instalação destruída | curto |

Os nomes e volumes ficam em `AUDIO_CONFIG`. Um segredo novo precisa de uma linha em `AUDIO_CONFIG.segredos` e de uma chamada
`tocarSegredo('nome')` no ponto em que ele é descoberto.

## Regras

- Formatos aceitos: **MP3** (`.mp3`) e **OGG** (`.ogg`).
- Nomes só com letras minúsculas, números e hífens (ex.: `pedra-secreta.mp3`), sempre dentro de uma das subpastas acima.
- Aberto pelo arquivo (`file://`), o jogo lê esta pasta diretamente. Pela aplicação PHP, os arquivos são entregues pela rota
  `index.php?rota=fazenda/audio&arquivo=<subpasta>/<nome>.<ext>` (`baseFazenda::enviarAudio`, em `Controller.php`), que recusa
  qualquer outro nome, subpasta ou extensão.
- Arquivo ausente não quebra o jogo: o painel Áudio mostra "arquivo não encontrado".

## Origem e licença

Só adicione arquivos de origem e licença conhecidas e registre cada um aqui antes do commit.

| Arquivo | Autor / fonte | Licença | Observações |
|---|---|---|---|
| — | — | — | Nenhum arquivo adicionado ainda. |

## Etapa 2 — músicas dos eventos especiais (pontos de integração)

Coloque arquivos de autoria própria (ou com licença de uso) nestes caminhos. Sem eles, os eventos rodam em silêncio.

| Arquivo | Quando toca | Configuração |
|---|---|---|
| `SFX/eventos/misterio.mp3` | começa quando a criatura da poção misteriosa aparece no céu; abaixa no fim da cena | `AUDIO_CONFIG.segredos.misterio` |
| `SFX/eventos/disco-voador.mp3` | chegada do disco voador (abdução) | `AUDIO_CONFIG.segredos.discoVoador` |
