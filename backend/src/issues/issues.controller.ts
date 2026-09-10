import { Controller, Get, Post, Param, Body, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { IssuesService } from './issues.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get(':id/export-cbz')
  async exportCbz(@Param('id') id: string, @Res() res: Response) {
    const { filename, buffer } = await this.issuesService.exportCbz(Number(id));
    res.setHeader('Content-Type', 'application/vnd.comicbook+zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }

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
