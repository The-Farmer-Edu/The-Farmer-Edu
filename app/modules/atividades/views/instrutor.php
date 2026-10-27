<?php
$inicial = mb_strtoupper(mb_substr($usuario['nome'], 0, 1, 'UTF-8'), 'UTF-8');
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<base href="<?= htmlspecialchars($base, ENT_QUOTES, 'UTF-8') ?>/">
<title>Postar Atividade</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Poppins:wght@500;700&display=swap">
<link rel="stylesheet" href="atividades/file?type=css&file=atividades.css">
</head>
<body class="tema-instrutor" data-instrutor="<?= htmlspecialchars($usuario['nome'], ENT_QUOTES, 'UTF-8') ?>">

<header>
    <img src="assets/img/png/logo_icone.png" alt="The Farm Edu">
    <div class="titulo-header">
        <h2 id="cabeçalho-titulo">MINHAS TURMAS</h2>
        <p id="cabecalho-sub">The Farmer Edu</p>
    </div>
    <div class="avatar"><?= htmlspecialchars($inicial, ENT_QUOTES, 'UTF-8') ?></div>
</header>

<div class="layout">

       <aside class="sidebar">
        <button class="menu-item" data-menu="mural" onclick="abrirPagina('mural')">
            <span class="icone">M</span>
            Mural
        </button>

        <button class="menu-item active" data-menu="atividades" onclick="abrirPagina('atividades')">
            <span class="icone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M8 11l1.2 1.2L11 10.4M13 11.5h3M8 16l1.2 1.2L11 15.4M13 16.5h3"/></svg>
            </span>
            Atividades
        </button>

        <button class="menu-item" data-menu="pessoas" onclick="abrirPagina('pessoas')">
            <span class="icone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/></svg>
            </span>
            Pessoas
        </button>

        <button class="menu-item back" onclick="abrirPagina('atividades')">
            <span class="icone">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4"/><path d="M14 8l4 4-4 4M18 12H9"/></svg>
            </span>
            Voltar
        </button>

        </aside>

    <main>

        <p id="aviso" class="aviso hidden" role="alert"></p>

        <section id="pagina-atividades" class="pagina">

            <div class="banner">
                <div class="banner-topo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M8 11l1.2 1.2L11 10.4M13 11.5h3M8 16l1.2 1.2L11 15.4M13 16.5h3"/></svg>
                    <h1>ATIVIDADES</h1>
                </div>
                <div class="banner-corpo">
                    <button class="primary" onclick="abrirPagina('opcoes')">
                        Adicionar Atividade
                    </button>
                </div>
            </div>

            <div id="lista-atividades" class="feed"></div>
            
        </section>


        <section id="pagina-opcoes" class="pagina hidden">

            <div class="page-header">
                <h1>O que você deseja adicionar?</h1>
            </div>

            <p>Escolha uma opção para continuar.</p>

            <div class="option-grid">

                <button class="option-card"
                    onclick="novaAtividade('codigo')">
                    Atividade de código
                    <small>O aluno responde com código, na linguagem que você escolher.</small>
                </button>

                <button class="option-card"
                    onclick="novaAtividade('texto')">
                    Atividade de texto
                    <small>O aluno responde escrevendo um texto livre.</small>
                </button>

                <button class="option-card"
                    onclick="novaAtividade('quiz')">
                    Pergunta
                    <small>Crie uma pergunta com alternativas de resposta.</small>
                </button>

                <button class="option-card"
                    onclick="abrirPagina('reutilizar')">
                    Reutilizar atividade já postada
                    <small>Escolha uma atividade existente para reutilizar.</small>
                </button>

            </div>

            <div class="form-actions">
                <button class="secondary"
                    onclick="abrirPagina('atividades')">
                    Voltar
                </button>
            </div>
        </section>

        <section id="pagina-normal" class="pagina hidden">
            <div class="form-card">
                <h2>Criar atividade</h2>
                <p>Adicione uma nova atividade de código para sua turma.</p>
                <p class="formato" data-tipo="codigo"></p>

                <form onsubmit="salvarAtividade(event)">
                    <input type="hidden" name="id_atividade" value="">
                    <input type="hidden" name="tipo" value="codigo">

                    <div class="field">
                        <label for="titulo-normal">Título</label>
                        <input id="titulo-normal" name="titulo"
                            placeholder="" maxlength="150" required>
                    </div>

                    <div class="field">
                        <label for="turma-normal">Turma</label>
                        <select id="turma-normal" name="id_turma" class="select-turma" required>
                            <option value="">Selecione</option>
                        </select>
                    </div>

                    <div class="field">
                        <label for="linguagem-normal">Linguagem</label>
                        <select id="linguagem-normal" name="linguagem" class="select-linguagem" required>
                            <option value="">Selecione</option>
                        </select>
                    </div>

                    <div class="field">
                        <label for="descricao-normal">Enunciado e descrição</label>
                        <textarea id="descricao-normal" name="descricao"
                            placeholder=""
                            required></textarea>
                    </div>

                    <div class="field">
                        <label for="prazo-normal">Prazo de entrega</label>
                        <input type="date" id="prazo-normal" name="prazo" required>
                    </div>

                    <div class="form-actions">
                        <button class="primary" type="submit">Publicar</button>
                        <button class="secondary" type="button"
                            onclick="cancelarFormulario(this)">Cancelar</button>
                    </div>
                </form>
            </div>
        </section>

        <section id="pagina-texto" class="pagina hidden">
            <div class="form-card">
                <h2>Publicar atividade de texto</h2>
                <p>O aluno vai responder esta atividade escrevendo um texto.</p>
                <p class="formato" data-tipo="texto"></p>

                <form onsubmit="salvarAtividade(event)">
                    <input type="hidden" name="id_atividade" value="">
                    <input type="hidden" name="tipo" value="texto">

                    <div class="field">
                        <label for="titulo-texto">Título</label>
                        <input id="titulo-texto" name="titulo"
                            placeholder="" maxlength="150" required>
                    </div>

                    <div class="field">
                        <label for="turma-texto">Turma</label>
                        <select id="turma-texto" name="id_turma" class="select-turma" required>
                            <option value="">Selecione</option>
                        </select>
                    </div>

                    <div class="field">
                        <label for="conteudo-texto">Enunciado</label>
                        <textarea id="conteudo-texto" name="descricao"
                            placeholder=""
                            required></textarea>
                    </div>

                    <div class="field">
                        <label for="prazo-texto">Prazo de entrega</label>
                        <input type="date" id="prazo-texto" name="prazo" required>
                    </div>

                    <div class="form-actions">
                        <button class="primary" type="submit">Publicar atividade</button>
                        <button class="secondary" type="button"
                            onclick="cancelarFormulario(this)">Cancelar</button>
                    </div>
                </form>
            </div>
        </section>

        <section id="pagina-pergunta" class="pagina hidden">
            <div class="form-card">
                <h2>Criar pergunta</h2>
                <p>Crie uma pergunta para os alunos responderem.</p>
                <p class="formato" data-tipo="quiz"></p>

                <form onsubmit="salvarAtividade(event)">
                    <input type="hidden" name="id_atividade" value="">
                    <input type="hidden" name="tipo" value="quiz">

                    <div class="field">
                        <label for="titulo-pergunta">Título</label>
                        <input id="titulo-pergunta" name="titulo"
                            placeholder="" maxlength="150" required>
                    </div>

                    <div class="field">
                        <label for="turma-pergunta">Turma</label>
                        <select id="turma-pergunta" name="id_turma" class="select-turma" required>
                            <option value="">Selecione</option>
                        </select>
                    </div>

                    <div class="field">
                        <label for="enunciado-pergunta">Enunciado da pergunta</label>
                        <textarea id="enunciado-pergunta" name="descricao"
                            placeholder="" required></textarea>
                    </div>

                    <div class="field">
                        <label for="alternativa-a">Alternativa A</label>
                        <input id="alternativa-a" name="alternativaA"
                            placeholder="" required>
                    </div>

                    <div class="field">
                        <label for="alternativa-b">Alternativa B</label>
                        <input id="alternativa-b" name="alternativaB"
                            placeholder="" required>
                    </div>

                    <div class="field">
                        <label for="alternativa-c">Alternativa C</label>
                        <input id="alternativa-c" name="alternativaC"
                            placeholder="" required>
                    </div>

                    <div class="field">
                        <label for="prazo-pergunta">Prazo de entrega</label>
                        <input type="date" id="prazo-pergunta" name="prazo" required>
                    </div>

                    <div class="form-actions">
                        <button class="primary" type="submit">Publicar pergunta</button>
                        <button class="secondary" type="button"
                            onclick="cancelarFormulario(this)">Cancelar</button>
                    </div>
                </form>
            </div>
        </section>

        <section id="pagina-reutilizar" class="pagina hidden">
            <div class="form-card">
                <h2>Reutilizar atividade</h2>
                <p>Selecione uma atividade da lista para usar como base de uma nova.</p>

                <div id="lista-reutilizar" class="feed"></div>

                <div class="form-actions">
                    <button class="secondary"
                        onclick="abrirPagina('opcoes')">
                        ← Voltar
                    </button>
                </div>
            </div>
        </section>

        <section id="pagina-mural" class="pagina hidden">
            <div class="page-header">
                <h1>MURAL DA TURMA</h1>
            </div>

            <div class="form-card">
                <h2>Bem-vindo ao mural!</h2>
                <p>Aqui poderão aparecer avisos e publicações da turma.</p>
                <button class="primary"
                    onclick="abrirPagina('atividades')">
                    Ver atividades
                </button>
            </div>
        </section>

        <section id="pagina-pessoas" class="pagina hidden">
            <div class="page-header">
                <h1>PESSOAS</h1>
            </div>

            <div class="form-card">
                <h2>Participantes da turma</h2>
                <p>Os alunos e instrutores poderão ser listados aqui.</p>
            </div>
        </section>
    </main>
</div>

<script src="atividades/file?type=js&file=instrutor.js"></script>
</body>
</html>