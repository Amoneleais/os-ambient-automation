# OS Ambient Automation

Automação simples em Node.js para organizar e higienizar arquivos de backup locais. O script lê o diretório `backupsFrom`, gera um relatório inicial dos arquivos encontrados e, em seguida, move arquivos recentes para `backupsTo` e remove arquivos antigos conforme a política de retenção (padrão: 3 dias). Todas as ações são registradas em log.

## Requisitos

- Node.js 18+ (recomendado)

## Instalação

1. Clone este repositório:
   ```bash
   git clone https://github.com/<seu-usuario>/os-ambient-automation.git
   cd os-ambient-automation
   ```

Não há dependências externas além dos módulos nativos do Node (`fs/promises` e `path`).

## Configuração

As pastas e logs são construídos a partir de um caminho base. Ajuste conforme seu ambiente no arquivo `app.js`:

- `BASE_PATH`: diretório base onde as pastas e logs serão criados.
  - Padrão: `path.join(__dirname, "home", "valcann")`
- `FOLDER_PATH`: origem dos arquivos, padrão: `<BASE_PATH>/backupsFrom`
- `ARCHIVE_PATH`: destino para onde arquivos recentes são movidos, padrão: `<BASE_PATH>/backupsTo`
- `LOG_FROM_PATH`: relatório inicial, padrão: `<BASE_PATH>/backupsFrom.log`
- `LOG_TO_PATH`: log de ações, padrão: `<BASE_PATH>/backupsTo.log`
- `DAYS_IN_MS`: janela de retenção. Padrão: `3 * 24 * 60 * 60 * 1000` (3 dias).

## Como funciona

1. Garante a existência das pastas.
2. Gera um relatório inicial (nome, tamanho, criação e modificação) de arquivos em `backupsFrom` no `backupsFrom.log`.
3. Para cada arquivo em `backupsFrom`:
   - Se a data de criação for mais antiga que `DAYS_IN_MS`, o arquivo é removido.
   - Caso contrário, o arquivo é movido para `backupsTo`.
4. Registra as ações (movido/removido/erros) em `backupsTo.log`.

## Executando

- Diretamente com Node:
  ```bash
  node app.js
  ```

Saídas e logs serão criados sob `BASE_PATH`.

## Agendamento (opcional)

Para rodar periodicamente:

- Windows (Task Scheduler):

  1. Abra o Agendador de Tarefas.
  2. Crie uma Tarefa Básica.
  3. Em "Ação", selecione "Iniciar um programa" e aponte para o executável do Node, por exemplo: `C:\\Program Files\\nodejs\\node.exe`.
  4. Em "Adicionar argumentos", informe o caminho completo para `app.js`, por ex.: `C:\\Users\\<voce>\\...\\os-ambient-automation\\app.js`.
  5. Defina o gatilho (ex.: diariamente) e salve.

## Solução de Problemas

- Permissões: garanta que o usuário tenha permissão de leitura/escrita em `BASE_PATH`.
- Caminhos: verifique `BASE_PATH` e subpastas; se usar rede/drive mapeado, confirme acessibilidade.
- Datas: a decisão de remoção usa `stats.birthtime` (data de criação). Em alguns sistemas isso pode diferir de `mtime` (modificação).
- Logs vazios: se `backupsFrom` estiver vazio, o script escreverá mensagem correspondente e encerrará.
