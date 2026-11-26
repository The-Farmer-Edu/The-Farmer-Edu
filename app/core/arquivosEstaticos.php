<?php
/**
 * ============================================================================
 * CORE — ENTREGA SEGURA DE ARQUIVOS ESTÁTICOS (CSS, JS, imagens, fontes, áudio)
 * ============================================================================
 * Função compartilhada pelos módulos que têm uma rota "file" (ex.: ?rota=auth/file&type=css&file=login.css).
 *
 * Por que existe: as rotas "file" de alguns módulos montavam o caminho direto com $_GET['type'] e $_GET['file'].
 * Com "../" era possível ler QUALQUER arquivo do servidor (inclusive o .env com a senha do banco), e algumas ainda
 * faziam require_once do arquivo pedido, o que EXECUTA código PHP em vez de só entregar o arquivo.
 *
 * Regras aplicadas aqui (todas precisam passar; qualquer recusa responde 404 sem corpo):
 *   1. "type" precisa ser uma das subpastas permitidas pelo módulo (lista explícita);
 *   2. "file" precisa ser um nome simples (letras, números, ponto, hífen, sublinhado), sem barras;
 *   3. a extensão precisa estar na lista de tipos conhecidos (PHP, .env, .md etc. nunca são entregues);
 *   4. o caminho real (realpath) precisa continuar DENTRO da pasta de assets do módulo;
 *   5. o arquivo é LIDO e enviado (readfile em blocos) — nunca incluído/executado.
 * Aceita "Range: bytes=..." (resposta 206), que os navegadores usam para áudio e arquivos grandes.
 * ============================================================================
 */

const TIPOS_DE_ARQUIVO_ESTATICO = [
    'css' => 'text/css; charset=utf-8',
    'js' => 'text/javascript; charset=utf-8',
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif' => 'image/gif',
    'webp' => 'image/webp',
    'svg' => 'image/svg+xml',
    'ico' => 'image/x-icon',
    'woff' => 'font/woff',
    'woff2' => 'font/woff2',
    'mp3' => 'audio/mpeg',
    'ogg' => 'audio/ogg',
];

/**
 * Entrega um arquivo de $pastaDeAssets/<type>/<file>.
 *
 * @param string   $pastaDeAssets      pasta base do módulo (ex.: __DIR__ . '/views/assets')
 * @param string[] $subpastasPermitidas valores aceitos em ?type= (ex.: ['css', 'images'])
 */
function enviarArquivoEstatico(string $pastaDeAssets, array $subpastasPermitidas): void
{
    $subpasta = $_GET['type'] ?? '';
    $nomeDoArquivo = $_GET['file'] ?? '';
    // compatibilidade: algumas páginas antigas pedem "type=images/" (com barra no fim)
    $subpasta = is_string($subpasta) ? rtrim($subpasta, '/') : '';

    if (!in_array($subpasta, $subpastasPermitidas, true)
        || !is_string($nomeDoArquivo)
        || !preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]*$/', $nomeDoArquivo)) {
        http_response_code(404);
        return;
    }
    $extensao = strtolower(pathinfo($nomeDoArquivo, PATHINFO_EXTENSION));
    if (!isset(TIPOS_DE_ARQUIVO_ESTATICO[$extensao])) {
        http_response_code(404);
        return;
    }
    $pastaReal = realpath($pastaDeAssets . DIRECTORY_SEPARATOR . $subpasta);
    $caminhoReal = $pastaReal === false ? false : realpath($pastaReal . DIRECTORY_SEPARATOR . $nomeDoArquivo);
    if ($caminhoReal === false || !is_file($caminhoReal) || strpos($caminhoReal, $pastaReal . DIRECTORY_SEPARATOR) !== 0) {
        http_response_code(404);
        return;
    }

    $tamanho = filesize($caminhoReal);
    $inicio = 0;
    $fim = $tamanho - 1;
    $faixaPedida = $_SERVER['HTTP_RANGE'] ?? '';
    if ($faixaPedida !== '') {
        if (!preg_match('/^bytes=(\d*)-(\d*)$/', $faixaPedida, $limites) || ($limites[1] === '' && $limites[2] === '')) {
            http_response_code(416);
            header('Content-Range: bytes */' . $tamanho);
            return;
        }
        if ($limites[1] === '') {
            $inicio = max(0, $tamanho - (int) $limites[2]);   // "bytes=-500": os últimos 500 bytes
        } else {
            $inicio = (int) $limites[1];
            if ($limites[2] !== '') {
                $fim = min($fim, (int) $limites[2]);
            }
        }
        if ($inicio > $fim) {
            http_response_code(416);
            header('Content-Range: bytes */' . $tamanho);
            return;
        }
        http_response_code(206);
        header('Content-Range: bytes ' . $inicio . '-' . $fim . '/' . $tamanho);
    }
    header('Content-Type: ' . TIPOS_DE_ARQUIVO_ESTATICO[$extensao]);
    header('X-Content-Type-Options: nosniff');
    header('Accept-Ranges: bytes');
    header('Cache-Control: public, max-age=3600');
    header('Content-Length: ' . ($fim - $inicio + 1));

    $leitor = fopen($caminhoReal, 'rb');
    if ($leitor === false) {
        return;
    }
    fseek($leitor, $inicio);
    $bytesRestantes = $fim - $inicio + 1;
    while ($bytesRestantes > 0) {
        $bloco = fread($leitor, min(65536, $bytesRestantes));
        if ($bloco === false || $bloco === '') {
            break;   // erro de leitura: para em vez de girar sem fim
        }
        echo $bloco;
        $bytesRestantes -= strlen($bloco);
    }
    fclose($leitor);
}
