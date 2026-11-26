<?php
/**
 * ============================================================================
 * MÓDULO SOBRE - MODEL (Model.php)
 * ============================================================================
 * Fonte dos dados da página "Sobre os Desenvolvedores".
 *
 * COMO ATUALIZAR
 *  - Para adicionar o GitHub de um aluno, preencha o 2º argumento de m():
 *      m('Nome do Aluno', 'usuario-github')
 *    Aceita o usuário (com ou sem @) ou a URL completa do perfil
 *    (https://github.com/usuario). Sem GitHub informado, o botão aparece
 *    desativado.
 *  - O 3º argumento marca o Tech Lead da semana: m('Nome', 'usuario', true)
 *  - Os squads 5 e 13 (Notificações) ainda não têm integrantes no README do
 *    repositório: basta preencher a lista 'membros' deles abaixo.
 * ============================================================================
 */

class SobreModel
{
    /** Atalho para montar um integrante. */
    private static function m(string $nome, string $github = '', bool $techLead = false): array
    {
        return ['nome' => $nome, 'github' => $github, 'techLead' => $techLead];
    }

    /**
     * Converte o que foi digitado (usuário ou URL) em uma URL segura de perfil
     * do GitHub. Retorna null quando vazio ou inválido.
     */
    public static function urlGithub(string $valor): ?string
    {
        $valor = trim($valor);
        if ($valor === '') {
            return null;
        }

        if (preg_match('~^https://github\.com/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))/?$~', $valor, $p)) {
            return 'https://github.com/' . $p[1];
        }

        if (preg_match('/^@?([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))$/', $valor, $p)) {
            return 'https://github.com/' . $p[1];
        }

        return null;
    }

    /** Lista dos 13 squads, na ordem do README do projeto. */
    public static function listarSquads(): array
    {
        $squads = [
            ['numero' => 1, 'nome' => 'Fazenda 1', 'membros' => [
                self::m('Davi Totti', 'Tottidevi', true),
                self::m('André Silva', 'andrezin00'),
                self::m('Gabriel Furtado', 'GabrielFurtadoDEVWEB'),
                self::m('Hendrick Glansmann', 'HendrickGlansmann'),
            ]],
            ['numero' => 2, 'nome' => 'Submissões 1', 'membros' => [
                self::m('Karolãyne Soriano', 'karolaynsilva', true),
                self::m('Arthur Bento', 'arthurbento3'),
                self::m('Vitória Neves', 'Vicky206-Cris'),
                self::m('Mariana Filgueiras', 'mariana740'),
            ]],
            ['numero' => 3, 'nome' => 'Notas', 'membros' => [
                self::m('Kauã Pereira', 'camposkaua791-spec', true),
                self::m('Gustavo Alexandre', 'GustavoS007'),
                self::m('Leonardo Wagner', 'Leonardo2220111'),
                self::m('Kauã Furtado', 'KauaF57'),
            ]],
            ['numero' => 4, 'nome' => 'Turmas e Cursos', 'membros' => [
                self::m('Yan Lopes', 'backcityboy', true),
                self::m('Diego Ravagnoli', 'diego-ravagnoli'),
                self::m('Matheus Mendes', 'matheusnascimentomendes1-cloud'),
                self::m('Emanuele Andrade', 'tudo-errado'),
            ]],
            ['numero' => 5, 'nome' => 'Notificações 1', 'membros' => [
                self::m('Kassio Kiang', 'LCeTOP', true),
                self::m('Bernardo Alves', '2casttro'),
                self::m('Bernardo Couto ', 'sandrosouza7'),
                self::m('João Lucas Mattoso', 'sandrosouza7'),
                self::m('Ian Venancio', 'arthur-januario'),
            ]],
            ['numero' => 6, 'nome' => 'Atividades', 'membros' => [
                self::m('Lucas Ferreira', 'LCeTOP', true),
                self::m('Bernardo Castro', '2casttro'),
                self::m('Arthur Januário', 'arthur-januario'),
                self::m('Sandro De Souza', 'sandrosouza7'),
            ]],
            ['numero' => 7, 'nome' => 'Fazenda 2', 'membros' => [
                self::m('Eduardo Fregulia', 'Freguliaz', true),
                self::m('Guilherme Macedo', 'GuilhermeSCCP'),
                self::m('Gabriel Albuquerque', 'albuquerque7'),
                self::m('Leonardo Correa', 'Leonardo2220111'),
                self::m('Ana Beatriz Condé', 'Beatriznunes7777'),
            ]],
            ['numero' => 8, 'nome' => 'Feedback IA 1', 'membros' => [
                self::m('Gustavo de Oliveira', 'Gasvuto', true),
                self::m('Felipe Cesar', 'Cesar-I-A'),
                self::m('Hugo Candido', 'hugo-silva15'),
                self::m('Laís Aparecida', 'laissilvz'),
            ]],
            ['numero' => 9, 'nome' => 'Feedback IA 2', 'membros' => [
                self::m('Breno Santos', 'brenola22', true),
                self::m('Emanuel Lourenço', 'mannel458'),
                self::m('Davi Paiva', 'dpaiva22'),
                self::m('Gabriel Donato', 'donato-prog-atz'),
            ]],
            ['numero' => 10, 'nome' => 'Autenticação', 'membros' => [
                self::m('Esther Vieira', 'estherjf', true),
                self::m('João Emanuel', 'JSilvaDevMG'),
                self::m('Bernardo Paulino', 'boliveira26'),
                self::m('Davi Souza', 'DaviCosta1703'),
                self::m('Ana Beatriz Assis', 'BiahAsis'),
            ]],
            ['numero' => 11, 'nome' => 'Gamificação', 'membros' => [
                self::m('Alvaro Ventura', '0Urimash', true),
                self::m('Eric Mendonça', 'Ericwinchester12'),
                self::m('Hugo Bacellar', 'voidhugo'),
                self::m('Ângelo Ferreira', 'AngeloFerreira14'),
                self::m('Breno Antônio', 'brenoafernandes2612-ops'),
            ]],
            ['numero' => 12, 'nome' => 'Submissões 2', 'membros' => [
                self::m('Agata Quadros', 'AgataQuadross', true),
                self::m('Lucas de Sá', 'Saodara002'),
                self::m('Annie Evelyn', 'annievelyn'),
                self::m('Rhuan de Souza', 'Rsouuz'),
                self::m('João Pedro Gouvea', 'rockyajj'),
            ]],
            ['numero' => 13, 'nome' => 'Notificações 2', 'membros' => [
                self::m('Guilherme Augusto', 'guialvesjf22', true),
                self::m('Kelvyn Keppler', 'kelvynkeppler'),
            ]],
        ];

        // Resolve a URL do GitHub e as iniciais de cada integrante
        foreach ($squads as &$squad) {
            foreach ($squad['membros'] as &$membro) {
                $membro['githubUrl'] = self::urlGithub($membro['github']);
                $membro['iniciais']  = self::iniciais($membro['nome']);
            }
            unset($membro);
        }
        unset($squad);

        return $squads;
    }

    /** Primeira letra do primeiro nome + primeira do último (igual ao avatar do cabeçalho). */
    private static function iniciais(string $nome): string
    {
        $partes = preg_split('/\s+/', trim($nome));
        $ini    = mb_strtoupper(mb_substr($partes[0], 0, 1, 'UTF-8'), 'UTF-8');
        if (count($partes) > 1) {
            $ini .= mb_strtoupper(mb_substr(end($partes), 0, 1, 'UTF-8'), 'UTF-8');
        }
        return $ini;
    }
}
