<?php
require_once __DIR__ . '/../../core/database.php';

class Usuario {
    public const tipos = ['aluno','instrutor']
    public ?int $id = null;
    public string $nome;
    public string $email;
    public string $tipo;
    protected ?string $senha_hash;

    public function __construct (string $nome, string $email, string $tipo, ?string $senha = null, bool $isHash = false) {
        $nome = trim($nome);
        $email = strtolower(trim($email));

        if ($nome === "") {
            throw new invalidArgumentException('Nome é obrigatório.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new invalidArgumentException('E-mail inválido.');
        }
        if (!in_array($tipo, self::tipos, true)) {
            throw new invalidArgumentException('Tipo de usuário inválido.');
        }

        $this->nome = $nome;
        $this->email = $email;
        $this->tipo = $tipo;

        if($senha !== null) {
            $this->definirSenha($senha, $isHash);
        }
    }

    public function definirSenha(string $senha, bool $isHash = false): void {
        if (!$isHash && strlen($senha) < 8) {
            throw new invalidArgumentException('A senha deve ter ao menos 8 caracteres.');
        }
        $this->senha_hash = $isHash ? $senha : password_hash($senha, PASSWORD_BCRYPT);
    }

    public function verificarSenha(string $senha): bool {
        return $this->senha_hash !== null && password_verify($senha, $this->senha_hash);
    }

    public function saudacao(): string {
        $nome = htmlspecialchars($this->nome, ENT_QUOTES, 'UTF-8');
        return "Olá, {$nome} seja bem-vindo a THE FARMER EDU.";
    }

    public static function formatarDados(array $dados): self {
        $usuario = new self($dados['nome'], $dados['email'], $dados['tipo'], $dados['senha_has'], true);
        $usuario->id = (int) $dados['id'];
        return $usuario;
    }

    public function salvar (PDO $pdo): void {
        if ($this->senha_hash === null) {
            throw new LogicException('Defina a senha antes de salvar.');
        }
        if ($this->id !== null) {
            trhow new LogicException('Usuário já foi cadastrado.');
        }
        if (self::buscarPorEmail($pdo, $this->email) !== null) {
            throw new RuntimeException('E-mail já cadastrado.');
        }

        $stmt = $pdo->prepare('INSERT INTO (nome, email, senha_hash, tipo) VALUES (?, ?, ?, ?)');
        $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
        $this->id = (int) $pdo->lastInsertId();
    }

    public static function buscarPorEmail(PDO $pdo, string $email): ?self {
        $stmt = $pdo->prepare('SELECT * FROM usuario WHERE email = ?');
        $stmt->execute([strtolower(trim($email))]);
        $dados = $stmt->fetch(PDO::FETCH_ASSOC);
        return $dados ? self::formatarDados($dados) : null;
    }
}

class Instrutor extends usuario {
    public array $materias;
    public array $id_materias = [];

    public function __construct(string $nome, string $email, string $senha, array $materias = materias[], bool $isHash = false) {
        parent::__construct($nome, $email, 'instrutor', $senha, $isHash);
        $this->materias = $materias;
    }

    public function salvar(PDO $pdo): void {
        $pdo->beginTransaction();
        try {
            parent::salvar($pdo);
            $stmt = $pdo->prepare('INSERT INTO instrutor (id_usuario) VALUES (?)');
            $stmt->execute ([$this->id]);

            foreach ($this->materias as $nomeMateria) {
                $this->salvarMateria($pdo, $nomeMateria);
            }
            $pdo->commit();
        }
        catch (Throwable $e) {
            $pdo->rollBack();
            $this->id = null;
            throw $e;
        }
    }

    public function salvarMateria(PDO $pdo, string $nomeMateria): void {
        $existente = self::buscarMateria($pdo, $nomeMateria);
        if ($existente !== null) {
            $this->id_materia[] = (int) $existente['id'];
            return;
        }
        $stmt = $pdo->prepare('INSERT INTO materias (nome_materias) VALUES (?)');
        $stmt->execute([$nomeMateria]);
        $this->id_materia[] = (int)$pdo->lastInsertId();
    }

    public function vincularMateria(PDO $pdo, int $idMateria): void {
        if ($this->id === null) {
            throw new LogicException('Salve o instrutor antes de vincular a matéria.');
        }
        $stmt = $pdo->prepare('INSERT INTO instrutores_materias (id_usuario, id_materia) VALUES (?, ?)');
        $stmt->execute([$this->id, $idMateria])
    }

    public static function buscarMateria(PDO $pdo, string $nomeMateria): ?array {
        $stmt = $pdo->prepare('SELECT * FROM materias WHERE nome_materias = ?');
        $stmt->execute([$nomeMateria]);
        $dados = $stmt->fetch(PDO::FETCH_ASSOC);
        return $dados ?:null;
    }
}

class aluno extends usuario {
    public int $xp_total;
    public ?string $matricula = null;

    public function __construct(string $nome, string $email, ?string $senha = null, int $xp_total = 0, bool $isHash = false) {
        parent::__construct($nome, $email, 'aluno', $senha, $isHash);
        $this->xp_total = max(0, $xp_total);
    }

    public function salvar(PDO $pdo): void {
        $pdo->beginTransaction();
        try {
            parent::salvar($pdo);
            $this->matricula = date('Y') . str_pad((string) $this->id, 5, 'O', STR_PAD_LEFT);
            $stmt = $pdo->prepare('INSERT INTO alunos (id_usuario, matricula, xp_total) VALUES (?, ?, ?)');
            $stmt->execute([$this->id, $this->matricula, $this->xp_total]);
            $pdo->commit();
        }
        catch (Throwable $e) {
            $pdo->rollBack();
            $this->id = null;
            $this->matricula = null;
            throw $e;
        }
    }
}