import { Controller, Get } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagEntity } from './tag.entity';

@Controller('tags')
export class tagController {
  constructor(private readonly tagService: TagService) {}
  @Get('list')
  async findAll(): Promise<{ tags: TagEntity[] }> {
    const tags = await this.tagService.findAll();
    return {
      tags: tags,
    };
  }
}
