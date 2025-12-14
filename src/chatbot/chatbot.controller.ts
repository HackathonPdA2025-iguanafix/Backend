import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  @Post('chat')
  async chat(@Body() data: { message: string }) {
    if (!data.message) {
      return {
        response: 'Por favor, envie uma mensagem.',
        extractedData: {},
      };
    }

    return this.chatbotService.chat(data.message);
  }
}
