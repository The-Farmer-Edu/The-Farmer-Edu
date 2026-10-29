<?php
// Função para reaproveitar o que a pessoa digitou quando der erro (e escapar o HTML)
$antigo = static fn(string $campo): string => htmlspecialchars((string) ($_POST[$campo] ?? ''), ENT_QUOTES, 'UTF-8');
$tipoEscolhido = $_POST['tipo'] ?? 'aluno';
?>
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cadastro - The Farmer Edu</title>
    <link rel="stylesheet" href="file?type=css&file=novoUsuario.css">
</head>
<body id="pagina-cadastro">
    <main class="tela-cadastro" id="tela-cadastro">
        
        <section class="painel-cadastro" id="painel-cadastro">
            <h1 class="titulo-cadastro" id="titulo-cadastro">Cadastro</h1>

            <?php if (!empty($mensagem)): ?>
                <p class="mensagem" id="mensagem-erro"><strong><?= htmlspecialchars($mensagem, ENT_QUOTES, 'UTF-8') ?></strong></p>
            <?php endif; ?>

                <form class="form-cadastro" id="form-cadastro" action="" method="POST">
                <div class="campo" id="campo-nome">
                    <label for="nome">Nome</label>
                    <input type="text" id="nome" name="nome" value="<?= $antigo('nome') ?>" required>
                </div>

                <div class="campo" id="campo-email">
                    <label for="email">E-mail</label>
                    <input type="email" id="email" name="email" value="<?= $antigo('email') ?>" required>
                </div>

                <div class="campo" id="campo-senha">
                    <label for="senha">Senha</label>
                    <input type="password" id="senha" name="senha" minlength="8" required>
                    <span class="dica" id="dica-senha">Mínimo de 8 caracteres</span>
                </div>
                
                <div class="campo" id="campo-tipo">
                    <label for="tipo">Eu sou</label>
                    <select id="tipo" name="tipo" required>
                        <option value="aluno" <?= $tipoEscolhido === 'aluno' ? 'selected' : '' ?>>Aluno</option>
                        <option value="instrutor" <?= $tipoEscolhido === 'instrutor' ? 'selected' : '' ?>>Instrutor</option>
                    </select>
                </div>

                <div class="campo" id="campo-materias" hidden>
                    <label for="materias">Matérias</label>
                    <input type="text" id="materias" name="materias" value="<?= $antigo('materias') ?>" placeholder="Ex.: PHP, Banco de Dados">
                    <span class="dica" id="dica-materias">Separe por vírgula</span>
                </div>

                <button type="submit" class="btn-cadastrar" id="btn-cadastrar">Cadastrar</button>
            </form>

            <p class="texto-login" id="texto-login">
                Já tem conta?
                <a class="link-verde" id="link-login-aluno" href="loginAluno">Entrar como aluno</a>
                <span class="separador">|</span>
                <a class="link-verde" id="link-login-instrutor" href="loginInstrutor">Entrar como instrutor</a>
            </p>
        </section>

        <aside class="painel-imagem" id="painel-imagem">
            <img class="logo" id="logo" src="/The-Farmer-Edu-tarde/public/assets/img/png/logo_icone.png" alt="Logo The Farm Edu">
            <h2 class="nome-marca" id="nome-marca">The Farm Edu</h2>
        </aside>

    </main>

    <script>
        const tipo = document.getElementById('tipo');
        const campoMaterias = document.getElementById('campo-materias');

        function atualizarCampos() {
            campoMaterias.hidden = tipo.value !== 'instrutor';
        }

        tipo.addEventListener('change', atualizarCampos);
        atualizarCampos(); // roda uma vez quando abre a página
    </script>
</body>
</html>
