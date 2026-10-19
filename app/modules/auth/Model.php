<?php
require_once __DIR__ . '/../../core/database.php';

class Usuario {
    public ?int $id = null;
    public string $nome;
    public string $email;
    public string $tipo;
    private string $senha_hash; 

    public function __construct(string $nome, string $email, string $tipo, ?string $senha = null, bool $isHash = false) {
        $this->nome = $nome;
        $this->email = $email;
        $this->tipo = $tipo;
        if ($senha !== null) {
            $this->definirSenha($senha, $isHash);
            $this->salvarUsuario(iniciarPDO());
        }
    }

    public function definirSenha(string $senha, bool $isHash): void {
        if ($isHash) {
            $this->senha_hash = $senha;
        } 
        else {
            $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
        }
    }

    public function verificarSenha(string $senha): bool {
        return password_verify($senha, $this->senha_hash);
    }

    public function saudacao(): string {
        return "Olá, meu nome é {$this->nome} e meu email é {$this->email}.";
    }

    private static function formatarDados(array $dados): self {
        $usuario = new self($dados['nome'], $dados['email'], $dados['tipo'], null, true);
        $usuario->id = (int)$dados['id'];
        $usuario->senha_hash = $dados['senha_hash'];
        return $usuario;
    }

    public function salvarUsuario(PDO $pdo): void {
        $stmt = $pdo->prepare("INSERT INTO usuario (nome, email, senha_hash, tipo) VALUES (?, ?, ?, ?)");
        $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
        $this->id = (int)$pdo->lastInsertId();
    }

    public static function buscarPorEmail(PDO $pdo, string $email): ?self {
        $stmt = $pdo->prepare("SELECT * FROM usuario WHERE email = ?");
        $stmt->execute([$email]);
        $dados = $stmt->fetch();
        return $dados ? self::formatarDados($dados) : null;
   }    
}

class Instrutor extends Usuario {
    public array $materias;
    public array $id_materias;

    public function __construct(string $nome, string $email, array $materias) {
        parent::__construct($nome, $email, 'instrutor', null, false);
        $this->materias = $materias;
    }
    public function salvarInstrutor(PDO $pdo): void {
        $stmt = $pdo->prepare("INSERT INTO instrutor (id_usuario) VALUES (?)");
        $stmt->execute([$this->id]);
    }

    public function salvarMaterias(PDO $pdo, string $nome_materias): void {
        $stmt = $pdo->prepare("INSERT INTO materias (nome_materias) VALUES (?)");
        $stmt->execute([$nome_materias]);
        $this->id_materias[]= (int)$pdo->lastInsertId();
    }
    public static function buscarMaterias(PDO $pdo, string $nome_materia): ?array {
        $stmt = $pdo->prepare("SELECT * FROM materias WHERE nome_materias = ?");
        $stmt->execute([$nome_materia]);
        $dadosMateria = $stmt->fetch();
        return $dadosMateria === false ? null : $dadosMateria;
    }  
}

class Aluno extends Usuario {
    public int $xp_total;
    public string $matricula;
    
    public function __construct(string $nome, string $email, string $senha, int $xp_total, bool $isHash = false) {
        parent::__construct($nome, $email, 'aluno', $senha, $xp_total, $isHash);
        $this->xp_total = $xp_total;
        $this->matricula = (string)$this->id;

        $pdo = iniciarPDO();
        $this->salvarUsuario($pdo);
    }

    public function salvarUsuario(PDO $pdo) {
        $stmt = $pdo->prepare("INSERT INTO alunos (id_usuario, matricula, xp_total");
        $stmt->execute([$this->id, $this->matricula, $this->xp_total]);
    }
}