import { ArticleType } from './article.type';

// یه اینترفیس برای برگردوندن تمامی مقاله ها مینویسیم
export interface ArticlesResponseInterface {
  articles: ArticleType[];
  articleCount: number;
}
