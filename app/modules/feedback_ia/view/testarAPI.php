<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <title>The Farmer Edu - testarAPI</title>
    <!-- Fontes Inter e Poppins para manter a estética dark tech -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@500;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #121212;
            color: #e0e0e0;
            padding: 20px;
        }

        h1,
        h2,
        h3 {
            font-family: 'Poppins', sans-serif;
            color: #00d2ff;
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
            background: #00d2ff;
            color: #000;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 10px;
            border-radius: 5px;
        }

        button:hover {
            background: #00a8cc;
        }

        #resultado-ia {
            margin-top: 20px;
            padding: 15px;
            background: #1e1e1e;
            border-left: 4px solid #00d2ff;
            display: none;
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
    </style>
</head>

<body>

    <h1>Desafio de Lógica</h1>
    <p>Objetivo: Criar uma função que receba um código em PHP codificado em Base64 e retornar ele decodificado</p>
    <pre>
        PD9waHAKICAgIHJlcXVpcmVfb25jZSBfX0RJUl9fIC4gJy8uLi8uLi9jb3JlL2RhdGFiYXNlLnBocCc7CgogICAgY2xhc3MgdGVzdGFyQVBJQ29udHJvbGxlciB7CiAgICBwdWJsaWMgZnVuY3Rpb24gc2hvd0F2YWxpYXIoKTogdm9pZCB7CiAgICAgICAgcmVxdWlyZV9vbmNlIF9fRElSX18gLiAnL3ZpZXcvdGVzdGFyQVBJLnBocCc7CiAgICB9CgogICAgcHVibGljIGZ1bmN0aW9uIHNlbmRBdmFsaWFjYW8oKTogdm9pZCB7CiAgICAgICAgcmVxdWlyZV9vbmNlIF9fRElSX18gLiAnL3ZpZXcvc2VuZEF2YWxpYWNhby5waHAnOwogICAgfQogICAgfQo/Pg==
    </pre>

    <!-- O textarea pode ser substituído futuramente pela biblioteca do VS Code (Monaco Editor) -->
    <textarea id="codigo_aluno" placeholder="Escreva seu código Python aqui..."></textarea>
   

    <button onclick="enviarParaAvaliacao()">Submeter Código</button>

    <div id="loading" style="display:none; color: #00d2ff; margin-top: 10px;">A IA está analisando sua lógica...</div>

    <div id="resultado-ia">
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