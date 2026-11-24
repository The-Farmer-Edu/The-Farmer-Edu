# Notificações em tempo real (tela + celular + PC)

Quando alguém chama `notificar(...)`, a notificação é gravada no banco, aparece **na hora** na tela
do usuário e chega como **alerta no celular e no PC**, mesmo com o site fechado (Web Push).

---

## Instalação (uma vez só)

**1. Banco** — rode o arquivo `banco_push.sql` (cria a tabela `notificacoes_push`).

**2. Biblioteca de push** — na pasta do módulo `notificacoes`:

```
composer require minishlink/web-push
```

Precisa do PHP com as extensões `openssl`, `mbstring` e `curl` (o composer avisa se faltar alguma).

**3. Chaves VAPID** — ainda na pasta do módulo:

```
php -r "require 'vendor/autoload.php'; print_r(Minishlink\WebPush\VAPID::createVapidKeys());"
```

Cole a `publicKey` e a `privateKey` em `push_config.php` e troque o e-mail em `subject`.
Não publique a chave privada no GitHub.

**4. HTTPS** — o navegador só libera push em site com HTTPS (em `localhost` funciona sem).
Para testar no celular durante o desenvolvimento, use um túnel HTTPS (ngrok, cloudflared etc.).

**5. Cada pessoa ativa uma vez em cada aparelho** — abrir a tela de notificações e tocar em **🔔 Ativar alertas**.

- **iPhone (iOS 16.4+):** Safari → Compartilhar → *Adicionar à Tela de Início* → abrir o Farmer Edu pelo ícone → Ativar alertas.
- **Android / PC:** direto no Chrome, Edge ou Firefox.

---

## Antes de ir para produção: usuário de teste

Em `Controller.php` existem duas constantes:

```php
const USAR_USUARIO_TESTE  = true;
const EMAIL_USUARIO_TESTE = 'teste.notificacoes@exemplo.com';
```

Com `true`, se não houver ninguém logado a tela usa o usuário de teste (modo desenvolvimento).
Se o projeto tiver login (`core/session.php` com `usuarioLogado()`), o usuário logado tem prioridade.
**Em produção coloque `false`**, senão qualquer visitante vê as notificações do usuário de teste.

---

## Como os outros squads enviam notificação

Nunca insira direto na tabela. Use:

```php
require_once __DIR__ . '/../notificacoes/Notificacoes.php'; // ajuste o caminho

// 1 usuário
Notificacoes::enviar($idAluno, Notificacoes::TIPO_NOTA_ATRIBUIDA, 'Sua atividade recebeu nota: Loops');

// atalho global (mesma coisa)
notificar($idAluno, 'feedback_ia', 'O feedback da IA está disponível.');

// vários usuários
Notificacoes::enviarParaVarios([3, 7, 9], Notificacoes::TIPO_ATIVIDADE_PENDENTE, 'Nova atividade: Arrays');

// todos os alunos de uma turma
Notificacoes::enviarParaTurma($idTurma, Notificacoes::TIPO_ATIVIDADE_PENDENTE, 'Nova atividade: Arrays');
```

O primeiro argumento é **quem recebe**, não quem causou o evento.
A função **nunca lança exceção**: se falhar, registra no `error_log` e devolve `false`/`0`.

### Opções (último parâmetro)

```php
notificar($idAluno, 'atividade_atrasada', 'Pendente há mais de 5 dias: Loops', [
    'evitar_duplicada' => true,   // não cria se já existir uma NÃO LIDA igual (bom para cron)
    'push'             => false,  // grava na tela, mas não envia alerta no celular/PC
    'pdo'              => $pdo,   // usa a sua conexão (ex.: dentro de transação)
]);
```

### Retorno

- `enviar` / `notificar`: `true` se criou, `false` se falhou.
- `enviarParaVarios` / `enviarParaTurma`: quantidade de usuários notificados.

### Tipos

| Constante | Valor |
|---|---|
| `TIPO_ATIVIDADE_PENDENTE` | `atividade_pendente` |
| `TIPO_ATIVIDADE_ATRASADA` | `atividade_atrasada` |
| `TIPO_ATIVIDADE_ENTREGUE` | `atividade_entregue` |
| `TIPO_ATIVIDADE_PUBLICADA` | `atividade_publicada` |
| `TIPO_NOTA_ATRIBUIDA` | `nota_atribuida` |
| `TIPO_FEEDBACK_IA` | `feedback_ia` |
| `TIPO_FAZENDA_ATACADA` | `fazenda_atacada` |

Tipo novo: acrescente **uma linha** em `tipos.php` (título e status). Vale para a tela e para o alerta.

---

## Arquivos

| Arquivo | Função |
|---|---|
| `Notificacoes.php` | API que os squads usam |
| `NotificacoesPush.php` | Envio do push (celular/PC) |
| `Model.php` | Acesso ao banco |
| `Controller.php` / `routes.php` | Rotas da tela e do push |
| `tipos.php` | Títulos e status de cada tipo |
| `push_config.php` | Chaves VAPID |
| `banco_push.sql` | Tabela dos aparelhos |
| `views/notificacoes.php` | Tela (lista, filtros, balão e botão de alertas) |
| `views/sw.js` | Service Worker (recebe o push com o site fechado) |
| `views/balaonotificacao.html`, `style.css`, `script.js` | Protótipo do balão (o visual já foi incorporado à tela; pode apagar) |

Importante: nenhum `.php` pode ter linha em branco antes do `<?php`. Isso quebra o JSON das rotas.

---

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Botão "Ativar alertas" não aparece | Site sem HTTPS, ou iPhone sem ter adicionado à Tela de Início |
| "Push não configurado no servidor" | `push_config.php` ainda com `COLE_AQUI` |
| Notificação aparece na tela, mas não chega no celular | Falta `composer require minishlink/web-push`, ou o aparelho não ativou os alertas (veja o `error_log`) |
| "Permissão não concedida" | A pessoa negou no navegador: liberar nas configurações do site |
| Trocou as chaves VAPID | Todos precisam desativar e ativar os alertas de novo |
