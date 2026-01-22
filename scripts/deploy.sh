#!/bin/bash

# Script de Deploy para KAMBA POS
# Puxa alterações, instala dependências e faz o build

echo "🔄 Iniciando processo de atualização..."

# 1. Puxar últimas alterações
echo "⬇️  Baixando atualizações..."
git pull origin main

# 2. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 3. Build
echo "🏗️  Compilando aplicação..."
npm run build

echo "✅ Sistema atualizado e pronto para produção!"
echo "Para iniciar, execute: npm start"
