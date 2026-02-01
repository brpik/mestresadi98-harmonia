# Pastas Usadas no Projeto Harmonia

## ✅ Pastas ATIVAS (em uso)

### Backend
- `backend/` - Backend principal da aplicação
  - `app.js` - Arquivo principal do servidor
  - `controllers/` - Controladores da API
  - `models/` - Modelos do MongoDB
  - `routes/` - Rotas da API
  - `uploads/` - Arquivos de mídia (músicas e logos)
  - `seed.js` - Script de seed para popular o banco
  - `import-data.js` - Script antigo de importação (pode ser removido)
  - `package.json` - Dependências do backend

### Frontend
- `frontend/` - Frontend principal (Next.js)
  - `app/` - Páginas e layouts Next.js
    - `globals.css` - Estilos globais (USADO)
  - `components/` - Componentes React
  - `context/` - Contextos React (MusicContext)
  - `hooks/` - Hooks customizados
  - `lib/` - Utilitários
  - `public/` - Arquivos estáticos
  - `utils/` - Funções utilitárias
  - `package.json` - Dependências do frontend

### Raiz
- `harmornia.categorias.json` - Dados de categorias (usado pelo seed)
- `harmornia.musicas.json` - Dados de músicas (usado pelo seed)
- `harmornia.configuracaos.json` - Dados de configurações (usado pelo seed)
- `ecosystem.config.js` - Configuração do PM2
- `package.json` - Scripts do monorepo
- `README.md` - Documentação

## ❌ Pastas NÃO USADAS (podem ser removidas)

- `music-player/` - Versão antiga/duplicada do projeto (NÃO USADA)
- `musicas/` - Pasta antiga com uma música (NÃO USADA)
- `frontend/styles/globals.css` - Duplicado (usa `app/globals.css`)
- `frontend/front.zip` - Arquivo zip antigo (NÃO USADO)

## 📝 Observações

1. O projeto usa apenas `backend/` e `frontend/` como pastas principais
2. A pasta `music-player/` parece ser uma versão antiga e não é referenciada em nenhum lugar
3. O arquivo `frontend/styles/globals.css` existe mas não é usado (o projeto usa `app/globals.css`)
4. A pasta `musicas/` na raiz contém apenas 1 arquivo e não é referenciada
