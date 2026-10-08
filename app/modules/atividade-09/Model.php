<?php 
class Usuario
{
    public $id;
    public $nome;
    public $email;
    public $tipo;
    private $senha_hash;

    public function __construct($id, $nome, $email, $tipo) {
        $this->id = $id;
        $this->nome = $nome;
        $this->email = $email;
        $this->tipo = $tipo;
         if(!empty($senha)){
                $this->definirSenha($senha);
            }
            $this->salvarUsuario(iniciarPDO());
    }

    public function saudacao(){
        return "Olá, " . $this->nome . "!";
    }

    public function definirSenha($senha){
        $this->senha_hash = password_hash($senha, PASSWORD_BCRYPT);
    }

  public function verificarSenha(string $senha): bool {
    return password_verify($senha, $this->senha_hash);
 }

}
        public function salvar(PDO $pdo): void {
            $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)");
            $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
            $this->id = (int) $pdo->lastInsertId();
        }
 
    
     public function salvarUsuario(PDO $pdo): void {
            $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario) VALUES (?, ?, ?, ?)");
            $stmt->execute([$this->nome, $this->email, $this->senha_hash, $this->tipo]);
            $this->id = (int) $pdo->lastInsertId();
     }

     public function buscarEmail(PDO $pdo, string $email): ?self{
        $stmt = $pdo-> prepare("SELECT * FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $dadosUsuario = $stmt->fetch();
            return dadosUsuario ? Usuario::formatarDadosUsuario($dadosUsuario);
     }
 

        public static function formatarDados(array $dadosUsuario): Usuario{
            $tipo_usuario = $dadosUsuario['tipo_usuario'];
            if ($tipo_usuario === 'instrutor'){
                $usuario = new Instrutor($dadosUsuario['nome'], $dadosUsuario['email'], "");
                $usuario->senha_hash = $dadosUsuario['senha_hash'];
                return $usuario;
            }
         }  