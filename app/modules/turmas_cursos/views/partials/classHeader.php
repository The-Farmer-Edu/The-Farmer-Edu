<header class="class-header">
    <a href="<?= $base ?>/turmas_cursos/<?= e($u['perfilAcesso']) ?>" aria-label="Página inicial"><img class="class-header__logo" src="<?= e($logoUrl) ?>" alt="The Farmer Edu"></a>
    <div class="class-header__text"><h1><?= e($turma['nome_turma']) ?></h1><p><?= e($turma['nome_curso']) ?> · <?= e(TurmaModel::TURNOS[$turma['turno']] ?? $turma['turno']) ?> · Turma #<?= (int) $turma['id_turma'] ?></p></div>
    <div class="dropdown"><button class="avatar-button" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Abrir menu do usuário"><?= e(inicialNome((string) $u['nome'])) ?></button><ul class="dropdown-menu dropdown-menu-end topbar-menu"><li><a class="dropdown-item" href="<?= $base ?>/turmas_cursos/<?= e($u['perfilAcesso']) ?>">Minhas turmas</a></li><li><a class="dropdown-item" href="<?= $base ?>/turmas_cursos/cursos">Cursos</a></li><li><a class="dropdown-item" href="<?= $base ?>/auth/logout">Sair</a></li></ul></div>
</header>
