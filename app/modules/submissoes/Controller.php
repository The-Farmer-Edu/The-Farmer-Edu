<?php
require_once __DIR__ . '/Model.php';
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
     * Método que dispara o processamento da submissão.
     * No fluxo atual, ele apenas inclui o script PHP responsável por receber JSON e lidar
     * com a avaliação; a lógica real fica no AvaliadorController.
     */
    public function processarSubmisssao() {
        require_once __DIR__ . '/view/processar_submissao.php';
    }

/**
 * Lê ?id= da URL e busca a atividade no banco.
 * Sem id válido ou sem registro, devolve null (a tela fica vazia e bloqueada).
 * Use ?debug=1 na URL para ver o erro real em vez de uma tela vazia.
 */
private function carregarAtividade(): ?array {
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) return null;

    try {
        return (new SubmissoesModel())->dadosParaView($id);
    } catch (Throwable $e) {
        error_log('[submissoes] ' . $e->getMessage());
        if (isset($_GET['debug'])) {
            header('Content-Type: text/plain; charset=UTF-8');
            exit('ERRO: ' . $e->getMessage() . "\n" . $e->getFile() . ':' . $e->getLine());
        }
        return null;
    }
}

public function showaluno() {
    $dadosAtividade = $this->carregarAtividade();
    require_once __DIR__ . '/view/aluno.html';
}

public function showiniciarAtv() {
    $dadosAtividade = $this->carregarAtividade();
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
     * Resolve o MIME type de um arquivo pela extensão.
     * Extensões fora do mapa caem em application/octet-stream.
     */
    private function resolverMimeType(string $caminhoArquivo): string {
        $extensao = strtolower(pathinfo($caminhoArquivo, PATHINFO_EXTENSION));
        return self::MIME_TYPES[$extensao] ?? 'application/octet-stream';
    }
}

