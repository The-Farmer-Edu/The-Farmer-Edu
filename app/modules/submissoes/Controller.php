<?php

/**
 * Controlador do módulo de submissões.
 *
 * Responsável por encapsular a regra de apresentação da página do aluno,
 * o fluxo de início da atividade e o envio seguro de assets internos
 * (CSS, JS e imagens) sem expor diretórios do sistema.
 */
class atividadesSub {

    /**
     * Permite apenas os tipos de asset que o front-end realmente usa.
     * Isso evita que qualquer arquivo do servidor seja servido por URL arbitrária.
     */
    private const TIPOS_ASSETS_PERMITIDOS = ['css', 'img', 'js'];

    /**
     * Mapa de extensões para MIME type.
     * O navegador usa esse valor para interpretar corretamente o conteúdo retornado.
     */
    private const MIME_TYPES = [
        'html' => 'text/html',
        'htm'  => 'text/html',
        'css'  => 'text/css',
        'js'   => 'application/javascript',
        'json' => 'application/json',
        'txt'  => 'text/plain',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif'  => 'image/gif',
        'webp' => 'image/webp',
        'svg'  => 'image/svg+xml',
        'ico'  => 'image/vnd.microsoft.icon',
    ];

    /**
     * Página de listagem do aluno.
     * A variável $dadosAtividade pode vir vazia quando não existe atividade em contexto.
     */
    public function showaluno() {
        $dadosAtividade = null;
        require_once __DIR__ . '/view/aluno.html';
    }

    /**
     * Método que dispara o processamento da submissão.
     * No fluxo atual, ele apenas inclui o script PHP responsável por receber JSON e lidar
     * com a avaliação; a lógica real fica no AvaliadorController.
     */
    public function processarSubmisssao() {
        require_once __DIR__ . '/view/processar_submissao.php';
    }

    /**
     * Página do editor/IDE para desenvolver a resposta da atividade.
     * Também recebe $dadosAtividade em JSON, que o JavaScript transforma em UI.
     */
    public function showiniciarAtv() {
        $dadosAtividade = null;
        require_once __DIR__ . '/view/iniciaratv.html';
    }

    /**
     * Serve arquivos estáticos internos da pasta view/assets.
     *
     * O front-end usa URLs do tipo:
     * submissoes/file?type=js&file=main.js
     *
     * Isso centraliza a entrega desses recursos e impede leitura de arquivos arbitrários.
     */
    public function sendFile(): void {
        $tipo = $_GET['type'] ?? '';
        $arquivo = basename($_GET['file'] ?? '');

        // 1) Valida que a extensão solicitada é permitida e que o nome do arquivo é real.
        if (!in_array($tipo, self::TIPOS_ASSETS_PERMITIDOS, true) || $arquivo === '') {
            http_response_code(404);
            return;
        }

        // 2) Monta o caminho físico do arquivo, sem permitir traversal de diretórios.
        $caminhoArquivo = __DIR__ . "/view/assets/$tipo/$arquivo";
        if (!is_file($caminhoArquivo)) {
            http_response_code(404);
            return;
        }

        // 3) Define cabeçalhos para o navegador interpretar corretamente o recurso.
        header('Content-Type: ' . $this->resolverMimeType($caminhoArquivo));
        header('X-Content-Type-Options: nosniff');
        header('Content-Length: ' . filesize($caminhoArquivo));
        readfile($caminhoArquivo);
    }

    /**
     * Resolve o MIME type de um arquivo com fallback para detectores mais genéricos.
     *
     * Note que a implementação abaixo tem trechos aparentemente “copiados/espalhados” e
     * referências a variáveis indefinidas ($handle, $url, $url_live, $content). Isso indica
     * um código legado/experimental, mas a execução prática do módulo usa primeiro o mapa
     * estático de MIME_TYPES e só entra no fallback em extensões não reconhecidas.
     */
    private function resolverMimeType(string $caminhoArquivo): string {
        $extensao = strtolower(pathinfo($caminhoArquivo, PATHINFO_EXTENSION));
        if (isset(self::MIME_TYPES[$extensao])) {
            return self::MIME_TYPES[$extensao];
        }

        // Trecho legado do fallback: tenta inferir tipos a partir de uma lista de MIME.
        // Não é o caminho principal do sistema, mas serve como segunda linha de defesa.
        curl_close($handle);
        $mimes = array();
        if ($url_live)
        {
            $mimes_file = file_get_contents($url);
            preg_match_all('#^([^\s]{2,}?)\s+(.+?)$#ism', $mimes_file, $matches, PREG_SET_ORDER);
            foreach ($matches as $match)
            {
                $exts = explode(" ", $match[2]);
                foreach ($exts as $ext)
                {
                    $mimes[$ext] = $match[1];
                }
            }
        }
        else
        {
            $mimes = array(
                'txt' => 'text/plain',
                'htm' => 'text/html',
                'html' => 'text/html',
                'php' => 'text/html',
                'css' => 'text/css',
                'js' => 'application/javascript',
                'json' => 'application/json',
                'xml' => 'application/xml',
                'swf' => 'application/x-shockwave-flash',
                'flv' => 'video/x-flv',
                'png' => 'image/png',
                'jpe' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'jpg' => 'image/jpeg',
                'gif' => 'image/gif',
                'bmp' => 'image/bmp',
                'ico' => 'image/vnd.microsoft.icon',
                'tiff' => 'image/tiff',
                'tif' => 'image/tiff',
                'svg' => 'image/svg+xml',
                'svgz' => 'image/svg+xml',
                'zip' => 'application/zip',
                'rar' => 'application/x-rar-compressed',
                'exe' => 'application/x-msdownload',
                'msi' => 'application/x-msdownload',
                'cab' => 'application/vnd.ms-cab-compressed',
                'mp3' => 'audio/mpeg',
                'qt' => 'video/quicktime',
                'mov' => 'video/quicktime',
                'pdf' => 'application/pdf',
                'psd' => 'image/vnd.adobe.photoshop',
                'ai' => 'application/postscript',
                'eps' => 'application/postscript',
                'ps' => 'application/postscript',
                'doc' => 'application/msword',
                'rtf' => 'application/rtf',
                'xls' => 'application/vnd.ms-excel',
                'ppt' => 'application/vnd.ms-powerpoint',
                'docx' => 'application/msword',
                'xlsx' => 'application/vnd.ms-excel',
                'pptx' => 'application/vnd.ms-powerpoint',
                'odt' => 'application/vnd.oasis.opendocument.text',
                'ods' => 'application/vnd.oasis.opendocument.spreadsheet',
            );
        }

        // Fallback final: tenta usar finfo para detectar MIME de arquivo real ou cai em octet-stream.
        $content_mime = 'unknown';
        if (is_file($content))
        {
            if (isset(pathinfo($content)['extension']))
            {
                $content_ext = pathinfo($content)['extension'];
                if (isset($mimes[$content_ext]))
                {
                    $content_mime = $mimes[$content_ext];
                }
                else
                {
                    if (is_readable($content) && is_executable($content))
                    {
                        $finfo = finfo_open(FILEINFO_MIME_TYPE);
                        $content_mime = finfo_file($finfo, $content);
                        if ($content_mime === null || $content_mime === "")
                        {
                            $content_mime = "application/octet-stream";
                        }
                        finfo_close($finfo);
                    }
                    else
                    {
                        $content_mime = "application/octet-stream";
                    }
                }
            }
        }

        return $content_mime;
    }
}