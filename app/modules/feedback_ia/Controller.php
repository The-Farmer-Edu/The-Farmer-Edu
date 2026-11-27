<?php
    require_once __DIR__ . '/../../core/database.php';
    require_once __DIR__ . '/../../core/arquivosEstaticos.php';
    

    class testarAPIController {
    public function showAvaliar(): void {
        // require_once __DIR__ . '/views/index.php';
        require_once __DIR__ . '/views/testeSIAE.php';
    }

    public function tremAvaliar(): void {
        // require_once __DIR__ . '/views/index.php';
        require_once __DIR__ . '/views/testarsalvarSIAE.php';
    }

    public function sendAvaliacao(): void {
        require_once __DIR__ . '/views/sendAvaliacao.php';
    }

    public function sendRespostaReferencia(): void {
        require_once __DIR__ . '/views/respostaReferencia.php';
    }
    public function showAvaliacao(): void {
        require_once __DIR__ . '/views/criteriosAvaliacao.php';
    }

    // Entrega as imagens da tela de avaliação (rota feedback_ia/file&type=img&file=nome.ext).
    // Usa a função segura do core: só nomes simples, só a subpasta "img", só tipos estáticos, nunca executa o arquivo.
    // (Antes o caminho era montado direto com type/file e o arquivo passava por require_once: com "../" dava para ler e
    // até EXECUTAR arquivos fora da pasta de assets.)
    public function sendFile(): void {
        enviarArquivoEstatico(__DIR__ . '/views/assets', ['css', 'img', 'js']);
    }
    }
?>