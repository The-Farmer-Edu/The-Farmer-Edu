<?php
require_once __DIR__ . '/../../core/database.php';
 
class Usuario {
    public const tipos = ['aluno', 'instrutor'];
 
    public ?int $id = null;
    public string $nome;
    public string $email;
    public string $tipo;
    public const MAX_TENTATIVAS = 3;
    public const MINUTOS_BLOQUEIO = 15;
    protected ?string $senha_hash = null; 
 
    public function __construct(string $nome, string $email, string $tipo, ?string $senha = null, bool $isHash = false) {
        $nome  = trim($nome);
        $email = strtolower(trim($email));
 
        if ($nome === '') {
            throw new InvalidArgumentException('Nome é obrigatório.');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('E-mail inválido.');
        }
        if (!in_array($tipo, self::tipos, true)) {
            throw new InvalidArgumentException('Tipo de usuário inválido.');
        }
 
        $this->nome  = $nome;
        $this->email = $email;
        $this->tipo  = $tipo;
 
        if ($senha !== null) {
            $this->definirSenha($senha, $isHash);
        }
    }
 
    public function definirSenha(string $senha, bool $isHash = false): void {
        if (!$isHash && strlen($senha) < 8) {
            throw new InvalidArgumentException('A senha deve ter ao menos 8 caracteres.');
        }
        $this->senha_hash = $isHash ? $senha : password_hash($senha, PASSWORD_BCRYPT);
    }
 
    public function verificarSenha(string $senha): bool {
        return $this->senha_hash !== null && password_verify($senha, $this->senha_hash);
    }
 
    public function segundosDeBloqueio(PDO $pdo): int {
        $stmt = $pdo->prepare('SELECT TIMESTAMPDIFF(SECOND, NOW(), bloqueado_ate)
        FROM usuarios WHERE id_usuario = ? AND bloqueado_ate IS NOT NULL');
        $stmt->execute([$this->id]);
        $s = $stmt->fetchColumn();
        return $s === false || $s === null ? 0 : max(0, (int) $s);
    }

    public function liberarSeBloqueioExpirou(PDO $pdo): void {
    $stmt = $pdo->prepare('UPDATE usuarios SET tentativas_login = 0,
    bloqueado_ate = NULL WHERE id_usuario = ? AND bloqueado_ate IS NOT NULL AND
    bloqueado_ate <= NOW()');
    $stmt->execute([$this->id]);
    }

    public function registrarFalhaLogin(PDO $pdo): int {
        $stmt = $pdo->prepare('UPDATE usuarios SET bloqueado_ate = 
        IF(tentativas_login + 1 >= ?, DATE_ADD(NOW(), INTERVAL ? MINUTE),
        bloqueado_ate), tentativas_login = tentativas_login + 1 WHERE id_usuario =?');
        $stmt->execute([self::MAX_TENTATIVAS, self::MINUTOS_BLOQUEIO, $this->id]);
        $stmt = $pdo->prepare('SELECT tentativas_login FROM usuarios WHERE id_usuario = ?');
        $stmt->execute([$this->id]);
        return max(0, self::MAX_TENTATIVAS - (int) $stmt->fetchColumn());
    }

    public function zerarTentativasLogin(PDO $pdo): void {
        $stmt = $pdo->prepare('UPDATE usuarios SET tentativas_login = 0,
            bloqueado_ate = NULL WHERE id_usuario = ?');
        $stmt->execute([$this->id]);
    }
    
    

    public function saudacao(): string {
        $nome = htmlspecialchars($this->nome, ENT_QUOTES, 'UTF-8');
        return "Olá, {$nome} seja bem-vindo a THE FARMER EDU.";
    }
 
    // Monta Usuario a partir de uma linha da tabela usuarios
    public static function formatarDados(array $dados): self {
        $usuario = new self($dados['nome'], $dados['email'], $dados['tipo_usuario'], $dados['senha_hash'], true);
        $usuario->id = (int) $dados['id_usuario'];
        return $usuario;
    }
 
    public function salvar(PDO $pdo): void {
        if ($this->senha_hash === null) {
            throw new LogicException('Defina a senha antes de salvar.');
        }
        if ($this->id !== null) {
            throw new LogicException('Usuário já foi cadastrado.');
        }
        if (self::buscarPorEmail($pdo, $this->email) !== null) {
            throw new RuntimeException('E-mail já cadastrado.');
        }
 
        $stmt = $pdo->prepare('INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)');
        $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
        $this->id = (int) $pdo->lastInsertId();
    }
 
    public static function buscarPorEmail(PDO $pdo, string $email): ?self {
        $stmt = $pdo->prepare('SELECT * FROM usuarios WHERE email = ?');
        $stmt->execute([strtolower(trim($email))]);
        $dados = $stmt->fetch(PDO::FETCH_ASSOC);
        return $dados ? self::formatarDados($dados) : null;
    }
}
 
class Instrutor extends Usuario {
    public array $materias = [];
    public array $id_materias = [];
 
    public function __construct(string $nome, string $email, string $senha, array $materias = [], bool $isHash = false) {
        parent::__construct($nome, $email, 'instrutor', $senha, $isHash);
        // array unique evita a mesma matéria duas vezes 
        $this->materias = array_values(array_unique($materias));
    }
 
    public function salvar(PDO $pdo): void {
        $pdo->beginTransaction();
        try {
            parent::salvar($pdo);
 
            $stmt = $pdo->prepare('INSERT INTO instrutores (id_usuario) VALUES (?)');
            $stmt->execute([$this->id]);
 
            foreach ($this->materias as $nomeMateria) {
                $idMateria = $this->salvarMateria($pdo, $nomeMateria);
                $this->id_materias[] = $idMateria;
                $this->vincularMateria($pdo, $idMateria);
            }
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            $this->id = null;
            $this->id_materias = [];
            throw $e;
        }
    }
 
    
    public function salvarMateria(PDO $pdo, string $nomeMateria): int {
        $existente = self::buscarMateria($pdo, $nomeMateria);
        if ($existente !== null) {
            return (int) $existente['id_materia'];
        }
        $stmt = $pdo->prepare('INSERT INTO materias (nome_materia) VALUES (?)');
        $stmt->execute([$nomeMateria]);
        return (int) $pdo->lastInsertId();
    }
 
    public function vincularMateria(PDO $pdo, int $idMateria): void {
        if ($this->id === null) {
            throw new LogicException('Salve o instrutor antes de vincular a matéria.');
        }
        $stmt = $pdo->prepare('INSERT INTO materias_instrutores (id_materia, id_instrutor) VALUES (?, ?)');
        $stmt->execute([$idMateria, $this->id]);
    }
 
    public static function buscarMateria(PDO $pdo, string $nomeMateria): ?array {
        $stmt = $pdo->prepare('SELECT * FROM materias WHERE nome_materia = ?');
        $stmt->execute([$nomeMateria]);
        $dados = $stmt->fetch(PDO::FETCH_ASSOC);
        return $dados ?: null;
    }
}
 
class Aluno extends Usuario {
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
 
            // Problema da matricula, como decidido que só iremos usar o email, mas o banco de dados tem a coluna da matricula como not null, então a matrícula é gerada aqui
            $this->matricula = date('Y') . str_pad((string) $this->id, 5, '0', STR_PAD_LEFT);
 
            $stmt = $pdo->prepare('INSERT INTO alunos (id_usuario, matricula, xp_total) VALUES (?, ?, ?)');
            $stmt->execute([$this->id, $this->matricula, $this->xp_total]);
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            $this->id = null;
            $this->matricula = null;
            throw $e;
        }
    }
}
 