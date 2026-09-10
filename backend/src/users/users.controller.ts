import { Controller, Get, Put, Post, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.userId);
  }

  @Put('me')
  async updateProfile(@Request() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user.userId, body);
  }

  @Put('me/password')
  async changePassword(@Request() req: any, @Body() body: any) {
    return this.usersService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
  }

  @Get('me/borrowings')
  async getBorrowings(@Request() req: any) {
    return this.usersService.getBorrowings(req.user.userId);
  }

  @Get('me/favorites')
  async getFavorites(@Request() req: any) {
    return this.usersService.getFavorites(req.user.userId);
  }

  @Post('me/favorites/:comicId')
  async addFavorite(@Request() req: any, @Param('comicId', ParseIntPipe) comicId: number) {
    return this.usersService.addFavorite(req.user.userId, comicId);
  }

  @Delete('me/favorites/:comicId')
  async removeFavorite(@Request() req: any, @Param('comicId', ParseIntPipe) comicId: number) {
    return this.usersService.removeFavorite(req.user.userId, comicId);
  }

  @Get('me/favorites/check/:comicId')
  async checkFavorite(@Request() req: any, @Param('comicId', ParseIntPipe) comicId: number) {
    return this.usersService.checkFavorite(req.user.userId, comicId);
  }
}
