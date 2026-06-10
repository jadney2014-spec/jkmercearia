#!/bin/bash

# Script de deploy otimizado para resolver problemas de cache
# Este script limpa o build antigo e faz deploy com configurações otimizadas

echo "🚀 Iniciando deploy otimizado..."

# Navegar para o diretório do cliente
cd client

echo "📦 Limpando build anterior..."
# Remover build anterior
rm -rf build
rm -rf dist

echo "🔨 Fazendo novo build..."
# Fazer novo build
npm run build

# Verificar se o build foi criado
if [ ! -d "build" ]; then
    echo "❌ Erro: Build não foi criado!"
    exit 1
fi

echo "✅ Build criado com sucesso!"

# Voltar para o diretório raiz
cd ..

echo "🔥 Fazendo deploy para Firebase..."
# Deploy apenas do hosting
firebase deploy --only hosting

echo "🎉 Deploy concluído!"
echo "💡 Dica: Se ainda houver problemas de cache, peça aos usuários para:"
echo "   1. Pressionar Ctrl+Shift+R (hard refresh)"
echo "   2. Ou abrir DevTools > Network > Disable cache"
echo "   3. Ou usar modo incógnito"
