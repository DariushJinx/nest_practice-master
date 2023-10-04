import { ArticleEntity } from '../article.entity';

// یه اینترفیس برای برگردوندن تمامی مقاله ها مینویسیم
export interface ArticlesResponseInterface {
  articles: ArticleEntity[];
  articleCount: number;
}
