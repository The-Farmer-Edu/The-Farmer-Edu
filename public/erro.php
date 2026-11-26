<?php
/**
 * ============================================================================
 * The Farmer Edu — Tela de erros generalizada (public/erro.php)
 * ============================================================================
 * Uma única tela para todos os erros HTTP convencionais (400, 401, 403, 404,
 * 405, 408, 410, 413, 429, 500, 502, 503, 504 e qualquer outro 4xx/5xx).
 *
 * É AUTOSSUFICIENTE DE PROPÓSITO: não usa sessão, banco, cabeçalho oficial nem
 * CSS externo, para continuar funcionando justamente quando o sistema falhou.
 *
 * COMO O CÓDIGO É DEFINIDO (nesta ordem)
 *   1. variável $codigoErro, quando o arquivo é incluído (ex.: pelo Router)
 *   2. REDIRECT_STATUS, quando o Apache usa esta página em um ErrorDocument
 *   3. código HTTP já definido na resposta (>= 400)
 *   4. ?codigo=NNN (apenas para testar a tela no navegador)
 *   5. 404, se nada acima se aplicar
 *
 * USOS
 *   - Router / index.php:   $codigoErro = 404; require __DIR__ . '/erro.php';
 *   - Apache (PHP ativo):   ErrorDocument 404 /erro.php
 *   - Apache (à prova de queda do PHP): gere os HTML estáticos com
 *         php public/erro.php --estatico
 *     e aponte o ErrorDocument para /erros/404.html (ver docs/apache-erros.conf)
 *
 * Requisições que pedem JSON (Accept: application/json ou XMLHttpRequest)
 * recebem {"erro":404,"titulo":"...","mensagem":"..."} em vez de HTML.
 * ============================================================================
 */

if (!function_exists('tfeCatalogoErros')) {

    /**
     * Catálogo de mensagens. Textos em linguagem simples: dizem o que aconteceu
     * e o que a pessoa pode fazer. "acoes" define os botões (o 1º é o principal):
     * inicio | entrar | recarregar | voltar
     */
    function tfeCatalogoErros(): array
    {
        return [
            400 => ['titulo' => 'Requisição inválida',
                    'texto'  => 'O servidor não entendeu o que foi enviado. Volte, confira os dados e tente de novo.',
                    'balao'  => 'Algo veio embaralhado no caminho. Confere os dados e envia de novo?',
                    'acoes'  => ['voltar', 'inicio']],
            401 => ['titulo' => 'Login necessário',
                    'texto'  => 'Você precisa entrar na sua conta para abrir esta página.',
                    'balao'  => 'Esse portão só abre com login.',
                    'acoes'  => ['entrar', 'inicio']],
            403 => ['titulo' => 'Acesso negado',
                    'texto'  => 'Seu perfil não tem permissão para abrir esta página. Se você acha que deveria ter acesso, fale com seu instrutor.',
                    'balao'  => 'Essa porteira está trancada para o seu perfil.',
                    'acoes'  => ['inicio', 'voltar']],
            404 => ['titulo' => 'Página não encontrada',
                    'texto'  => 'O endereço não existe ou foi movido. Confira se ele foi digitado certo ou volte para o início.',
                    'balao'  => 'Procurei pela fazenda toda e não achei essa página.',
                    'acoes'  => ['inicio', 'voltar']],
            405 => ['titulo' => 'Ação não permitida',
                    'texto'  => 'Esta página não aceita o tipo de solicitação enviado. Volte e use os botões do próprio sistema.',
                    'balao'  => 'Esse caminho só se atravessa de outro jeito.',
                    'acoes'  => ['voltar', 'inicio']],
            408 => ['titulo' => 'Tempo esgotado',
                    'texto'  => 'A conexão demorou demais para enviar os dados. Verifique sua internet e tente de novo.',
                    'balao'  => 'A internet demorou demais para chegar. Tenta de novo?',
                    'acoes'  => ['recarregar', 'inicio'],
                    'tecnico' => true],
            410 => ['titulo' => 'Página removida',
                    'texto'  => 'Este conteúdo foi removido e não voltará. Procure o que precisa a partir do início.',
                    'balao'  => 'Essa parte da fazenda foi desativada.',
                    'acoes'  => ['inicio']],
            413 => ['titulo' => 'Arquivo grande demais',
                    'texto'  => 'O arquivo enviado passou do tamanho permitido. Reduza o arquivo ou envie uma versão menor.',
                    'balao'  => 'Esse arquivo não cabe no carrinho. Tenta um menor?',
                    'acoes'  => ['voltar', 'inicio']],
            429 => ['titulo' => 'Muitas tentativas',
                    'texto'  => 'Foram muitas solicitações em pouco tempo. Aguarde alguns minutos e tente de novo.',
                    'balao'  => 'Calma, uma coisa de cada vez. Espera um pouquinho.',
                    'acoes'  => ['recarregar', 'inicio']],
            500 => ['titulo' => 'Erro no servidor',
                    'texto'  => 'Algo falhou do nosso lado e a página não pôde ser carregada. Tente de novo em alguns instantes.',
                    'balao'  => 'Tropecei em algo aqui dentro. Tenta de novo daqui a pouco.',
                    'acoes'  => ['recarregar', 'inicio'],
                    'tecnico' => true],
            502 => ['titulo' => 'Falha de comunicação',
                    'texto'  => 'Dois serviços do sistema não conseguiram se comunicar. Aguarde um instante e recarregue a página.',
                    'balao'  => 'A linha entre dois serviços caiu. Já já volta.',
                    'acoes'  => ['recarregar', 'inicio'],
                    'tecnico' => true],
            503 => ['titulo' => 'Sistema indisponível',
                    'texto'  => 'O sistema está em manutenção ou sobrecarregado. Volte em alguns minutos.',
                    'balao'  => 'Estou arrumando a fazenda. Volta daqui a pouco!',
                    'acoes'  => ['recarregar', 'inicio'],
                    'tecnico' => true],
            504 => ['titulo' => 'Resposta demorou demais',
                    'texto'  => 'O servidor levou tempo demais para responder. Recarregue a página em instantes.',
                    'balao'  => 'Esperei, esperei e ninguém respondeu. Tenta de novo?',
                    'acoes'  => ['recarregar', 'inicio'],
                    'tecnico' => true],
        ];
    }

    /** Códigos que ganham uma página estática em public/erros/. */
    function tfeCodigosConhecidos(): array
    {
        return array_keys(tfeCatalogoErros());
    }

    /** Descobre o código a partir da requisição (ver cabeçalho do arquivo). */
    function tfeCodigoDaRequisicao(): int
    {
        $candidatos = [
            $_SERVER['REDIRECT_STATUS'] ?? null,
            http_response_code() ?: null,
            $_GET['codigo'] ?? null,
        ];
        foreach ($candidatos as $c) {
            if (is_numeric($c) && (int) $c >= 400 && (int) $c <= 599) {
                return (int) $c;
            }
        }
        return 404;
    }

    /** Dados de um código; códigos fora do catálogo caem no genérico 4xx/5xx. */
    function tfeDadosDoErro(int $codigo): array
    {
        $catalogo = tfeCatalogoErros();
        if (isset($catalogo[$codigo])) {
            return $catalogo[$codigo];
        }
        if ($codigo >= 500) {
            return $catalogo[500];
        }
        return ['titulo' => 'Não foi possível concluir',
                'texto'  => 'O sistema não conseguiu atender esta solicitação. Volte e tente de novo.',
                'balao'  => 'Esse pedido não deu certo. Vamos tentar outra vez?',
                'acoes'  => ['voltar', 'inicio']];
    }

    /** Caminho base da aplicação (vazio quando o DocumentRoot é a pasta public). */
    function tfeBaseUrl(): string
    {
        $dir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
        return ($dir === '/' || $dir === '\\' || $dir === '.' || $dir === '') ? '' : rtrim(str_replace('\\', '/', $dir), '/');
    }

    /** Monta o HTML completo da tela de erro. */
    function tfeHtmlErro(int $codigo, string $base, string $horario = ''): string
    {
        $d   = tfeDadosDoErro($codigo);
        $h   = fn($v) => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
        $b   = $h($base);
        $inicio = $b . '/';

        $botoes = '';
        foreach ($d['acoes'] as $i => $acao) {
            $classe = $i === 0 ? 'btn btn-primario' : 'btn btn-secundario';
            switch ($acao) {
                case 'inicio':
                    $botoes .= "<a class=\"$classe\" href=\"$inicio\">Ir para o início</a>";
                    break;
                case 'entrar':
                    $botoes .= "<a class=\"$classe\" href=\"$b/auth/loginAluno\">Entrar na conta</a>";
                    break;
                case 'recarregar':
                    $botoes .= "<button type=\"button\" class=\"$classe\" data-acao=\"recarregar\">Tentar novamente</button>";
                    break;
                case 'voltar':
                    $botoes .= "<button type=\"button\" class=\"$classe\" data-acao=\"voltar\">Voltar</button>";
                    break;
            }
        }

        $ajuda = '';
        if (!empty($d['tecnico'])) {
            $ajuda = '<p class="ajuda">Se o problema continuar, avise seu instrutor informando o código <strong>'
                   . (int) $codigo . '</strong>.<span data-agora>'
                   . ($horario !== '' ? ' Horário: ' . $h($horario) : '') . '</span></p>';
        }

        $titulo = $h($d['titulo']);
        $texto  = $h($d['texto']);
        $balao  = $h($d['balao']);
        $cod    = (int) $codigo;

        return <<<HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#A0FDA3">
<title>Erro {$cod} · {$titulo} · The Farmer Edu</title>
<link rel="icon" type="image/x-icon" href="{$b}/assets/img/ico/logo_icone.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet">
<style>
:root{
  --verde:#1B5E20; --verde-escuro:#089C2F; --verde-claro:#A0FDA3;
  --laranja:#FF8D28; --navy:#002D38; --cinza:#727272; --item:#D9D9D9; --fundo:#F1FBF3;
  --sombra:0 4px 4px rgba(0,0,0,.25); --brilho:0 4px 3px rgba(248,96,17,.5);
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;min-height:100vh;position:relative;display:flex;flex-direction:column;
  background:var(--fundo);color:var(--navy);font-family:'Inter','Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased}

/* Cabeçalho simplificado (mesma identidade do cabeçalho oficial, sem depender de sessão) */
.topo{background:var(--verde-claro);box-shadow:var(--brilho);border-radius:0 0 10px 10px}
.topo-int{max-width:1100px;margin:0 auto;padding:10px clamp(16px,4vw,40px);min-height:64px;display:flex;align-items:center}
.marca{display:inline-flex;align-items:center;gap:12px;color:var(--navy);text-decoration:none;
  font-family:'Poppins',sans-serif;font-weight:700;font-size:20px}
.marca img{width:42px;height:42px;border-radius:50%;background:#fff;padding:2px;box-shadow:0 2px 5px rgba(0,0,0,.12)}
.marca b{color:var(--verde-escuro);font-weight:800}
.marca:focus-visible{outline:3px solid var(--laranja);outline-offset:4px;border-radius:12px}

main{flex:1;width:100%;max-width:1100px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);
  align-items:center;gap:clamp(28px,5vw,72px);padding:clamp(32px,6vw,80px) clamp(16px,4vw,40px) 120px}

/* Barra de título "colada à mão" (-0.35°), igual aos cards de matéria */
.etiqueta{display:inline-block;padding:7px 18px;border-radius:10px;background:var(--verde-claro);color:#000;
  font-family:'Poppins',sans-serif;font-weight:700;font-size:15px;line-height:1.2;transform:rotate(-.35deg)}
h1{margin:20px 0 0;font-family:'Poppins',sans-serif;font-weight:800;font-size:clamp(32px,5.5vw,52px);
  line-height:1.08;letter-spacing:-.02em}
.texto{margin:18px 0 0;max-width:46ch;font-size:18px;line-height:1.6;color:#3A4A4D}
.ajuda{margin:14px 0 0;max-width:46ch;font-size:15px;line-height:1.55;color:var(--cinza)}
.acoes{display:flex;flex-wrap:wrap;gap:14px;margin-top:30px}

.btn{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 28px;border-radius:999px;
  font-family:'Poppins',sans-serif;font-weight:600;font-size:15px;text-decoration:none;cursor:pointer;
  transition:transform .15s ease,box-shadow .15s ease,background .15s ease,color .15s ease}
.btn-primario{background:var(--verde);color:#fff;border:2px solid var(--verde)}
.btn-primario:hover{transform:translateY(-1px);box-shadow:var(--brilho)}
.btn-secundario{background:transparent;color:var(--navy);border:2px solid var(--navy)}
.btn-secundario:hover{background:var(--navy);color:#fff}
.btn:focus-visible{outline:3px solid var(--laranja);outline-offset:3px}

/* Sophia + balão de chat (elemento de marca do guia: balão branco, raio 49px, Inter Bold) */
.cena{display:flex;flex-direction:column;align-items:flex-start}
.balao{position:relative;max-width:340px;padding:22px 30px;background:#fff;border:2px solid var(--item);
  border-radius:49px;box-shadow:var(--sombra);font-family:'Inter',sans-serif;font-weight:700;font-size:17px;line-height:1.45}
.balao::after{content:"";position:absolute;left:58px;bottom:-13px;width:22px;height:22px;background:#fff;
  border-right:2px solid var(--item);border-bottom:2px solid var(--item);border-bottom-right-radius:6px;transform:rotate(45deg)}
.sophia{width:min(230px,52vw);height:auto;margin:22px 0 0 18px;image-rendering:pixelated}

.galinha{position:absolute;right:clamp(12px,3vw,36px);bottom:clamp(10px,2vw,24px);width:72px;height:auto;image-rendering:pixelated}

@media (max-width:760px){
  main{grid-template-columns:1fr;align-items:start;padding-bottom:110px}
  .texto{font-size:17px}
  .btn{flex:1 1 auto}
}
@media (prefers-reduced-motion:reduce){.btn{transition:none}}
</style>
</head>
<body>
<header class="topo">
  <div class="topo-int">
    <a class="marca" href="{$inicio}" aria-label="The Farmer Edu, ir para o início">
      <img src="{$b}/assets/img/svg/logo_icone.svg" alt="" onerror="this.style.display='none'">
      <span>The Farmer <b>Edu</b></span>
    </a>
  </div>
</header>

<main>
  <section>
    <span class="etiqueta">Erro {$cod}</span>
    <h1>{$titulo}</h1>
    <p class="texto">{$texto}</p>
    {$ajuda}
    <div class="acoes">{$botoes}</div>
  </section>

  <aside class="cena" aria-label="Mensagem da Sophia">
    <div class="balao" role="note">{$balao}</div>
    <img class="sophia" src="{$b}/assets/img/mascotes/sophia.webp" alt="Sophia, a assistente do The Farmer Edu" width="256" height="256" onerror="this.style.display='none'">
  </aside>
</main>

<img class="galinha" src="{$b}/assets/img/mascotes/galinha.png" alt="" aria-hidden="true" onerror="this.style.display='none'">

<script>
(function(){
  var inicio = "{$inicio}";
  document.addEventListener('click', function(e){
    var el = e.target.closest('[data-acao]');
    if(!el) return;
    if(el.dataset.acao === 'recarregar'){ location.reload(); }
    if(el.dataset.acao === 'voltar'){ history.length > 1 ? history.back() : (location.href = inicio); }
  });
  var agora = document.querySelector('[data-agora]');
  if(agora){
    agora.textContent = ' Horário: ' + new Date().toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
  }
})();
</script>
</body>
</html>
HTML;
    }

    /** Versão JSON para chamadas de API/AJAX. */
    function tfePedeJson(): bool
    {
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        return stripos($accept, 'application/json') !== false
            || strtolower($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'xmlhttprequest';
    }
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

// Linha de comando: gera as páginas estáticas em public/erros/NNN.html
if (PHP_SAPI === 'cli') {
    if (in_array('--estatico', $argv ?? [], true)) {
        $pasta = __DIR__ . '/erros';
        if (!is_dir($pasta)) {
            mkdir($pasta, 0755, true);
        }
        foreach (tfeCodigosConhecidos() as $c) {
            file_put_contents("$pasta/$c.html", tfeHtmlErro($c, ''));
            echo "erros/$c.html\n";
        }
    } else {
        echo "Uso: php public/erro.php --estatico\n";
    }
    return;
}

$tfeCodigo = isset($codigoErro) ? (int) $codigoErro : tfeCodigoDaRequisicao();
if ($tfeCodigo < 400 || $tfeCodigo > 599) {
    $tfeCodigo = 404;
}

if (!headers_sent()) {
    http_response_code($tfeCodigo);
    header('Cache-Control: no-store');
    header('X-Robots-Tag: noindex, nofollow');
    if ($tfeCodigo === 503 || $tfeCodigo === 429) {
        header('Retry-After: 120');
    }
}

$tfeDados = tfeDadosDoErro($tfeCodigo);

if (tfePedeJson()) {
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=UTF-8');
    }
    echo json_encode(['erro' => $tfeCodigo, 'titulo' => $tfeDados['titulo'], 'mensagem' => $tfeDados['texto']], JSON_UNESCAPED_UNICODE);
    return;
}

if (!headers_sent()) {
    header('Content-Type: text/html; charset=UTF-8');
}
echo tfeHtmlErro($tfeCodigo, tfeBaseUrl(), date('d/m/Y H:i'));
return;
