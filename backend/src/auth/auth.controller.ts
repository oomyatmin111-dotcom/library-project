import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Get('demo-user')
  async getDemoUser() {
    const user = await this.authService.getDemoUser();
    return {
      userId: user?.userId ?? 2,
      email: user?.email ?? 'member@comics.com',
      name: user ? `${user.firstName} ${user.lastName}` : 'Comic Fan',
      roleId: user?.roleId ?? 3,
    };
  }
}
