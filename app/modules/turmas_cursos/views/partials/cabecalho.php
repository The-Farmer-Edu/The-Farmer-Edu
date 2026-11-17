<header>
    <div>
        <strong>The Farmer Edu</strong>
        <span> | Bem-vindo, <?= e($u['nome']) ?></span>
    </div>

    <nav aria-label="Menu principal">
        <details>
            <summary>☰ Menu</summary>
            <ul>
                <li><a href="<?= $base ?>/turmas_cursos/<?= e($u['perfilAcesso']) ?>">Turmas</a></li>
                <?php if ($u['perfilAcesso'] === 'instrutor'): ?>
                    <li><a href="<?= $base ?>/turmas_cursos/cursos">Cursos</a></li>
                    <li><a href="<?= $base ?>/turmas_cursos/alunos">Alunos</a></li>
                <?php endif; ?>
                <li><a href="<?= $base ?>/turmas_cursos/minhaConta">Minha conta</a></li>
                <li><a href="<?= $base ?>/auth/logout">Sair</a></li>
            </ul>
        </details>
    </nav>
</header>
