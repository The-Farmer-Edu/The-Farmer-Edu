<?php

require_once __DIR__ . '/Model.php';

/**
 * Envio de Web Push (alertas no celular e no PC) usando a biblioteca minishlink/web-push.
 *
 * Se a biblioteca ou as chaves não estiverem configuradas, o push é simplesmente ignorado
 * (a notificação continua sendo gravada e aparecendo na tela). Nunca lança exceção.
 */
class NotificacoesPush
{
    private static $config = null;
    private static $tipos  = null;

    public static function config()
    {
        if (self::$config === null) {
            $carregado = [];
            $arquivo   = __DIR__ . '/push_config.php';

            if (is_file($arquivo)) {
                $carregado = require $arquivo;
            }

            self::$config = is_array($carregado) ? $carregado : [];
        }

        return self::$config;
    }

    public static function configurado()
    {
        $config = self::config();

        foreach (['vapid_public', 'vapid_private', 'subject'] as $chave) {
            if (empty($config[$chave]) || strpos((string) $config[$chave], 'COLE_AQUI') !== false) {
                return false;
            }
        }

        return true;
    }

    /**
     * Envia o push para todos os dispositivos dos usuários informados.
     *
     * @param array $idsUsuarios
     * @return int quantidade de dispositivos que receberam
     */
    public static function enviarParaUsuarios($pdo, $idsUsuarios, $tipo, $mensagem)
    {
        try {
            if (!self::configurado()) {
                return 0;
            }

            if (!self::carregarBiblioteca()) {
                error_log('[notificacoes] push ignorado: biblioteca minishlink/web-push não encontrada (rode: composer require minishlink/web-push)');
                return 0;
            }

            $assinaturas = NotificacoesModel::listarAssinaturas($pdo, $idsUsuarios);

            if (empty($assinaturas)) {
                return 0;
            }

            $config = self::config();

            $webPush = new \Minishlink\WebPush\WebPush(
    [
        'VAPID' => [
            'subject' => $config['subject'],
            'publicKey' => $config['vapid_public'],
            'privateKey' => $config['vapid_private'],
        ],
    ],
    ['TTL' => 86400, 'urgency' => 'high']
);

            $payload = json_encode([
                'titulo'   => self::tituloDoTipo($tipo),
                'mensagem' => $mensagem,
                'tipo'     => $tipo,
                'tag'      => 'farmer-' . uniqid(),
            ], JSON_UNESCAPED_UNICODE);

            foreach ($assinaturas as $assinatura) {
                $webPush->queueNotification(
                    \Minishlink\WebPush\Subscription::create([
                        'endpoint'        => $assinatura['endpoint'],
                        'publicKey'       => $assinatura['chave_p256dh'],
                        'authToken'       => $assinatura['chave_auth'],
                        'contentEncoding' => 'aes128gcm',
                    ]),
                    $payload
                );
            }

            $enviados = 0;

            foreach ($webPush->flush() as $relatorio) {
                if ($relatorio->isSuccess()) {
                    $enviados++;
                    continue;
                }

                // Dispositivo desinstalado/permissão removida: apaga para não tentar de novo.
                if ($relatorio->isSubscriptionExpired()) {
                    NotificacoesModel::removerAssinaturaPorEndpoint($pdo, $relatorio->getEndpoint());
                    continue;
                }

                error_log('[notificacoes] push falhou: ' . $relatorio->getReason());
            }

            return $enviados;

        } catch (Throwable $e) {
            error_log('[notificacoes] push erro: ' . $e->getMessage());
            return 0;
        }
    }

    private static function carregarBiblioteca()
    {
        $classe = 'Minishlink\\WebPush\\WebPush';

        if (class_exists($classe, false)) {
            return true;
        }

        $candidatos = [
            __DIR__ . '/vendor/autoload.php',
            __DIR__ . '/../../vendor/autoload.php',
            __DIR__ . '/../../../vendor/autoload.php',
        ];

        foreach ($candidatos as $autoload) {
            if (is_file($autoload)) {
                require_once $autoload;

                if (class_exists($classe)) {
                    return true;
                }
            }
        }

        return class_exists($classe);
    }

    private static function tituloDoTipo($tipo)
    {
        if (self::$tipos === null) {
            $carregado = [];
            $arquivo   = __DIR__ . '/tipos.php';

            if (is_file($arquivo)) {
                $carregado = require $arquivo;
            }

            self::$tipos = is_array($carregado) ? $carregado : [];
        }

        if (isset(self::$tipos[$tipo]['titulo'])) {
            return self::$tipos[$tipo]['titulo'];
        }

        return ucfirst(str_replace('_', ' ', (string) $tipo));
    }
}
