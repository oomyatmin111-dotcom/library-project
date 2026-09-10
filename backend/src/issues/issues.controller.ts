import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { IssuesService } from './issues.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get(':id')
  async getIssue(@Param('id') id: string) {
    return this.issuesService.findByIssueId(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'LIBRARIAN')
  async createIssue(@Body() body: any) {
    return this.issuesService.createIssue(body);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'LIBRARIAN')
  async createIssueBulk(@Body() body: any) {
    return this.issuesService.createIssueWithPages(body);
  }

  @Post(':id/pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'LIBRARIAN')
  async addPages(@Param('id') id: string, @Body('imageUrls') imageUrls: string[]) {
    return this.issuesService.addPagesBulk(Number(id), imageUrls);
  }
}
