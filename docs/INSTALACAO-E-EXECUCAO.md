# The Farmer Edu — Instalação e execução local

Guia para um estudante ou desenvolvedor colocar o sistema para rodar numa máquina com XAMPP. Cada passo abaixo foi executado e
conferido em 23/11/2026 (XAMPP com PHP 8.2.12 e MariaDB 10.4.32, Windows). O que NÃO foi possível conferir está marcado.

---

## 1. Requisitos

- **XAMPP** (Apache + MySQL/MariaDB + PHP 8.2). O Apache precisa de `mod_rewrite` e `AllowOverride All` (o padrão do XAMPP).
- **Navegador atualizado** (Chrome ou Edge) com aceleração de hardware ligada — a Fazenda é 3D (Three.js r128).
- **Internet** para a Fazenda: o Three.js vem do cdnjs e a fonte dos balões das cenas secretas vem do Google Fonts.
- Opcional: **Judge0** e **Ollama** na rede local, para executar código e gerar o feedback de IA (módulo `api`) — não fazem
  parte desta instalação e não foram testados aqui.

## 2. Código

Copie o projeto para `C:\xampp\htdocs\The-Farmer-Edu-main` (ou o `htdocs` do seu XAMPP). A pasta pública é `public/`; o
`.htaccess` da raiz redireciona para ela, e o `.htaccess` de `public/` manda tudo para `public/index.php` (o roteador).

## 3. Banco de dados

> ⚠️ **Atenção:** `database/schema.sql` começa com `DROP DATABASE IF EXISTS the_farmer_edu`. Rodá-lo **apaga o banco
> `the_farmer_edu` inteiro** antes de recriá-lo. Se você já tem dados nesse banco, faça um backup antes (phpMyAdmin → Exportar)
> ou importe numa cópia com outro nome (troque o nome nas três linhas do início do arquivo).

1. Ligue o MySQL no painel do XAMPP.
2. Importe, nesta ordem:
   - `database/schema.sql` — cria as 18 tabelas (usuários, alunos, instrutores, cursos, turmas, matrículas, atividades,
     submissões, feedback, notas, fazendas, elementos da fazenda, XP, notificações, arquivos…);
   - `database/seeds.sql` — dados de exemplo (opcional; senhas de exemplo `12345678`).
3. **Não rode** `database/fazenda_alteracoes.sql` num banco criado pelo `schema.sql` atual: ele é a migração para bancos
   ANTIGOS e falha num banco novo (`Duplicate column name 'nome_fazenda'`), porque o `schema.sql` já traz essas colunas.
4. `database/schema_backup.sql` é uma cópia antiga; não use.

**Linha de comando** (alternativa ao phpMyAdmin), no Prompt de Comando:

```
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < database\schema.sql
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 < database\seeds.sql
```

## 4. Configuração (`.env`)

Crie `app/core/.env` copiando `app/core/.env.example`:

```
DB_HOST=127.0.0.1
DB_NAME=the_farmer_edu
DB_USER=root
DB_PASS=
DB_CHARSET=utf8mb4
```

- Sem esse arquivo, o PHP mostra um aviso com o caminho completo do servidor em todas as páginas (o XAMPP vem com
  `display_errors` ligado).
- **Nunca envie o `.env` para o GitHub** (ele contém a senha do banco).
- O módulo `api` (Judge0/Ollama) lê um **segundo** arquivo, `app/modules/api/.env`, com os endereços desses serviços. Sem ele,
  as rotas `/api/*` e as páginas que as usam param com erro fatal.

## 5. Endereços

Com o projeto em `htdocs/The-Farmer-Edu-main`:

| Página | Endereço |
|---|---|
| Login do aluno | `http://localhost/The-Farmer-Edu-main/public/auth/loginAluno` |
| Login do instrutor | `http://localhost/The-Farmer-Edu-main/public/auth/loginInstrutor` |
| Cadastro | `http://localhost/The-Farmer-Edu-main/public/auth/novoUsuario` |
| Fazenda (aluno logado) | `http://localhost/The-Farmer-Edu-main/public/fazenda` |
| Página inicial (exemplo do esqueleto) | `http://localhost/The-Farmer-Edu-main/public/home` |

- Use sempre o caminho com **`/public/`**. Sem ele (`/The-Farmer-Edu-main/auth/loginAluno`) o roteador não reconhece a rota (404).
- Alternativa sem `mod_rewrite`: `http://localhost/The-Farmer-Edu-main/public/index.php?rota=auth/loginAluno`. Neste formato
  alguns redirecionamentos relativos do módulo de login (ex.: depois do logout) apontam para o lugar errado; prefira o formato
  com caminho.

## 6. Fazenda sem servidor (demonstração)

Abra `app/modules/fazenda/views/fazenda.html` direto no navegador (`file://`). Tudo funciona, mas o save fica só no
`localStorage` daquele navegador. Detalhes em `docs/ENTREGA-DA-FAZENDA.md` (inclusive o modo desenvolvedor).

## 7. Conferência rápida (o que foi verificado em 23/11)

| Verificação | Resultado esperado |
|---|---|
| Abrir `/public/fazenda` sem login | redireciona para o login do aluno |
| Cadastro de aluno → login → `/public/fazenda` | a Fazenda abre com `window.FARMEDU_SERVIDOR` (save do servidor) |
| Jogar e recarregar | o progresso volta do banco (`fazendas.estado`) |
| Abrir a Fazenda em outra aba e salvar na antiga | a aba antiga recebe aviso de conflito (409) |
| Instrutor abrindo `/public/fazenda` | 403 ("A Fazenda é exclusiva para alunos") |
| XP lançado em `xp_logs` (nota de atividade) | aparece no jogo na próxima abertura e é marcado como entregue |

## 8. Problemas conhecidos desta branch (ver `docs/ENCERRAMENTO-TECNICO-2026-11-23.md`)

- Esta branch (`squad-1/fazenda-maisAjustes`) está **1 commit atrás da `origin/main`** (`800ac71 squad-6/implementando_backend
  (#184)`). Sem ele, o módulo **Atividades** do instrutor quebra (classe `Gabarito` inexistente, coluna
  `atividades.resposta_referencia` ausente no `schema.sql`, sem proteção CSRF). Atualizar com a `main` resolve os três.
- Páginas que quebram por arquivo de view ausente: `/respostas` (submissões) e `/feedback_ia/respostaReferencia`.
- Não testado aqui: envio de e-mail (Mailtrap), Judge0, Ollama, HTTPS.
