import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WalletService } from './wallet.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@Req() req: any) {
    return this.walletService.getWallet(req.user.userId);
  }

  @Post('topup')
  async topup(@Req() req: any, @Body('amount') amount: number) {
    return this.walletService.topup(req.user.userId, amount || 100);
  }

  @Post('unlock')
  async unlock(@Req() req: any, @Body('issueId') issueId: number) {
    return this.walletService.unlockChapter(req.user.userId, issueId);
  }

  @Post('upgrade-tier')
  async upgradeTier(
    @Req() req: any,
    @Body('tier') tier: 'GOLD_VIP' | 'PLATINUM_VIP',
  ) {
    return this.walletService.upgradeTier(req.user.userId, tier);
  }
}
