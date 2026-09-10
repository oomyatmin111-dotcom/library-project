import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ComicsService } from './comics.service.js';

@Controller('comics')
export class ComicsController {
  constructor(private readonly comicsService: ComicsService) {}

  @Get()
  async findAll(
    @Query('universe') universe?: string,
    @Query('type') type?: string,
    @Query('popular') popular?: string,
    @Query('trending') trending?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: string,
  ) {
    return this.comicsService.findAll({ universe, type, popular, trending, search, status, sort } as any);
  }

  @Get('featured')
  async findFeatured() {
    return this.comicsService.findFeatured();
  }

  @Get('universes')
  async getUniverses() {
    return this.comicsService.getUniverses();
  }

  @Get(':idOrSlug/recommendations')
  async getRecommendations(@Param('idOrSlug') idOrSlug: string) {
    return this.comicsService.getRecommendations(idOrSlug);
  }

  @Get(':idOrSlug')
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.comicsService.findBySlugOrId(idOrSlug);
  }

  @Post()
  async create(@Body() body: any) {
    return this.comicsService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.comicsService.update(Number(id), body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.comicsService.remove(Number(id));
  }
}
