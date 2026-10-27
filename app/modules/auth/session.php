<?php
const SESSAO_INATIVIDADE_SEGUNDOS = 60 * 60 * 4;
function registrarAtividadeSessao(): void {
    iniciarSessao();
    $_SESSION['ultimaAtividade'] = time();
}
function sessaoExpirouPorInatividade(): bool {
    iniciarSessao();
    if (!isset($_SESSION['usuario'])) return false;
    $ultima = (int) ($_SESSION['ultimaAtividade'] ?? 0);
    if ($ultima > 0 && (time() - $ultima) > SESSAO_INATIVIDADE_SEGUNDOS) {
    logout();
    return true;
}
registrarAtividadeSessao();
    return false;
}