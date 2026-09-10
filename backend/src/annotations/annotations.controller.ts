import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AnnotationsService } from './annotations.service.js';
import { CreateAnnotationDto } from './dto/create-annotation.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('annotations')
@UseGuards(JwtAuthGuard)
export class AnnotationsController {
  constructor(private readonly annotationsService: AnnotationsService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateAnnotationDto) {
    return this.annotationsService.create(req.user.userId, dto);
  }

  @Get('issue/:issueId')
  async getByIssue(
    @Request() req: any,
    @Param('issueId', ParseIntPipe) issueId: number,
  ) {
    return this.annotationsService.findByIssue(req.user.userId, issueId);
  }

  @Get('my')
  async getMy(@Request() req: any) {
    return this.annotationsService.findByUser(req.user.userId);
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note: string,
    @Body('color') color?: string,
  ) {
    return this.annotationsService.update(req.user.userId, id, note, color);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.annotationsService.remove(req.user.userId, id);
  }
}
