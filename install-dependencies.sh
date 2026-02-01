#!/bin/bash

# Script de instalação de dependências do sistema para Harmonia Sadi
# Execute com: bash install-dependencies.sh

set -e

echo "🚀 Instalando dependências do sistema para Harmonia Sadi..."
echo ""

# Detectar sistema operacional
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Detectar distribuição Linux
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    else
        echo "❌ Não foi possível detectar a distribuição Linux"
        exit 1
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    echo "❌ Sistema operacional não suportado: $OSTYPE"
    exit 1
fi

echo "📦 Sistema detectado: $OS"
echo ""

# Função para instalar no Ubuntu/Debian
install_ubuntu_debian() {
    echo "📥 Atualizando repositórios..."
    sudo apt-get update

    echo "📥 Instalando Node.js..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        echo "✅ Node.js já instalado: $(node --version)"
    fi

    echo "📥 Instalando MongoDB..."
    if ! command -v mongod &> /dev/null; then
        wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
        echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
        sudo apt-get update
        sudo apt-get install -y mongodb-org
        sudo systemctl start mongod
        sudo systemctl enable mongod
    else
        echo "✅ MongoDB já instalado: $(mongod --version | head -1)"
    fi

    echo "📥 Instalando yt-dlp..."
    if ! command -v yt-dlp &> /dev/null; then
        sudo apt-get install -y python3-pip
        sudo pip3 install yt-dlp
    else
        echo "✅ yt-dlp já instalado: $(yt-dlp --version)"
    fi

    echo "📥 Instalando ffmpeg..."
    if ! command -v ffmpeg &> /dev/null; then
        sudo apt-get install -y ffmpeg
    else
        echo "✅ ffmpeg já instalado: $(ffmpeg -version | head -1)"
    fi

    echo "📥 Instalando PM2..."
    if ! command -v pm2 &> /dev/null; then
        sudo npm install -g pm2
    else
        echo "✅ PM2 já instalado: $(pm2 --version)"
    fi
}

# Função para instalar no macOS
install_macos() {
    echo "📥 Verificando Homebrew..."
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew não encontrado. Instale em: https://brew.sh"
        exit 1
    fi

    echo "📥 Instalando Node.js..."
    if ! command -v node &> /dev/null; then
        brew install node
    else
        echo "✅ Node.js já instalado: $(node --version)"
    fi

    echo "📥 Instalando MongoDB..."
    if ! command -v mongod &> /dev/null; then
        brew tap mongodb/brew
        brew install mongodb-community
        brew services start mongodb-community
    else
        echo "✅ MongoDB já instalado"
    fi

    echo "📥 Instalando yt-dlp..."
    if ! command -v yt-dlp &> /dev/null; then
        brew install yt-dlp
    else
        echo "✅ yt-dlp já instalado: $(yt-dlp --version)"
    fi

    echo "📥 Instalando ffmpeg..."
    if ! command -v ffmpeg &> /dev/null; then
        brew install ffmpeg
    else
        echo "✅ ffmpeg já instalado: $(ffmpeg -version | head -1)"
    fi

    echo "📥 Instalando PM2..."
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    else
        echo "✅ PM2 já instalado: $(pm2 --version)"
    fi
}

# Instalar baseado no sistema operacional
case $OS in
    ubuntu|debian)
        install_ubuntu_debian
        ;;
    macos)
        install_macos
        ;;
    *)
        echo "❌ Sistema operacional não suportado: $OS"
        echo "Por favor, instale manualmente seguindo o guia em DEPLOY.md"
        exit 1
        ;;
esac

echo ""
echo "✅ Verificando instalações..."
echo ""

# Verificar todas as instalações
check_command() {
    if command -v $1 &> /dev/null; then
        echo "✅ $1: $(command -v $1)"
        return 0
    else
        echo "❌ $1: NÃO ENCONTRADO"
        return 1
    fi
}

ERRORS=0
check_command node || ERRORS=$((ERRORS+1))
check_command npm || ERRORS=$((ERRORS+1))
check_command mongod || ERRORS=$((ERRORS+1))
check_command yt-dlp || ERRORS=$((ERRORS+1))
check_command ffmpeg || ERRORS=$((ERRORS+1))
check_command ffprobe || ERRORS=$((ERRORS+1))
check_command pm2 || ERRORS=$((ERRORS+1))

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "🎉 Todas as dependências foram instaladas com sucesso!"
    echo ""
    echo "Próximos passos:"
    echo "1. Clone o repositório: git clone git@github.com:brpik/mestresadi98-harmonia.git"
    echo "2. Configure os arquivos .env (veja DEPLOY.md)"
    echo "3. Execute: npm install nos diretórios backend e frontend"
    echo "4. Inicie a aplicação com PM2 ou manualmente"
else
    echo "⚠️  Algumas dependências não foram instaladas. Verifique os erros acima."
    echo "Consulte DEPLOY.md para instruções de instalação manual."
fi
