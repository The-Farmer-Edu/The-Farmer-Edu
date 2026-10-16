<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <title>The Farmer Edu - testarAPI</title>
    <!-- Fontes Inter e Poppins para manter a estética dark tech -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@500;700&display=swap" rel="stylesheet">
    <link rel="shortcut icon" href="/The-Farmer-Edu-Tarde-Setup/public/assets/img/ico/logo_icone.ico" type="image/x-icon">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: white;
            color: black;
        }

        h1,
        h2,
        h3 {
            font-family: 'Poppins', sans-serif;
            color: #34C759;
        }

        textarea {
            width: 100%;
            height: 200px;
            background: #1e1e1e;
            color: #c586c0;
            font-family: monospace;
            padding: 10px;
            border: 1px solid #333;
        }

        button {
            background: #34C759;
            color: #000;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 10px;
            border-radius: 5px;
            width: 200px;
            height: 60px;
            font-size: 18px;
            margin: 30px;
        }

        button:hover {
            background: #089C2F;
        }

        #resultado-ia {
            margin-top: 20px;
            padding: 50px;
            background: #D9D9D9;
            border-left: 4px solid #34C759;
            display: none;
            width: 60%;
            border-top: 2px solid black;
            border-right: 2px solid black;
            border-bottom: 2px solid black;
            margin-left: 20px;
        }

        .missao {
            color: #ff5252;
            font-weight: bold;
        }

        pre {
            background: #000;
            padding: 10px;
            color: #0f0;
            overflow-x: auto;
        }

        #logo_cabecalho {
            width: height: 100%;
            height: 80%;
        }

        #nome_cabecalho {
            color: #2bad1a;
            font-size: 30px;
        }

        header {
            background-color: #A0FDA3;
            display: flex;
            width: 100%;
            height: 100px;
            justify-content: space-between;
        }

        #esquerda_cabecalho {
            display: flex;
            align-items: center;
            padding-left: 40px;
            gap: 30px;
        }

        #direita_cabecalho {
            display: flex;
            align-items: center;
            padding-right: 60px;
        }

        #desafio {
            display: flex;
            flex-direction: column;
            margin: 20px;
            gap: 10px;
        }

        #titulo_codigo {
            margin: 20px;
        }






    </style>
</head>

<body>
    <header>
        <div id="esquerda_cabecalho">
            <img src="/The-Farmer-Edu-Tarde-Setup/public/assets/img/png/logo_icone.png" alt="Logo" id="logo_cabecalho">
            <p id="nome_cabecalho">The Farmer Edu</p>
        </div>
        
        <div id="direita_cabecalho">
            <p>Bem vindo, PiorAinda</p>
        </div>
    </header>
    <div id="desafio">
        <h1>Desafio de Lógica</h1>
        <p>Objetivo: Criar uma função que receba um código em PHP codificado em Base64 e retornar ele decodificado</p>
    </div>


    <!-- O textarea pode ser substituído futuramente pela biblioteca do VS Code (Monaco Editor) -->
    <h1 id="titulo_codigo">Digite seu Código abaixo:</h1>
    <textarea id="codigo_aluno" placeholder="Escreva seu código PHP aqui..."></textarea>
   

    <button onclick="enviarParaAvaliacao()">Submeter Código</button>

    <div id="loading" style="display:none; color: #34C759; margin-top: 10px;">A IA está analisando sua lógica...</div>

    <div id="resultado-ia" style="display:none;">
        <h2 id="nota-final"></h2>
        <p><strong>Status do Compilador:</strong> <span id="status-compilador"></span></p>
        <p><strong>Terminal:</strong></p>
        <pre id="terminal-saida"></pre>

        <h3>Feedback do Professor IA:</h3>
        <p id="feedback-geral"></p>

        <h3>Missões de Correção <span class="missao">(Pontos de Melhoria)</span></h3>
        <ul id="pontos-melhoria"></ul>
    </div>

    <script>
        async function enviarParaAvaliacao() {
            const codigo = document.getElementById('codigo_aluno').value;
            const loading = document.getElementById('loading');
            const resultadoDiv = document.getElementById('resultado-ia');

            if (!codigo) return alert('Digite algum código antes de enviar!');

            loading.style.display = 'block';
            resultadoDiv.style.display = 'none';

            // O payload com as regras da atividade
            const payload = {
                codigo_aluno: codigo,
                id_linguagem: 68, // 71 = Python no Judge0, 68 = PHP
                objetivo_atividade: "Criar uma função que receba um código em PHP codificado em Base64 e retornar ele decodificado",
                nota_max: "10",
                nota_min: "6"
            };

            try {
                // Chama o Controller que orquestra os Models
                const response = await fetch('sendAvaliacao', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                console.log(data)

                if (data.sucesso) {
                    document.getElementById('nota-final').innerText = "Nota Atribuída: " + data.avaliacao.nota_atribuida;
                    document.getElementById('status-compilador').innerText = data.compilacao.status;
                    document.getElementById('terminal-saida').innerText = data.compilacao.saida_terminal;
                    document.getElementById('feedback-geral').innerText = data.avaliacao.feedback_geral;

                    const ulMelhoria = document.getElementById('pontos-melhoria');
                    ulMelhoria.innerHTML = '';

                    // Renderiza os pontos de melhoria devolvidos no JSON do Llama
                    if (data.avaliacao.pontos_melhoria && data.avaliacao.pontos_melhoria.length > 0) {
                        data.avaliacao.pontos_melhoria.forEach(ponto => {
                            let li = document.createElement('li');
                            li.innerText = ponto;
                            ulMelhoria.appendChild(li);
                        });
                    } else {
                        ulMelhoria.innerHTML = '<li>Lógica perfeita! Nenhuma correção necessária.</li>';
                    }

                    resultadoDiv.style.display = 'block';
                } else {
                    alert("Erro: " + data.erro);
                }
            } catch (error) {
                console.error("Erro ao comunicar com o servidor:", error);
                alert("Erro de comunicação com o servidor de avaliação.");
            } finally {
                loading.style.display = 'none';
            }
        }
    </script>
</body>

</html>