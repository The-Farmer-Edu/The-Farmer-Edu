<?php
require '/../../core/database.php'

class Usuario {
    protected int $id;
    public string $nome;
    public string $email;
    public string $tipo; // instrutor ou aluno
    private string $senha_hash;

    public function saudacao(): string{
        return "Olá; {$this->nome}!";
    }

    public function definirSenha (string $senha): void {
        $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
    }

    public function verificarSenha(string $senha): bool {
        return password_verify($senha, $this->senha_hash);
    }

    public function __construct(string $nome, string $email, string $tipo, string $senha) {
        $this->nome = $nome;
        $this->email = $email;
        $this->tipo = $tipo;
        $this->definirSenha($senha);
        $this->salvaUsuario(iniciarPDO());
        
    }

    public function salvaUsuario (PDO $pdo): void {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES (?,?,?,?)"); // continua com os tipos de usuário?
        $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
        $this->id_usuarios=(int)$pdo->lastInsertId();
    }

    public static function buscarUsuario (PDO $pdo, string $email){
        $stmt =$pdo ->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $dadosUsuario = $stmt->fetch();
    return $dadosUsuario ? self::formatarDadosUsuario($dadosUsuario) : null;
    }


}



class Instrutor extends Usuario {
    public array $materias_lecionadas;

    function __construct(string $nome, string $email, string $senha, array $materias_lecionadas) {
        parent::__construct($nome, $email, 'Instrutor', $senha);
        $this->materias_lecionadas = $materias_lecionadas;
    }
}



class Aluno extends Usuario {

    public int $xp_total;

    function __construct(string $nome, string $email, string $senha, string $xp_total) {
        parent::__construct($nome, $email, 'Aluno', $senha);
        $this->xp_total = $xp_total;
    }
 
}










