# 🏗️ Arquitetura do Projeto - IguanaFix Backend

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Fluxograma de Cadastro](#fluxograma-de-cadastro)
4. [Diagrama de Classes](#diagrama-de-classes)
5. [Tecnologias Utilizadas](#tecnologias-utilizadas)
6. [Estrutura de Pastas](#estrutura-de-pastas)

---

## 🎯 Visão Geral

Sistema backend para cadastro e gerenciamento de profissionais da IguanaFix, desenvolvido em **NestJS** com integração de **IA conversacional** (Google Gemini) para coleta progressiva de dados em 5 etapas.

### Principais Características:
- 🤖 Chatbot inteligente com IA
- 🔐 Autenticação JWT
- 📸 Upload de múltiplos arquivos
- 📊 Extração automática de dados
- ✅ Validação sequencial de etapas
- 🗄️ Persistência com Prisma + MySQL

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
        +exports: Service[]
    }
    
    class AuthController {
        -authService: AuthService
        +register(dto: RegisterDto): Promise~Token~
        +login(dto: LoginDto): Promise~Token~
    }
    
    class AuthService {
        -prisma: PrismaService
        -jwtService: JwtService
        +register(data): Promise~Provider~
        +login(credentials): Promise~Token~
        +validateUser(id): Promise~Provider~
    }
    
    class JwtStrategy {
        -prisma: PrismaService
        +validate(payload): Promise~Provider~
    }
    
    class JwtAuthGuard {
        +canActivate(context): boolean
    }
    
    class ChatbotModule {
        +imports: Module[]
        +controllers: ChatbotController[]
        +providers: ChatbotService[]
    }
    
    class ChatbotController {
        -chatbotService: ChatbotService
        +chat(dto): Promise~Response~
        +validateField(dto): Promise~ValidationResult~
        +updateData(dto): Promise~Provider~
        +reset(): Promise~Message~
        +getHistory(): Promise~History~
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
        +imports: Module[]
        +controllers: UploadController[]
    }
    
    class UploadController {
        +uploadSingle(file): FileResponse
        +uploadMultiple(files): FileResponse[]
    }
    
    class ProvidersModule {
        +imports: Module[]
        +controllers: ProvidersController[]
        +providers: ProvidersService[]
    }
    
    class ProvidersController {
        -providersService: ProvidersService
        +getAll(): Promise~Provider[]~
        +getOne(id): Promise~Provider~
        +update(id, data): Promise~Provider~
    }
    
    class ProvidersService {
        -prisma: PrismaService
        +findAll(): Promise~Provider[]~
        +findOne(id): Promise~Provider~
        +update(id, data): Promise~Provider~
    }
    
    class PrismaModule {
        +providers: PrismaService[]
        +exports: Service[]
    }
    
    class PrismaService {
        +provider: PrismaClient
        +onModuleInit(): Promise~void~
        +onModuleDestroy(): Promise~void~
    }
    
    class Provider {
        +id: string
        +email: string
        +senha: string
        +nome: string
        +cpf: string
        +fotoPerfil?: string
        +fotoDocumento?: string
        +certidaoAntecedentes?: string
        +rg?: string
        +estado?: string
        +cidade?: string
        +cep?: string
        +bairro?: string
        +logradouro?: string
        +numero?: string
        +complemento?: string
        +estadoInteresse?: string
        +cidadeInteresse?: string
        +categorias?: string
        +certificados?: string
        +referencias?: string
        +cnpjDoc?: string
        +razaoSocial?: string
        +cnpj?: string
        +tipoConta?: string
        +pixTipo?: string
        +pixChave?: string
        +bancoNome?: string
        +agencia?: string
        +conta?: string
        +titularNome?: string
        +titularDoc?: string
        +cadastroCompleto: boolean
        +status: string
        +createdAt: DateTime
        +updatedAt: DateTime
    }
    
    class ConversationMessage {
        +role: string
        +content: string
    }
    
    class ChatResponse {
        +response: string
        +extractedData: Object
        +conversationId: string
    }
    
    class StageStatus {
        +etapa1: boolean
        +etapa2: boolean
        +etapa3: boolean
        +etapa4: boolean
        +etapa5: boolean
    }
    
    AppModule --> AuthModule
    AppModule --> ChatbotModule
    AppModule --> UploadModule
    AppModule --> ProvidersModule
    AppModule --> PrismaModule
    
    AuthModule --> AuthController
    AuthModule --> AuthService
    AuthModule --> JwtStrategy
    AuthModule --> JwtAuthGuard
    
    AuthController --> AuthService
    AuthService --> PrismaService
    AuthService ..> Provider
    JwtStrategy --> PrismaService
    
    ChatbotModule --> ChatbotController
    ChatbotModule --> ChatbotService
    ChatbotController --> ChatbotService
    ChatbotService --> PrismaService
    ChatbotService ..> Provider
    ChatbotService ..> ConversationMessage
    ChatbotService ..> ChatResponse
    ChatbotService ..> StageStatus
    
    UploadModule --> UploadController
    
    ProvidersModule --> ProvidersController
    ProvidersModule --> ProvidersService
    ProvidersController --> ProvidersService
    ProvidersService --> PrismaService
    ProvidersService ..> Provider
    
    PrismaModule --> PrismaService
    PrismaService ..> Provider
```

---

## 🛠️ Tecnologias Utilizadas

### Backend Framework
- **NestJS 10** - Framework Node.js progressivo
- **TypeScript** - Superset tipado do JavaScript
- **Express** - Framework HTTP subjacente

### Database & ORM
- **Prisma ORM** - Next-generation ORM
- **MySQL** - Banco de dados relacional (Railway)

### Autenticação & Segurança
- **@nestjs/jwt** - JSON Web Tokens
- **@nestjs/passport** - Estratégias de autenticação
- **bcrypt** - Hash de senhas
- **Zod** - Validação de schemas

### IA & Machine Learning
- **Google Gemini API** - Large Language Model
- **Axios** - Cliente HTTP para API calls

### Upload & Storage
- **Multer** - Middleware de upload de arquivos
- **File System (fs)** - Armazenamento local

### Validação & Utilitários
- **class-validator** - Validação de DTOs
- **class-transformer** - Transformação de objetos

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
│   │   └── providers.module.ts      # Módulo de providers
│   │
│   ├── upload/
│   │   ├── upload.controller.ts  # Endpoints de upload
│   │   └── upload.module.ts      # Módulo de upload
│   │
│   ├── prisma/
│   │   ├── prisma.service.ts  # Cliente Prisma
│   │   └── prisma.module.ts   # Módulo Prisma
│   │
│   ├── app.module.ts   # Módulo raiz
│   └── main.ts         # Entry point
│
├── uploads/            # Arquivos enviados
├── .env                # Variáveis de ambiente
├── package.json        # Dependências
├── tsconfig.json       # Config TypeScript
└── nest-cli.json       # Config NestJS
```

---

## 🔐 Variáveis de Ambiente

```env
# Database
DATABASE_URL="mysql://user:password@host:port/database"

# JWT
JWT_SECRET="your-secret-key"

# Gemini AI
GEMINI_API_KEY="your-gemini-api-key"

# Server
PORT=3001
```

---

## 🔄 Fluxo de Dados

### 1. Autenticação
```
Cliente → POST /auth/register → AuthService → Prisma → DB
                                     ↓
                               Hash Senha (bcrypt)
                                     ↓
                              Gerar Token JWT
                                     ↓
                              Retornar Token
```

### 2. Chatbot Interaction
```
Cliente → POST /chatbot/chat → JWT Guard → ChatbotService
                                                ↓
                                         Buscar Provider
                                                ↓
                                    Verificar Completude Etapas
                                                ↓
                                    Try: Gemini API | Catch: Fallback
                                                ↓
                                    Extrair Dados (Regex)
                                                ↓
                                         Salvar no DB
                                                ↓
                                    Rebuscar Provider
                                                ↓
                                    Retornar Resposta
```

### 3. Upload de Arquivos
```
Cliente → POST /upload/single → JWT Guard → Multer Middleware
                                                 ↓
                                         Validar Tipo/Tamanho
                                                 ↓
                                         Salvar em ./uploads
                                                 ↓
                                         Retornar URL
```

---

## 📊 Modelo de Dados

### Provider (Entidade Principal)

**Seção 1: Cadastro Básico**
- id, email, senha, nome, cpf

**Seção 2: Documentos**
- fotoPerfil, fotoDocumento, certidaoAntecedentes

**Seção 3: Dados Pessoais**
- rg, estado, cidade, cep, bairro, logradouro, numero, complemento

**Seção 4: Interesses**
- estadoInteresse, cidadeInteresse, categorias (JSON)

**Seção 5: Experiência**
- certificados (JSON), referencias (JSON)

**Seção 6: Dados Fiscais**
- cnpjDoc, razaoSocial, cnpj, tipoConta, pixTipo, pixChave
- bancoNome, agencia, conta, titularNome, titularDoc

**Controle**
- cadastroCompleto, status, createdAt, updatedAt

---

## 🚀 Endpoints Disponíveis

### Auth
- `POST /auth/register` - Registrar novo provider
- `POST /auth/login` - Login e obter token

### Chatbot (Protegido)
- `POST /chatbot/chat` - Conversar com IA
- `POST /chatbot/validate-field` - Validar campo
- `POST /chatbot/update-data` - Atualizar dados
- `POST /chatbot/reset` - Resetar conversa
- `GET /chatbot/history` - Obter histórico

### Upload (Protegido)
- `POST /upload/single` - Upload de 1 arquivo
- `POST /upload/multiple` - Upload múltiplo

### Providers (Protegido)
- `GET /providers` - Listar todos
- `GET /providers/:id` - Buscar um
- `PATCH /providers/:id` - Atualizar

---

## 🧪 Testes

Ver arquivo **FLUXO_TESTES.md** para sequência completa de testes.

---

## 📈 Melhorias Futuras

- [ ] Implementar Redis para histórico de conversas
- [ ] Adicionar WebSocket para chat em tempo real
- [ ] Sistema de notificações (email/SMS)
- [ ] Dashboard de administração
- [ ] Análise de sentimento nas conversas
- [ ] Backup automático de uploads
- [ ] Rate limiting por usuário
- [ ] Logs estruturados (Winston/Pino)
- [ ] Testes unitários e E2E
- [ ] CI/CD pipeline

---

**Desenvolvido com ❤️ para IguanaFix**
