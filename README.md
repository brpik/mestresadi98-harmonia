# Harmonia Sadi - Player de Música

Sistema completo de player de música com frontend em Next.js e backend em Node.js/Express.

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- MongoDB (rodando localmente ou URL de conexão)
- npm ou yarn

## 🚀 Instalação

### Backend

1. Navegue até a pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o arquivo `.env` (já criado):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/harmonia
```

4. Inicie o servidor:
```bash
npm run dev
```

O backend estará rodando em `http://localhost:5000`

### Frontend

1. Navegue até a pasta do frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install --legacy-peer-deps
```

3. Configure o arquivo `.env.local` (já criado):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

## 📝 Notas Importantes

- Certifique-se de que o MongoDB está rodando antes de iniciar o backend
- O diretório `uploads/` no backend é usado para armazenar arquivos de música e logos
- Para funcionalidade de download do YouTube, é necessário ter `yt-dlp` instalado no sistema

## 🛠️ Scripts Disponíveis

### Backend
- `npm start` - Inicia o servidor em modo produção
- `npm run dev` - Inicia o servidor em modo desenvolvimento com nodemon
- `node backend/seed.js` - Popula o banco de dados com dados iniciais (veja [SEED.md](backend/SEED.md) para mais detalhes)

### Frontend
- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

## 📁 Estrutura do Projeto

```
harmonia-sadi/
├── backend/
│   ├── controllers/     # Controladores da API
│   ├── models/          # Modelos do MongoDB
│   ├── routes/          # Rotas da API
│   ├── uploads/         # Arquivos de mídia
│   └── app.js           # Arquivo principal
├── frontend/
│   ├── app/             # Páginas Next.js
│   ├── components/      # Componentes React
│   ├── context/         # Contextos React
│   └── utils/           # Utilitários
└── README.md
```

## 🔧 Configuração do MongoDB

Se você não tiver MongoDB instalado localmente, pode usar MongoDB Atlas ou alterar a `MONGO_URI` no arquivo `.env` do backend.

## ✅ Status da Instalação

- ✅ Dependências do backend instaladas
- ✅ Dependências do frontend instaladas
- ✅ Arquivo .env do backend configurado
- ✅ Arquivo .env.local do frontend configurado
- ✅ Estrutura de pastas verificada
