# 🚀 Atualização do Sistema de Cadastro com Chatbot IA

## ✅ Implementações Concluídas

### 1. **Novo Fluxo de Cadastro em 2 Etapas**

#### Etapa 1: Formulário Inicial Simples
- **Endpoint**: `POST /auth/register`
- **Campos obrigatórios**:
  - Nome completo
  - E-mail
  - CPF (11 dígitos)
  - Senha (mínimo 6 caracteres)

#### Etapa 2: Completar Perfil via Chatbot
- **Endpoint**: `POST /chatbot/chat` (requer autenticação)
- Assistente IA (Iguana) guia o usuário através de:
  - Fotos e documentos
  - Informações pessoais e endereço
  - Região de interesse e serviços
  - Experiência e referências
  - Dados fiscais e bancários

### 2. **Integração Inteligente com Gemini**

#### Recursos Implementados:
- ✅ Validação automática de formatos (CPF, CNPJ, CEP, telefone, etc.)
- ✅ Suporte educacional sobre documentos
- ✅ Respostas contextuais e naturais
- ✅ Histórico de conversa por usuário
- ✅ Extração automática de dados estruturados

### 3. **Novos Endpoints**

#### Autenticação
```
POST /auth/register
Body: { nome, email, cpf, senha }

POST /auth/login  
Body: { email, senha }

GET /auth/me
Headers: { Authorization: Bearer <token> }
```

#### Chatbot
```
POST /chatbot/chat
Headers: { Authorization: Bearer <token> }
Body: { message: "sua mensagem" }

POST /chatbot/validate-field
Body: { fieldName: "cpf", value: "12345678901" }

POST /chatbot/update-data
Body: { rg: "123456789", estado: "SP", ... }

POST /chatbot/reset
GET /chatbot/history
```

#### Upload de Arquivos
```
POST /upload/single
Headers: { Authorization: Bearer <token> }
Body: FormData com campo 'file'

POST /upload/multiple
Body: FormData com campo 'files' (até 10 arquivos)
```

### 4. **Schema do Banco Atualizado**

Novos campos no modelo `Provider`:
- Dados básicos: `cpf`, `cadastroCompleto`
- Documentos: `fotoPerfil`, `fotoDocumento`, `certidaoAntecedentes`
- Endereço: `rg`, `estado`, `cidade`, `cep`, `bairro`, `logradouro`, `numero`, `complemento`
- Interesse: `estadoInteresse`, `cidadeInteresse`, `categorias`
- Experiência: `certificados`, `referencias`
- Fiscal: `cnpjDoc`, `razaoSocial`, `cnpj`, `tipoConta`, `pixTipo`, `pixChave`, `bancoNome`, `agencia`, `conta`, `titularNome`, `titularDoc`

## 🎯 Como Usar

### 1. Cadastro Inicial (Frontend)
```javascript
const response = await fetch('http://localhost:3001/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nome: "João Silva",
    email: "joao@example.com",
    cpf: "12345678901",
    senha: "senha123"
  })
});

const { token, provider } = await response.json();
// Salvar token e redirecionar para tela do chatbot
```

### 2. Interação com Chatbot
```javascript
const response = await fetch('http://localhost:3001/chatbot/chat', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: "Meu nome é João Silva"
  })
});

const { response: botMessage, extractedData } = await response.json();
// Exibir botMessage para o usuário
```

### 3. Upload de Documentos
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3001/upload/single', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { path } = await response.json();
// Usar path para atualizar os dados do provider
```

## 🔧 Configuração

Certifique-se de que o arquivo `.env` contém:
```env
DATABASE_URL="sua_url_do_banco"
JWT_SECRET="sua_chave_secreta"
JWT_EXPIRATION="24h"
GEMINI_API_KEY="sua_chave_do_gemini"
PORT=3001
```

## 🚀 Para Iniciar

```bash
# Instalar dependências
npm install

# Rodar migrations
npx prisma migrate dev

# Iniciar servidor
npm run start:dev
```

## 📝 Notas Importantes

1. **Validações**: O chatbot valida automaticamente todos os formatos de dados
2. **Uploads**: Arquivos são salvos em `./uploads` (criar pasta manualmente ou pelo código)
3. **Segurança**: Todos endpoints do chatbot requerem autenticação JWT
4. **Histórico**: Cada usuário tem seu próprio histórico de conversa
5. **Formatos aceitos**: JPEG, PNG, PDF (máximo 5MB por arquivo)

## 🎨 Personalização do Chatbot

O comportamento da IA pode ser ajustado em [chatbot.service.ts](src/chatbot/chatbot.service.ts) na variável `systemPrompt`.
