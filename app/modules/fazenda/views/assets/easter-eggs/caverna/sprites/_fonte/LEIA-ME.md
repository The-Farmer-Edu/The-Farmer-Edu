# Fontes dos sprites da caverna (pixel art)

Cada personagem tem uma fonte `.txt` nesta pasta, desenhada **pixel a pixel** (um caractere = um pixel). O script
`gerar-atlas.ps1` transforma as fontes em `../<id>.png` (o atlas) e `../<id>.atlas.js` (o mapa do atlas, lido pela cena).

> Estado atual: **as oito fontes são RASCUNHOS PROVISÓRIOS** feitos sem editor de pixel art. Servem para a cena funcionar e
> para fixar o tamanho, as partes e os quadros de cada personagem; a arte final deve ser refeita por um artista (ver
> `docs/EDICAO-PESSOAL-CAVERNA.md`, seção "Assets que ainda precisam ser produzidos").

## Gerar

```powershell
powershell -ExecutionPolicy Bypass -File .\gerar-atlas.ps1                    # todos
powershell -ExecutionPolicy Bypass -File .\gerar-atlas.ps1 -Somente hulk      # só um
powershell -ExecutionPolicy Bypass -File .\gerar-atlas.ps1 -Previa C:\pasta    # também grava previa-<id>.png ampliada 8×
```

## Formato

```
paleta                 # uma cor por linha: <caractere> <#rrggbb ou #rrggbbaa>; '.' é sempre transparente
k #0a0b10
fim
base 30 46             # figura inteira, 46 linhas de 30 caracteres
base-espelhada 30 46   # (alternativa) cada linha traz só a metade esquerda; a direita é o espelho
pinta 26 24            # sobrescreve pixels da base a partir de (26, 24): '.' = não mexe, '_' = apaga
regiao cabeca 9 0 12 11      # recorta da base o retângulo (x, y, largura, altura): vira o quadro 0 da parte "cabeca"
quadro cabeca 9 0            # quadro extra da parte, desenhado na posição (x, y) do personagem; linhas abaixo
espelho capaD 20 26 capaE 1  # quadro novo = 1º "quadro" de capaE, espelhado, na posição (20, 26)
```

Regras importantes:

- As regiões são recortadas **na ordem do arquivo**; o que sobra da base vira a parte `base`. Uma região que fica dentro de
  outra (os olhos dentro da cabeça) precisa vir **antes**.
- Um quadro extra precisa **cobrir todo o retângulo** da sua região (o que a região tirou da base não volta sozinho).
  Pode ser maior que a região (a carta do Coringa sobe acima da mão).
- Partes sem `regiao` (só `quadro`) são **partes extras**: a língua do Venom, os tentáculos do Slenderman. A definição do
  personagem decide quando aparecem.
- Linhas de pixels nunca têm espaço; qualquer linha com espaço encerra o bloco de pixels.

## Trocar pela arte final

O código só lê `<id>.png` + `<id>.atlas.js`. Para trocar a arte:

1. **Mesmo esquema de partes:** redesenhe a fonte `.txt` (ou exporte do Aseprite e monte o atlas com o mesmo mapa) e gere de novo.
   Nada no código muda.
2. **Animação quadro a quadro (estilo Floor796):** ponha cada pose inteira como `quadro` de uma parte única (ex.: `corpo`
   com 12 quadros) e, na definição do personagem (`personagens/<id>.js`), troque os comportamentos para escolher
   `e.partes.corpo.quadro`. O carregador e o motor já aceitam qualquer número de quadros por parte.

## Arte final desenhada à mão (Aseprite) → `importar-aseprite.ps1`

Para sprites em 3/4 com animação quadro a quadro, desenhe no Aseprite e importe; o motor e o carregador não mudam.

1. Um arquivo `.aseprite` por personagem. Tela = tamanho do personagem (pés na última linha).
2. Uma **camada por parte**, com os nomes usados em `personagens/<id>.js` (`base`, `cabeca`, `tronco`, `bracoD`, `capaE`,
   `lingua`…). A camada `base` tem o corpo sem as partes que se mexem: cada pixel fica numa camada só.
3. Os **quadros** da linha do tempo são os quadros de cada parte (quadro 1 = repouso). Deixe a camada vazia nos quadros
   que ela não usa.
4. Exporte: `aseprite -b <id>.aseprite --split-layers --trim --sheet-type packed --sheet <id>-folha.png --format json-array --filename-format "{layer}|{frame}" --data <id>-folha.json`
5. Importe: `powershell -ExecutionPolicy Bypass -File .\importar-aseprite.ps1 -Id <id> -Json <id>-folha.json -Folha <id>-folha.png`
6. Se a nova arte tiver partes, quadros ou pontos de brilho diferentes, ajuste só `personagens/<id>.js` (camadas,
   comportamentos e as coordenadas de olhos, mãos etc.).

Testado: uma planilha no formato de exportação do Aseprite montada com os quadros do Venom atual gerou um atlas idêntico
ao original (partes, tamanho e PNG).