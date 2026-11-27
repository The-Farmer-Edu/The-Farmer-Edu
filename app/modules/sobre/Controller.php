<?php
require_once __DIR__ . '/Model.php';
require_once __DIR__ . '/../../core/session.php';
require_once __DIR__ . '/../../core/arquivosEstaticos.php';

class SobreController
{
    public function mostrarDesenvolvedores(): void
    {
        $squads = SobreModel::listarSquads();

        // Tema por perfil (Guia de Design): verde para aluno, azul para instrutor.
        $usuario      = usuarioLogado();
        $isInstructor = is_array($usuario) && ($usuario['perfilAcesso'] ?? '') === 'instrutor';
        $tema         = $isInstructor ? 'instrutor' : 'aluno';

        // Totais exibidos no topo da página
        $totalSquads = count($squads);
        $totalAlunos = array_sum(array_map(fn($s) => count($s['membros']), $squads));

        require __DIR__ . '/views/Sobre.php';
    }

    public function sendFile(): void {
        enviarArquivoEstatico(__DIR__ . '/views/assets', ['css', 'images', 'js']);
    }
}
