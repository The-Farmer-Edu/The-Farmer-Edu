<?php

class Usuario {
    public ?int $id = null;
    public string $nome = '';
    public string $email;
    public string $tipo = 'cliente';
    public string $tipo_formatado = ''; 
    private string $senha_hash;

    public function __construct(string $email, string $senha) {
        $this->email = $email;
        $this->definirSenha($senha);
    }

    public function getEmail(): string {
        return $this->email;
    }

    public function saudacao(): string {
        return "Olá, {$this->nome}!";
    }
    
    public function definirSenha(string $senha): void {
        $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
    }

    public function verificarSenha(string $senha): bool {
        return password_verify($senha, $this->senha_hash);
    }

    // MÉTODOS COLOCADOS DENTRO DA CLASSE:

    public function salvar(PDO $pdo): void {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)");
        $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
        $this->id = (int) $pdo->lastInsertId();
    }

    public static function buscarPorEmail(PDO $pdo, string $email): ?self {
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $dados = $stmt->fetch(PDO::FETCH_ASSOC);

        return $dados ? self::formatarDados($dados) : null;
    }

    
    private static function formatarDados(array $dados): self {
        $usuario = new self($dados['email'], '');
        $usuario->id = (int) $dados['id'];
        $usuario->nome = $dados['nome'] ?? '';
        $usuario->tipo = $dados['tipo_usuario'] ?? 'cliente';
        $usuario->senha_hash = $dados['senha_hash'] ?? '';

        return $usuario;
    }
}

// --- TESTE DE NOVO USUÁRIO ---

// 1. Inclua sua conexão PDO aqui
$pdo = new PDO("mysql:host=localhost;dbname=the_farmer_edu", "root", "");
try {
    // 1. Tenta criar a conexão
    $pdo = new PDO("mysql:host=localhost;dbname=the_farmer_edu", "root", "");
    
    // 2. Configura o PDO para lançar exceções se houver erros no banco
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "✅ Conexão realizada com sucesso!";
    
} catch (PDOException $e) {
    // 3. Se algo der errado, cai aqui e exibe a mensagem de erro detalhada
    echo "❌ Falha na conexão: " . $e->getMessage();
}
// 2. Criação e salvamento
$novoUsuario = new Usuario("felipe@gmail.com", "123456");
$novoUsuario->nome = "Felipe";
$novoUsuario->tipo = "admin";
$novoUsuario->salvar($pdo);

// 3. Busca
$buscarUsuario = Usuario::buscarPorEmail($pdo, "felipe@gmail.com");

if ($buscarUsuario) {
    echo $buscarUsuario->saudacao(); // Exibe: Olá, Felipe!
}