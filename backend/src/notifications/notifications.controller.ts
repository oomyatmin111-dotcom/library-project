import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@Request() req: any) {
    return this.notificationsService.getUserNotifications(req.user.userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    return this.notificationsService.getUnreadCount(req.user.userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.markAsRead(req.user.userId, id);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Post('sync-reminders')
  async syncReminders(@Request() req: any) {
    return this.notificationsService.checkLoanDueReminders(req.user.userId);
  }
}
