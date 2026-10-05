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

    public function definirSenha (string $senha, bool $isHash): void {

        
        $isHash ? $this->senha_hash = $senha : $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
    }

    public function verificarSenha(string $senha): bool {
        return password_verify($senha, $this->senha_hash);
    }

    public function __construct(string $nome, string $email, string $tipo, string $senha, bool $isHash) {
        $this->nome = $nome;
        $this->email = $email;
        $this->tipo = $tipo;
        $this->definirSenha($senha, $isHash);
        $this->salvaUsuario(iniciarPDO());
        
    }

    public function salvaUsuario (PDO $pdo): void {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?,?,?,?)"); // função de salvar usuario no banco de dados com os parametros nome, email, senha_hash e tipo
        $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
        $this->id_usuarios=(int)$pdo->lastInsertId();
    }

    public static function buscarUsuario (PDO $pdo, string $email){
        $stmt =$pdo ->prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $dadosUsuario = $stmt->fetch();
        return $dadosUsuario ? self::formatarDadosUsuario($dadosUsuario) : null;
    }

    public static function formatarDadosUsuario(array $dadosUsuario): Usuario {
        if ($dadosUsuario['tipo_usuario'] === 'Instrutor') {
            return new Instrutor($dadosUsuario['nome'], $dadosUsuario['email'], $dadosUsuario['senha_hash'], $dadosUsuario['materias_lecionadas'], true);;
        elseif ($dadosUsuario['tipo_usuario'] === 'Aluno') {
            return new Aluno($dadosUsuario['nome'], $dadosUsuario['email'], $dadosUsuario['senha_hash'], $dadosUsuario['xp_total'], true);

    }

    }
}



class Instrutor extends Usuario {
    public array $materias_lecionadas;
    public array $id_materias;

    public function salvarInstrutor(PDO $pdo): void {
        $stmt = $pdo->prepare("INSERT INTO instrutores (id_usuario) VALUES (?)");
        $stmt->execute([$this->id])
    }   

    public function gerenciarMaterias(PDO $pdo, array $materias_lecionadas): void {
        foreach ($materias_lecionadas as $materia)
            if 
        
            

    }

    public function salvarMaterias(PDO $pdo, string $nome): void {
        $stmt = $pdo->prepare("INSERT INTO materias (id_materia, nome_materia) VALUES (?, ?)");
        // $stmt->execute([$this->id, this->])
        $this->id_materias[] = (int)$pdo->lastInsertId();

    }

    public static function buscarMaterias(PDO $pdo, string $nome): ?array{
        $stmt =$pdo->prepare("SELECT * FROM materias WHERE nome_materia = ?")
        $stmt -> execute([$nome]);
        $dadosMateria = $stmt->fetch();
        if ($dadosMateria) {
            return $dadosMateria;
        } else {
            return null;
        }
    }



    function __construct(string $nome, string $email, string $senha, array $materias_lecionadas, bool $isHash = false) {
        parent::__construct($nome, $email, 'Instrutor', $senha, $isHash);
        $this->materias_lecionadas = $materias_lecionadas;
    }
}



class Aluno extends Usuario {

    public int $xp_total;

    function __construct(string $nome, string $email, string $senha, string $xp_total, bool $isHash = false) {
        parent::__construct($nome, $email, 'Aluno', $senha, $isHash);
        $this->xp_total = $xp_total;
    }
 
}










