# Áudios da Fazenda

Sons da Fazenda 3D. Os caminhos usados pelo jogo ficam em `AUDIO_CONFIG` (`assets/js/02b-configuracao-dos-audios.js`); o motor
de áudio fica em `assets/js/23-audio.js`. Esta lista foi gerada na missão final (18/11) a partir do `AUDIO_CONFIG` real, carregando
cada arquivo no navegador (veja "Como foi verificado").

## Estrutura real

| Pasta | Conteúdo |
|---|---|
| `Theme_songs/` | Músicas de fundo: `musica1` a `musica5` tocam em ordem aleatória (uma nova a cada faixa que termina); `ataque.mp3` é a música das invasões |
| `SFX/areas-do-jogo/` | Sons contínuos de ambiente: cachoeira, fonte, riacho, trator, carrinho da mina |
| `SFX/vacas`, `galinhas`, `ovelhas`, `porcos`, `cavalo` | Sons dos animais |
| `SFX/sons-do-jogo/` | Botões, menus, ações e progressão |
| `SFX/mobs/` | Criaturas (zumbi, esqueleto, vampiro), fazendeiros/guardas e lenhador |
| `SFX/pocoes/` | Guardião da Mina e poções (preparar, usar, fim do efeito) |
| `SFX/segredos/` | Easter eggs: pedra secreta, disco voador, abdução, trilhas do unicórnio e dos alienígenas |

## Como o jogo encontra os arquivos

- **Pelo servidor PHP** (modo normal): a pasta `views/` não é pública; cada áudio sai pela rota
  `fazenda/arquivo?type=audio/<pasta>&file=<nome>` (`Controller::sendFile`, que aceita só arquivos dentro de `views/assets`).
- **Aberto pelo arquivo** (`file://`, modo local sem servidor): o jogo lê esta pasta diretamente (corrigido na missão final; antes o
  modo local ficava mudo).
- **Arquivo ausente ou com erro não quebra o jogo:** o som fica "indisponível" no painel Áudio e o resto continua. Na playlist, uma
  faixa que falha é pulada.

## Arquivos usados pelo jogo e verificação

Colunas "local" e "servidor": resultado de carregar o arquivo no Chrome (o navegador leu o cabeçalho e a duração) pelo endereço do
modo local e pela rota real do Apache local. "ok" traz a duração.

| Arquivo | Usado em (`AUDIO_CONFIG`) | Local | Servidor |
|---|---|---|---|
| `Theme_songs/musica1.mp3` | musica.tema | ok 179.4s | ok 179.3s |
| `Theme_songs/musica2.mp3` | musica.tema | ok 175.6s | ok 175.6s |
| `Theme_songs/musica3.mp3` | musica.tema | ok 177.1s | ok 177.0s |
| `Theme_songs/musica4.mp3` | musica.tema | ok 178.8s | ok 178.7s |
| `Theme_songs/musica5.mp3` | musica.tema | ok 179.5s | ok 179.5s |
| `Theme_songs/ataque.mp3` | musica.invasao | ok 65.2s | ok 65.2s |
| `SFX/areas-do-jogo/cachoeira.mp3` | ambiente.cachoeira | ok 29.9s | ok 29.5s |
| `SFX/areas-do-jogo/fonte.mp3` | ambiente.fonte | ok 9.8s | ok 9.9s |
| `SFX/areas-do-jogo/trator.mp3` | ambiente.trator | ok 30.0s | ok 30.0s |
| `SFX/areas-do-jogo/riacho.mp3` | ambiente.riacho | ok 39.6s | ERRO |
| `SFX/areas-do-jogo/carrinho.mp3` | ambiente.mina | ok 30.0s | ok 30.0s |
| `SFX/vacas/mugido1.mp3` | animais.vaca,segredos.pegarvaca | ok 2.3s | ok 2.3s |
| `SFX/vacas/mugido2.mp3` | animais.vaca | ok 2.3s | ok 2.3s |
| `SFX/vacas/mugido3.mp3` | animais.vaca | ok 1.3s | ok 1.3s |
| `SFX/galinhas/cacarejo1.mp3` | animais.galinha | ok 7.0s | ok 7.0s |
| `SFX/galinhas/cacarejo2.mp3` | animais.galinha | ok 6.7s | ok 6.6s |
| `SFX/galinhas/galo.mp3` | animais.galinha | ok 2.1s | ok 2.1s |
| `SFX/ovelhas/balido1.mp3` | animais.ovelha | ok 1.7s | ok 1.7s |
| `SFX/ovelhas/balido2.mp3` | animais.ovelha | ok 4.0s | ok 3.9s |
| `SFX/porcos/roncocurto1.mp3` | animais.porco | ok 1.1s | ok 1.1s |
| `SFX/porcos/roncocurto2.mp3` | animais.porco | ok 0.6s | ok 0.6s |
| `SFX/porcos/roncolongo.mp3` | animais.porco | ok 8.7s | ok 8.7s |
| `SFX/cavalo/bufando.mp3` | animais.cavalo | ok 10.1s | ok 10.1s |
| `SFX/cavalo/relincho1.mp3` | animais.cavalo | ok 5.0s | ok 5.0s |
| `SFX/cavalo/relincho2.mp3` | animais.cavalo | ok 1.6s | ok 1.6s |
| `SFX/cavalo/relincho3.mp3` | animais.cavalo | ok 1.4s | ok 1.4s |
| `SFX/sons-do-jogo/botoes-e-menu/botaoenter.mp3` | efeitos.Enter | ok 0.5s | ok 0.5s |
| `SFX/sons-do-jogo/botoes-e-menu/botaovoltar.mp3` | efeitos.Fecha | ok 0.9s | ok 0.9s |
| `SFX/sons-do-jogo/botoes-e-menu/ativar.mp3` | efeitos.ativar | ok 0.3s | ok 0.4s |
| `SFX/sons-do-jogo/botoes-e-menu/desativar.mp3` | efeitos.desativar | ok 0.3s | ok 0.3s |
| `SFX/sons-do-jogo/botoes-e-menu/desenvolvedor.mp3` | efeitos.desenvolvedor | ok 2.1s | ok 2.1s |
| `SFX/sons-do-jogo/botoes-e-menu/erros.mp3` | efeitos.erro | ok 0.3s | ok 0.3s |
| `SFX/sons-do-jogo/acoes/reparar_danos.mp3` | efeitos.construir | ok 1.4s | ok 1.4s |
| `SFX/sons-do-jogo/botoes-e-menu/plantar.mp3` | efeitos.plantar | ok 1.2s | ok 1.2s |
| `SFX/sons-do-jogo/botoes-e-menu/colher.mp3` | efeitos.colher | ok 1.6s | ok 1.7s |
| `SFX/sons-do-jogo/botoes-e-menu/contratar.mp3` | efeitos.contratar | ok 0.4s | ok 0.4s |
| `SFX/sons-do-jogo/botoes-e-menu/demitir.mp3` | efeitos.demitir | ok 0.4s | ok 0.4s |
| `SFX/sons-do-jogo/botoes-e-menu/evoluir.mp3` | efeitos.evoluir | ok 3.6s | ok 3.6s |
| `SFX/sons-do-jogo/botoes-e-menu/Xp.mp3` | efeitos.xp | ok 0.4s | ok 0.4s |
| `SFX/sons-do-jogo/acoes/destruicao.mp3` | efeitos.desabamento | ok 2.4s | ok 2.4s |
| `SFX/pocoes/preparar.mp3` | efeitos.pocaoPreparar | ok 1.9s | ok 1.9s |
| `SFX/pocoes/usar.mp3` | efeitos.pocaoUsar | ok 2.6s | ok 2.6s |
| `SFX/pocoes/fimefeito.mp3` | efeitos.pocaoEfeitoFim | ok 3.1s | ok 3.1s |
| `SFX/pocoes/pocaosecreta.mp3` | efeitos.pocaoSecreta | ok 6.0s | ok 6.0s |
| `SFX/pocoes/guardiao.mp3` | efeitos.guardiao | ok 4.5s | ok 4.4s |
| `SFX/mobs/fazendeiros/ataquehomem.mp3` | efeitos.fazendeiroAtaque | ok 0.7s | ok 0.7s |
| `SFX/mobs/fazendeiros/ataquemulher.mp3` | efeitos.fazendeiroAtaque | ok 0.5s | ok 0.6s |
| `SFX/mobs/fazendeiros/dano.mp3` | efeitos.fazendeiroDano | ok 0.4s | ok 0.4s |
| `SFX/mobs/fazendeiros/morte.mp3` | efeitos.fazendeiroMorte | ok 0.9s | ok 0.9s |
| `SFX/mobs/lenhador/machado.mp3` | efeitos.machado | ok 0.3s | ok 0.3s |
| `SFX/mobs/lenhador/quedaarvore.mp3` | efeitos.quedaArvore | ok 2.1s | ok 2.1s |
| `SFX/mobs/lenhador/lenhador.mp3` | efeitos.lenhador | ok 0.2s | ok 0.2s |
| `SFX/mobs/esqueleto/surge.mp3` | efeitos.esqueletoAparecer | ok 1.3s | ok 1.2s |
| `SFX/mobs/esqueleto/ataque.mp3` | efeitos.esqueletoAtaque | ok 1.3s | ok 1.2s |
| `SFX/mobs/esqueleto/dano.mp3` | efeitos.esqueletoDano | ok 0.4s | ok 0.4s |
| `SFX/mobs/esqueleto/morte.mp3` | efeitos.esqueletoDerrotado | ok 1.1s | ok 1.1s |
| `SFX/mobs/zumbi/surge.mp3` | efeitos.zumbiAparecer | ok 3.5s | ok 3.5s |
| `SFX/mobs/zumbi/ataque.mp3` | efeitos.zumbiAtaque | ok 0.7s | ok 0.6s |
| `SFX/mobs/zumbi/dano.mp3` | efeitos.zumbiDano | ok 0.9s | ok 0.9s |
| `SFX/mobs/zumbi/morte.mp3` | efeitos.zumbiDerrotado | ok 3.6s | ok 3.6s |
| `SFX/mobs/vampiro/surge.mp3` | efeitos.vampiroAparecer | ok 3.4s | ok 3.4s |
| `SFX/mobs/vampiro/ataque.mp3` | efeitos.vampiroAtaque | ok 1.5s | ok 1.5s |
| `SFX/mobs/vampiro/dano.mp3` | efeitos.vampiroDano | ok 1.5s | ok 1.5s |
| `SFX/mobs/vampiro/morte.mp3` | efeitos.vampiroDerrotado | ok 1.2s | ok 1.2s |
| `SFX/segredos/pedra-secreta.mp3` | segredos.pedraSecreta | ok 3.5s | ok 3.5s |
| `SFX/segredos/unicornio.mp3` | segredos.unicornio | ERRO | ERRO |
| `SFX/segredos/temaunicornio.mp3` | segredos.unicornioTrilha | ok 94.8s | ok 94.8s |
| `SFX/segredos/nave.mp3` | segredos.discoVoador | ok 9.9s | ok 9.9s |
| `SFX/segredos/nave_indo_embora.mp3` | segredos.naveindoembora | ok 8.1s | ok 8.1s |
| `SFX/segredos/pegavaca.mp3` | segredos.abducao | ok 7.0s | ok 7.0s |
| `SFX/segredos/temaaliens.mp3` | segredos.trilha | ok 9.6s | ok 9.5s |

### Problemas encontrados (para quem cuida do áudio)

- **`SFX/segredos/unicornio.mp3` não existe.** A entrada `segredos.unicornio` está na configuração, mas nenhuma parte do jogo a toca
  (a cena do unicórnio usa `unicornioTrilha` = `temaunicornio.mp3`, que existe). Ou envie o arquivo, ou remova a entrada.
- **`SFX/areas-do-jogo/riacho.mp3` é um WAV com extensão `.mp3`** (cabeçalho `RIFF…WAVE`, 3,8 MB). No modo local o navegador o
  reconhece; pelo servidor local ele falhou. Nesta máquina o PHP acrescenta um aviso no começo das respostas porque falta o
  `app/core/.env`, e isso estraga o cabeçalho do WAV (os MP3 resistem); num servidor configurado não foi testado. Recomendado:
  converter para MP3 de verdade (fica também bem menor).
- `dragon-studio-spaceship-interior-5-min-584742.mp3` (9,6 MB, na raiz desta pasta) veio na branch de áudio e **não é usado** pelo jogo.
- Os arquivos antigos que a branch de áudio renomeou ou apagou (`Theme_songs/noite_.mp3`, `diaa.mp3`, `dia a dia.mp3`,
  `anoitecer.mp3`, `amanhecer_.mp3`, `ambiencia noturna grilos.mp3`, `ataque_complet.mp3`, `teste.mp3` e
  `SFX/sons-do-jogo/pedra-secreta.mp3`) continuam na cópia de trabalho, sem uso; saem quando a branch for mesclada pelo Git.

## Como foi verificado

`teste-audio.js` (missão final), no Chrome de teste: para cada caminho do `AUDIO_CONFIG`, um elemento `<audio>` com
`preload="metadata"` espera `loadedmetadata` (ok) ou `error`. Não verifica o volume nem o som ouvido. A reprodução dentro do jogo
foi conferida pelo estado das fontes (`playing` → "ok"), por exemplo no som da pedra secreta.

## Regras para novos arquivos

- MP3 (`.mp3`) ou OGG (`.ogg`) de verdade (a extensão precisa corresponder ao conteúdo).
- Registre o caminho em `AUDIO_CONFIG` e, para um segredo novo, chame `tocarSegredo('nome')` no ponto em que ele é descoberto.

## Origem e licença

A origem e a licença de cada arquivo **ainda não foram registradas**. Quem adicionou os arquivos deve preencher esta tabela antes da
apresentação.

| Arquivo | Autor / fonte | Licença | Observações |
|---|---|---|---|
| (a preencher pela equipe de áudio) | | | |
