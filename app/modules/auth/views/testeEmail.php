<?php
    $env_data = parse_ini_file(__DIR__ . "/../.env");

    $code = '';
    for ($i = 0; $i < 6; $i++) {
        $code .= rand(0, 9);
    }

    use Mailtrap\Helper\ResponseHelper;
    use Mailtrap\Config;
    use Mailtrap\MailtrapClient;
    use Symfony\Component\Mime\Email; // <-- ALTERADO: Usando a classe nativa da Symfony para v1.x
    use Symfony\Component\Mime\Address;

    require __DIR__ . '/../vendor/autoload.php';

    $apiKey = $env_data['API_TOKEN_MAILTRAP'];
    
    // Configuração compatível com Mailtrap v1.x (PHP 8.0)
    $mailtrap = new MailtrapClient(new Config($apiKey));

    // ALTERADO: Instanciando Email() em vez de MailtrapEmail()
    $email = (new Email())
        ->from(new Address('suporte@the-farmer-edu.pedrotech.com.br', 'Suporte - The Farmer Edu'))
        ->to(new Address("0001143444@senaimgaluno.com.br"))
        ->subject('Redefinição - The Farmer Edu')
        ->text("Código de redefinição de senha: $code");
        // Nota: O método ->category() não existe na v1.x com a classe Email padrão, 
        // caso precise passar metadados específicos, remova-o daqui para evitar erros.

    // Envio compatível com a v1.x
    $response = $mailtrap->sending()->emails()->send($email);

    var_dump(ResponseHelper::toArray($response));
