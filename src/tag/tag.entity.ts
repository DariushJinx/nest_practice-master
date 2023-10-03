import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// ساخت جدول(تیبل)

@Entity({ name: 'tags' })
export class TagEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
