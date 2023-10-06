import { UserType } from 'src/user/types/user.types';

// ما داخل پروفایل به تمامی موارد داخل یوزر احتیاج داشتیم و یه فالویینگ کم داشتیم که به اینصورت اومدیم از موارد یوزر استفاده کردیم و فالویینگ رو اضافه کردیم

export type ProfileType = UserType & { following: boolean };
