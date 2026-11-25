<?php
/**
 * ============================================================================
 * The Farmer Edu — Cabeçalho Oficial Unificado (app/core/cabecalho.php)
 * ============================================================================
 * Baseado no Guia de Design Oficial:
 * - Tema Aluno: Fundo #A0FDA3, Avatar #089C2F, Verde #1B5E20
 * - Tema Instrutor: Fundo #90BDF0, Avatar #2276E3, Azul #0088FF
 * - Destaque: Brilho laranja característico box-shadow: 0px 4px 3px rgba(248,96,17,0.5)
 * - Geometria: border-radius: 0 0 10px 10px
 * - Tipografia: Poppins (Interface) e Inter (Conteúdo)
 * - Marca: "The Farmer Edu" com "Edu" sempre verde (#089C2F) e o restante em navy (#002D38)
 * ============================================================================
 */

if (defined('TFE_CABECALHO_RENDERED')) {
    return;
}
define('TFE_CABECALHO_RENDERED', true);

// 1. Resolução do usuário autenticado
if (!function_exists('dadosUsuarioLogado')) {
    if (file_exists(__DIR__ . '/session.php')) {
        require_once __DIR__ . '/session.php';
    } elseif (file_exists(__DIR__ . '/../../core/session.php')) {
        require_once __DIR__ . '/../../core/session.php';
    }
}

$currentUser = $u ?? $usuario ?? (function_exists('usuarioLogado') ? usuarioLogado() : null) ?? ($_SESSION['usuario'] ?? []);
if (!is_array($currentUser)) {
    $currentUser = [];
}
$isLoggedIn = !empty($currentUser['idUsuario']) || !empty($currentUser['id']) || !empty($currentUser['email']);
$userName = trim((string)($currentUser['nome'] ?? 'Usuário'));
$userRole = strtolower((string)($currentUser['perfilAcesso'] ?? $currentUser['tipo_usuario'] ?? 'aluno'));
$isInstructor = ($userRole === 'instrutor');

// 2. Resolução da URL base da aplicação
if (!isset($base) || empty($base)) {
    $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
    $base = ($scriptDir !== '/' && $scriptDir !== '\\') ? rtrim(str_replace('\\', '/', $scriptDir), '/') : '';
}

// 3. Resolução da Logo Oficial
$logoSrc = $base . '/assets/img/svg/logo_icone.svg';

// 4. Iniciais do Nome para o Avatar
$userInitials = '';
$nameParts = preg_split('/\s+/', $userName);
if (!empty($nameParts[0])) {
    $userInitials .= mb_strtoupper(mb_substr($nameParts[0], 0, 1, 'UTF-8'), 'UTF-8');
}
if (count($nameParts) > 1 && !empty($nameParts[count($nameParts) - 1])) {
    $userInitials .= mb_strtoupper(mb_substr($nameParts[count($nameParts) - 1], 0, 1, 'UTF-8'), 'UTF-8');
}
if ($userInitials === '') {
    $userInitials = 'U';
}

// 5. Configurações de Cores pelo Guia de Design
if ($isInstructor) {
    $bgHeader = '#90BDF0';      // Azul claro — fundo da barra superior do instrutor
    $avatarBg = '#2276E3';      // Azul escuro — avatar / ativo instrutor
    $accentColor = '#0088FF';    // Azul primário
    $roleLabel = 'Instrutor';
    $roleHome = $base . '/turmas_cursos/instrutor';
    $roleBadgeBg = '#E0EEFF';
    $roleBadgeColor = '#005BB5';
} else {
    $bgHeader = '#A0FDA3';      // Verde claro — fundo da barra superior do aluno
    $avatarBg = '#089C2F';      // Verde escuro — avatar / ativo aluno
    $accentColor = '#1B5E20';    // Verde primário
    $roleLabel = 'Aluno';
    $roleHome = $base . '/turmas_cursos/aluno';
    $roleBadgeBg = '#E5F9E7';
    $roleBadgeColor = '#1B5E20';
}

if (!$isLoggedIn) {
    $roleHome = $base . '/home';
}

$tfeHeaderZ = isset($tfeHeaderZ) ? (int) $tfeHeaderZ : 1050;
?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<!-- CABEÇALHO OFICIAL UNIFICADO - THE FARMER EDU -->
<header class="tfe-topbar" id="tfeUnifiedHeader">
    <div class="tfe-topbar-inner">
        <!-- Logo e Marca -->
        <div class="tfe-brand">
            <a href="<?= htmlspecialchars($roleHome, ENT_QUOTES, 'UTF-8') ?>" class="tfe-brand-link" title="Ir para o início">
                <img src="<?= htmlspecialchars($logoSrc, ENT_QUOTES, 'UTF-8') ?>" alt="The Farmer Edu" class="tfe-logo-img" onerror="this.style.display='none'">
                <span class="tfe-brand-text">The Farmer <strong class="tfe-brand-edu">Edu</strong></span>
            </a>
        </div>

        <!-- Ações do Usuário e Menu -->
        <div class="tfe-actions">
            <?php if (!$isLoggedIn): ?>
                <a class="tfe-guest-link" href="<?= htmlspecialchars($base . '/auth/loginAluno', ENT_QUOTES, 'UTF-8') ?>">Entrar como aluno</a>
                <a class="tfe-guest-link" href="<?= htmlspecialchars($base . '/auth/loginInstrutor', ENT_QUOTES, 'UTF-8') ?>">Entrar como instrutor</a>
                <a class="tfe-guest-link tfe-guest-cta" href="<?= htmlspecialchars($base . '/auth/novoUsuario', ENT_QUOTES, 'UTF-8') ?>">Cadastrar</a>
            <?php else: ?>
            <span class="tfe-welcome">
                Bem-vindo(a), <strong><?= htmlspecialchars($userName, ENT_QUOTES, 'UTF-8') ?></strong>
            </span>

            <!-- Botão de Avatar / Trigger do Menu -->
            <div class="tfe-dropdown" id="tfeUserDropdown">
                <button type="button" class="tfe-avatar-btn" id="tfeAvatarBtn" aria-expanded="false" aria-haspopup="true" aria-label="Abrir menu do usuário">
                    <span class="tfe-avatar"><?= htmlspecialchars($userInitials, ENT_QUOTES, 'UTF-8') ?></span>
                    <svg class="tfe-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>

                <!-- Menu Suspenso Padronizado -->
                <div class="tfe-dropdown-menu" id="tfeDropdownMenu" role="menu" aria-labelledby="tfeAvatarBtn">
                    <div class="tfe-dropdown-header">
                        <div class="tfe-user-info">
                            <span class="tfe-user-name"><?= htmlspecialchars($userName, ENT_QUOTES, 'UTF-8') ?></span>
                            <span class="tfe-user-badge"><?= htmlspecialchars($roleLabel, ENT_QUOTES, 'UTF-8') ?></span>
                        </div>
                    </div>

                    <div class="tfe-dropdown-divider"></div>

                    <div class="tfe-dropdown-nav">
                        <?php if ($isInstructor): ?>
                            <!-- Opções Padronizadas: Instrutor -->
                            <a href="<?= htmlspecialchars($base . '/turmas_cursos/instrutor', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item" role="menuitem">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                <span>Minhas Turmas</span>
                            </a>
                            <a href="<?= htmlspecialchars($base . '/turmas_cursos/cursos', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item" role="menuitem">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                <span>Cursos</span>
                            </a>
                            <a href="<?= htmlspecialchars($base . '/turmas_cursos/alunos', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item" role="menuitem">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                <span>Alunos Matriculados</span>
                            </a>
                            <a href="<?= htmlspecialchars($base . '/atividades/instrutor', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item" role="menuitem">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                <span>Gerenciar Atividades</span>
                            </a>
                            <a href="<?= htmlspecialchars($base . '/notas/instrutor', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item" role="menuitem">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                                <span>Centro de Notas</span>
                            </a>
                            <a href="<?= htmlspecialchars($base . '/notificacoes', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item" role="menuitem">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                <span>Notificações</span>
                            </a>
                        <?php else: ?>
                            <!-- Opções Padronizadas: Aluno -->
                            <a href="<?= htmlspecialchars($base . '/turmas_cursos/aluno', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item" role="menuitem">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                <span>Minhas Turmas</span>
                            </a>
                            <a href="<?= htmlspecialchars($base . '/turmas_cursos/cursos', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item" role="menuitem">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                <span>Meus Cursos</span>
                            </a>
                            <a href="<?= htmlspecialchars($base . '/atividades/aluno', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item" role="menuitem">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                <span>Minhas Atividades</span>
                            </a>
                            <a href="<?= htmlspecialchars($base . '/notas/aluno', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item" role="menuitem">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                                <span>Minhas Notas</span>
                            </a>
                            <a href="<?= htmlspecialchars($base . '/fazenda', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item" role="menuitem">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                <span>Minha Fazenda</span>
                            </a>
                            <a href="<?= htmlspecialchars($base . '/notificacoes', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item" role="menuitem">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                <span>Notificações</span>
                            </a>
                        <?php endif; ?>

                        <div class="tfe-dropdown-divider"></div>

                        <!-- Conta e Logout -->
                        <a href="<?= htmlspecialchars($base . '/auth/editarConta', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item" role="menuitem">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                            <span>Minha Conta</span>
                        </a>
                        <a href="<?= htmlspecialchars($base . '/auth/logout', ENT_QUOTES, 'UTF-8') ?>" class="tfe-menu-item tfe-item-logout" role="menuitem">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            <span>Sair</span>
                        </a>
                    </div>
                </div>
            </div>
            <?php endif; ?>
        </div>
    </div>
</header>

<style>
/* ============================================================
   ESTILOS OFICIAIS DO CABEÇALHO UNIFICADO THE FARMER EDU
   Conforme Guia de Design (Tokens, Cores, Sombra e Geometria)
   ============================================================ */
.tfe-topbar {
    width: 100% !important;
    background: <?= $bgHeader ?> !important;
    box-shadow: 0px 4px 3px rgba(248, 96, 17, 0.5) !important; /* Brilho quente característico do Guia */
    border-radius: 0 0 10px 10px !important;                 /* Raio de 10px na barra superior */
    position: sticky !important;
    top: 0 !important;
    z-index: <?= $tfeHeaderZ ?> !important;
    font-family: 'Poppins', 'Segoe UI', Arial, sans-serif !important;
    box-sizing: border-box !important;
}

.tfe-topbar-inner {
    max-width: 1400px;
    min-height: 64px;
    margin: 0 auto;
    padding: 8px clamp(16px, 3vw, 40px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    box-sizing: border-box;
}

/* Marca / Logo */
.tfe-brand {
    display: flex;
    align-items: center;
}

.tfe-brand-link {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    text-decoration: none !important;
    color: #002D38 !important;
    transition: opacity 0.2s ease;
}

.tfe-brand-link:hover {
    opacity: 0.9;
}

.tfe-logo-img {
    width: 42px !important;
    height: 42px !important;
    object-fit: contain !important;
    border-radius: 50% !important;
    background: #FFFFFF !important;
    padding: 2px !important;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12) !important;
}

.tfe-brand-text {
    font-family: 'Poppins', sans-serif !important;
    font-size: 20px !important;
    font-weight: 700 !important;
    color: #002D38 !important;
    letter-spacing: -0.5px;
    line-height: 1;
}

.tfe-brand-edu {
    color: #089C2F !important; /* "Edu" SEMPRE em verde, conforme regra oficial do Guia */
    font-weight: 800 !important;
}

/* Ações e Avatar */
.tfe-actions {
    display: flex;
    align-items: center;
    gap: 16px;
}

.tfe-welcome {
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #002D38;
    white-space: nowrap;
}

.tfe-welcome strong {
    font-weight: 700;
}

@media (max-width: 680px) {
    .tfe-welcome {
        display: none;
    }
}

/* Dropdown */
.tfe-dropdown {
    position: relative;
}

.tfe-avatar-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    padding: 2px;
    cursor: pointer;
    border-radius: 20px;
    transition: all 0.2s ease;
}

.tfe-avatar-btn:hover,
.tfe-avatar-btn:focus {
    outline: none;
    filter: brightness(0.95);
}

.tfe-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: <?= $avatarBg ?> !important;
    color: #FFFFFF !important;
    border: 2px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.5px;
}

.tfe-chevron {
    color: #002D38;
    transition: transform 0.2s ease;
}

.tfe-dropdown.active .tfe-chevron {
    transform: rotate(180deg);
}

/* Menu Suspenso */
.tfe-dropdown-menu {
    display: none;
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    width: 260px;
    background: #FFFFFF;
    border-radius: 14px;
    box-shadow: 0 10px 25px rgba(0, 45, 56, 0.18);
    border: 1px solid rgba(0, 45, 56, 0.1);
    padding: 8px 0;
    z-index: 1100;
    animation: tfeFadeIn 0.18s ease-out;
}

@keyframes tfeFadeIn {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.tfe-dropdown.active .tfe-dropdown-menu {
    display: block;
}

.tfe-dropdown-header {
    padding: 10px 16px 8px;
}

.tfe-user-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.tfe-user-name {
    font-size: 14px;
    font-weight: 700;
    color: #002D38;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tfe-user-badge {
    align-self: flex-start;
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    background: <?= $roleBadgeBg ?>;
    color: <?= $roleBadgeColor ?>;
    padding: 2px 8px;
    border-radius: 12px;
}

.tfe-dropdown-divider {
    height: 1px;
    background: #E6E6E6;
    margin: 6px 0;
}

.tfe-dropdown-nav {
    display: flex;
    flex-direction: column;
}

.tfe-menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    color: #002D38 !important;
    text-decoration: none !important;
    transition: background 0.15s ease, color 0.15s ease;
}

.tfe-menu-item svg {
    color: #727272;
    transition: color 0.15s ease;
    flex-shrink: 0;
}

.tfe-menu-item:hover {
    background: #F4F7F5;
    color: <?= $accentColor ?> !important;
}

.tfe-menu-item:hover svg {
    color: <?= $accentColor ?>;
}

.tfe-item-logout {
    color: #DC2626 !important;
}

.tfe-item-logout svg {
    color: #DC2626;
}

.tfe-item-logout:hover {
    background: #FEE2E2 !important;
    color: #B91C1C !important;
}

.tfe-item-logout:hover svg {
    color: #B91C1C;
}
</style>

<script>
// Toggle autocontido para o menu do cabeçalho
(function() {
    const dropdown = document.getElementById('tfeUserDropdown');
    const btn = document.getElementById('tfeAvatarBtn');
    if (!dropdown || !btn) return;

    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('active');
        dropdown.classList.toggle('active', !isOpen);
        btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            dropdown.classList.remove('active');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
})();
</script>
