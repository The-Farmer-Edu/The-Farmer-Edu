<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resposta de Referência</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Poppins:wght@500;700&display=swap" rel="stylesheet">
    <link rel="shortcut icon" href="/The-Farmer-Edu-Tarde-Setup/public/assets/img/ico/logo_icone.ico" type="image/x-icon">

    <style>
        :root {
            --verdeEscuro: #1e6b45;
            --verdeMedio: #2e8b57;
            --verdeClaro: #ebf8f0;
            --verdeSuave: #d9f3e5;
            --cinzaEscuro: #243127;
            --cinzaMedio: #5e6d63;
            --cinzaClaro: #f5f7f6;
            --branco: #ffffff;
            --sombra: 0 12px 30px rgba(18, 64, 42, 0.12);
            --borda: #dfeae5;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(180deg, #f4faf6 0%, #edf7f1 100%);
            color: var(--cinzaEscuro);
        }

        .pagina {
            max-width: 1200px;
            margin: 0 auto;
            padding: 32px 20px 60px;
        }

        .cabecalho {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 28px 32px;
            background: linear-gradient(135deg, var(--verdeEscuro), var(--verdeMedio));
            border-radius: 20px;
            box-shadow: var(--sombra);
            color: var(--branco);
            margin-bottom: 28px;
        }

        .cabecalhoTexto h1 {
            margin: 8px 0 0;
            font-size: clamp(1.8rem, 2.6vw, 2.8rem);
        }

        .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.22);
            border-radius: 999px;
            padding: 8px 14px;
            font-size: 0.8rem;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            font-weight: 700;
        }

        .conteudo {
            display: grid;
            grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
            gap: 24px;
            align-items: start;
        }

        .cartao {
            background: var(--branco);
            border: 1px solid var(--borda);
            border-radius: 20px;
            box-shadow: var(--sombra);
            padding: 28px;
        }

        .tituloSecao {
            margin: 0 0 20px;
            color: var(--verdeEscuro);
            font-size: 1.4rem;
        }

        .gradeFormulario {
            display: grid;
            grid-template-columns: repeat(2, minmax(220px, 1fr));
            gap: 20px;
        }

        .campo {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .campoCompleto {
            grid-column: 1 / -1;
        }

        label {
            font-weight: 700;
            color: var(--cinzaEscuro);
            font-size: 0.98rem;
        }

        input,
        select,
        textarea {
            width: 100%;
            border: 1px solid var(--borda);
            border-radius: 12px;
            background: var(--cinzaClaro);
            padding: 12px 14px;
            font-size: 1rem;
            color: var(--cinzaEscuro);
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        input:focus,
        select:focus,
        textarea:focus {
            outline: none;
            border-color: var(--verdeMedio);
            box-shadow: 0 0 0 4px rgba(46, 139, 87, 0.1);
        }

        textarea {
            min-height: 150px;
            resize: vertical;
        }

        .textoAjuda {
            color: var(--cinzaMedio);
            font-size: 0.8rem;
            margin: -4px 0 0;
        }

        .listaCriterios {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 10px;
            padding: 12px 0 0;
        }

        .listaCriterios label {
            display: flex;
            align-items: center;
            gap: 10px;
            background: var(--verdeClaro);
            border: 1px solid #d6ecdf;
            border-radius: 12px;
            padding: 10px 12px;
            font-weight: 600;
            cursor: pointer;
        }

        .listaCriterios input {
            width: auto;
            accent-color: var(--verdeMedio);
        }

        .botoes {
            display: flex;
            justify-content: flex-end;
            gap: 14px;
            margin-top: 26px;
            flex-wrap: wrap;
        }

        button {
            border: none;
            border-radius: 12px;
            padding: 12px 20px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        button:hover {
            transform: translateY(-1px);
        }

        .botaoPrimario {
            background: var(--verdeMedio);
            color: var(--branco);
            box-shadow: 0 10px 18px rgba(46, 139, 87, 0.24);
        }

        .botaoSecundario {
            background: var(--verdeClaro);
            color: var(--verdeEscuro);
            border: 1px solid #cfead9;
        }

        .cartaoResumo {
            position: sticky;
            top: 20px;
            background: linear-gradient(180deg, #ffffff 0%, #f3fbf6 100%);
        }

        .cartaoResumo h2 {
            margin: 0 0 18px;
            color: var(--verdeEscuro);
            font-size: 1.2rem;
        }

        .listaResumo {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .listaResumo li {
            background: var(--branco);
            border: 1px solid var(--borda);
            border-radius: 12px;
            padding: 10px 12px;
        }

        .listaResumo strong {
            display: block;
            margin-bottom: 4px;
            color: var(--verdeEscuro);
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        @media (max-width: 850px) {
            .conteudo {
                grid-template-columns: 1fr;
            }

            .cartaoResumo {
                position: static;
            }
        }

        @media (max-width: 620px) {
            .gradeFormulario {
                grid-template-columns: 1fr;
            }

            .cabecalho {
                flex-direction: column;
                align-items: flex-start;
            }

            .botoes {
                justify-content: stretch;
            }

            .botoes button {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="pagina">
        <header class="cabecalho">
            <div class="cabecalhoTexto">
                <span class="badge">Feedback IA</span>
                <h1>Resposta de Referência</h1>
            </div>
            <div class="badge">Formato acadêmico</div>
        </header>

        <main class="conteudo">
            <section class="cartao">
                <h2 class="tituloSecao">Cadastrar resposta modelo</h2>

                <form id="formRespostaReferencia" novalidate>
                    <div class="gradeFormulario">
                        <div class="campo">
                            <label for="tituloAtividade">Título da atividade</label>
                            <input id="tituloAtividade" name="tituloAtividade" type="text" placeholder="Ex.: Análise crítica da produção textual" required>
                        </div>

                        <div class="campo">
                            <label for="disciplina">Disciplina</label>
                            <input id="disciplina" name="disciplina" type="text" placeholder="Ex.: Língua Portuguesa" required>
                        </div>

                        <div class="campo">
                            <label for="turma">Turma</label>
                            <input id="turma" name="turma" type="text" placeholder="Ex.: 7º ano A" required>
                        </div>

                        <div class="campo">
                            <label for="professor">Professor(a)</label>
                            <input id="professor" name="professor" type="text" placeholder="Nome do docente" required>
                        </div>

                        <div class="campo campoCompleto">
                            <label for="objetivoAtividade">Objetivo da atividade</label>
                            <textarea id="objetivoAtividade" name="objetivoAtividade" placeholder="Descreva o propósito da tarefa, o conteúdo previsto e a intenção pedagógica." required></textarea>
                        </div>

                        <div class="campo campoCompleto">
                            <label for="respostaReferencia">Resposta de referência</label>
                            <textarea id="respostaReferencia" name="respostaReferencia" placeholder="Escreva a resposta modelo, com linguagem clara, objetiva e de nível acadêmico." required></textarea>
                            <p id="contadorPalavras" class="textoAjuda">0 palavras</p>
                        </div>

                        <div class="campo campoCompleto">
                            <label>Critérios de avaliação</label>
                            <div class="listaCriterios">
                                <label><input type="checkbox" name="criterio" value="clareza"> Clareza</label>
                                <label><input type="checkbox" name="criterio" value="coerencia"> Coerência</label>
                                <label><input type="checkbox" name="criterio" value="argumentacao"> Argumentação</label>
                                <label><input type="checkbox" name="criterio" value="organizacao"> Organização</label>
                                <label><input type="checkbox" name="criterio" value="conhecimento"> Conhecimento</label>
                                <label><input type="checkbox" name="criterio" value="criatividade"> Criatividade</label>
                            </div>
                        </div>

                        <div class="campo">
                            <label for="valorAtividade">Pontuação esperada</label>
                            <input id="valorAtividade" name="valorAtividade" type="number" min="1" max="100" placeholder="Ex.: 10" required>
                        </div>

                        <div class="campo">
                            <label for="nivelComplexidade">Nível de complexidade</label>
                            <select id="nivelComplexidade" name="nivelComplexidade" required>
                                <option value="">Selecione</option>
                                <option value="basico">Básico</option>
                                <option value="intermediario">Intermediário</option>
                                <option value="avancado">Avançado</option>
                            </select>
                        </div>

                        <div class="campo campoCompleto">
                            <label for="observacoesPedagogicas">Observações pedagógicas</label>
                            <textarea id="observacoesPedagogicas" name="observacoesPedagogicas" placeholder="Inclua orientações para correção, pontos de atenção e critérios de excelência."></textarea>
                        </div>
                    </div>

                    <div class="botoes">
                        <button type="button" class="botaoSecundario" id="botaoModelo">Usar modelo</button>
                        <button type="submit" class="botaoPrimario">Salvar resposta</button>
                    </div>
                </form>
            </section>

            <aside class="cartao cartaoResumo">
                <h2>Resumo da referência</h2>
                <ul class="listaResumo">
                    <li>
                        <strong>Atividade</strong>
                        <span id="resumoTitulo">Não informado</span>
                    </li>
                    <li>
                        <strong>Disciplina</strong>
                        <span id="resumoDisciplina">Não informado</span>
                    </li>
                    <li>
                        <strong>Professor(a)</strong>
                        <span id="resumoProfessor">Não informado</span>
                    </li>
                    <li>
                        <strong>Critérios</strong>
                        <span id="resumoCriterios">Nenhum critério selecionado</span>
                    </li>
                    <li>
                        <strong>Pontuação</strong>
                        <span id="resumoPontuacao">Não informada</span>
                    </li>
                </ul>
            </aside>
        </main>
    </div>

    <script>
        const formRespostaReferencia = document.getElementById('formRespostaReferencia');
        const campoRespostaReferencia = document.getElementById('respostaReferencia');
        const contadorPalavras = document.getElementById('contadorPalavras');
        const botaoModelo = document.getElementById('botaoModelo');

        function atualizarContadorPalavras() {
            const textoResposta = campoRespostaReferencia.value.trim();
            const quantidadePalavras = textoResposta ? textoResposta.split(/\s+/).length : 0;
            contadorPalavras.textContent = `${quantidadePalavras} palavra${quantidadePalavras === 1 ? '' : 's'}`;
        }

        function atualizarResumo() {
            const tituloAtividade = document.getElementById('tituloAtividade').value.trim() || 'Não informado';
            const disciplina = document.getElementById('disciplina').value.trim() || 'Não informado';
            const professor = document.getElementById('professor').value.trim() || 'Não informado';
            const pontuacao = document.getElementById('valorAtividade').value.trim() || 'Não informada';
            const criteriosSelecionados = Array.from(document.querySelectorAll('input[name="criterio"]:checked')).map(function(item) {
                return item.value;
            });

            document.getElementById('resumoTitulo').textContent = tituloAtividade;
            document.getElementById('resumoDisciplina').textContent = disciplina;
            document.getElementById('resumoProfessor').textContent = professor;
            document.getElementById('resumoPontuacao').textContent = pontuacao;
            document.getElementById('resumoCriterios').textContent = criteriosSelecionados.length ? criteriosSelecionados.join(', ') : 'Nenhum critério selecionado';
        }

        function preencherModelo() {
            document.getElementById('tituloAtividade').value = 'Análise crítica do texto argumentativo';
            document.getElementById('disciplina').value = 'Língua Portuguesa';
            document.getElementById('turma').value = '8º ano B';
            document.getElementById('professor').value = 'Professora Ana Paula';
            document.getElementById('objetivoAtividade').value = 'Compreender a estrutura de um texto argumentativo e identificar elementos como tese, argumentos e conclusão, além de avaliar a clareza e a organização da escrita.';
            document.getElementById('valorAtividade').value = '10';
            document.getElementById('nivelComplexidade').value = 'intermediario';
            document.getElementById('observacoesPedagogicas').value = 'Espera-se que o estudante apresente uma tese clara, argumentos consistentes e conclusão objetiva, com linguagem formal e organização lógica.';
            document.getElementById('respostaReferencia').value = 'O texto argumentativo é estruturado em torno de uma tese, que expressa a posição defendida pelo autor. Em uma boa produção, a introdução apresenta a ideia central de forma clara e contextualizada, enquanto os parágrafos de desenvolvimento apresentam argumentos consistentes, baseados em exemplos, fatos ou justificativas lógicas. A conclusão retoma a tese e reforça a posição defendida, sem contradizer os pontos apresentados ao longo do texto. Portanto, a qualidade da resposta está relacionada à clareza, à coerência, à organização das ideias e à capacidade de sustentar a argumentação com informações relevantes.';

            document.querySelectorAll('input[name="criterio"]').forEach(function(item) {
                if (['clareza', 'coerencia', 'organizacao', 'argumentacao'].includes(item.value)) {
                    item.checked = true;
                }
            });

            atualizarContadorPalavras();
            atualizarResumo();
        }

        function validarFormulario(evento) {
            evento.preventDefault();

            const camposObrigatorios = [
                document.getElementById('tituloAtividade'),
                document.getElementById('disciplina'),
                document.getElementById('turma'),
                document.getElementById('professor'),
                document.getElementById('objetivoAtividade'),
                document.getElementById('respostaReferencia'),
                document.getElementById('valorAtividade'),
                document.getElementById('nivelComplexidade')
            ];

            const campoVazio = camposObrigatorios.find(function(campo) {
                return !campo.value.trim();
            });

            if (campoVazio) {
                campoVazio.focus();
                alert('Preencha todos os campos obrigatórios antes de salvar a resposta de referência.');
                return;
            }

            alert('Resposta de referência salva com sucesso!');
            formRespostaReferencia.reset();
            atualizarContadorPalavras();
            atualizarResumo();
        }

        formRespostaReferencia.addEventListener('submit', validarFormulario);
        campoRespostaReferencia.addEventListener('input', function() {
            atualizarContadorPalavras();
            atualizarResumo();
        });

        document.getElementById('tituloAtividade').addEventListener('input', atualizarResumo);
        document.getElementById('disciplina').addEventListener('input', atualizarResumo);
        document.getElementById('professor').addEventListener('input', atualizarResumo);
        document.getElementById('valorAtividade').addEventListener('input', atualizarResumo);
        document.querySelectorAll('input[name="criterio"]').forEach(function(item) {
            item.addEventListener('change', atualizarResumo);
        });
        botaoModelo.addEventListener('click', preencherModelo);

        atualizarContadorPalavras();
        atualizarResumo();
    </script>
</body>
</html>

