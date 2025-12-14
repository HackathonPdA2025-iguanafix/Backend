# Provider Onboarding Backend

Backend NestJS para a plataforma de onboarding de prestadores de serviço com chatbot inteligente.

## 🎯 Sobre

Este é um projeto **NestJS** independente que implementa:

- ✅ **Autenticação JWT** - Login e cadastro seguro
- ✅ **bcrypt** - Hash de senhas
- ✅ **Prisma ORM** - Acesso ao banco MySQL
- ✅ **Zod** - Validação de dados
- ✅ **Chatbot com Gemini API** - IA para coleta de dados
- ✅ **CORS** - Configurado para frontend
- ✅ **Testes** - Jest com cobertura

## 🚀 Começando

### Pré-requisitos

- Node.js 18+ e npm 9+
- MySQL 8.0+ (ou TiDB)

### Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com credenciais do MySQL e Gemini API
nano .env
```

### Variáveis de Ambiente

```env
DATABASE_URL="mysql://user:password@localhost:3306/provider_onboarding"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="24h"
GEMINI_API_KEY="AIzaSyA9Wtg-Ve4BE92gauaiHb_4yvM5d0YfShI"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### Configurar Banco de Dados

```bash
# Executar migrações Prisma
npm run db:push

# (Opcional) Abrir Prisma Studio
npm run db:studio
```

### Executar em Desenvolvimento

```bash
npm run start:dev
```

Acesse: http://localhost:3001

### Build para Produção

```bash
npm run build
npm run start:prod
```

## 📁 Estrutura

```
src/
├── auth/                # Módulo de autenticação
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── jwt.strategy.ts
│   └── jwt-auth.guard.ts
├── providers/           # Módulo de prestadores
│   ├── providers.module.ts
│   ├── providers.service.ts
│   └── providers.controller.ts
├── chatbot/             # Módulo de chatbot
│   ├── chatbot.module.ts
│   ├── chatbot.service.ts
│   └── chatbot.controller.ts
├── prisma/              # Serviço Prisma
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts        # Módulo raiz
└── main.ts              # Entry point
```

## 🔌 Endpoints

### Autenticação

- `POST /auth/register` - Registrar novo prestador
  ```json
  {
    "email": "user@example.com",
    "senha": "password123",
    "nome": "John Doe",
    "cpfCnpj": "12345678901",
    "areaAtuacao": "Eletricista"
  }
  ```

- `POST /auth/login` - Fazer login
  ```json
  {
    "email": "user@example.com",
    "senha": "password123"
  }
  ```

- `GET /auth/me` - Obter dados do usuário autenticado (requer JWT)

### Prestadores

- `GET /providers` - Listar todos os prestadores
- `GET /providers/:id` - Obter dados de um prestador
- `PATCH /providers/:id/status` - Atualizar status do prestador

### Chatbot

- `POST /chatbot/chat` - Enviar mensagem para o chatbot
  ```json
  {
    "message": "Qual é o prazo de aprovação?"
  }
  ```

## 📊 Modelo de Dados

### Tabela: providers

```sql
CREATE TABLE providers (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cpfCnpj VARCHAR(14) UNIQUE NOT NULL,
  areaAtuacao VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pendente',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Status possíveis:**
- `pendente` - Aguardando aprovação
- `aprovado` - Cadastro aprovado
- `rejeitado` - Cadastro rejeitado

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com cobertura
npm run test:cov

# Modo watch
npm run test:watch
```

## 📝 Scripts

- `npm run start:dev` - Desenvolvimento com watch
- `npm run start:debug` - Debug mode
- `npm run build` - Build para produção
- `npm run start:prod` - Iniciar servidor de produção
- `npm run test` - Executar testes
- `npm run test:cov` - Testes com cobertura
- `npm run db:push` - Migrar banco de dados
- `npm run db:studio` - Abrir Prisma Studio

## 🔐 Segurança

- **Senhas**: Hasheadas com bcrypt (10 rounds)
- **Autenticação**: JWT com expiração de 24h
- **Validação**: Zod no backend
- **CORS**: Configurado para aceitar apenas o frontend
- **Sanitização**: Trim de espaços em branco

## 🐛 Troubleshooting

### Erro de conexão com banco de dados

```bash
# Verifique se MySQL está rodando
mysql -u user -p

# Verifique a DATABASE_URL no .env
# Formato: mysql://user:password@host:port/database
```

### Erro de CORS

```bash
# Verifique se FRONTEND_URL está correto no .env
# Deve corresponder à URL do frontend
```

### Porta 3001 em uso

```bash
# Mude a porta no .env
PORT=3002
```

## 📚 Documentação

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Zod Docs](https://zod.dev)
- [Gemini API Docs](https://ai.google.dev/docs)

---

**Desenvolvido com ❤️ para a Iguanafix**
