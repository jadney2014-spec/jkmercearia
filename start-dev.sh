#!/bin/bash

# 🚀 Script para iniciar o sistema completo
# Este script inicia tanto o backend quanto o frontend

echo "🚀 Iniciando Sistema de Contabilidade da Igreja..."
echo "================================================"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# Verificar se o banco de dados existe
if [ ! -f "database/igreja.db" ]; then
    echo "📦 Configurando banco de dados..."
    node server/setup-database.js
fi

echo "✅ Banco de dados configurado!"

# Criar arquivo .env para desenvolvimento se não existir
if [ ! -f "client/.env" ]; then
    echo "📝 Criando arquivo de configuração..."
    cat > client/.env << EOF
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_VERSION=1.0.0
REACT_APP_ENV=development
EOF
    echo "✅ Arquivo .env criado!"
fi

echo ""
echo "🔧 Credenciais de Login:"
echo "👤 Username: admin"
echo "🔑 Senha: admin123"
echo ""
echo "🌐 URLs de acesso:"
echo "   Frontend: http://localhost:3000"
echo "   Tesouraria: http://localhost:3000/tesouraria/login"
echo "   API: http://localhost:5001/api"
echo ""
echo "⚡ Iniciando servidores..."

# Iniciar backend em background
echo "🔧 Iniciando backend..."
npm run server &
BACKEND_PID=$!

# Aguardar backend inicializar
sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend..."
cd client && npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Sistema iniciado com sucesso!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5001"
echo ""
echo "🛑 Para parar os servidores, pressione Ctrl+C"

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando servidores..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servidores parados!"
    exit 0
}

# Capturar sinal de interrupção
trap cleanup SIGINT SIGTERM

# Aguardar indefinidamente
wait
