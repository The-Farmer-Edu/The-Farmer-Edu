<header class="app-topbar">
    <div class="topbar-brand">
        <a href="<?= $base ?>/turmas_cursos/<?= e($u['perfilAcesso']) ?>" aria-label="Página inicial The Farmer Edu">
            <img src="<?= e($logoUrl) ?>" alt="" class="brand-logo">
            <span class="brand-name">The Farm <strong>Edu</strong></span>
        </a>
    </div>
    <div class="topbar-actions">
        <span class="welcome-text">Bem-vindo, <strong><?= e($u['nome']) ?></strong></span>
        <span class="avatar-button" aria-label="Usuário <?= e($u['nome']) ?>">
            <?= e(inicialNome((string) $u['nome'])) ?>
        </span>
        <div class="dropdown">
            <button class="btn btn-link topbar-menu-button" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Abrir menu principal">
                <i class="bi bi-list"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end topbar-menu">
                <li><a class="dropdown-item" href="<?= $base ?>/turmas_cursos/<?= e($u['perfilAcesso']) ?>"><i class="bi bi-grid me-2"></i>Turmas</a></li>
                <li><a class="dropdown-item" href="<?= $base ?>/turmas_cursos/cursos"><i class="bi bi-journals me-2"></i>Cursos</a></li>
                <?php if ($u['perfilAcesso'] === 'instrutor'): ?>
                    <li><a class="dropdown-item" href="<?= $base ?>/turmas_cursos/alunos"><i class="bi bi-people me-2"></i>Alunos</a></li>
                <?php endif; ?>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="<?= $base ?>/turmas_cursos/minhaConta"><i class="bi bi-person-circle me-2"></i>Minha conta</a></li>
                <li><a class="dropdown-item" href="<?= $base ?>/auth/logout"><i class="bi bi-box-arrow-right me-2"></i>Sair</a></li>
            </ul>
        </div>
    </div>
</header>
