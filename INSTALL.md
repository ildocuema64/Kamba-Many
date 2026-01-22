# Guia de Instalação e Produção - KAMBA POS Angola

Este guia detalha os passos para instalar e executar o sistema KAMBA POS em um ambiente de produção (computador do cliente).

## Pré-requisitos

O computador do cliente deve ter os seguintes softwares instalados:

1.  **Node.js**: Versão 18 ou superior (Recomendado v20 LTS).
    *   Download: [https://nodejs.org/](https://nodejs.org/)
2.  **Git**: Para baixar e atualizar o código (Opcional se for copiar os arquivos manualmente).
    *   Download: [https://git-scm.com/](https://git-scm.com/)

## 1. Obter o Código Fonte

Clone o repositório ou extraia o arquivo ZIP do projeto em uma pasta no computador do cliente, por exemplo em `C:\KambaPOS` ou `/opt/kambapos`.

```bash
git clone <url-do-repositorio> .
```

## 2. Configuração do Ambiente

1.  Na pasta raiz do projeto, copie o arquivo `.env.example` para um novo arquivo chamado `.env`.
2.  Abra o arquivo `.env` com um editor de texto (Bloco de Notas, VS Code, etc.).
3.  Preencha as variáveis necessárias:

```env
# Configuração do Supabase (Cloud ou Local)
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_supabase

# Informações da Aplicação
NEXT_PUBLIC_APP_NAME="POS Angola"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Chave Privada da AGT (Essencial para Assinatura de Faturas)
# Deve ser uma String Base64 da chave privada PEM
AGT_PRIVATE_KEY_B64=sua_chave_privada_base64
```

> **NOTA:** A chave privada da AGT é crítica para a validação fiscal. Mantenha-a segura.

## 3. Instalação e Build

Abra o terminal na pasta do projeto e execute os seguintes comandos:

```bash
# 1. Instalar dependências
npm install

# 2. Compilar o projeto para produção
npm run build
```

Este processo pode levar alguns minutos. Se ocorrerem erros, verifique se todas as dependências do sistema estão instaladas.

## 4. Executando em Produção

Para iniciar o sistema, execute:

```bash
npm start
```

O sistema estará acessível em: `http://localhost:3000`

### Script de Inicialização Rápida
Para facilitar, você pode usar o script `scripts/start-prod.sh` (em Linux/Mac) ou criar um atalho no Windows que execute `npm start`.

## 5. Ativação do Sistema

No primeiro acesso, o sistema pode solicitar uma ativação.
Como administrador, você deve gerar um código de ativação para o cliente.

1.  Abra o arquivo `public/admin-activator.html` no seu navegador (não no do cliente).
2.  Insira a Referência do Cliente e o Plano.
3.  Gere o código e insira na tela de ativação do sistema no cliente.
