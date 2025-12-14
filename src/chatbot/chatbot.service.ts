import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ChatbotService {
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;
  private readonly geminiApiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  private conversationHistory: Array<{ role: string; content: string }> = [];

  async chat(message: string) {
    if (!this.geminiApiKey) {
      throw new BadRequestException('Gemini API key não configurada');
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: message,
    });

    // System prompt for the chatbot
    const systemPrompt = `Você é um assistente de IA para cadastro de prestadores de serviço. 
    Sua função é coletar informações do usuário de forma natural e conversacional.
    
    Informações a coletar:
    1. Nome completo
    2. Email
    3. CPF/CNPJ
    4. Área de atuação
    5. Senha (solicitar apenas uma vez, de forma segura)
    
    Responda em português brasileiro, seja amigável e profissional.
    Se o usuário fornecer uma informação, confirme que recebeu e passe para a próxima.
    
    Quando tiver coletado todas as informações, confirme e peça para o usuário revisar os dados.`;

    try {
      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemPrompt}\n\nHistórico da conversa:\n${this.conversationHistory
                    .map((m) => `${m.role}: ${m.content}`)
                    .join('\n')}\n\nResponda de forma natural e continue coletando dados.`,
                },
              ],
            },
          ],
        },
      );

      const assistantMessage =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'Desculpe, não consegui processar sua resposta.';

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      // Extract data from user message (simple pattern matching)
      const extractedData = this.extractData(message);

      return {
        response: assistantMessage,
        extractedData,
      };
    } catch (error) {
      console.error('Erro ao chamar Gemini API:', error);
      throw new BadRequestException('Erro ao processar mensagem com Gemini');
    }
  }

  private extractData(message: string): Record<string, string> {
    const data: Record<string, string> = {};

    // Simple pattern matching for common formats
    const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      data.email = emailMatch[0];
    }

    const cpfCnpjMatch = message.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
    if (cpfCnpjMatch) {
      data.cpfCnpj = cpfCnpjMatch[0].replace(/\D/g, '');
    }

    // Check for common professions/areas
    const areas = [
      'eletricista',
      'encanador',
      'pedreiro',
      'pintor',
      'carpinteiro',
      'mecânico',
      'jardineiro',
      'limpeza',
      'consultoria',
    ];
    for (const area of areas) {
      if (message.toLowerCase().includes(area)) {
        data.areaAtuacao = area;
        break;
      }
    }

    // Extract name (first capitalized word sequence)
    const nameMatch = message.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    if (nameMatch && !emailMatch && !cpfCnpjMatch) {
      data.nome = nameMatch[0];
    }

    return data;
  }

  resetConversation() {
    this.conversationHistory = [];
  }
}
