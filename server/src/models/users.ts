import dbInstance from '@/database/pg';
import { InvalidCredentialsError } from '@/exceptions';
import { compare } from 'bcryptjs';

export default class UserModel extends dbInstance.BaseModel('users', 'id') {
  static async checkPassword(password: string, userId: number): Promise<void> {
    const user = await this.selectFrom().select(['password']).where('id', '=', userId).executeTakeFirst();
    if (!user?.password) {
      throw new InvalidCredentialsError('Email ou mot de passe incorrect !');
    }
    const isCorrectPassword = await compare(password, user.password);
    if (!isCorrectPassword) throw new InvalidCredentialsError('Email ou mot de passe incorrect !');
  }
}
