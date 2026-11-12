<?php
    require_once "Config.php";

    class Ollama {
        protected string $host;
        protected string $prompt;
        protected string $payload;
        protected array $routes;
        protected string $promptSistema;
        protected string $model;

        protected function __construct() {
            $this->host = (new InitConfig())->hostOllama;
            $this->routes = [
                'apiGen' => 'api/generate',
            ];
        }

        protected function gerar(bool $think = false): string{ // manda o prompt e retorna a resposta da IA
            $array_payload = [
                "model" => $this->model,
                "prompt" => $this->prompt,
                "stream" => false // false para receber a resposta toda de uma vez
            ];
            $think ? $array_payload['think'] = $think : null;
            $this->payload = json_encode($array_payload);

            $curlOllama = curl_init();
            curl_setopt($curlOllama, CURLOPT_URL, $this->host . base64_encode($this->routes['apiGen']) . '&isBase64=true');
            curl_setopt($curlOllama, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curlOllama, CURLOPT_POST, true);
            curl_setopt($curlOllama, CURLOPT_POSTFIELDS, $this->payload);
            curl_setopt($curlOllama, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

            $respostaOllama = json_decode(curl_exec($curlOllama), true);

            return $respostaOllama['response'] ?? "A IA não conseguiu gerar um feedback. Erro: " . curl_error($curlOllama);
        }
    }

    class SIAE extends Ollama {
        public function __construct() {
            parent::__construct();
            $this->model = "siae";
        }

        public function obterResultadoSIAE(string $linguagem, string $objetivoAtividade, string $codigoAluno): mixed {
            $this->prompt = '
                Verifique se o código do aluno foi feito por IA ou não. Para isso, você utilizará os exemplos a baixo para entender como é um código feito por IA, deverá usar esses exemplos como medida de comparação. 
                Após averiguar, retorne em porcentagem o quanto aquele código é similar aos códigos de IA, ou seja, a porcentegem indicará a probabilidade do código ter sido feito por uma IA, juntamente com isso deverá ser retornado um pequeno texto explicando o porque acredita-se que código seja de IA. 
                Caso o valor da porcentagem seja menos que 40% não precisa retonar nenhum texto explicativo.
                É importante que você analise os padrões dos códigos feitos por IA para que possa identifica-los posteriormente.

                Exemplos de códigos feitos por IA:

                linguagem do código: HTML
                Objetivo: Faça um código em HTML para uma página de Login

                exemplo:
                <!-- <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Página de Login</title>

                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                            font-family: Arial, sans-serif;
                        }

                        body {
                            height: 100vh;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            background: linear-gradient(135deg, #141e30, #243b55);
                        }

                        .login-container {
                            width: 350px;
                            padding: 40px;
                            background: white;
                            border-radius: 15px;
                            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        }

                        .login-container h1 {
                            text-align: center;
                            margin-bottom: 10px;
                            color: #243b55;
                        }

                        .login-container p {
                            text-align: center;
                            color: #777;
                            margin-bottom: 30px;
                        }

                        .input-group {
                            margin-bottom: 20px;
                        }

                        .input-group label {
                            display: block;
                            margin-bottom: 8px;
                            color: #333;
                            font-weight: bold;
                        }

                        .input-group input {
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #ccc;
                            border-radius: 8px;
                            outline: none;
                            font-size: 14px;
                        }

                        .input-group input:focus {
                            border-color: #243b55;
                        }

                        .options {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            font-size: 13px;
                            margin-bottom: 25px;
                        }

                        .options a {
                            color: #243b55;
                            text-decoration: none;
                        }

                        .options a:hover {
                            text-decoration: underline;
                        }

                        button {
                            width: 100%;
                            padding: 13px;
                            background: #243b55;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: 0.3s;
                        }

                        button:hover {
                            background: #141e30;
                        }

                        .register {
                            text-align: center;
                            margin-top: 25px;
                            font-size: 14px;
                        }

                        .register a {
                            color: #243b55;
                            font-weight: bold;
                            text-decoration: none;
                        }
                    </style>
                </head>

                <body>

                    <div class="login-container">

                        <h1>Bem-vindo!</h1>
                        <p>Faça login na sua conta</p>

                        <form onsubmit="fazerLogin(event)">

                            <div class="input-group">
                                <label for="email">E-mail</label>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="Digite seu e-mail"
                                    required
                                >
                            </div>

                            <div class="input-group">
                                <label for="senha">Senha</label>
                                <input
                                    type="password"
                                    id="senha"
                                    placeholder="Digite sua senha"
                                    required
                                >
                            </div>

                            <div class="options">
                                <label>
                                    <input type="checkbox">
                                    Lembrar-me
                                </label>

                                <a href="#">Esqueceu a senha?</a>
                            </div>

                            <button type="submit">Entrar</button>

                        </form>

                        <div class="register">
                            Não tem uma conta?
                            <a href="#">Cadastre-se</a>
                        </div>

                    </div>

                    <script>
                        function fazerLogin(event) {
                            event.preventDefault();

                            alert("Formulário enviado! Conecte o login a um sistema de autenticação.");
                        }
                    </script>

                </body>
                </html> -->


                linguagem do código: PHP
                Objetivo: Faça uma função em PHP para enviar dados de vendas de peças de carro para um banco de dados

                exemplo 1:

                <!-- <?php

                // Configurações do Banco de Dados
                $host    = "localhost";
                $dbname  = "autopeças_db";
                $user    = "root";
                $password = "sua_senha";

                try {
                    // 1. Conexão com o banco
                    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $password, [
                        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    ]);

                    // 2. Montagem dos dados da venda da peça
                    $venda = [
                        "peca_id"        => 1042,
                        "nome_peca"      => "Jogo de Pastilhas de Freio Dianteira",
                        "codigo_oem"     => "5U0698151A",
                        "quantidade"     => 2,
                        "preco_unitario" => 145.90,
                        "cliente_nome"   => "Carlos Eduardo"
                    ];

                    // 3. Execução da função
                    if (registrarVendaPeca($pdo, $venda)) {
                        echo "Venda registrada com sucesso!";
                    } else {
                        echo "Falha ao registrar a venda.";
                    }

                } catch (PDOException $e) {
                    echo "Erro na conexão com o banco de dados: " . $e->getMessage();
                } -->




                <!-- <?php

                /**
                 * Registra uma venda de peça automotiva no banco de dados.
                 *
                 * @param PDO $pdo Instância da conexão PDO ativa.
                 * @param array $dadosVenda Dados da peça e da transação.
                 * @return bool Retorna true em caso de sucesso ou false em caso de falha.
                 */
                function registrarVendaPeca(PDO $pdo, array $dadosVenda): bool
                {
                    $sql = "INSERT INTO vendas_pecas (
                                peca_id, 
                                nome_peca, 
                                codigo_oem, 
                                quantidade, 
                                preco_unitario, 
                                valor_total, 
                                cliente_nome
                            ) VALUES (
                                :peca_id, 
                                :nome_peca, 
                                :codigo_oem, 
                                :quantidade, 
                                :preco_unitario, 
                                :valor_total, 
                                :cliente_nome
                            )";

                    try {
                        // Cálculo automático do valor total
                        $valorTotal = $dadosVenda["quantidade"] * $dadosVenda["preco_unitario"];

                        $stmt = $pdo->prepare($sql);

                        return $stmt->execute([
                            ":peca_id"        => $dadosVenda["peca_id"],
                            ":nome_peca"      => $dadosVenda["nome_peca"],
                            ":codigo_oem"     => $dadosVenda["codigo_oem"] ?? null,
                            ":quantidade"     => $dadosVenda["quantidade"],
                            ":preco_unitario" => $dadosVenda["preco_unitario"],
                            ":valor_total"    => $valorTotal,
                            ":cliente_nome"   => $dadosVenda["cliente_nome"] ?? "Consumidor Final"
                        ]);
                    } catch (PDOException $e) {
                        // Log do erro (substitua por seu sistema de logs se preferir)
                        error_log("Erro ao salvar venda de peça: " . $e->getMessage());
                        return false;
                    }
                } -->


                objetivo 2: Faça um código para mim em php para cadastar uma pessoa, código deve estar em POO
                exemplo 2:

                <!-- <?php

                class Pessoa {

                    private $nome;
                    private $idade;
                    private $email;

                    // Método construtor
                    public function __construct($nome, $idade, $email) {
                        $this->nome = $nome;
                        $this->idade = $idade;
                        $this->email = $email;
                    }

                    // Métodos Getters
                    public function getNome() {
                        return $this->nome;
                    }

                    public function getIdade() {
                        return $this->idade;
                    }

                    public function getEmail() {
                        return $this->email;
                    }

                    // Método para exibir os dados
                    public function exibirDados() {
                        echo "Nome: " . $this->nome . "<br>";
                        echo "Idade: " . $this->idade . "<br>";
                        echo "E-mail: " . $this->email . "<br>";
                    }
                } -->


                <!-- <?php

                require_once "Pessoa.php";

                // Recebendo os dados do formulário
                $nome = $_POST["nome"];
                $idade = $_POST["idade"];
                $email = $_POST["email"];

                // Criando um objeto da classe Pessoa
                $pessoa = new Pessoa($nome, $idade, $email);

                // Exibindo os dados cadastrados
                echo "<h2>Pessoa cadastrada com sucesso!</h2>";

                $pessoa->exibirDados();

                ?> -->




                linguagem do código: JavaScript
                Objetivo 1: Faça um código em Javascript para adicionar compras num carrinho

                exemplo 1:


                <!-- let carrinho = [];

                // Adicionar produtos ao carrinho
                function adicionarCarrinho(nome, preco) {

                    let produto = carrinho.find(item => item.nome === nome);

                    if (produto) {
                        produto.quantidade++;
                    } else {
                        carrinho.push({
                            nome: nome,
                            preco: preco,
                            quantidade: 1
                        });
                    }

                    atualizarCarrinho();
                }

                // Remover produto do carrinho
                function removerCarrinho(nome) {

                    carrinho = carrinho.filter(item => item.nome !== nome);

                    atualizarCarrinho();
                }

                // Alterar quantidade
                function alterarQuantidade(nome, quantidade) {

                    let produto = carrinho.find(item => item.nome === nome);

                    if (produto) {
                        produto.quantidade += quantidade;

                        if (produto.quantidade <= 0) {
                            removerCarrinho(nome);
                            return;
                        }
                    }

                    atualizarCarrinho();
                }

                // Atualizar informações do carrinho
                function atualizarCarrinho() {

                    let areaCarrinho = document.getElementById("carrinho");

                    let total = 0;

                    areaCarrinho.innerHTML = "";

                    carrinho.forEach(produto => {

                        let subtotal = produto.preco * produto.quantidade;

                        total += subtotal;

                        areaCarrinho.innerHTML += `
                            <div>
                                <h3>${produto.nome}</h3>

                                <p>Preço: R$ ${produto.preco.toFixed(2)}</p>

                                <p>Quantidade: ${produto.quantidade}</p>

                                <p>Subtotal: R$ ${subtotal.toFixed(2)}</p>

                                <button onclick="alterarQuantidade("${produto.nome}", 1)">
                                    +
                                </button>

                                <button onclick="alterarQuantidade("${produto.nome}", -1)">
                                    -
                                </button>

                                <button onclick="removerCarrinho("${produto.nome}")">
                                    Remover
                                </button>

                                <hr>
                            </div>
                        `;
                    });

                    document.getElementById("total").innerText =
                        "Total: R$ " + total.toFixed(2);
                } -->

                objetivo 2: faça um código em JavaScript para criar um contador de lançamento de foguete
                exemplo 2:
                
                <!-- <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Contador de Lançamento de Foguete</title>
                    <style>
                        body {
                            background-color: #0d1117;
                            color: #ffffff;
                            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                        }

                        .container {
                            text-align: center;
                            background: #161b22;
                            padding: 40px;
                            border-radius: 12px;
                            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                            border: 1px solid #30363d;
                        }

                        .contador {
                            font-size: 5rem;
                            font-weight: bold;
                            color: #58a6ff;
                            margin: 20px 0;
                            font-family: monospace;
                        }

                        button {
                            background-color: #238636;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            font-size: 1.1rem;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: background 0.2s;
                        }

                        button:hover {
                            background-color: #2ea043;
                        }

                        button:disabled {
                            background-color: #484f58;
                            cursor: not-allowed;
                        }
                    </style>
                </head>
                <body>

                    <div class="container">
                        <h1 id="status">Centro de Lançamento</h1>
                        <div class="contador" id="display">10</div>
                        <button id="btnIniciar" onclick="iniciarLancamento()">Iniciar Sequência</button>
                    </div>

                    <script>
                        function iniciarLancamento() {
                            const display = document.getElementById("display");
                            const status = document.getElementById("status");
                            const btn = document.getElementById("btnIniciar");

                            let tempo = 10;
                            btn.disabled = true;
                            status.innerText = "🚀 Contagem Regressiva em Andamento...";

                            const intervalo = setInterval(() => {
                                tempo--;
                                display.innerText = tempo;

                                if (tempo === 0) {
                                    clearInterval(intervalo);
                                    display.innerText = "🚀🔥";
                                    status.innerText = "DECOLAGEM!";
                                    btn.disabled = false;
                                }
                            }, 1000);
                        }
                    </script>
                </body>
                </html> -->

                linguagem do código: Python
                Objetivo: Faça um código em Python para adicionar compras num carrinho

                exemplo:

                <!-- class CarrinhoDeCompras:
                    def __init__(self):
                        # Armazena os itens no formato: {nome: {"preco": float, "quantidade": int}}
                        self.itens = {}

                    def adicionar_item(self, nome: str, preco: float, quantidade: int = 1):
                        """Adiciona um item ao carrinho ou incrementa sua quantidade se já existir."""
                        if quantidade <= 0 or preco < 0:
                            print("Erro: Preço e quantidade devem ser maiores que zero.")
                            return

                        if nome in self.itens:
                            self.itens[nome]["quantidade"] += quantidade
                        else:
                            self.itens[nome] = {"preco": preco, "quantidade": quantidade}
                            
                        print(f"✓ {quantidade}x "{nome}" adicionado(s) ao carrinho.")

                    def remover_item(self, nome: str):
                        """Remove completamente um item do carrinho."""
                        if nome in self.itens:
                            del self.itens[nome]
                            print(f"✓ "{nome}" removido do carrinho.")
                        else:
                            print(f"✗ Item "{nome}" não encontrado no carrinho.")

                    def calcular_total(self) -> float:
                        """Calcula o valor total da compra."""
                        return sum(item["preco"] * item["quantidade"] for item in self.itens.values())

                    def exibir_carrinho(self):
                        """Exibe o resumo detalhado das compras."""
                        if not self.itens:
                            print("\nSeu carrinho está vazio.")
                            return

                        print("\n" + "=" * 40)
                        print("          RESUMO DO CARRINHO          ")
                        print("=" * 40)
                        for nome, dados in self.itens.items():
                            subtotal = dados["preco"] * dados["quantidade"]
                            print(f"{nome:<20} {dados["quantidade"]}x R$ {dados["preco"]:>7.2f} = R$ {subtotal:>7.2f}")
                        print("-" * 40)
                        print(f"VALOR TOTAL: R$ {self.calcular_total():.2f}")
                        print("=" * 40 + "\n")


                # --- Exemplo de uso ---

                carrinho = CarrinhoDeCompras()

                # 1. Adicionando itens
                carrinho.adicionar_item("Pneu 175/70 R14", 320.00, 2)
                carrinho.adicionar_item("Óleo de Motor 5W30", 45.90, 4)
                carrinho.adicionar_item("Filtro de Ar", 29.90, 1)

                # 2. Adicionando o mesmo item novamente (incrementa a quantidade)
                carrinho.adicionar_item("Óleo de Motor 5W30", 45.90, 1)

                # 3. Exibindo o estado do carrinho
                carrinho.exibir_carrinho()

                # 4. Removendo um item
                carrinho.remover_item("Filtro de Ar")

                # 5. Exibindo o carrinho atualizado
                carrinho.exibir_carrinho() -->

            ### PARÂMETROS DA AVALIAÇÃO:
            - Linguagem de Programação: {$linguagem}
            -Objetivo da Atividade: {$objetivoAtividade}
            - Código Enviado pelo Aluno:
            ```{$linguagem}
            {$codigoAluno}
            ';
            return $this->gerar(true);
        }
    }

    class Sophia extends Ollama {
        public function __construct() {
            parent::__construct();
            $this->model = "sophia";
        }

        public function obterResultadoSophia(
            string $linguagem, 
            string $objetivoAtividade, 
            string $notaMax, 
            string $notaMin, 
            string $codigoBase, 
            string $codigoAluno, 
            mixed $statusJudge0, 
            mixed $saidaJudge0
        ): mixed {
            // Tratamento de segurança para dados que vêm como array ou objeto
            $statusStr = is_array($statusJudge0) || is_object($statusJudge0) ? json_encode($statusJudge0, JSON_UNESCAPED_UNICODE) : (string)$statusJudge0;
            $saidaStr  = is_array($saidaJudge0)  || is_object($saidaJudge0)  ? json_encode($saidaJudge0, JSON_UNESCAPED_UNICODE)  : (string)$saidaJudge0;

            $this->prompt = "
            Sua tarefa é analisar a submissão de um aluno do SENAI, avaliar a lógica em conjunto com a saída do compilador (Judge0) e do códibo base enviado. Por fim, deve gerar um boletim de avaliação unicamente em formato JSON.

            [DADOS DA ATIVIDADE]
            - Linguagem/Matéria: $linguagem
            - Objetivo: $objetivoAtividade
            - Nota Máxima: $notaMax
            - Nota Mínima para Aprovação: $notaMin

            [CÓDIGO BASE DO PROJETO]
            $codigoBase

            [CÓDIGO DESENVOLVIDO PELO ALUNO]
            $codigoAluno

            [SAÍDA DO MOTOR DE AVALIAÇÃO (Judge0)]
            - Status: $statusJudge0
            - Terminal (stdout/stderr): $saidaJudge0

            [DIRETRIZES DE AVALIAÇÃO]
            1. Análise Lógica e de Regras: Verifique se o código atende ao objetivo da atividade gamificada. O código compilar sem erros no Judge0 não significa necessariamente que a lógica resolve o problema proposto.
            2. Boas Práticas Técnicas: Avalie a clareza, indentação e nomenclatura das variáveis segundo os padrões da linguagem ($linguagem).
            3. Feedback Formativo (Regra de Ouro): NUNCA forneça o código corrigido pronto. Guie o aluno a descobrir o erro (seja de sintaxe ou de lógica) através de dicas conceituais. No campo \"feedback_geral\", adote o tom de um instrutor técnico e encerre SEMPRE com uma pergunta que estimule o raciocínio.
            4. Avaliação e Nota: Seja justo. Atribua a nota (0 a $notaMax) baseada na proximidade da solução ideal e no cumprimento da demanda. Se houver erro crítico de compilação ou falha lógica grave, a nota deve refletir isso para que o status seja 'refazer'.

            [FORMATO DE SAÍDA OBRIGATÓRIO]
            Não inclua nenhuma saudação, explicação, formatação markdown (como ```json) ou texto fora do JSON. Retorne EXCLUSIVAMENTE um objeto JSON válido, pronto para ser lido por um decodificador (json_decode), utilizando a exata estrutura abaixo:

            {
                \"nota_atribuida\": 0.0,
                \"status_avaliacao\": \"aprovado|reprovado|refazer\",
                \"pontos_positivos\": [\"...\", \"...\"],
                \"pontos_melhoria\": [\"...\", \"...\"],
                \"feedback_geral\": \"...\"
            }
            ";

            return $this->gerar();
        }
    }

    // public function chamarSophia() {
    //     return gerar();

    // }
        $resultado = json_decode($resultado, true);

    $nota = $resultado['nota_atribuida'];
    $pontosMelhoria = $resultado['pontos_melhoria'];
    
    echo "Nota: " . $nota;

foreach ($pontosMelhoria as $ponto) {
    echo "<p>" . htmlspecialchars($ponto) . "</p>";
}

?>