import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

export interface ConversationMessage {
  role: string;
  content: string;
}

@Injectable()
export class ChatbotService {
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;
  private readonly geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

  // Armazenar histórico de conversas por usuário (em produção, usar Redis ou DB)
  private conversationHistories: Map<string, ConversationMessage[]> = new Map();

  constructor(private prisma: PrismaService) {}

  async chat(message: string, userId?: string) {
    if (!this.geminiApiKey) {
      throw new BadRequestException('Gemini API key não configurada');
    }

    // Buscar dados do provider para verificar completude
    const provider = await this.prisma.provider.findUnique({
      where: { id: userId },
    });

    if (!provider) {
      throw new BadRequestException('Provider não encontrado');
    }

    // Inicializar ou recuperar histórico do usuário
    const conversationId = userId || 'default';
    if (!this.conversationHistories.has(conversationId)) {
      this.conversationHistories.set(conversationId, []);
    }
    
    const history = this.conversationHistories.get(conversationId)!;

    // Adicionar mensagem do usuário ao histórico
    history.push({
      role: 'user',
      content: message,
    });

    // Prompt do sistema atualizado com o novo fluxo
    const systemPrompt = `Você é a Iamanos, uma assistente de IA inteligente e amigável da IguanaFix, especializada em ajudar profissionais a completarem seu cadastro.

**CONTEXTO IMPORTANTE:**
O usuário já criou sua conta básica (nome, e-mail, CPF e senha). Agora você vai guiá-lo para completar o perfil profissional coletando informações adicionais de forma conversacional e natural.

**SUAS RESPONSABILIDADES:**

1. **COLETA SEQUENCIAL DE DADOS** - Colete as informações na seguinte ordem:

   **Seção 1: Fotos e Documentos Pessoais**
   - Foto de perfil (requisitos: fundo claro, camisa escura sem estampa, olhando para câmera, braços cruzados, sem acessórios)
   - Foto do documento (CNH ou RG - frente e verso)
   - Certidão de antecedentes criminais

   **Seção 2: Informações Pessoais e Endereço**
   - RG
   - Estado
   - Cidade
   - CEP
   - Bairro
   - Logradouro
   - Número
   - Complemento

   **Seção 3: Região de Interesse e Serviços**
   - Estado onde quer trabalhar
   - Cidade onde quer trabalhar
   - Categorias de serviço (eletricista, encanador, pedreiro, pintor, carpinteiro, mecânico, jardineiro, limpeza, consultoria, etc.)

   **Seção 4: Experiência e Referências**
   - Certificados de experiência (carteira de trabalho, cartas de recomendação)
   - Referências: nome, telefone e telefone alternativo (pode adicionar múltiplas)

   **Seção 5: Dados Fiscais e Bancários**
   - Cartão CNPJ ou comprovante MEI
   - Razão social
   - CNPJ
   - Tipo de conta (PF ou PJ)
   - PIX: tipo de chave e chave
   - Banco: nome, agência, conta
   - Titular: nome e documento

2. **VALIDAÇÃO INTELIGENTE** - Valide todos os dados em tempo real:
   - CPF: 11 dígitos, formato XXX.XXX.XXX-XX
   - CNPJ: 14 dígitos, formato XX.XXX.XXX/XXXX-XX
   - CEP: 8 dígitos, formato XXXXX-XXX
   - RG: apenas números
   - Telefone: formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
   - E-mail: formato válido com @ e domínio
   - PIX: validar conforme tipo (CPF, CNPJ, e-mail, telefone, chave aleatória)
   - Agência e Conta: apenas números e hífen

   **QUANDO DETECTAR ERRO:** Explique gentilmente o formato correto e por que é importante.

3. **SUPORTE EDUCACIONAL** - Responda perguntas sobre documentos:
   - O que é cada documento
   - Como obter (especialmente certidão de antecedentes criminais online)
   - Por que é necessário para o cadastro
   - Requisitos específicos de fotos

4. **TOM E ESTILO:**
   - Seja amigável, paciente e profissional
   - Use uma linguagem clara e acessível
   - Confirme cada informação recebida antes de prosseguir
   - Celebre o progresso do usuário
   - Mantenha conversas naturais, não robotizadas
   - Seja empático com dúvidas e dificuldades

5. **GERENCIAMENTO DE ARQUIVOS:**
   - Oriente sobre uploads de documentos
   - Confirme quando arquivos forem enviados
   - Permita que o usuário revise e altere nomes de arquivos

**IMPORTANTE:** 
- Colete UMA informação por vez para não sobrecarregar o usuário
- Sempre valide o formato antes de aceitar
- Se o usuário perguntar algo fora do contexto, responda educadamente e retorne ao fluxo
- Ao final, peça para o usuário revisar todos os dados antes de finalizar

Responda SEMPRE em português brasileiro com linguagem natural e amigável.`;

    try {
      // Preparar o prompt com histórico
      const conversationText = history
        .map((m) => `${m.role === 'user' ? 'Usuário' : 'Iamanos'}: ${m.content}`)
        .join('\n');

      const fullPrompt = `${systemPrompt}\n\n--- HISTÓRICO DA CONVERSA ---\n${conversationText}\n\n--- INSTRUÇÃO ---\nCom base no histórico acima, responda de forma natural e contextual à última mensagem do usuário. Continue o fluxo de cadastro de forma sequencial e valide os dados fornecidos.`;

      let assistantMessage = '';

      try {
        const response = await axios.post(
          `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
          {
            contents: [
              {
                role: 'user',
                parts: [{ text: fullPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        assistantMessage =
          response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          'Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?';
      } catch (apiError: any) {
        console.error('Erro ao chamar Gemini API:', apiError.response?.data || apiError.message);
        
        // FALLBACK: Respostas simuladas quando a API falha
        if (apiError.response?.data?.error?.code === 429) {
          console.log('⚠️ Usando modo FALLBACK - Quota da API excedida');
          assistantMessage = this.generateFallbackResponse(message, history, provider);
        } else {
          throw apiError;
        }
      }

      // Adicionar resposta da IA ao histórico
      history.push({
        role: 'assistant',
        content: assistantMessage,
      });

      // Extrair dados estruturados da mensagem do usuário
      const extractedData = this.extractStructuredData(message);

      // Se dados foram extraídos, atualizar o provider no banco
      if (Object.keys(extractedData).length > 0) {
        await this.prisma.provider.update({
          where: { id: userId },
          data: extractedData,
        });
        console.log('✅ Dados atualizados no banco:', extractedData);
        
        // Rebuscar o provider atualizado para verificações futuras
        const updatedProvider = await this.prisma.provider.findUnique({
          where: { id: userId },
        });
        
        // Atualizar objeto provider local
        Object.assign(provider, updatedProvider);
      }

      return {
        response: assistantMessage,
        extractedData,
        conversationId,
      };
    } catch (error: any) {
      console.error('Erro ao processar mensagem:', error.response?.data || error.message);
      throw new BadRequestException('Erro ao processar mensagem. Tente novamente.');
    }
  }

  // Verificar se uma etapa foi completada baseado nos dados do provider
  private checkStageCompletion(provider: any): {
    etapa1: boolean;
    etapa2: boolean;
    etapa3: boolean;
    etapa4: boolean;
    etapa5: boolean;
  } {
    const completion = {
      etapa1: !!(provider.rg && provider.estado && provider.cidade && provider.cep),
      etapa2: !!(provider.estadoInteresse && provider.cidadeInteresse && provider.categorias),
      etapa3: !!(provider.referencias && provider.referencias.length >= 2),
      etapa4: !!(provider.pixTipo && provider.pixChave && provider.bancoNome && provider.agencia && provider.conta),
      etapa5: !!(provider.fotoPerfil && provider.fotoDocumento && provider.certidaoAntecedentes),
    };

    console.log('🔍 Verificação de completude:', {
      etapa1: { completa: completion.etapa1, campos: { rg: provider.rg, estado: provider.estado, cidade: provider.cidade, cep: provider.cep } },
      etapa2: { completa: completion.etapa2, campos: { estadoInteresse: provider.estadoInteresse, cidadeInteresse: provider.cidadeInteresse, categorias: provider.categorias } },
      etapa3: { completa: completion.etapa3, campos: { referencias: provider.referencias } },
      etapa4: { completa: completion.etapa4, campos: { pixTipo: provider.pixTipo, pixChave: provider.pixChave, bancoNome: provider.bancoNome } },
      etapa5: { completa: completion.etapa5, campos: { fotoPerfil: provider.fotoPerfil, fotoDocumento: provider.fotoDocumento } },
    });

    return completion;
  }

  // Método de fallback para quando a API do Gemini não está disponível
  private generateFallbackResponse(message: string, history: ConversationMessage[], provider: any): string {
    const lowerMessage = message.toLowerCase();
    const historyLength = history.filter(h => h.role === 'user').length;
    const historyText = history.map(h => h.content.toLowerCase()).join(' ');
    
    // Verificar completude de cada etapa
    const completion = this.checkStageCompletion(provider);

    // Detectar solicitação explícita de etapa - mas verificar se pode ir para ela
    if (/etapa\s*2|região|categorias|serviços|trabalhar onde/i.test(message) && !(/eletricista|encanador|pedreiro/i.test(message))) {
      if (!completion.etapa1) {
        return '⚠️ **Ops!** Você ainda precisa completar a **ETAPA 1** antes.\n\n📋 Preciso das suas informações pessoais:\n- RG\n- Estado e Cidade\n- CEP\n- Bairro, Logradouro e Número\n\nPor favor, me envie esses dados primeiro! 😊';
      }
      return '✅ Entendido! Vamos para a **ETAPA 2**.\n\n🗺️ **ETAPA 2: Região de Interesse e Serviços**\n\nAgora preciso saber:\n\n1. Em qual **Estado** e **Cidade** você deseja trabalhar? (pode ser diferente do seu endereço)\n2. Qual(is) **categoria(s) de serviço** você oferece?\n\n**Categorias disponíveis:**\n- Eletricista\n- Encanador\n- Pedreiro\n- Pintor\n- Carpinteiro\n- Mecânico\n- Jardineiro\n- Limpeza\n- Consultoria\n\nExemplo: "Quero trabalhar em SP, São Paulo. Sou eletricista e encanador"';
    }

    if (/etapa\s*3|referências|experiência|contatos/i.test(message) && !(/\(\d{2}\)\s?\d{4,5}-?\d{4}/i.test(message))) {
      if (!completion.etapa1 || !completion.etapa2) {
        const missing = [];
        if (!completion.etapa1) missing.push('**ETAPA 1** (Informações Pessoais)');
        if (!completion.etapa2) missing.push('**ETAPA 2** (Região e Serviços)');
        return `⚠️ **Ops!** Você ainda precisa completar:\n\n${missing.join('\n')}\n\nPor favor, complete as etapas anteriores primeiro! 😊`;
      }
      return '✅ Ok! Vamos para a **ETAPA 3**.\n\n📜 **ETAPA 3: Experiência e Referências**\n\nPara validar seu perfil, preciso de **referências profissionais** (obrigatório - mínimo 2):\n\n- Nome completo\n- Telefone de contato\n- Telefone alternativo (opcional)\n\nExemplo: "João Silva (11) 98765-4321, Maria Santos (21) 91234-5678"\n\n💡 Se tiver certificados de experiência, poderá enviá-los na última etapa.';
    }

    if (/etapa\s*4|dados fiscais|bancários|pix|cnpj/i.test(message) && !(/\d{2}\.\d{3}\.\d{3}\/\d{4}/i.test(message))) {
      if (!completion.etapa1 || !completion.etapa2 || !completion.etapa3) {
        const missing = [];
        if (!completion.etapa1) missing.push('**ETAPA 1** (Informações Pessoais)');
        if (!completion.etapa2) missing.push('**ETAPA 2** (Região e Serviços)');
        if (!completion.etapa3) missing.push('**ETAPA 3** (Referências)');
        return `⚠️ **Ops!** Você ainda precisa completar:\n\n${missing.join('\n')}\n\nPor favor, complete as etapas anteriores primeiro! 😊`;
      }
      return '✅ Perfeito! Vamos para a **ETAPA 4**.\n\n💰 **ETAPA 4: Dados Fiscais e Bancários**\n\nPreciso dos seus dados para recebimento:\n\n**Se você é MEI ou tem CNPJ:**\n- Razão Social\n- CNPJ\n- Tipo de conta: PF ou PJ\n\n**Dados bancários (obrigatório):**\n- Tipo de chave PIX (CPF, CNPJ, E-mail, Telefone ou Aleatória)\n- Chave PIX\n- Nome do Banco\n- Agência\n- Conta\n- Nome do Titular\n- Documento do Titular (CPF ou CNPJ)\n\n📌 Os dados de recebimento devem ser PF ou PJ, não pode misturar!\n\nExemplo: "CNPJ: 12.345.678/0001-90, Razão: João Silva MEI, Tipo: PF, PIX: CPF 123.456.789-01, Banco: Itaú, Agência: 1234, Conta: 56789-0, Titular: João Silva, Doc: 123.456.789-01"';
    }

    if (/etapa\s*5|documentos|fotos|upload|enviar arquivos/i.test(message) && !(/enviado|enviei/i.test(message))) {
      if (!completion.etapa1 || !completion.etapa2 || !completion.etapa3 || !completion.etapa4) {
        const missing = [];
        if (!completion.etapa1) missing.push('**ETAPA 1** (Informações Pessoais)');
        if (!completion.etapa2) missing.push('**ETAPA 2** (Região e Serviços)');
        if (!completion.etapa3) missing.push('**ETAPA 3** (Referências)');
        if (!completion.etapa4) missing.push('**ETAPA 4** (Dados Fiscais)');
        return `⚠️ **Ops!** Você ainda precisa completar:\n\n${missing.join('\n')}\n\nPor favor, complete as etapas anteriores primeiro! 😊`;
      }
      return '✅ Ótimo! Vamos para a **ETAPA 5 (FINAL)**.\n\n📸 **ETAPA 5: Fotos e Documentos (FINAL)**\n\nAgora só falta enviar os documentos obrigatórios:\n\n1. **Foto de Perfil**\n   - Fundo claro\n   - Camisa escura sem estampa\n   - Olhando para câmera\n   - Braços cruzados\n   - Sem acessórios\n\n2. **Foto do Documento** (CNH ou RG - frente e verso)\n\n3. **Certidão de Antecedentes Criminais**\n\n4. **Cartão CNPJ ou Comprovante MEI** (se aplicável)\n\n5. **Certificados de Experiência** (opcional - carteira de trabalho, cartas de recomendação)\n\n💡 **Como enviar:**\nFaça upload em /upload/single ou /upload/multiple e depois me confirme: "Documentos enviados"';
    }

    // Sempre permitir voltar para Etapa 1
    if (/etapa\s*1|informações pessoais|começar|reiniciar|rg\s*\?|endereço\s*\?/i.test(message)) {
      return '👋 Claro! Vamos para a **ETAPA 1**.\n\n📋 **ETAPA 1: Informações Pessoais e Endereço**\n\nPara começar, preciso de:\n\n1. Número do seu **RG**\n2. **Estado** e **Cidade** onde você mora\n3. **CEP**\n4. **Bairro**, **Logradouro** e **Número**\n\nExemplo: "RG: 123456789, Estado: SP, Cidade: São Paulo, CEP: 01310-100, Bairro: Bela Vista, Rua: Av Paulista, Número: 1000"\n\nPode me enviar tudo em uma única mensagem! 😊';
    }

    // ETAPA 1: Primeira interação - Sol - VERIFICAR SE TUDO FOI COMPLETO
    if ((historyText.includes('upload') || historyText.includes('documento') || historyText.includes('foto') || historyText.includes('enviei') || historyText.includes('enviado')) && historyLength > 5) {
      // Verificar se TODAS as etapas foram completadas
      const allComplete = completion.etapa1 && completion.etapa2 && completion.etapa3 && completion.etapa4 && completion.etapa5;
      
      if (!allComplete) {
        const missing = [];
        if (!completion.etapa1) missing.push('❌ **ETAPA 1** - Informações Pessoais');
        if (!completion.etapa2) missing.push('❌ **ETAPA 2** - Região e Serviços');
        if (!completion.etapa3) missing.push('❌ **ETAPA 3** - Referências');
        if (!completion.etapa4) missing.push('❌ **ETAPA 4** - Dados Fiscais');
        if (!completion.etapa5) missing.push('❌ **ETAPA 5** - Documentos');
        
        return `⚠️ **Quase lá!** Mas ainda faltam algumas etapas:\n\n${missing.join('\n')}\n\n**Completadas:**\n${completion.etapa1 ? '✅ ETAPA 1\n' : ''}${completion.etapa2 ? '✅ ETAPA 2\n' : ''}${completion.etapa3 ? '✅ ETAPA 3\n' : ''}${completion.etapa4 ? '✅ ETAPA 4\n' : ''}${completion.etapa5 ? '✅ ETAPA 5\n' : ''}\nPor favor, complete as etapas pendentes para finalizar seu cadastro! 😊`;
      }
      
      return '👋 Olá! Sou a **Iamanos**, sua assistente de cadastro da IguanaFix!\n\nVejo que você já completou seu cadastro básico. Agora vamos finalizar seu perfil profissional seguindo algumas etapas simples.\n\n📋 **ETAPA 1: Informações Pessoais e Endereço**\n\nPara começar, preciso de:\n\n1. Número do seu **RG**\n2. **Estado** e **Cidade** onde você mora\n3. **CEP**\n4. **Bairro**, **Logradouro** e **Número**\n\nExemplo: "RG: 123456789, Estado: SP, Cidade: São Paulo, CEP: 01310-100, Bairro: Bela Vista, Rua: Av Paulista, Número: 1000"\n\nPode me enviar tudo em uma única mensagem! 😊';
    }

    // ETAPA 2: Após RG/Endereço, solicitar região de interesse e categorias
    if ((/rg|identidade|\d{7,9}|cep|\d{5}-?\d{3}|estado|cidade|sp|rj|mg|bairro|rua|avenida/i.test(message)) && !historyText.includes('categoria') && !historyText.includes('eletricista')) {
      return `✅ Perfeito! Informações pessoais registradas.\n\n🗺️ **ETAPA 2: Região de Interesse e Serviços**\n\nAgora preciso saber:\n\n1. Em qual **Estado** e **Cidade** você deseja trabalhar? (pode ser diferente do seu endereço)\n2. Qual(is) **categoria(s) de serviço** você oferece?\n\n**Categorias disponíveis:**\n- Eletricista\n- Encanador\n- Pedreiro\n- Pintor\n- Carpinteiro\n- Mecânico\n- Jardineiro\n- Limpeza\n- Consultoria\n\nExemplo: "Quero trabalhar em SP, São Paulo. Sou eletricista e encanador"`;
    }

    // ETAPA 3: Após categorias, solicitar experiência e referências
    if (/eletricista|encanador|pedreiro|pintor|carpinteiro|mecânico|jardineiro|limpeza|consultoria/i.test(message) && !historyText.includes('referência')) {
      return `✅ Excelente! Categoria(s) anotada(s).\n\n📜 **ETAPA 3: Experiência e Referências**\n\nPara validar seu perfil, preciso de **referências profissionais** (obrigatório - mínimo 2):\n\n- Nome completo\n- Telefone de contato\n- Telefone alternativo (opcional)\n\nExemplo: "João Silva (11) 98765-4321, Maria Santos (21) 91234-5678"\n\n💡 Se tiver certificados de experiência, poderá enviá-los na última etapa.`;
    }

    // ETAPA 4: Após referências, solicitar dados fiscais
    if ((/\(\d{2}\)\s?\d{4,5}-?\d{4}|referência|contato/i.test(message)) && !historyText.includes('cnpj') && !historyText.includes('pix')) {
      return `✅ Referências registradas com sucesso!\n\n💰 **ETAPA 4: Dados Fiscais e Bancários**\n\nPreciso dos seus dados para recebimento:\n\n**Se você é MEI ou tem CNPJ:**\n- Razão Social\n- CNPJ\n- Tipo de conta: PF ou PJ\n\n**Dados bancários (obrigatório):**\n- Tipo de chave PIX (CPF, CNPJ, E-mail, Telefone ou Aleatória)\n- Chave PIX\n- Nome do Banco\n- Agência\n- Conta\n- Nome do Titular\n- Documento do Titular (CPF ou CNPJ)\n\n📌 Os dados de recebimento devem ser PF ou PJ, não pode misturar!\n\nExemplo: "CNPJ: 12.345.678/0001-90, Razão: João Silva MEI, Tipo: PF, PIX: CPF 123.456.789-01, Banco: Itaú, Agência: 1234, Conta: 56789-0, Titular: João Silva, Doc: 123.456.789-01"`;
    }

    // ETAPA 5 (FINAL): Após dados bancários, solicitar uploads
    if ((/cnpj|mei|\d{2}\.\d{3}\.\d{3}\/\d{4}|pix|banco|agência|conta|titular/i.test(message)) && !historyText.includes('upload') && !historyText.includes('documento enviado')) {
      return `✅ Dados fiscais registrados com sucesso!\n\n📸 **ETAPA 5: Fotos e Documentos (FINAL)**\n\nAgora só falta enviar os documentos obrigatórios:\n\n1. **Foto de Perfil**\n   - Fundo claro\n   - Camisa escura sem estampa\n   - Olhando para câmera\n   - Braços cruzados\n   - Sem acessórios\n\n2. **Foto do Documento** (CNH ou RG - frente e verso)\n\n3. **Certidão de Antecedentes Criminais**\n\n4. **Cartão CNPJ ou Comprovante MEI** (se aplicável)\n\n5. **Certificados de Experiência** (opcional - carteira de trabalho, cartas de recomendação)\n\n💡 **Como enviar:**\nFaça upload em /upload/single ou /upload/multiple e depois me confirme: "Documentos enviados"`;
    }

    // CONCLUSÃO: Após confirmar uploads
    if ((historyText.includes('upload') || historyText.includes('documento') || historyText.includes('foto') || historyText.includes('enviei') || historyText.includes('enviado')) && historyLength > 5) {
      return `🎉 **PARABÉNS! Cadastro Completo!**\n\nTodos os seus dados foram registrados com sucesso. ✅\n\nSeu perfil será analisado pela nossa equipe e você receberá uma notificação em breve.\n\n📋 **Resumo:**\n- ✅ Informações Pessoais: Completas\n- ✅ Região de Atuação: Definida\n- ✅ Experiência: Registrada\n- ✅ Dados Bancários: Configurados\n- ✅ Documentos: Enviados\n\n**Status:** Aguardando Aprovação\n\nSe precisar alterar alguma informação, entre em contato com nosso suporte. Obrigada! 🙏`;
    }

    // Perguntas sobre documentos
    if (/o que é|como obter|certidão|antecedentes|onde|como faço/i.test(message)) {
      return `📄 **Sobre Documentos:**\n\n**Certidão de Antecedentes Criminais:**\nDocumento que comprova ausência de registros criminais.\n✅ Como obter: https://www.gov.br/pt-br/servicos/emitir-certidao-de-antecedentes-criminais\n(Gratuito, com conta gov.br)\n\n**Comprovante MEI:**\n✅ Acesse: https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/quero-ser-mei\n\n**Upload de Documentos:**\nO frontend deve fazer upload em /upload/single e te retornar uma URL. Depois é só me confirmar!\n\nPrecisa de mais ajuda?`;
    }

    // Resposta genérica contextual
    return `Entendi! 😊\n\nEstou aqui para ajudar. Pode me dar mais detalhes ou me dizer em qual etapa você está?\n\n**Etapas do cadastro:**\n1. ✅ Cadastro básico (já completo)\n2. 📋 Informações pessoais e endereço\n3. 🗺️ Região e serviços\n4. 📜 Experiência e referências\n5. 💰 Dados fiscais\n6. 📸 Documentos e fotos\n\nQual informação você gostaria de fornecer agora?`;
  }

  // Validação inteligente de dados com Gemini
  async validateField(fieldName: string, value: string): Promise<{ valid: boolean; message: string }> {
    if (!this.geminiApiKey) {
      throw new BadRequestException('Gemini API key não configurada');
    }

    const validationPrompt = `Você é um validador de dados especializado.

Campo: ${fieldName}
Valor fornecido: ${value}

Regras de validação:
- CPF: 11 dígitos, formato XXX.XXX.XXX-XX ou apenas números
- CNPJ: 14 dígitos, formato XX.XXX.XXX/XXXX-XX ou apenas números
- CEP: 8 dígitos, formato XXXXX-XXX ou apenas números
- RG: apenas números, mínimo 7 dígitos
- Telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
- E-mail: formato válido
- PIX (CPF): formato de CPF
- PIX (CNPJ): formato de CNPJ
- PIX (E-mail): formato de e-mail
- PIX (Telefone): formato de telefone
- Agência: apenas números, até 4 dígitos
- Conta: números e hífen

Analise se o valor está no formato correto. Responda APENAS em JSON:
{
  "valid": true ou false,
  "message": "Mensagem amigável explicando o problema (se houver) ou confirmando que está correto"
}`;

    try {
      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: validationPrompt }],
            },
          ],
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{"valid": false, "message": "Erro na validação"}';
      
      // Extrair JSON da resposta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { valid: false, message: 'Não foi possível validar o campo' };
    } catch (error) {
      console.error('Erro na validação:', error);
      return { valid: true, message: 'Validação não disponível' }; // Permitir prosseguir em caso de erro
    }
  }

  // Extrair dados estruturados da mensagem
  private extractStructuredData(message: string): Record<string, any> {
    const data: Record<string, any> = {};

    // CPF
    const cpfMatch = message.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/);
    if (cpfMatch) {
      data.cpf = cpfMatch[0].replace(/\D/g, '');
    }

    // CNPJ
    const cnpjMatch = message.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
    if (cnpjMatch) {
      data.cnpj = cnpjMatch[0].replace(/\D/g, '');
    }

    // CEP
    const cepMatch = message.match(/\b\d{5}-?\d{3}\b/);
    if (cepMatch) {
      data.cep = cepMatch[0].replace(/\D/g, '');
    }

    // E-mail
    const emailMatch = message.match(/\b[\w.-]+@[\w.-]+\.\w+\b/);
    if (emailMatch) {
      data.email = emailMatch[0];
    }

    // Telefone
    const phoneMatch = message.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g);
    if (phoneMatch && phoneMatch.length > 0) {
      // Se tem múltiplos telefones, são referências
      if (phoneMatch.length >= 2) {
        data.referencias = JSON.stringify(phoneMatch.map(tel => ({ telefone: tel })));
      } else {
        data.telefone = phoneMatch[0];
      }
    }

    // RG
    const rgMatch = message.match(/\bRG:?\s*(\d+)/i);
    if (rgMatch) {
      data.rg = rgMatch[1];
    }

    // Estado (buscar padrões como "Estado: SP" ou "SP" isolado)
    const estadoMatch = message.match(/\bEstado:?\s*([A-Z]{2})\b/i) || message.match(/\b(SP|RJ|MG|ES|PR|SC|RS|BA|SE|AL|PE|PB|RN|CE|PI|MA|PA|AP|RR|AM|AC|RO|MT|MS|GO|DF|TO)\b/);
    if (estadoMatch) {
      data.estado = estadoMatch[1].toUpperCase();
    }

    // Cidade
    const cidadeMatch = message.match(/\bCidade:?\s*([^,\n]+?)(?=,|\.|;|$)/i);
    if (cidadeMatch) {
      data.cidade = cidadeMatch[1].trim();
    }

    // Bairro
    const bairroMatch = message.match(/\bBairro:?\s*([^,\n]+?)(?=,|\.|;|$)/i);
    if (bairroMatch) {
      data.bairro = bairroMatch[1].trim();
    }

    // Logradouro (Rua/Av)
    const logradouroMatch = message.match(/\b(?:Rua|Avenida|Av):?\s*([^,\n]+?)(?=,|\.|;|Número|$)/i);
    if (logradouroMatch) {
      data.logradouro = logradouroMatch[0].trim();
    }

    // Número
    const numeroMatch = message.match(/\bNúmero:?\s*(\d+)/i) || message.match(/\bn[°º]:?\s*(\d+)/i);
    if (numeroMatch) {
      data.numero = numeroMatch[1];
    }

    // Complemento
    const complementoMatch = message.match(/\bComplemento:?\s*([^,\n]+?)(?=,|\.|;|$)/i);
    if (complementoMatch) {
      data.complemento = complementoMatch[1].trim();
    }

    // Categorias de serviço
    const categorias = [];
    if (/eletricista/i.test(message)) categorias.push('Eletricista');
    if (/encanador/i.test(message)) categorias.push('Encanador');
    if (/pedreiro/i.test(message)) categorias.push('Pedreiro');
    if (/pintor/i.test(message)) categorias.push('Pintor');
    if (/carpinteiro|marceneiro/i.test(message)) categorias.push('Carpinteiro');
    if (/mecânico/i.test(message)) categorias.push('Mecânico');
    if (/jardineiro/i.test(message)) categorias.push('Jardineiro');
    if (/limpeza/i.test(message)) categorias.push('Limpeza');
    if (/consultoria/i.test(message)) categorias.push('Consultoria');
    
    if (categorias.length > 0) {
      data.categorias = JSON.stringify(categorias);
    }

    // Estado e Cidade de interesse (trabalhar em)
    const trabalharMatch = message.match(/\btrabalhar\s+em\s+([A-Z]{2})[,\s]+([^,.\n]+)/i);
    if (trabalharMatch) {
      data.estadoInteresse = trabalharMatch[1].toUpperCase();
      data.cidadeInteresse = trabalharMatch[2].trim();
    }

    // Dados bancários
    const pixTipoMatch = message.match(/\bPIX:?\s*(CPF|CNPJ|E-mail|Telefone|Aleatória)/i);
    if (pixTipoMatch) {
      data.pixTipo = pixTipoMatch[1];
    }

    const pixChaveMatch = message.match(/\bPIX:?\s*(?:CPF|CNPJ|E-mail|Telefone|Aleatória)?\s*([^\s,]+)/i);
    if (pixChaveMatch) {
      data.pixChave = pixChaveMatch[1];
    }

    const bancoMatch = message.match(/\bBanco:?\s*([^,\n]+?)(?=,|\.|;|Agência|$)/i);
    if (bancoMatch) {
      data.bancoNome = bancoMatch[1].trim();
    }

    const agenciaMatch = message.match(/\bAgência:?\s*(\d+)/i);
    if (agenciaMatch) {
      data.agencia = agenciaMatch[1];
    }

    const contaMatch = message.match(/\bConta:?\s*([\d-]+)/i);
    if (contaMatch) {
      data.conta = contaMatch[1];
    }

    const titularMatch = message.match(/\bTitular:?\s*([^,\n]+?)(?=,|\.|;|Doc|$)/i);
    if (titularMatch) {
      data.titularNome = titularMatch[1].trim();
    }

    const titularDocMatch = message.match(/\bDoc:?\s*([\d.-\/]+)/i);
    if (titularDocMatch) {
      data.titularDoc = titularDocMatch[1];
    }

    const razaoMatch = message.match(/\bRazão(?:\s+Social)?:?\s*([^,\n]+?)(?=,|\.|;|CNPJ|Tipo|$)/i);
    if (razaoMatch) {
      data.razaoSocial = razaoMatch[1].trim();
    }

    const tipoContaMatch = message.match(/\bTipo(?:\s+de\s+conta)?:?\s*(PF|PJ)/i);
    if (tipoContaMatch) {
      data.tipoConta = tipoContaMatch[1].toUpperCase();
    }

    return data;
  }

  // Atualizar dados do provider
  async updateProviderData(providerId: string, data: any) {
    try {
      const updated = await this.prisma.provider.update({
        where: { id: providerId },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      return updated;
    } catch (error) {
      console.error('Erro ao atualizar provider:', error);
      throw new BadRequestException('Erro ao salvar dados');
    }
  }

  // Resetar conversa
  resetConversation(userId?: string) {
    const conversationId = userId || 'default';
    this.conversationHistories.delete(conversationId);
  }

  // Obter histórico de conversa
  getConversationHistory(userId?: string) {
    const conversationId = userId || 'default';
    return this.conversationHistories.get(conversationId) || [];
  }
}
