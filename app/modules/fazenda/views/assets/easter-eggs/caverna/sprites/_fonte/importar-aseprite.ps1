# ====================================================================================================
# EDIÇÃO PESSOAL — CAVERNA SECRETA · importar-aseprite.ps1
# Converte uma planilha exportada do Aseprite no atlas da caverna (../<id>.png + ../<id>.atlas.js), SEM mudar o carregador
# nem o motor. É o caminho para a arte final desenhada à mão (3/4, quadro a quadro) de um personagem por sprite.
#
# No Aseprite, um personagem = um arquivo .aseprite com:
#   • uma CAMADA por parte (nomes iguais aos usados pela definição do personagem: base, cabeca, tronco, bracoD, capaE, lingua...);
#     a camada "base" tem o corpo SEM as partes que se mexem (cada pixel fica numa camada só);
#   • os QUADROS da linha do tempo = os quadros de cada parte (quadro 1 = repouso). Uma camada vazia num quadro é ignorada.
#   • tela do arquivo = tamanho do personagem; os pés na última linha.
# Exportar (linha de comando do Aseprite):
#   aseprite -b personagem.aseprite --split-layers --trim --sheet-type packed --sheet hulk-folha.png
#            --format json-array --filename-format "{layer}|{frame}" --data hulk-folha.json
# Importar:
#   powershell -ExecutionPolicy Bypass -File .\importar-aseprite.ps1 -Id hulk -Json hulk-folha.json -Folha hulk-folha.png
# Os nomes de campo lidos do JSON (frames, filename, frame.x/y/w/h, spriteSourceSize, sourceSize) são do formato do Aseprite.
# ====================================================================================================
param([Parameter(Mandatory)] [string]$Id, [Parameter(Mandatory)] [string]$Json, [Parameter(Mandatory)] [string]$Folha)
$ErrorActionPreference = 'Stop'
$pastaDeSaida = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$planilha = Get-Content $Json -Raw -Encoding UTF8 | ConvertFrom-Json
# o Aseprite exporta os quadros como lista (json-array) ou como objeto indexado pelo nome (json-hash): aceita os dois
$quadrosDaPlanilha = if ($planilha.frames -is [array]) { $planilha.frames } else {
  $planilha.frames.PSObject.Properties | ForEach-Object { $quadro = $_.Value; $quadro | Add-Member -NotePropertyName filename -NotePropertyValue $_.Name -Force; $quadro }
}
$tamanhoDoPersonagem = $null; $quadrosPorParte = [ordered]@{}
foreach ($quadro in $quadrosDaPlanilha) {
  $nomeDaParte, $numeroDoQuadro = $quadro.filename -split '\|'
  if (-not $nomeDaParte -or $quadro.frame.w -le 0 -or $quadro.frame.h -le 0) { continue }
  if ($quadro.spriteSourceSize.w -le 0) { continue }                                  # camada vazia neste quadro
  if (-not $tamanhoDoPersonagem) { $tamanhoDoPersonagem = @($quadro.sourceSize.w, $quadro.sourceSize.h) }
  if (-not $quadrosPorParte.Contains($nomeDaParte)) { $quadrosPorParte[$nomeDaParte] = New-Object System.Collections.ArrayList }
  # [xNoAtlas, yNoAtlas, largura, altura, xNoPersonagem, yNoPersonagem] — mesmo formato de gerar-atlas.ps1, lido por sprites.js
  [void]$quadrosPorParte[$nomeDaParte].Add(@([int]$numeroDoQuadro, "[$($quadro.frame.x),$($quadro.frame.y),$($quadro.frame.w),$($quadro.frame.h),$($quadro.spriteSourceSize.x),$($quadro.spriteSourceSize.y)]"))
}
if (-not $quadrosPorParte.Contains('base')) { throw "a planilha não tem a camada 'base'" }
$linhasDasPartes = foreach ($nomeDaParte in $quadrosPorParte.Keys) {
  "    '$nomeDaParte': [" + (($quadrosPorParte[$nomeDaParte] | Sort-Object { $_[0] } | ForEach-Object { $_[1] }) -join ', ') + "]"
}
Copy-Item $Folha (Join-Path $pastaDeSaida "$Id.png") -Force
$codigoDoAtlas = @"
// GERADO por sprites/_fonte/importar-aseprite.ps1 a partir de uma planilha do Aseprite — não edite à mão.
(() => {
  const cavernaSecreta = window.CavernaSecreta = window.CavernaSecreta || {}; cavernaSecreta.atlas = cavernaSecreta.atlas || {};
  cavernaSecreta.atlas['$Id'] = { imagem: '$Id.png', tamanho: [$($tamanhoDoPersonagem[0]), $($tamanhoDoPersonagem[1])], partes: {
$($linhasDasPartes -join ",`n")
  } };
})();
"@
[IO.File]::WriteAllText((Join-Path $pastaDeSaida "$Id.atlas.js"), $codigoDoAtlas, (New-Object Text.UTF8Encoding $false))
"$Id importado: tamanho $($tamanhoDoPersonagem -join '×'), partes: " + (($quadrosPorParte.Keys | ForEach-Object { "$_($($quadrosPorParte[$_].Count))" }) -join ' ')
