<?php
use Mailtrap\Config;
use Mailtrap\MailtrapClient;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

require_once __DIR__ . '/vendor/autoload.php';

class EnviadorEmail {
    public static function enviarCodigoRecuperacao(string $email, string $nome, string $codigo): void {
        $env   = @parse_ini_file(__DIR__ . '/.env');
        $token = $env['API_TOKEN_MAILTRAP'] ?? '';
        if ($token === '') {
            throw new RuntimeException('API_TOKEN_MAILTRAP não configurado no .env do módulo auth.');
        }

        $minutos  = RecuperacaoSenha::VALIDADE_MINUTOS;
        $nomeHtml = htmlspecialchars($nome, ENT_QUOTES, 'UTF-8');

        $mensagem = (new Email())
            ->from(new Address('suporte@the-farmer-edu.pedrotech.com.br', 'Suporte - The Farmer Edu'))
            ->to(new Address($email, $nome))
            ->subject('Redefinição de senha - The Farmer Edu')
            ->text("Olá, $nome!\n\nSeu código de redefinição de senha é: $codigo\n\nEle vale por $minutos minutos. Se você não pediu a redefinição, ignore este e-mail.")
            ->html("<p>Olá, {$nomeHtml}!</p><p>Seu código de redefinição de senha é:</p>"
                . "<p style=\"font-size:28px;letter-spacing:6px;\"><strong>{$codigo}</strong></p>"
                . "<p>Ele vale por {$minutos} minutos. Se você não pediu a redefinição, ignore este e-mail.</p>");

        $mailtrap = new MailtrapClient(new Config($token));
        $mailtrap->sending()->emails()->send($mensagem);
    }
}