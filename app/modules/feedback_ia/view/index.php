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
            user-select: none;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: white;
            color: black;
            
        }
        main {
           
            min-height: 100vh;
        }


        h1, h2, h3 {
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
            background: rgba(113, 218, 86, 0.88);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            /* box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.5),
                inset 0 -1px 0 rgba(255, 255, 255, 0.1),
                inset 0 0 16px 8px rgba(255, 255, 255, 0.8); */
            position: relative;
            overflow: hidden;
            transition: background-color 0.3s ease;
  
        }

button::before {
    
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.8),
        transparent
    );
}

button::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.8),
        transparent,
        rgba(255, 255, 255, 0.3)
    );

    }



        button:hover {
            background: #089C2F;
            transform: scale(1); /* Aumenta 10% de tamanho */
        }

        #resultado-ia {
            margin: 30px;
            padding: 35px;
            /* background: #FFF;
            background: linear-gradient(90deg,rgba(255, 255, 255, 1) 0%, rgba(8, 156, 47, 1) 175%); */
            width: 97%;
            flex-direction: column;
            gap: 15px;
            border-radius: 30px;    
        }

        .missao {
            color: #ff5252;
            font-weight: bold;
        }

        pre {
            padding: 10px;
            color: rgb(0, 0, 0);
            font-family: monospace;
            font-size: 18px;
        }

        #logo_cabecalho {
            width: 80px;
            height: 80px;
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

        html {
            position: relative;
            /* min-height: 100vh; */
        }

        html::before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: url('file?type=img&file=agropecuaria-capa-1.png') no-repeat center center fixed;
            background-size: cover;
            opacity: 0.7;
        }

        .glass-card {

            background: rgba(255, 255, 255, 60%);
            backdrop-filter: blur(9px);
            -webkit-backdrop-filter: blur(9px);
            border-radius: 20px;
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.5),
                inset 0 -1px 0 rgba(255, 255, 255, 0.1),
                inset 0 0 0px 0px rgba(255, 255, 255, 0);
            position: relative;
            overflow: hidden;
        }

        .glass-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.8),
                transparent
            );
        }

        .glass-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 1px;
            height: 100%;
            background: linear-gradient(
                180deg,
                rgba(255, 255, 255, 0.8),
                transparent,
                rgba(255, 255, 255, 0.3)
            );
        }

        .status-compilador {
            background: #FFF;
            background: linear-gradient(90deg, rgba(255, 255, 255, 1) 0%, rgba(52, 199, 89, 1) 50%, rgba(8, 156, 47, 1) 200%);
            border-radius: 10px;
            padding: 5px;
            width: fit-content;
        }

        #pontos-melhoria{
            padding: 10px;
        }
        #loading {
            display:none;
            color: black;
            margin-top: 10px;
            font-size: 18px;
            font-weight: bold;
            background: rgba(247, 231, 231, 60%);
            backdrop-filter: blur(9px);
            -webkit-backdrop-filter: blur(9px);
            width: fit-content;
            margin-left: 20px;
            padding: 10px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            gap: 10px;
        }
        #spinner{
            width: 25px;
            height: 25px;
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-top: 5px solid #34C759;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        #status_compilador {
            padding: 10px;
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
    <main>
    <div id="desafio">
        <h1>Desafio de Lógica</h1>
        <p>Objetivo: Criar uma função que receba um código em PHP codificado em Base64 e retornar ele decodificado</p>
    </div>
<!-- 
    <img src="file?type=img&file=agropecuaria-capa-1.png" alt="Logo" id="logo_fundo"> -->



    <!-- O textarea pode ser substituído futuramente pela biblioteca do VS Code (Monaco Editor) -->
    <h1 id="titulo_codigo">Digite seu Código abaixo:</h1>
    <textarea id="codigo_aluno" placeholder="Escreva seu código PHP aqui..."></textarea>
   

    <button onclick="enviarParaAvaliacao()">Submeter Código</button>

    <div id="loading">
        A IA está analisando sua lógica...
        <div id="spinner"></div>
    </div>

    <div class="glass-card" id="resultado-ia" style="display:none;">
        <h2 id="nota-final"></h2>
        <p class="glass-card" id="status_compilador"><strong>Status do Compilador:</strong> <span id="status-compilador"></span></p>
        <p><strong>Terminal:</strong></p>
        <pre class="glass-card" id="terminal-saida"></pre>

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

            loading.style.display = 'flex';
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

                    resultadoDiv.style.display = 'flex';
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
    </main>
    <footer style="height: 25px; width: 100%; text-align: center; background-color: #A0FDA3;" opc>
        <p>&copy; 2026 The Farmer Edu. Todos os direitos reservados.</p>
    </footer>
</body>

</html>