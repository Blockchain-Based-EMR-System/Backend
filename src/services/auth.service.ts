import { PrismaClient } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { Service } from 'typedi';
import { SECRET_KEY, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY, ACCESS_TOKEN_EXPIRY } from '@config';
import { CompleteUserProfileDto, CreateUserDto, LoginUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, AccessTokenData, RefreshTokenData, TokenResponse } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import crypto from 'crypto';

@Service()
export class AuthService {
  public users = new PrismaClient().user;
  public refreshTokens = new PrismaClient().refreshToken;

  public async signup(userData: CreateUserDto): Promise<{ createdUserData:User; cookies: string[] }> {
    const findUserSameEmail: User = await this.users.findUnique({ where: { email: userData.email } });
    if (findUserSameEmail) throw new HttpException(409, `This email ${userData.email} already exists`);

    const emailHandle = userData.email.split('@')[0];
    const findUserSameUsername: User = await this.users.findUnique({ where: { username: emailHandle } });
    if (findUserSameUsername) throw new HttpException(409, `This username ${emailHandle} already exists`);

    const hashedPassword = await hash(userData.password, 10);
    const username = emailHandle;
    const { password, ...userDataWithoutPassword } = userData;
    const createdUserData: User = await this.users.create({
      data: {
        ...userDataWithoutPassword, username, password_hash: hashedPassword,
        phone: "", gender: "MALE", date_of_birth: new Date("2000-01-01")
      }
    });

    const tokenResponse = await this.createTokens(createdUserData, true);
    const cookies = this.createCookies(tokenResponse);

    return { createdUserData, cookies };
  }

  public async login(userData: LoginUserDto): Promise<{ cookies: string[]; findUser: User }> {
    const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
    if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    const isPasswordMatching: boolean = await compare(userData.password, findUser.password_hash);
    if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');

    const tokenResponse = await this.createTokens(findUser, userData.rememberMe);
    const cookies = this.createCookies(tokenResponse);

    return { cookies, findUser };
  }

  public async logout(userData: User): Promise<User> {
    const findUser: User = await this.users.findFirst({ where: { email: userData.email, password_hash: userData.password_hash } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    // Revoke all refresh tokens for this user
    await this.refreshTokens.updateMany({
      where: { user_id: findUser.id, is_revoked: false },
      data: { is_revoked: true, revoked_at: new Date() },
    });

    return findUser;
  }

  public async completeProfile(userData: User, profileData: CompleteUserProfileDto): Promise<User> {
    const findUser: User = await this.users.findUnique({ where: { id: userData.id } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    const updatedUserData: User = await this.users.update({
      where: { id: userData.id },
      data: {
        phone: profileData.phone,
        gender: profileData.gender,
        date_of_birth: new Date(profileData.date_of_birth),
      },
    });

    return updatedUserData;
  }


  public async createTokens(user: User, rememberMe: boolean = false): Promise<TokenResponse> {
    const accessToken = this.createAccessToken(user);

    if (rememberMe) {
      const refreshToken = await this.createRefreshToken(user);
      return { accessToken, refreshToken };
    }

    return { accessToken };
  }

  public createAccessToken(user: User): AccessTokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = this.parseTimeToSeconds(ACCESS_TOKEN_EXPIRY);

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public async createRefreshToken(user: User): Promise<RefreshTokenData> {
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = REFRESH_TOKEN_SECRET;
    const expiresIn: number = this.parseTimeToSeconds(REFRESH_TOKEN_EXPIRY);

    const token = sign(dataStoredInToken, secretKey, { expiresIn });

    // Hash the token before storing
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Store refresh token in database
    await this.refreshTokens.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + expiresIn * 1000),
      },
    });

    return { expiresIn, token };
  }

  public createCookies(tokenResponse: TokenResponse): string[] {
    const cookies: string[] = [];

    // Access token cookie
    cookies.push(`Authorization=${tokenResponse.accessToken.token}; HttpOnly; Max-Age=${tokenResponse.accessToken.expiresIn}; Path=/; SameSite=Strict`);

    // Refresh token cookie (if exists)
    if (tokenResponse.refreshToken) {
      cookies.push(`RefreshToken=${tokenResponse.refreshToken.token}; HttpOnly; Max-Age=${tokenResponse.refreshToken.expiresIn}; Path=/; SameSite=Strict`);
    }

    return cookies;
  }

  public async refreshAccessToken(refreshToken: string): Promise<{ cookies: string[]; user: User; accessToken: AccessTokenData }> {
    if (!refreshToken) throw new HttpException(401, 'Refresh token not provided');

    try {
      // Verify the refresh token
      const secretKey: string = REFRESH_TOKEN_SECRET;
      const decoded = verify(refreshToken, secretKey) as DataStoredInToken;

      // Hash the token to compare with stored hash
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Check if refresh token exists and is not revoked
      const storedToken = await this.refreshTokens.findFirst({
        where: {
          token_hash: tokenHash,
          user_id: decoded.id,
          is_revoked: false,
          expires_at: { gt: new Date() },
        },
      });

      if (!storedToken) throw new HttpException(401, 'Invalid or expired refresh token');

      // Get user
      const user = await this.users.findUnique({ where: { id: decoded.id } });
      if (!user) throw new HttpException(401, 'User not found');

      // Create new access token
      const accessToken = this.createAccessToken(user);
      const cookies = this.createCookies({ accessToken });

      return { cookies, user, accessToken };
    } catch (error) {
      throw new HttpException(401, 'Invalid refresh token');
    }
  }

  // public async revokeRefreshToken(refreshToken: string): Promise<void> {    
  //   const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  //   await this.refreshTokens.updateMany({
  //     where: { token_hash: tokenHash, is_revoked: false },
  //     data: { is_revoked: true, revoked_at: new Date() },
  //   });
  // }

  private parseTimeToSeconds(timeString: string): number {
    const unit = timeString.slice(-1);
    const value = parseInt(timeString.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 3600; // Default 1 hour
    }
  }

  // Keep old methods for backward compatibility
  public createToken(user: User): AccessTokenData {
    return this.createAccessToken(user);
  }

  public createCookie(tokenData: AccessTokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}
