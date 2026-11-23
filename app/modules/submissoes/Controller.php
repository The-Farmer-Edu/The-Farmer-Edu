<?php

require_once __DIR__ . '/../../core/arquivosEstaticos.php';
// require_once __DIR__ . '/Model.php';

class atividadesSub {
    public function showaluno() {
        require_once __DIR__ . '/view/aluno.html';
    }
    public function showtestarApi() {
        require_once __DIR__ . '/view/testarApi.php';
        }
    public function processarSubmisssao() {
        require_once __DIR__ . '/view/processar_submissao.php';
    }
    public function showiniciarAtv() {
        require_once __DIR__ . '/view/iniciaratv.html';
    }
       public function showrespostas() {
        require_once __DIR__ . '/view/respostas.html';
    }

    // Entrega CSS, JS e imagens das telas de submissão (rota submissoes/file&type=css|js|img&file=nome.ext).
    // Usa a função segura do core: só nomes simples, só as subpastas abaixo, só tipos estáticos, nunca executa o arquivo.
    // (Antes o caminho era montado direto com type/file e o arquivo passava por require_once: com "../" dava para ler e
    // até EXECUTAR arquivos fora da pasta de assets. A consulta remota de tipos MIME em svn.apache.org também saiu.)
    public function sendFile(): void {
        enviarArquivoEstatico(__DIR__ . '/view/assets', ['css', 'js', 'img']);
    }
}

?>