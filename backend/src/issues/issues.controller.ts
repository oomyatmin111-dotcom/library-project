import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { IssuesService } from './issues.service.js';

@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get(':id')
  async getIssue(@Param('id') id: string) {
    return this.issuesService.findByIssueId(Number(id));
  }

  @Post()
  async createIssue(@Body() body: any) {
    return this.issuesService.createIssue(body);
  }

  @Post(':id/pages')
  async addPages(@Param('id') id: string, @Body('imageUrls') imageUrls: string[]) {
    return this.issuesService.addPagesBulk(Number(id), imageUrls);
  }
}
