<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <title>Submissões</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@500;700&display=swap" rel="stylesheet">
    <style>
       body {
            font-family: 'Inter', sans-serif;
            background-color: #121212;
            color: #e0e0e0;
            padding: 20px;
            max-width: 900px;
            margin: 0 auto;
        }
        h1, h2, h3 {
            font-family: 'Poppins', sans-serif;
            color: #00d2ff;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            color: #00d2ff;
            font-weight: 600;
        }
        select, input[type="text"], textarea {
            width: 100%;
            background: #1e1e1e;
            color: #c586c0;
            font-family: monospace;
            padding: 10px;
            border: 1px solid #333;
            border-radius: 4px;
        }
        textarea {
            height: 180px;
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
            transition: background 0.2s;
        }
        button:hover {
            background: #00a8cc;
        }
        #resultado-ia {
            margin-top: 25px;
            padding: 20px;
            background: #1e1e1e;
            border-left: 4px solid #00d2ff;
            display: none;
            border-radius: 4px;
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
            border-radius: 4px;
        }
        #loading {
            display: none;
            color: #00d2ff;
            margin-top: 10px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <h1>Módulo de Submissões</h1>
    <p>Envie sua solução para validação automática no compilador e feedback da IA.</p>
    <div class="form-group">
        <label for="atividade_id">Selecione a Atividade:</label>
        <select id="atividade_id">
            <option value="Validação e Formatação de CPF">Atividade 01: Validação e Formatação de Dados</option>
        </select>
    </div>
    <div class="form-group">
        <label for="id_linguagem">Linguagem de Programação:</label>
        <select id="id_linguagem">
            <option value="71">Python (3.8.1)</option>
            <option value="63">JavaScript (Node.js)</option>
            <option value="54">C++ (GCC)</option>
        </select>
    </div>
    <div class="form-group">
        <label for="codigo_aluno">Código da Submissão:</label>
        <textarea id="codigo_aluno" placeholder="# Escreva seu código aqui..."></textarea>
    </div>
    <button onclick="enviarSubmissao()">Enviar Submissão</button>
    <div id="loading">Aguarde... O Judge0 está processando o código e a IA está avaliando...</div>
    <div id="resultado-ia">
        <h2 id="nota-final"></h2>
        <p><strong>Status da Avaliação:</strong> <span id="status-avaliacao" style="text-transform: uppercase; font-weight: bold;"></span></p>
        <p><strong>Status do Compilador (Judge0):</strong> <span id="status-compilador"></span></p>
        <p><strong>Saída do Terminal:</strong></p>
        <pre id="terminal-saida"></pre>
        <h3>Feedback do Professor IA:</h3>
        <p id="feedback-geral"></p>
        <h3>Pontos de Melhoria <span class="missao">(Missões de Correção)</span></h3>
        <ul id="pontos-melhoria"></ul>
    </div>
    <script>
    async function enviarSubmissao() {
        const atividadeId = document.getElementById('atividade_id').value;
        const idLinguagem = document.getElementById('id_linguagem').value;
        const codigo = document.getElementById('codigo_aluno').value;
        const loading = document.getElementById('loading');
        const resultadoDiv = document.getElementById('resultado-ia');
        if (!codigo.trim()) {
            alert('Por favor, insira o código da submissão!');
            return;
        }
        loading.style.display = 'block';
        resultadoDiv.style.display = 'none';
        const payload = {
            id_linguagem: parseInt(idLinguagem),
            codigo_aluno: codigo,
            objetivo_atividade: atividadeId,
            nota_max: "10",
            nota_min: "6"
        };
        try {
            const response = await fetch('enviarSubmissao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            console.log(data);
            if (data.sucesso) {
                document.getElementById('nota-final').innerText = "Nota Atribuída: " + data.avaliacao.nota_atribuida + " / 10";
                document.getElementById('status-avaliacao').innerText = data.avaliacao.status_avaliacao;
                document.getElementById('status-compilador').innerText = data.compilacao.status.description || data.compilacao.status;
                document.getElementById('terminal-saida').innerText = data.compilacao.saida_terminal;
                document.getElementById('feedback-geral').innerText = data.avaliacao.feedback_geral;
                const ulMelhoria = document.getElementById('pontos-melhoria');
                ulMelhoria.innerHTML = '';
                if (data.avaliacao.pontos_melhoria && data.avaliacao.pontos_melhoria.length > 0) {
                    data.avaliacao.pontos_melhoria.forEach(ponto => {
                        let li = document.createElement('li');
                        li.innerText = ponto;
                        ulMelhoria.appendChild(li);
                    });
                } else {
                    ulMelhoria.innerHTML = '<li>Parabéns! Nenhuma correção necessária.</li>';
                }
                resultadoDiv.style.display = 'block';
            } else {
                alert("Erro na submissão: " + (data.erro || 'Erro desconhecido.'));
            }
        } catch (error) {
            console.error("Erro ao comunicar com o servidor:", error);
            alert("Erro de comunicação com o servidor.");
        } finally {
            loading.style.display = 'none';
        }
    }
    </script>
</body>
</html>