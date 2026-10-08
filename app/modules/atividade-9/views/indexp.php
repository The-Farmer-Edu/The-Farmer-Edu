<?php
require_once __DIR__ . '/../../../core/database.php';
require_once __DIR__ . '/../../../core/init_database.php';
require_once __DIR__ . '/../Model.php';

$pdo = inicializarBancoDados();

$testes = [];

// Teste 1: Criação de novo usuário
try {
    $email_teste = 'teste-' . time() . '@example.com';
    $usuario_teste = new Usuario09('João Silva', $email_teste, password_hash('senha123', PASSWORD_BCRYPT), 'aluno');
    $usuario_teste->salvar($pdo);
    $testes['teste1'] = [
        'status' => '✓ PASSOU',
        'resultado' => "Usuário criado com ID = {$usuario_teste->id}"
    ];
} catch (Exception $e) {
    $testes['teste1'] = [
        'status' => '✗ FALHOU',
        'resultado' => $e->getMessage()
    ];
}

// Teste 2: Busca de usuário por email
try {
    $usuario_buscado = Usuario09::buscarPorEmail($pdo, $email_teste);
    if ($usuario_buscado && $usuario_buscado->nome === 'João Silva' && $usuario_buscado->email === $email_teste) {
        $testes['teste2'] = [
            'status' => '✓ PASSOU',
            'resultado' => "Usuário encontrado - Nome: {$usuario_buscado->nome}, Email: {$usuario_buscado->email}, ID: {$usuario_buscado->id}"
        ];
    } else {
        $testes['teste2'] = [
            'status' => '✗ FALHOU',
            'resultado' => 'Dados não conferem'
        ];
    }
} catch (Exception $e) {
    $testes['teste2'] = [
        'status' => '✗ FALHOU',
        'resultado' => $e->getMessage()
    ];
}

// Teste 3: SQL Injection
try {
    $usuario_injection = Usuario09::buscarPorEmail($pdo, "' OR '1'='1");
    if ($usuario_injection === null) {
        $testes['teste3'] = [
            'status' => '✓ PASSOU',
            'resultado' => "SQL Injection bloqueado - Retorno NULL (prepared statement funciona!)"
        ];
    } else {
        $testes['teste3'] = [
            'status' => '✗ FALHOU',
            'resultado' => 'SQL Injection não foi bloqueado'
        ];
    }
} catch (Exception $e) {
    $testes['teste3'] = [
        'status' => '✗ FALHOU',
        'resultado' => $e->getMessage()
    ];
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Atividade 09 - Testes</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 5px; }
        h1 { color: #333; }
        .teste { margin: 20px 0; padding: 15px; border-left: 5px solid #ddd; background: #fafafa; }
        .passou { border-left-color: #28a745; background: #7c5353; }
        .falhou { border-left-color: #dc3545; background: #7c5353; }
        .status { font-weight: bold; font-size: 1.1em; margin-bottom: 5px; }
        .resultado { color: #555; }
        .links { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        a { color: #007bff; text-decoration: none; margin-right: 20px; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Atividade 09 - Usuario com Banco</h1>
        <p><strong>Resultados dos Testes Obrigatórios:</strong></p>

        <div class="teste <?= strpos($testes['teste1']['status'], 'PASSOU') !== false ? 'passou' : 'falhou' ?>">
            <div class="status">Teste 1: Salvando usuário novo</div>
            <div class="resultado"><?= htmlspecialchars($testes['teste1']['resultado']) ?></div>
            <div class="status"><?= $testes['teste1']['status'] ?></div>
        </div>

        <div class="teste <?= strpos($testes['teste2']['status'], 'PASSOU') !== false ? 'passou' : 'falhou' ?>">
            <div class="status">Teste 2: Buscando usuário por email</div>
            <div class="resultado"><?= htmlspecialchars($testes['teste2']['resultado']) ?></div>
            <div class="status"><?= $testes['teste2']['status'] ?></div>
        </div>

        <div class="teste <?= strpos($testes['teste3']['status'], 'PASSOU') !== false ? 'passou' : 'falhou' ?>">
            <div class="status">Teste 3: SQL Injection (' OR '1'='1)</div>
            <div class="resultado"><?= htmlspecialchars($testes['teste3']['resultado']) ?></div>
            <div class="status"><?= $testes['teste3']['status'] ?></div>
        </div>
    </div>
</body>
</html>