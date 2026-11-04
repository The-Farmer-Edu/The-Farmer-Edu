<?php
    $env_data = parse_ini_file(__DIR__ . "/../.env");

    $code = '';
    for ($i = 0; $i < 6; $i++) {
        $code .= rand(0, 9);
    }

    use Mailtrap\Helper\ResponseHelper;
    use Mailtrap\MailtrapClient;
    use Mailtrap\Mime\MailtrapEmail;
    use Symfony\Component\Mime\Address;

    require __DIR__ . '/../vendor/autoload.php';

    $apiKey = $env_data['API_TOKEN_MAILTRAP'];
    $mailtrap = MailtrapClient::initSendingEmails(
        apiKey: $apiKey,
    );

    $email = (new MailtrapEmail())
        ->from(new Address('suporte@the-farmer-edu.pedrotech.com.br', 'Suporte - The Farmer Edu'))
        ->to(new Address("0001143444@senaimgaluno.com.br"))
        ->subject('Redefinição de Senha - The Farmer Edu')
        ->text("Código de redefinição de senha: $code")
        ->category('CENAI')
    ;

    $response = $mailtrap->send($email);

    var_dump(ResponseHelper::toArray($response));