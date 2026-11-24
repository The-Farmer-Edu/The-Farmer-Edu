<?php

/**
 * Configuração do Web Push (alertas no celular e no PC).
 *
 * Gere as chaves UMA vez, na pasta do módulo:
 *   php -r "require 'vendor/autoload.php'; print_r(Minishlink\WebPush\VAPID::createVapidKeys());"
 *
 * Cole a publicKey e a privateKey abaixo (ou defina as variáveis de ambiente
 * VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY e VAPID_SUBJECT).
 * A chave PRIVADA é secreta: não envie este arquivo para o GitHub depois de preenchido.
 */
return [
    'vapid_public'  => getenv('VAPID_PUBLIC_KEY')  ?: 'COLE_AQUI_A_CHAVE_PUBLICA',
    'vapid_private' => getenv('VAPID_PRIVATE_KEY') ?: 'COLE_AQUI_A_CHAVE_PRIVADA',
    'subject'       => getenv('VAPID_SUBJECT')     ?: 'mailto:seu-email@exemplo.com',
];
