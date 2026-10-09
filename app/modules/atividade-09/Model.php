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

      class Instrutor extends Usuario{
        public array $materias_lecionadas;
        public array $id_materias;

        public function __construct(string $nome, string $email, string $senha, array $materias_lecionadas){
            parent::__construct($nome, $email, 'instrutor', $senha);
            $this->materias_lecionadas = $materias_lecionadas;

            $this->salvarInstrutor(iniciarPDO());
            $this->gerenciarMaterias(iniciarPDO(), $materias_lecionadas);
            $this->relacionarId(iniciarPDO());
        }
      }
        public function salvarInstrutor(PDO $pdo): void {
            $stmt = $pdo->prepare("INSERT INTO instrutores (id_usuario) VALUES (?)");
            $stmt->execute([$this->id]);
        }

          public function gerenciarMaterias(PDO $pdo, array $materias_lecionadas): void {
            foreach($materias_lecionadas as $materia) {
                $materiaDb = $this->buscarMaterias($pdo, $materia);
                if ($materiaDb === null){
                  
                    $this->salvarMaterias($pdo, $materia);
                }
                 else {
                    $this->id_materias[] =(int)$materia['id_materia'];
                
                }
            }
        }

        public function salvarMaterias(PDO $pdo, string $materia): void {
            $stmt = $pdo->prepare("INSERT INTO materias (nome_materia) VALUES (?)");
            $stmt->execute([$materia]);
            $this->id_materias[] = (int)$pdo->LastInsertId();
        } 
    

    public function buscarMaterias(PDO $pdo, string $materia): void {
        $stmt = $pdo->prepare("SELECT * FROM materias WHERE nome_materia = ?");
        $stmt->execute([$materia]);
        $dadosMateria = $stmt->fetch();
         if ($dadosMateria){
            return $dadosMateria;
        } else {
            return null;
         }
    }

     public function relacionarId(PDO $pdo){
        foreach($this->id_materias as $id_materia){
            $stmt = $pdo->prepare("INSERT INTO materias_instrutores (id_materia, id_instrutor) VALUES (?,?)");
            $stmt->execute([$id_materia, $this->id]);
        }
    }

    class Aluno extends Usuario{
        public int $xptotal;
        public string $matricula;
        function __construct(string $nome, string $email, string $senha, int $xptotal){
            parent::__construct($nome, $email, 'aluno', $senha, $ishash)
            this->xptotal= $xptotal; 
            
        }
    }

       public function __construct(string $nome, string $email, string $senha, string $matricula, int $xp_total = 0, bool $salvarUsuario = true){
            parent::__construct($nome,  $email, 'Aluno', $senha);
            $this->xp_total = $xp_total;
            $this->matricula = $matricula;
            if($salvarUsuario){
                $this->salvarAluno(iniciarPDO());
            }
        }

         public function salvarAluno(PDO $pdo): void {
            $stmt = $pdo->prepare("INSERT INTO alunos (id_usuario, matricula, xp_total) VALUES (?, ?, ?)");
            $stmt->execute([$this->id, $this->matricula, $this->xp_total]);
        }

        public static function buscarAluno(PDO $pdo, int $id_usuario){
            $stmt = $pdo->prepare("SELECT * FROM alunos WHERE id_usuario = ?");
            $stmt->execute([$id_usuario]);
            $dadosAluno = $stmt->fetch();
            if ($dadosAluno){
                return $dadosAluno;
            } else {
                return null;
            }
        }


?> 

//continuar tentando mesmo dps de entregue incompleto..



