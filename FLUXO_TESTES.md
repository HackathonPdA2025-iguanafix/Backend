# 🧪 Fluxo de Testes - API Chatbot Cadastro

Este documento contém o fluxo completo para testar o sistema de cadastro de profissionais via chatbot.

## 📋 Pré-requisitos

- Servidor rodando em `http://localhost:3001`
- Thunder Client ou REST Client instalado no VS Code
- Usuário já registrado (use o endpoint de registro se necessário)

---

## 🔐 PASSO 1: Login (Obter Token)

**Método:** `POST`  
**URL:** `http://localhost:3001/auth/login`  
**Body (JSON):**

```json
{
  "email": "joao.silva@example.com",
  "senha": "senha123"
}
```

**Resposta Esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "joao.silva@example.com",
    "nome": "João Silva"
  }
}
```

⚠️ **IMPORTANTE:** Copie o valor do `token` e use nos próximos passos!

---

## 💬 PASSO 2: Mensagem Inicial

**Método:** `POST`  
**URL:** `http://localhost:3001/chatbot/chat`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Body (JSON):**
```json
{
  "message": "Olá! Quero completar meu cadastro"
}
```

**Resposta Esperada:**
```json
{
  "response": "👋 Olá! Sou a **Iguana**, sua assistente de cadastro da IguanaFix!\n\n📋 **ETAPA 1: Informações Pessoais e Endereço**...",
  "extractedData": {},
  "conversationHistory": [...]
}
```

---

## 📋 PASSO 3: ETAPA 1 - Informações Pessoais e Endereço

**Método:** `POST`  
**URL:** `http://localhost:3001/chatbot/chat`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Body (JSON):**
```json
{
  "message": "RG: 123456789, Estado: SP, Cidade: São Paulo, CEP: 01310-100, Bairro: Bela Vista, Rua: Av Paulista, Número: 1000"
}
```

**Dados Extraídos:**
- ✅ RG
- ✅ CEP
- ✅ Estado/Cidade
- ✅ Endereço completo

---

## 🗺️ PASSO 4: ETAPA 2 - Região de Interesse e Categorias

**Método:** `POST`  
**URL:** `http://localhost:3001/chatbot/chat`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Body (JSON):**
```json
{
  "message": "Quero trabalhar em SP, São Paulo. Sou eletricista e encanador"
}
```

**Dados Extraídos:**
- ✅ Estado de interesse
- ✅ Cidade de interesse
- ✅ Categorias de serviço

---

## 📜 PASSO 5: ETAPA 3 - Experiência e Referências

**Método:** `POST`  
**URL:** `http://localhost:3001/chatbot/chat`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Body (JSON):**
```json
{
  "message": "Tenho 2 referências: João Silva (11) 98765-4321 e Maria Santos (21) 91234-5678"
}
```

**Dados Extraídos:**
- ✅ Telefones de referência
- ✅ Quantidade de referências

---

## 💰 PASSO 6: ETAPA 4 - Dados Fiscais e Bancários

**Método:** `POST`  
**URL:** `http://localhost:3001/chatbot/chat`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Body (JSON):**
```json
{
  "message": "Sou MEI. CNPJ: 12.345.678/0001-90, Razão: João Silva MEI, Tipo: PF, PIX: CPF 123.456.789-01, Banco: Itaú, Agência: 1234, Conta: 56789-0, Titular: João Silva, Doc: 123.456.789-01"
}
```

**Dados Extraídos:**
- ✅ CNPJ
- ✅ Razão Social
- ✅ Tipo de conta
- ✅ Dados bancários
- ✅ Chave PIX

---

## 📸 PASSO 7: ETAPA 5 - Uploads de Documentos (FINAL)

**Método:** `POST`  
**URL:** `http://localhost:3001/chatbot/chat`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Body (JSON):**
```json
{
  "message": "Documentos enviados"
}
```

**Resposta Esperada:**
```json
{
  "response": "🎉 **PARABÉNS! Cadastro Completo!**\n\nTodos os seus dados foram registrados com sucesso...",
  "extractedData": {...},
  "conversationHistory": [...]
}
```

---

## 📸 Upload de Arquivos (Complementar)

### Upload Único
**Método:** `POST`  
**URL:** `http://localhost:3001/upload/single`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```
**Body:** `form-data`
- Key: `file`
- Type: `File`
- Value: Selecione o arquivo

### Upload Múltiplo
**Método:** `POST`  
**URL:** `http://localhost:3001/upload/multiple`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```
**Body:** `form-data`
- Key: `files`
- Type: `File` (múltiplos)
- Value: Selecione os arquivos

---

## ✅ Verificar Histórico de Conversa

**Método:** `GET`  
**URL:** `http://localhost:3001/chatbot/history`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta:**
```json
{
  "history": [
    {
      "role": "user",
      "content": "Olá! Quero completar meu cadastro",
      "timestamp": "2025-12-14T..."
    },
    {
      "role": "assistant",
      "content": "👋 Olá! Sou a **Iguana**...",
      "timestamp": "2025-12-14T..."
    }
  ]
}
```

---

## 🔄 Resetar Conversa

**Método:** `POST`  
**URL:** `http://localhost:3001/chatbot/reset`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta:**
```json
{
  "message": "Histórico de conversa resetado com sucesso"
}
```

---

## 📊 Validar Campo Específico (Opcional)

**Método:** `POST`  
**URL:** `http://localhost:3001/chatbot/validate-field`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Body (JSON):**
```json
{
  "field": "cpf",
  "value": "123.456.789-01"
}
```

---

## 🔄 Atualizar Dados Diretamente (Opcional)

**Método:** `POST`  
**URL:** `http://localhost:3001/chatbot/update-data`  
**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Body (JSON):**
```json
{
  "data": {
    "rg": "123456789",
    "estado": "SP",
    "cidade": "São Paulo",
    "cep": "01310-100"
  }
}
```

---

## 🎯 Fluxo Completo Resumido

```
1. POST /auth/login → Obter token
2. POST /chatbot/chat → "Olá! Quero completar meu cadastro"
3. POST /chatbot/chat → Informações pessoais (RG, CEP, endereço)
4. POST /chatbot/chat → Região e categorias de serviço
5. POST /chatbot/chat → Referências profissionais
6. POST /chatbot/chat → Dados fiscais e bancários
7. POST /chatbot/chat → "Documentos enviados"
8. GET /chatbot/history → Verificar todo histórico
```

---

## 🛠️ Categorias de Serviço Disponíveis

- Eletricista
- Encanador
- Pedreiro
- Pintor
- Carpinteiro
- Mecânico
- Jardineiro
- Limpeza
- Consultoria

---

## 📝 Documentos Necessários (Upload)

1. ✅ **Foto de Perfil** (requisitos: fundo claro, camisa escura, sem acessórios)
2. ✅ **Foto do Documento** (CNH ou RG - frente e verso)
3. ✅ **Certidão de Antecedentes Criminais**
4. ✅ **Comprovante MEI/CNPJ** (se aplicável)
5. ✅ **Certificados de Experiência** (opcional)

---

## ❓ Perguntas Frequentes ao Chatbot

**"O que é certidão de antecedentes?"**
```json
{
  "message": "O que é certidão de antecedentes criminais?"
}
```

**"Como obter comprovante MEI?"**
```json
{
  "message": "Como faço para obter o comprovante MEI?"
}
```

---

## 🚨 Troubleshooting

### Erro 401 Unauthorized
- ✅ Verificar se o token está correto
- ✅ Verificar formato: `Bearer SEU_TOKEN` (com espaço)

### Erro 404 Not Found
- ✅ Verificar se a URL está correta
- ✅ Verificar se o servidor está rodando

### Chatbot não responde corretamente
- ✅ Use POST /chatbot/reset para limpar histórico
- ✅ Comece novamente do Passo 2

---

## 📌 Notas Importantes

- ⚠️ O token expira em **24 horas**
- ⚠️ Uploads devem ser feitos **ANTES** de confirmar "Documentos enviados"
- ⚠️ Referências são **obrigatórias** (mínimo 2)
- ⚠️ Dados fiscais PF e PJ não podem ser misturados

---

## 🎉 Status Final

Após completar todas as etapas:
- ✅ `cadastroCompleto: true` no banco de dados
- ✅ Status: Aguardando Aprovação
- ✅ Perfil pronto para análise

---

**Desenvolvido com ❤️ para IguanaFix**
