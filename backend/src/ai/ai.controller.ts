import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service.js';
import { ChatRequestDto } from './dto/chat-request.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Req() req: any, @Body() dto: ChatRequestDto) {
    const userId = req.user?.userId || null;
    return this.aiService.chat(userId, dto);
  }

  @Get('quick-prompts')
  getQuickPrompts() {
    return this.aiService.getQuickPrompts();
  }

  @Get('dialogue-search')
  async searchDialogue(@Query('q') q: string) {
    return this.aiService.searchDialogue(q || '');
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getHistory(@Req() req: any) {
    return this.aiService.getHistory(req.user.userId);
  }
}
