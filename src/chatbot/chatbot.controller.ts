import { Controller, Post, Body, UseGuards, Request, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(@Body() data: any, @Request() req: any) {
    console.log('Dados recebidos no chatbot:', JSON.stringify(data));
    console.log('Usuário autenticado:', req.user);
    
    // Aceita tanto { message: "..." } quanto apenas a string direta
    const message = data?.message || data?.text || (typeof data === 'string' ? data : '');
    
    if (!message || message.trim() === '') {
      console.log('Mensagem vazia ou inválida');
      return {
        response: 'Por favor, envie uma mensagem.',
        extractedData: {},
      };
    }

    const userId = req.user?.sub || req.user?.id;
    return this.chatbotService.chat(message, userId);
  }

  @Post('validate-field')
  @UseGuards(JwtAuthGuard)
  async validateField(@Body() data: { fieldName: string; value: string }) {
    return this.chatbotService.validateField(data.fieldName, data.value);
  }

  @Post('update-data')
  @UseGuards(JwtAuthGuard)
  async updateData(@Body() data: any, @Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    return this.chatbotService.updateProviderData(userId, data);
  }

  @Post('reset')
  @UseGuards(JwtAuthGuard)
  async resetConversation(@Request() req: any) {
    const userId = req.user?.sub || req.user?.id;
    this.chatbotService.resetConversation(userId);
    return { message: 'Conversa reiniciada com sucesso' };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Request() req: any): Promise<any> {
    const userId = req.user?.sub || req.user?.id;
    return this.chatbotService.getConversationHistory(userId);
  }
}
