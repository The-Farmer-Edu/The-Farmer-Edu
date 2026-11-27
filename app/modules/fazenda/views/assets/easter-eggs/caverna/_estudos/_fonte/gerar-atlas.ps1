# ====================================================================================================
# EDIÇÃO PESSOAL — CAVERNA SECRETA · gerar-atlas.ps1
# Converte as FONTES de pixel art (arquivos .txt desta pasta, um por personagem, pixel a pixel) em:
#   ../<id>.png        atlas com todas as partes e quadros do personagem
#   ../<id>.atlas.js   mapa do atlas (onde está cada parte/quadro) lido pela cena em tempo de execução
# Uso (PowerShell):  .\gerar-atlas.ps1            (todos)      .\gerar-atlas.ps1 hulk   (só um)
# Formato da fonte: ver LEIA-ME.md nesta pasta. Nenhum desenho é feito por código: cada pixel vem do .txt.
# Hoje os personagens da caverna são bonecos desenhados por código (personagens/boneco.js); os atlas continuam aqui para o
# carregador por sprite (sprites.js). O FORMATO gerado (window.CavernaSecreta.atlas[id] = { imagem, tamanho, partes } com quadros
# [xNoAtlas, yNoAtlas, largura, altura, xNoPersonagem, yNoPersonagem]) é o que sprites.js lê: não mude sem mudar o carregador.
# ====================================================================================================
param([string]$Somente = '', [string]$Previa = '')   # -Previa <pasta>: grava também uma prévia ampliada de cada personagem
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$pastaDasFontes = Split-Path -Parent $MyInvocation.MyCommand.Path
$pastaDeSaida = Split-Path -Parent $pastaDasFontes

function Ler-Fonte([string]$arquivo) {
  $linhas = [IO.File]::ReadAllLines($arquivo, [Text.Encoding]::UTF8)
  $fonte = @{ id = [IO.Path]::GetFileNameWithoutExtension($arquivo); paleta = (New-Object System.Collections.Hashtable ([StringComparer]::Ordinal)); base = $null; largura = 0; altura = 0; regioes = @(); quadros = @() }
  $indiceDaLinha = 0; $modo = ''
  while ($indiceDaLinha -lt $linhas.Count) {
    $linha = $linhas[$indiceDaLinha]; $indiceDaLinha++
    $linhaLimpa = ($linha -replace '(^|\s)#(?![0-9a-fA-F]{6}).*$', '').Trim()   # comentário: '#' que não seja cor
    if ($modo -eq 'paleta') {
      if ($linhaLimpa -eq 'fim') { $modo = ''; continue }
      if ($linhaLimpa -eq '') { continue }
      $campos = $linhaLimpa -split '\s+'; $fonte.paleta[[string]$campos[0]] = $campos[1]; continue
    }
    if ($linhaLimpa -eq '') { continue }
    $campos = $linhaLimpa -split '\s+'
    switch ($campos[0]) {
      'paleta' { $modo = 'paleta' }
      'base' {
        $fonte.largura = [int]$campos[1]; $fonte.altura = [int]$campos[2]; $linhasDaBase = @()
        for ($numero = 0; $numero -lt $fonte.altura; $numero++) { $linhasDaBase += $linhas[$indiceDaLinha].TrimEnd(); $indiceDaLinha++ }
        $fonte.base = $linhasDaBase
      }
      'base-espelhada' {   # cada linha traz só a metade esquerda; a direita é o espelho (largura ímpar: a coluna do meio não repete)
        $fonte.largura = [int]$campos[1]; $fonte.altura = [int]$campos[2]; $linhasDaBase = @(); $metade = [Math]::Ceiling($fonte.largura / 2)
        for ($numero = 0; $numero -lt $fonte.altura; $numero++) {
          $metadeEsquerda = $linhas[$indiceDaLinha].TrimEnd(); $indiceDaLinha++
          if ($metadeEsquerda.Length -ne $metade) { throw "$($fonte.id): linha $($numero + 1) da base espelhada tem $($metadeEsquerda.Length) colunas (esperado $metade)" }
          $caracteresEspelhados = $metadeEsquerda.Substring(0, [Math]::Floor($fonte.largura / 2)).ToCharArray(); [Array]::Reverse($caracteresEspelhados)
          $linhasDaBase += $metadeEsquerda + (-join $caracteresEspelhados)
        }
        $fonte.base = $linhasDaBase
      }
      'pinta' {            # sobrescreve pixels da base a partir de (x, y); '.' aqui = não mexe, '_' = apaga (transparente)
        $inicioX = [int]$campos[1]; $inicioY = [int]$campos[2]; $numero = 0
        while ($indiceDaLinha -lt $linhas.Count -and $linhas[$indiceDaLinha].Trim() -ne '' -and -not $linhas[$indiceDaLinha].Trim().Contains(' ')) {
          $linhaPintada = $linhas[$indiceDaLinha].TrimEnd(); $indiceDaLinha++; $linhaDaBase = $fonte.base[$inicioY + $numero].ToCharArray()
          for ($coluna = 0; $coluna -lt $linhaPintada.Length; $coluna++) {
            if ($linhaPintada[$coluna] -eq '_') { $linhaDaBase[$inicioX + $coluna] = '.' } elseif ($linhaPintada[$coluna] -ne '.') { $linhaDaBase[$inicioX + $coluna] = $linhaPintada[$coluna] }
          }
          $fonte.base[$inicioY + $numero] = -join $linhaDaBase; $numero++
        }
      }
      'regiao' { $fonte.regioes += ,@{ nome = $campos[1]; x = [int]$campos[2]; y = [int]$campos[3]; largura = [int]$campos[4]; altura = [int]$campos[5] } }
      'quadro' {
        $linhasDoQuadro = @()
        while ($indiceDaLinha -lt $linhas.Count -and $linhas[$indiceDaLinha].Trim() -ne '' -and -not $linhas[$indiceDaLinha].Trim().Contains(' ')) { $linhasDoQuadro += $linhas[$indiceDaLinha].TrimEnd(); $indiceDaLinha++ }
        $fonte.quadros += ,@{ nome = $campos[1]; x = [int]$campos[2]; y = [int]$campos[3]; linhas = $linhasDoQuadro }
      }
      'espelho' {          # espelho <nome> <x> <y> <origem> <n>: quadro novo = n-ésimo 'quadro' de <origem>, espelhado na horizontal
        $quadroDeOrigem = @($fonte.quadros | Where-Object { $_.nome -eq $campos[4] })[[int]$campos[5] - 1]
        if (-not $quadroDeOrigem) { throw "$($fonte.id): espelho de um quadro que não existe ($($campos[4]) $($campos[5]))" }
        $linhasDoQuadro = @($quadroDeOrigem.linhas | ForEach-Object { $caracteres = $_.ToCharArray(); [Array]::Reverse($caracteres); -join $caracteres })
        $fonte.quadros += ,@{ nome = $campos[1]; x = [int]$campos[2]; y = [int]$campos[3]; linhas = $linhasDoQuadro }
      }
      default { throw "$($fonte.id): diretiva desconhecida na linha ${indiceDaLinha}: $linha" }
    }
  }
  return $fonte
}

function Cor-Do-Caractere([hashtable]$paleta, [string]$caractere, [string]$id) {
  if ($caractere -eq '.') { return $null }
  if (-not $paleta.ContainsKey($caractere)) { throw "${id}: cor '$caractere' não está na paleta" }
  $corHex = $paleta[$caractere].TrimStart('#'); $opacidade = 255
  if ($corHex.Length -eq 8) { $opacidade = [Convert]::ToInt32($corHex.Substring(6, 2), 16) }
  return [Drawing.Color]::FromArgb($opacidade, [Convert]::ToInt32($corHex.Substring(0, 2), 16), [Convert]::ToInt32($corHex.Substring(2, 2), 16), [Convert]::ToInt32($corHex.Substring(4, 2), 16))
}

function Gerar([string]$arquivo) {
  $fonte = Ler-Fonte $arquivo; $id = $fonte.id
  if (-not $fonte.base) { throw "${id}: falta o bloco 'base'" }
  for ($y = 0; $y -lt $fonte.altura; $y++) { if ($fonte.base[$y].Length -ne $fonte.largura) { throw "${id}: linha $($y + 1) da base tem $($fonte.base[$y].Length) colunas (esperado $($fonte.largura))" } }
  # grade da base (char[,]); as regiões são recortadas e retiradas dela
  $gradeDaBase = New-Object 'char[,]' $fonte.largura, $fonte.altura
  for ($y = 0; $y -lt $fonte.altura; $y++) { for ($x = 0; $x -lt $fonte.largura; $x++) { $gradeDaBase[$x, $y] = $fonte.base[$y][$x] } }
  $pecas = New-Object System.Collections.ArrayList   # @{ nome; xNoPersonagem; yNoPersonagem; largura; altura; pixels (char[,]) }
  foreach ($regiao in $fonte.regioes) {
    $pixels = New-Object 'char[,]' $regiao.largura, $regiao.altura
    for ($y = 0; $y -lt $regiao.altura; $y++) { for ($x = 0; $x -lt $regiao.largura; $x++) { $pixels[$x, $y] = $gradeDaBase[($regiao.x + $x), ($regiao.y + $y)]; $gradeDaBase[($regiao.x + $x), ($regiao.y + $y)] = '.' } }
    [void]$pecas.Add(@{ nome = $regiao.nome; xNoPersonagem = $regiao.x; yNoPersonagem = $regiao.y; largura = $regiao.largura; altura = $regiao.altura; pixels = $pixels })
  }
  foreach ($quadro in $fonte.quadros) {
    $larguraDoQuadro = ($quadro.linhas | Measure-Object -Property Length -Maximum).Maximum; $alturaDoQuadro = $quadro.linhas.Count
    $pixels = New-Object 'char[,]' $larguraDoQuadro, $alturaDoQuadro
    for ($y = 0; $y -lt $alturaDoQuadro; $y++) { for ($x = 0; $x -lt $larguraDoQuadro; $x++) { $pixels[$x, $y] = if ($x -lt $quadro.linhas[$y].Length) { $quadro.linhas[$y][$x] } else { '.' } } }
    [void]$pecas.Add(@{ nome = $quadro.nome; xNoPersonagem = $quadro.x; yNoPersonagem = $quadro.y; largura = $larguraDoQuadro; altura = $alturaDoQuadro; pixels = $pixels })
  }
  # o que sobrou da base vira a peça "base" (recortada no menor retângulo)
  $minimoX = $fonte.largura; $minimoY = $fonte.altura; $maximoX = -1; $maximoY = -1
  for ($y = 0; $y -lt $fonte.altura; $y++) { for ($x = 0; $x -lt $fonte.largura; $x++) {
    if ($gradeDaBase[$x, $y] -ne '.') { if ($x -lt $minimoX) { $minimoX = $x }; if ($y -lt $minimoY) { $minimoY = $y }; if ($x -gt $maximoX) { $maximoX = $x }; if ($y -gt $maximoY) { $maximoY = $y } }
  } }
  $larguraDaBase = $maximoX - $minimoX + 1; $alturaDaBase = $maximoY - $minimoY + 1; $pixelsDaBase = New-Object 'char[,]' $larguraDaBase, $alturaDaBase
  for ($y = 0; $y -lt $alturaDaBase; $y++) { for ($x = 0; $x -lt $larguraDaBase; $x++) { $pixelsDaBase[$x, $y] = $gradeDaBase[($minimoX + $x), ($minimoY + $y)] } }
  $pecas.Insert(0, @{ nome = 'base'; xNoPersonagem = $minimoX; yNoPersonagem = $minimoY; largura = $larguraDaBase; altura = $alturaDaBase; pixels = $pixelsDaBase })
  # empacotamento em prateleiras (1 px de folga entre as peças)
  $larguraDoAtlas = 256; $cursorX = 0; $cursorY = 0; $alturaDaPrateleira = 0
  foreach ($peca in $pecas) {
    if ($cursorX + $peca.largura -gt $larguraDoAtlas) { $cursorX = 0; $cursorY += $alturaDaPrateleira + 1; $alturaDaPrateleira = 0 }
    $peca.xNoAtlas = $cursorX; $peca.yNoAtlas = $cursorY; $cursorX += $peca.largura + 1; if ($peca.altura -gt $alturaDaPrateleira) { $alturaDaPrateleira = $peca.altura }
  }
  $alturaDoAtlas = $cursorY + $alturaDaPrateleira
  $imagemDoAtlas = New-Object Drawing.Bitmap $larguraDoAtlas, $alturaDoAtlas, ([Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $coresJaConvertidas = (New-Object System.Collections.Hashtable ([StringComparer]::Ordinal))
  foreach ($peca in $pecas) {
    for ($y = 0; $y -lt $peca.altura; $y++) { for ($x = 0; $x -lt $peca.largura; $x++) {
      $caractere = [string]$peca.pixels[$x, $y]; if ($caractere -eq '.') { continue }
      if (-not $coresJaConvertidas.ContainsKey($caractere)) { $coresJaConvertidas[$caractere] = Cor-Do-Caractere $fonte.paleta $caractere $id }
      $imagemDoAtlas.SetPixel($peca.xNoAtlas + $x, $peca.yNoAtlas + $y, $coresJaConvertidas[$caractere])
    } }
  }
  $imagemDoAtlas.Save((Join-Path $pastaDeSaida "$id.png"), [Drawing.Imaging.ImageFormat]::Png); $imagemDoAtlas.Dispose()
  # mapa do atlas: partes[nome] = lista de quadros [xNoAtlas, yNoAtlas, largura, altura, xNoPersonagem, yNoPersonagem]
  $quadrosPorParte = [ordered]@{}
  foreach ($peca in $pecas) {
    if (-not $quadrosPorParte.Contains($peca.nome)) { $quadrosPorParte[$peca.nome] = @() }
    $quadrosPorParte[$peca.nome] += "[$($peca.xNoAtlas),$($peca.yNoAtlas),$($peca.largura),$($peca.altura),$($peca.xNoPersonagem),$($peca.yNoPersonagem)]"
  }
  $partes = ($quadrosPorParte.Keys | ForEach-Object { "    '$_': [" + ($quadrosPorParte[$_] -join ', ') + "]" }) -join ",`n"
  $codigoDoAtlas = @"
// GERADO por sprites/_fonte/gerar-atlas.ps1 a partir de _fonte/$id.txt — não edite à mão (edite a fonte e gere de novo).
(() => {
  const cavernaSecreta = window.CavernaSecreta = window.CavernaSecreta || {}; cavernaSecreta.atlas = cavernaSecreta.atlas || {};
  cavernaSecreta.atlas['$id'] = { imagem: '$id.png', tamanho: [$($fonte.largura), $($fonte.altura)], partes: {
$partes
  } };
})();
"@
  [IO.File]::WriteAllText((Join-Path $pastaDeSaida "$id.atlas.js"), $codigoDoAtlas, (New-Object Text.UTF8Encoding $false))
  if ($Previa) {   # conferência visual: a figura inteira (base original) e, ao lado, cada quadro alternativo aplicado sobre ela
    $ampliacao = 8; $quadrosExtras = @($fonte.quadros); $quantidadeDeVariantes = 1 + $quadrosExtras.Count
    $imagemDaPrevia = New-Object Drawing.Bitmap ($fonte.largura * $ampliacao * $quantidadeDeVariantes + 8 * ($quantidadeDeVariantes - 1)), ($fonte.altura * $ampliacao)
    $desenho = [Drawing.Graphics]::FromImage($imagemDaPrevia); $desenho.Clear([Drawing.Color]::FromArgb(255, 92, 96, 104))
    for ($variante = 0; $variante -lt $quantidadeDeVariantes; $variante++) {
      $linhasDaVariante = [string[]]$fonte.base.Clone()
      if ($variante -gt 0) {
        $quadro = $quadrosExtras[$variante - 1]
        for ($y = 0; $y -lt $quadro.linhas.Count; $y++) {
          $caracteres = $linhasDaVariante[$quadro.y + $y].ToCharArray()
          for ($x = 0; $x -lt $quadro.linhas[$y].Length; $x++) { $caracteres[$quadro.x + $x] = $quadro.linhas[$y][$x] }
          $linhasDaVariante[$quadro.y + $y] = -join $caracteres
        }
      }
      for ($y = 0; $y -lt $fonte.altura; $y++) { for ($x = 0; $x -lt $fonte.largura; $x++) {
        $caractere = [string]$linhasDaVariante[$y][$x]; if ($caractere -eq '.') { continue }
        $pincel = New-Object Drawing.SolidBrush (Cor-Do-Caractere $fonte.paleta $caractere $id)
        $desenho.FillRectangle($pincel, $variante * ($fonte.largura * $ampliacao + 8) + $x * $ampliacao, $y * $ampliacao, $ampliacao, $ampliacao); $pincel.Dispose()
      } }
    }
    $desenho.Dispose(); $imagemDaPrevia.Save((Join-Path $Previa "previa-$id.png"), [Drawing.Imaging.ImageFormat]::Png); $imagemDaPrevia.Dispose()
  }
  "{0,-16} {1}x{2}  partes: {3}  atlas {4}x{5}" -f $id, $fonte.largura, $fonte.altura, ($quadrosPorParte.Keys -join ','), $larguraDoAtlas, $alturaDoAtlas
}

Get-ChildItem -Path $pastaDasFontes -Filter *.txt | Where-Object { -not $Somente -or $_.BaseName -eq $Somente } | ForEach-Object { Gerar $_.FullName }
