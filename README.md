# 🏗️ IguanaFix Backend - Cadastro de Profissionais

Sistema backend para cadastro e gerenciamento de profissionais da IguanaFix, desenvolvido em **NestJS** com integração de **IA conversacional** (Google Gemini) para coleta progressiva de dados em 5 etapas.

## 📋 Índice
1. [Visão Geral](#-visão-geral)
2. [Arquitetura do Sistema](#️-arquitetura-do-sistema)
3. [Fluxograma de Cadastro](#-fluxograma-de-cadastro)
4. [Diagrama de Classes](#-diagrama-de-classes)
5. [Começando](#-começando)
6. [Endpoints](#-endpoints)
7. [Modelo de Dados](#-modelo-de-dados)
8. [Tecnologias](#️-tecnologias-utilizadas)
9. [Testes](#-testes)

---

## 🎯 Visão Geral

### Principais Características:
- 🤖 **Chatbot Inteligente** - IA conversacional com Google Gemini
- 🔐 **Autenticação JWT** - Login e cadastro seguro
- 📸 **Upload de Arquivos** - Suporte a múltiplos arquivos
- 📊 **Extração Automática** - Regex para parsing de dados
- ✅ **Validação Sequencial** - Fluxo em 5 etapas progressivas
- 🗄️ **Persistência** - Prisma ORM com MySQL

---

## 🏛️ Arquitetura do Sistema

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Cliente Web/Mobile]
    end
    
    subgraph "API Gateway"
        B[NestJS Server :3001]
        C[CORS Middleware]
        D[JWT Guard]
    end
    
    subgraph "Application Layer"
        E[Auth Module]
        F[Chatbot Module]
        G[Upload Module]
        H[Providers Module]
    end
    
    subgraph "Service Layer"
        I[Auth Service]
        J[Chatbot Service]
        K[Upload Service]
        L[Providers Service]
        M[Prisma Service]
    end
    
    subgraph "External Services"
        N[Google Gemini API]
        O[(MySQL Database)]
        P[File System]
    end
    
    A -->|HTTP/HTTPS| B
    B --> C
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    
    E --> I
    F --> J
    G --> K
    H --> L
    
    I --> M
    J --> M
    K --> P
    L --> M
    
    J -->|API Call| N
    M -->|Prisma ORM| O
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style N fill:#ffe1e1
    style O fill:#e1ffe1
    style P fill:#f0e1ff
```

### Fluxo de Requisição:

1. **Cliente** → Envia requisição HTTP
2. **CORS Middleware** → Valida origem (http://localhost:3000)
3. **JWT Guard** → Valida token de autenticação
4. **Controller** → Roteia para serviço apropriado
5. **Service** → Processa lógica de negócio
6. **Prisma Service** → Persiste dados no MySQL
7. **Response** → Retorna resultado ao cliente

---

## 🔄 Fluxograma de Cadastro

```mermaid
flowchart TD
    Start([Início]) --> Register[Cadastro Básico<br/>Nome, Email, CPF, Senha]
    Register --> Login[Login JWT]
    Login --> Token{Token<br/>Válido?}
    Token -->|Não| Login
    Token -->|Sim| Chat1[ETAPA 1: Chatbot<br/>Informações Pessoais]
    
    Chat1 --> Extract1[Extrair: RG, CEP,<br/>Estado, Cidade, Endereço]
    Extract1 --> Save1[(Salvar no DB)]
    Save1 --> Check1{Etapa 1<br/>Completa?}
    Check1 -->|Não| Chat1
    Check1 -->|Sim| Chat2[ETAPA 2: Chatbot<br/>Região e Serviços]
    
    Chat2 --> Extract2[Extrair: Estado/Cidade<br/>Interesse, Categorias]
    Extract2 --> Save2[(Salvar no DB)]
    Save2 --> Check2{Etapa 2<br/>Completa?}
    Check2 -->|Não| Chat2
    Check2 -->|Sim| Chat3[ETAPA 3: Chatbot<br/>Referências]
    
    Chat3 --> Extract3[Extrair: Nome,<br/>Telefones múltiplos]
    Extract3 --> Save3[(Salvar no DB)]
    Save3 --> Check3{Etapa 3<br/>Completa?<br/>Min 2 refs}
    Check3 -->|Não| Chat3
    Check3 -->|Sim| Chat4[ETAPA 4: Chatbot<br/>Dados Fiscais]
    
    Chat4 --> Extract4[Extrair: CNPJ, PIX,<br/>Banco, Agência, Conta]
    Extract4 --> Save4[(Salvar no DB)]
    Save4 --> Check4{Etapa 4<br/>Completa?}
    Check4 -->|Não| Chat4
    Check4 -->|Sim| Chat5[ETAPA 5: Chatbot<br/>Documentos]
    
    Chat5 --> Upload1[Upload: Foto Perfil]
    Upload1 --> Upload2[Upload: Foto Doc]
    Upload2 --> Upload3[Upload: Certidão]
    Upload3 --> Save5[(Salvar URLs no DB)]
    Save5 --> Check5{Etapa 5<br/>Completa?}
    Check5 -->|Não| Chat5
    Check5 -->|Sim| Final{Todas<br/>Etapas OK?}
    
    Final -->|Não| ShowMissing[Mostrar Etapas<br/>Pendentes]
    ShowMissing --> Chat1
    Final -->|Sim| Complete[Cadastro Completo<br/>cadastroCompleto = true]
    Complete --> End([Fim])
    
    style Register fill:#e1f5ff
    style Login fill:#fff4e1
    style Chat1 fill:#ffe1f5
    style Chat2 fill:#ffe1f5
    style Chat3 fill:#ffe1f5
    style Chat4 fill:#ffe1f5
    style Chat5 fill:#ffe1f5
    style Complete fill:#e1ffe1
    style End fill:#e1ffe1
```

---

## 📐 Diagrama de Classes

```mermaid
classDiagram
    class AppModule {
        +imports: Module[]
        +controllers: Controller[]
        +providers: Provider[]
    }
    
    class AuthModule {
        +imports: Module[]
        +controllers: AuthController[]
        +providers: AuthService[]
    }
    
    class AuthService {
        -prisma: PrismaService
        -jwtService: JwtService
        +register(data): Promise~Provider~
        +login(credentials): Promise~Token~
        +validateUser(id): Promise~Provider~
    }
    
    class ChatbotModule {
        +imports: Module[]
        +controllers: ChatbotController[]
        +providers: ChatbotService[]
    }
    
    class ChatbotService {
        -prisma: PrismaService
        -geminiApiKey: string
        -conversationHistories: Map
        +chat(message, userId): Promise~ChatResponse~
        -generateFallbackResponse(): string
        -extractStructuredData(): Object
        -checkStageCompletion(): StageStatus
        +updateProviderData(): Promise~Provider~
        +resetConversation(): void
    }
    
    class UploadModule {
        +controllers: UploadController[]
    }
    
    class ProvidersModule {
        +controllers: ProvidersController[]
        +providers: ProvidersService[]
    }
    
    class PrismaService {
        +provider: PrismaClient
        +onModuleInit(): Promise~void~
    }
    
    class Provider {
        +id: string
        +email: string
        +nome: string
        +cpf: string
        +rg?: string
        +estado?: string
        +cidade?: string
        +cep?: string
        +estadoInteresse?: string
        +cidadeInteresse?: string
        +categorias?: string
        +referencias?: string
        +pixTipo?: string
        +pixChave?: string
        +bancoNome?: string
        +cadastroCompleto: boolean
        +status: string
    }
    
    AppModule --> AuthModule
    AppModule --> ChatbotModule
    AppModule --> UploadModule
    AppModule --> ProvidersModule
    
    AuthModule --> AuthService
    ChatbotModule --> ChatbotService
    
    AuthService --> PrismaService
    ChatbotService --> PrismaService
    
    AuthService ..> Provider
    ChatbotService ..> Provider
```

---

## 🚀 Começando

### Pré-requisitos

- Node.js 18+ e npm 9+
- MySQL 8.0+ (Railway recomendado)

### Instalação

```bash
# Instalar dependências
npm install

### Variáveis de Ambiente (.env)

```env
# Database
DATABASE_URL="mysql://user:password@host:port/database"

# JWT
JWT_SECRET="your-secret-key-change-in-production"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Server
PORT=3001
```
Aplicar schema no banco
npx prisma db push

# (Opcional) Abrir Prisma Studio
npx prisma studio
```

### Executar

```bash
# Desenvolvimento (watch mode)
npm run start:dev

# Produção
npm run build
npm run start:prod
```

Servidor: **http://localhost:3001**
```bash
npm run build
npm run start:prod
```

## 📁 Estrutura

---

## 📁 Estrutura de Pastas

```
backendprivate/
├── prisma/
│   └── schema.prisma           # Schema do banco de dados
│
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts  # Endpoints de autenticação
│   │   ├── auth.service.ts     # Lógica de auth
│   │   ├── auth.module.ts      # Módulo de auth
│   │   ├── jwt.strategy.ts     # Estratégia JWT
│   │   └── jwt-auth.guard.ts   # Guard de proteção
│   │
│   ├── chatbot/
│   │   ├── chatbot.controller.ts  # Endpoints do chatbot
│   │   ├── chatbot.service.ts     # Lógica do chatbot + IA
│   │   └── chatbot.module.ts      # Módulo do chatbot
│   │
│   ├── providers/
│   │   ├── providers.controller.ts  # CRUD de providers
│   │   ├── providers.service.ts     # Lógica de providers
│   � Endpoints Disponíveis

### Auth
- `POST /auth/register` - Registrar novo provider
  ```json
  {
    "nome": "João Silva",
    "email": "joao@example.com",
    "cpf": "12345678901",
    "senha": "senha123"
  }
  ```

- `POST /auth/login` - Login e obter token
  ```json
  {
    "email": "joao@example.com",
    "senha": "senha123"
  }
  ```

### Chatbot (🔒 Protegido - Requer JWT)
- `POST /chatbot/chat` - Conversar com IA
- `POST /chatbot/validate-field` - Validar campo específico
- `POST /chatbot/update-data` - Atualizar dados diretamente
- `POST /chatbot/reset` - Resetar conversa
- `GET /chatbot/history` - Obter histórico de conversa

### Upload (🔒 Protegido)
- `POST /upload/single` - Upload de 1 arquivo (max 5MB)
- `POST /upload/multiple` - Upload múltiplo

### Providers (🔒 Protegido)
- `GET /providers` - Listar todos
- `GET /providers/:id` - Buscar um
- `PATCH /providers/:id` - Atualizar

> 📖 Ver **FLUXO_TESTES.md** para exemplos completos de usosenha": "password123"
  }
  ```
---

## 📊 Modelo de Dados

### Provider (Entidade Principal - 30+ campos)

**Cadastro Básico**
- id, email, senha, nome, cpf

**Documentos (Etapa 5)**
- fotoPerfil, fotoDocumento, certidaoAntecedentes

**Dados Pessoais (Etapa 1)**
- rg, estado, cidade, cep, bairro, logradouro, numero, complemento

**Interesses (Etapa 2)**
- estadoInteresse, cidadeInteresse, categorias (JSON)

**Experiência (Etapa 3)**
- certificados (JSON), referencias (JSON - mínimo 2)

**Dados Fiscais (Etapa 4)**
- cnpjDoc, razaoSocial, cnpj, tipoConta (PF/PJ)
---

## 🧪 Testes

Ver arquivo **FLUXO_TESTES.md** para sequência completa de testes com Thunder Client/REST Client.

```bash
# Testes unitários
npm test

# Testes com cobertura
npm run test:cov

# Modo watch
npm run test:watch
```

---

## 📝 Scripts Disponíveis

- `npm run start:dev` - Desenvolvimento (watch mode)
- `npm run start:debug` - Debug mode
- `npm run build` - Build para produção
---

## 🔐 Segurança

- ✅ **Senhas**: Hash bcrypt (10 rounds)
- ✅ **JWT**: Token com expiração 24h
- ✅ **Validação**: Zod + class-validator
- ✅ **CORS**: Apenas http://localhost:3000
- ✅ **Guards**: Proteção em rotas sensíveis
- ✅ **Sanitização**: Trim automático

---

## 🐛 Troubleshooting

### Erro de conexão MySQL
```bash
# Verificar DATABASE_URL no .env
# Formato: mysql://user:pass@host:port/db
```

### Gemini API quota excedida
```bash
# Sistema usa fallback automaticamente
# Aguarde 24h ou gere nova chave em:
# https://aistudio.google.com/app/apikey
```

### Porta 3001 em uso
```bash
# Altere PORT no .env
PORT=3002
```

---

## 📈 Melhorias Futuras

- [ ] Redis para histórico de conversas
- [ ] WebSocket para chat em tempo real
- [ ] Sistema de notificações (email/SMS)
- [ ] Dashboard administrativo
- [ ] Análise de sentimento nas conversas
- [ ] Backup automático de uploads
- [ ] Rate limiting por usuário
- [ ] Logs estruturados (Winston/Pino)
- [ ] Testes E2E completos
- [ ] CI/CD pipeline

---

## 📚 Documentação Adicional

- 📖 **ARCHITECTURE.md** - Arquitetura detalhada com diagramas
- 📖 **FLUXO_TESTES.md** - Guia completo de testes com exemplos
- 📖 [NestJS Docs](https://docs.nestjs.com)
- 📖 [Prisma Docs](https://www.prisma.io/docs)
- 📖 [Gemini API Docs](https://ai.google.dev/docs)

---

**Desenvolvido com ❤️ para IguanaFix**

**Status:** ✅ 100% Operacional | **Endpoints:** 12 | **Database:** MySQL (Railway)(Railway)

### Autenticação & Segurança
- **@nestjs/jwt** - JSON Web Tokens
- **@nestjs/passport** - Estratégias de autenticação
- **bcrypt** - Hash de senhas
- **Zod** - Validação de schemas

### IA & Machine Learning
- **Google Gemini API** - Large Language Model
- **Axios** - Cliente HTTP para API calls

### Upload & Storage
- **Multer** - Middleware de upload de arquivos (JPEG, PNG, PDF - max 5MB)
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
