import { Module } from '@nestjs/common';
import { tagController } from './tag.controller';
import { TagService } from './tag.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagEntity } from './tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TagEntity])],
  controllers: [tagController],
  providers: [TagService],
})
export class TagModule {}
