# 🚀 Guia de Deploy em Produção

Este guia explica como fazer o deploy completo da aplicação Harmonia Sadi em um servidor de produção.

## 📋 Pré-requisitos do Sistema

Antes de clonar o repositório, você precisa instalar as seguintes dependências do sistema operacional:

### 1. Node.js e npm
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Ou usando nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 2. MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. yt-dlp (Obrigatório para downloads do YouTube)

#### Ubuntu/Debian:
```bash
# Opção 1: Via pip (recomendado)
sudo apt-get update
sudo apt-get install -y python3-pip
sudo pip3 install yt-dlp

# Opção 2: Via snap
sudo snap install yt-dlp

# Opção 3: Download direto (mais atualizado)
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

#### CentOS/RHEL:
```bash
sudo yum install -y python3-pip
sudo pip3 install yt-dlp
```

#### macOS (se estiver usando servidor macOS):
```bash
brew install yt-dlp
```

### 4. ffmpeg (Obrigatório para conversão de áudio)

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y ffmpeg
```

#### CentOS/RHEL:
```bash
# Adicionar repositório RPM Fusion
sudo yum install -y epel-release
sudo yum install -y https://download1.rpmfusion.org/free/el/rpmfusion-free-release-8.noarch.rpm
sudo yum install -y ffmpeg
```

#### macOS:
```bash
brew install ffmpeg
```

### 5. PM2 (Gerenciador de Processos - Opcional mas Recomendado)
```bash
sudo npm install -g pm2
```

## 🔧 Instalação da Aplicação

### Passo 1: Clonar o Repositório
```bash
git clone git@github.com:brpik/mestresadi98-harmonia.git
cd harmonia-sadi
```

### Passo 2: Instalar Dependências do Node.js

#### Backend:
```bash
cd backend
npm install
```

#### Frontend:
```bash
cd ../frontend
npm install --legacy-peer-deps
```

### Passo 3: Configurar Variáveis de Ambiente

#### Backend (.env):
```bash
cd ../backend
nano .env
```

Conteúdo do arquivo `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/harmonia
# Ou para MongoDB Atlas:
# MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/harmonia
NODE_ENV=production
```

#### Frontend (.env.local):
```bash
cd ../frontend
nano .env.local
```

Conteúdo do arquivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://seu-servidor:5000/api
# Ou se estiver usando domínio:
# NEXT_PUBLIC_API_URL=https://api.seudominio.com/api
```

### Passo 4: Criar Diretório de Uploads
```bash
cd ../backend
mkdir -p uploads
chmod 755 uploads
```

### Passo 5: Popular o Banco de Dados (Opcional)
```bash
cd backend
node seed.js
```

Veja [backend/SEED.md](backend/SEED.md) para mais detalhes sobre o seed.

## 🚀 Executando em Produção

### Opção 1: Usando PM2 (Recomendado)

```bash
# Na raiz do projeto
pm2 start ecosystem.config.js --env production

# Verificar status
pm2 status

# Ver logs
pm2 logs

# Reiniciar
pm2 restart all

# Parar
pm2 stop all
```

### Opção 2: Executando Manualmente

#### Terminal 1 - Backend:
```bash
cd backend
npm start
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run build
npm start
```

### Opção 3: Usando systemd (Linux)

Crie um arquivo de serviço para o backend:

```bash
sudo nano /etc/systemd/system/harmonia-backend.service
```

Conteúdo:
```ini
[Unit]
Description=Harmonia Sadi Backend
After=network.target mongod.service

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/caminho/para/harmonia-sadi/backend
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Ativar e iniciar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable harmonia-backend
sudo systemctl start harmonia-backend
```

## ✅ Verificação Pós-Instalação

### Verificar se todas as dependências estão instaladas:

```bash
# Node.js
node --version

# npm
npm --version

# MongoDB
mongod --version

# yt-dlp
yt-dlp --version

# ffmpeg
ffmpeg -version

# ffprobe (incluído no ffmpeg)
ffprobe -version
```

### Testar o Backend:
```bash
curl http://localhost:5000/api/musicas
```

### Testar o Frontend:
```bash
curl http://localhost:3000
```

## 🔒 Configurações de Segurança

### 1. Firewall (UFW - Ubuntu)
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5000/tcp  # Backend (se necessário)
sudo ufw enable
```

### 2. Nginx como Proxy Reverso (Recomendado)

Instalar Nginx:
```bash
sudo apt-get install -y nginx
```

Configurar `/etc/nginx/sites-available/harmonia`:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:5000/uploads;
    }
}
```

Ativar configuração:
```bash
sudo ln -s /etc/nginx/sites-available/harmonia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. SSL com Let's Encrypt
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

## 📝 Notas Importantes

1. **Dependências do Sistema**: `yt-dlp` e `ffmpeg` são dependências do sistema operacional, não do Node.js. Elas devem ser instaladas no servidor antes de executar a aplicação.

2. **PATH do Sistema**: O código já está configurado para encontrar `yt-dlp` e `ffmpeg` automaticamente, mas certifique-se de que eles estão no PATH do sistema.

3. **Permissões**: O diretório `uploads/` precisa ter permissões de escrita para o usuário que executa a aplicação.

4. **MongoDB**: Certifique-se de que o MongoDB está rodando e acessível antes de iniciar o backend.

5. **Portas**: Por padrão, o backend usa a porta 5000 e o frontend usa a porta 3000. Ajuste conforme necessário.

## 🐛 Troubleshooting

### yt-dlp não encontrado:
```bash
# Verificar instalação
which yt-dlp

# Se não estiver no PATH, adicionar ao .bashrc ou .profile
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
source ~/.bashrc
```

### ffmpeg não encontrado:
```bash
# Verificar instalação
which ffmpeg

# Reinstalar se necessário
sudo apt-get install --reinstall ffmpeg
```

### Erro de permissão no uploads:
```bash
cd backend
chmod -R 755 uploads
chown -R seu-usuario:seu-usuario uploads
```

## 📚 Recursos Adicionais

- [Documentação do yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [Documentação do ffmpeg](https://ffmpeg.org/documentation.html)
- [Documentação do PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Documentação do MongoDB](https://docs.mongodb.com/)
