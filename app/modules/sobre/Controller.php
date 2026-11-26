<?php

/**
 * ============================================================================
 * MÓDULO SOBRE - CONTROLLER (Controller.php)
 * ============================================================================
 * Prepara os dados dos squads e carrega a view "Sobre os Desenvolvedores".
 * A página é pública: não exige login.
 * ============================================================================
 */

require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/session.php';

class SobreController
{
    private const TIPOS_DE_ARQUIVO = [
        'mp3' => 'audio/mpeg',
        'ogg' => 'audio/ogg',
        'wav' => 'audio/wav',
        'css' => 'text/css; charset=utf-8',
        'js' => 'text/javascript; charset=utf-8',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'json' => 'application/json',
        'txt' => 'text/plain; charset=utf-8',
    ];

    public function mostrarDesenvolvedores(): void
    {
        $squads = SobreModel::listarSquads();

        // Tema por perfil (Guia de Design): verde para aluno, azul para instrutor.
        $usuario      = usuarioLogado();
        $isInstructor = is_array($usuario) && ($usuario['perfilAcesso'] ?? '') === 'instrutor';
        $tema         = $isInstructor ? 'instrutor' : 'aluno';

        // Totais exibidos no topo da página
        $totalSquads = count($squads);
        $totalAlunos = array_sum(array_map(fn($s) => count($s['membros']), $squads));

        require __DIR__ . '/views/Sobre.php';
    }

    public function sendFile(): void
    {
        $tipo = $_GET['type'] ?? null;
        $arquivo = $_GET['file'] ?? null;
        if (!is_string($tipo) || !is_string($arquivo) || $tipo === '' || $arquivo === '' || strpos($tipo . $arquivo, "\0") !== false) {
            http_response_code(404);
            return;
        }
        $pasta = realpath(__DIR__ . '/views/assets');
        $caminhoArquivo = $pasta === false ? false : realpath($pasta . '/' . $tipo . '/' . $arquivo);
        $extensao = $caminhoArquivo === false ? '' : strtolower(pathinfo($caminhoArquivo, PATHINFO_EXTENSION));
        if (
            $caminhoArquivo === false || strpos($caminhoArquivo, $pasta . DIRECTORY_SEPARATOR) !== 0
            || !is_file($caminhoArquivo) || !isset(self::TIPOS_DE_ARQUIVO[$extensao])
        ) {
            http_response_code(404);
            return;
        }

        $tamanho = filesize($caminhoArquivo);
        $inicio = 0;
        $fim = $tamanho - 1;
        $faixa = $_SERVER['HTTP_RANGE'] ?? '';
        if ($faixa !== '') {
            if (!preg_match('/^bytes=(\d*)-(\d*)$/', $faixa, $limites) || ($limites[1] === '' && $limites[2] === '')) {
                http_response_code(416);
                header('Content-Range: bytes */' . $tamanho);
                return;
            }
            if ($limites[1] === '') {
                $inicio = max(0, $tamanho - (int) $limites[2]);   // "bytes=-500": os últimos 500 bytes
            } else {
                $inicio = (int) $limites[1];
                if ($limites[2] !== '') $fim = min($fim, (int) $limites[2]);
            }
            if ($inicio > $fim) {
                http_response_code(416);
                header('Content-Range: bytes */' . $tamanho);
                return;
            }
            http_response_code(206);
            header('Content-Range: bytes ' . $inicio . '-' . $fim . '/' . $tamanho);
        }
        header('Content-Type: ' . self::TIPOS_DE_ARQUIVO[$extensao]);
        header('X-Content-Type-Options: nosniff');
        header('Accept-Ranges: bytes');
        header('Cache-Control: no-cache');
        header('Content-Length: ' . ($fim - $inicio + 1));
        $leitor = fopen($caminhoArquivo, 'rb');
        fseek($leitor, $inicio);
        $restante = $fim - $inicio + 1;
        while ($restante > 0) {
            $bloco = fread($leitor, min(65536, $restante));
            if ($bloco === false || $bloco === '') break;   // erro de leitura: para em vez de girar sem fim
            echo $bloco;
            $restante -= strlen($bloco);
        }
        fclose($leitor);
    }
}
