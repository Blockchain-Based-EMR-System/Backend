import { PrismaClient } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { Service } from 'typedi';
import { SECRET_KEY } from '@config';
import { CreateUserDto, LoginUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';

@Service()
export class AuthService {
  public users = new PrismaClient().user;

  public async signup(userData: CreateUserDto): Promise<User> {
    const findUserSameEmail: User = await this.users.findUnique({ where: { email: userData.email  } });
    if (findUserSameEmail) throw new HttpException(409, `This email ${userData.email} already exists`);
    
    const emailHandle = userData.email.split('@')[0];
    const findUserSameUsername: User = await this.users.findUnique({ where: { username: emailHandle } });
    if (findUserSameUsername) throw new HttpException(409, `This username ${emailHandle} already exists`);

    const hashedPassword = await hash(userData.password, 10);
    const username = emailHandle;
    const { password, ...userDataWithoutPassword } = userData;
    const createUserData: Promise<User> = this.users.create({ data: { ...userDataWithoutPassword, username ,password_hash: hashedPassword } });

    return createUserData;
  }

  public async login(userData: LoginUserDto): Promise<{ cookie: string; findUser: User }> {
    const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
    if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    const isPasswordMatching: boolean = await compare(userData.password, findUser.password_hash);
    if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');

    const tokenData = this.createToken(findUser);
    const cookie = this.createCookie(tokenData);

    return { cookie, findUser };
  }

  public async logout(userData: User): Promise<User> {
    const findUser: User = await this.users.findFirst({ where: { email: userData.email, password_hash: userData.password_hash } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }

  public createToken(user: User): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60;

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}
