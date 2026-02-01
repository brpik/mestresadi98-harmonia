# Script de Seed - População do Banco de Dados

Este script permite popular o MongoDB com dados iniciais (categorias, músicas e configurações) a partir dos arquivos JSON.

## Pré-requisitos

1. Node.js instalado
2. MongoDB rodando e acessível
3. Arquivo `.env` configurado com `MONGO_URI`

## Arquivos Necessários

O script procura pelos seguintes arquivos na raiz do projeto:

- `harmornia.categorias.json` - Lista de categorias
- `harmornia.musicas.json` - Lista de músicas
- `harmornia.configuracaos.json` - Configurações (opcional)

## Uso

### Importação Simples (sem limpar dados existentes)

```bash
node backend/seed.js
```

Este comando:
- Verifica se já existem dados no banco
- Se existirem, apenas avisa e não sobrescreve
- Se não existirem, importa todos os dados

### Limpar e Importar

```bash
node backend/seed.js --clean
```

ou

```bash
node backend/seed.js --reset
```

Este comando:
- **Remove todos os dados existentes** (categorias, músicas e configurações)
- Importa todos os dados dos arquivos JSON

⚠️ **ATENÇÃO**: Use `--clean` ou `--reset` apenas quando quiser substituir completamente os dados do banco.

## Exemplo de Uso em Produção

```bash
# 1. Configure a variável de ambiente
export MONGO_URI="mongodb://usuario:senha@servidor:27017/harmonia"

# 2. Execute o seed
node backend/seed.js --reset
```

## O que o Script Faz

1. **Conecta ao MongoDB** usando a URI do `.env`
2. **Verifica argumentos** (`--clean` ou `--reset`)
3. **Limpa dados** (se solicitado)
4. **Importa categorias** do arquivo JSON
5. **Importa músicas** do arquivo JSON (filtra automaticamente músicas grandes removidas)
6. **Importa configurações** (se o arquivo existir)
7. **Exibe estatísticas** finais

## Filtros Automáticos

O script automaticamente filtra músicas grandes que foram removidas do repositório:
- `musica_1743612137380.mp3` (59MB)
- `musica_1743612960165.mp3` (56MB)

Essas músicas não serão importadas mesmo que estejam no JSON.

## Tratamento de Erros

- O script trata erros de duplicação (código 11000) automaticamente
- Exibe mensagens claras de erro quando algo falha
- Fecha a conexão com o MongoDB ao finalizar

## Exemplo de Saída

```
🔌 Conectando ao MongoDB...
   URI: mongodb://***:***@servidor:27017/harmonia
✅ Conectado ao MongoDB

🗑️  Limpando dados existentes...
✅ Dados antigos removidos

📂 Importando categorias...
✅ 8 categorias importadas

📂 Importando músicas...
⚠️  2 músicas grandes foram filtradas
   Progresso: 100/100 músicas
✅ 100 músicas importadas

📂 Verificando configurações...
✅ 1 configurações importadas

📊 Estatísticas:
   Categorias: 8
   Músicas: 100
   Configurações: 1

✅ Seed concluído com sucesso!

🔌 Conexão com MongoDB fechada
```
