import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CirculationService } from './circulation.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('circulation')
export class CirculationController {
  constructor(private readonly circulationService: CirculationService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'LIBRARIAN')
  @Post('checkout')
  async checkout(@Body() body: { barcode: string; memberIdentifier: string; durationDays?: number }, @Request() req: any) {
    const librarianId = req.user?.sub;
    return this.circulationService.checkout(body.barcode, body.memberIdentifier, body.durationDays, librarianId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'LIBRARIAN')
  @Post('checkin')
  async checkin(@Body() body: { barcode: string; conditionNote?: string }) {
    return this.circulationService.checkin(body.barcode, body.conditionNote);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'LIBRARIAN')
  @Get('loans')
  async getLoans(@Query('status') status?: string, @Query('search') search?: string, @Query('userId') userId?: number) {
    return this.circulationService.getLoans({ status, search, userId });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'LIBRARIAN')
  @Get('fines')
  async getFines(@Query('status') status?: string) {
    return this.circulationService.getFines(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'LIBRARIAN')
  @Post('fines/:id/pay')
  async payFine(@Param('id') id: string, @Body('amount') amount?: number) {
    return this.circulationService.payFine(Number(id), amount);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'LIBRARIAN')
  @Post('fines/:id/waive')
  async waiveFine(@Param('id') id: string, @Body('notes') notes?: string) {
    return this.circulationService.waiveFine(Number(id), notes);
  }

  @UseGuards(JwtAuthGuard)
  @Get('reservations')
  async getReservations(@Query('bookId') bookId?: number, @Query('userId') userId?: number) {
    return this.circulationService.getReservations(bookId ? Number(bookId) : undefined, userId ? Number(userId) : undefined);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reservations')
  async createReservation(@Body('bookId') bookId: number, @Request() req: any) {
    const userId = req.user.sub;
    return this.circulationService.createReservation(Number(bookId), userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('reservations/:id')
  async cancelReservation(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.role === 'ADMIN' ? undefined : req.user.sub;
    return this.circulationService.cancelReservation(Number(id), userId);
  }
}
