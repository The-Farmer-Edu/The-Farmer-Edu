@echo off
echo Criando a arvore de diretorios para the-farmer-edu...

:: Define a pasta raiz do projeto
set ROOT=The-Farmer-Edu

:: Cria a pasta raiz
if not exist "%ROOT%" mkdir "%ROOT%"

:: Cria a estrutura da pasta public e assets
mkdir "%ROOT%\public\assets\css"
mkdir "%ROOT%\public\assets\js"
mkdir "%ROOT%\public\assets\img"
type NUL > "%ROOT%\public\index.php"

:: Cria a estrutura da pasta app e core
mkdir "%ROOT%\app\core"
mkdir "%ROOT%\app\modules"

:: Loop para criar os modulos dinamicamente, suas pastas internas (views) e arquivos MVC + rotas
for %%m in (auth turmas_cursos atividades submissoes feedback_ia notas gamificacao fazenda notificacoes) do (
    mkdir "%ROOT%\app\modules\%%m\views"
    type NUL > "%ROOT%\app\modules\%%m\Controller.php"
    type NUL > "%ROOT%\app\modules\%%m\Model.php"
    type NUL > "%ROOT%\app\modules\%%m\routes.php"
)

:: Cria a estrutura do banco de dados (database) e arquivos SQL
mkdir "%ROOT%\database"
type NUL > "%ROOT%\database\schema.sql"
type NUL > "%ROOT%\database\seeds.sql"

:: Cria pastas de isolamento e testes
mkdir "%ROOT%\sandbox"
mkdir "%ROOT%\tests"

:: Cria o README com o titulo basico
echo # The Farmer Edu > "%ROOT%\README.md"
echo Consulte a secao 4 para regras de contribuicao. >> "%ROOT%\README.md"

echo.
echo Estrutura criada com sucesso! 
echo Pressione qualquer tecla para sair...
pause >nul