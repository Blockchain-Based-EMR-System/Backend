import { PrismaClient } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { Service } from 'typedi';
import { SECRET_KEY, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY, ACCESS_TOKEN_EXPIRY, FRONTEND_URL, SENDER_EMAIL } from '@config';
import { CompleteUserProfileDto, CreateUserDto, LoginUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, AccessTokenData, RefreshTokenData, TokenResponse, RequestWithUser } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { transporter } from '@/utils/nodeMailerService';
import crypto from 'crypto';

@Service()
export class AuthService {
  public users = new PrismaClient().user;
  public refreshTokens = new PrismaClient().refreshToken;

  public async signup(userData: CreateUserDto): Promise<{ createdUserData: User; cookies: string[] }> {
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

  public async sendEmailOtp(email: string): Promise<void> {

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const userInfo: Partial<User> = await this.users.update({
      where: { email },
      data: {
        email_OTP: otp,
        email_OTP_expires_at: expiryDate,
      },
      select: { email: true }
    });

    const mailOptions = {
      from: SENDER_EMAIL,
      to: userInfo.email,
      subject: 'Your Email Verification Code',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="text-align: center; color: #333;">Email Verification</h2>
        <p style="font-size: 16px;">Hi there,</p>
        <p style="font-size: 16px;">Thank you for registering. Please use the following code to verify your email address:</p>
        <p style="font-size: 24px; text-align: center; font-weight: bold; letter-spacing: 3px; margin: 25px 0; padding: 10px; background-color: #f4f4f4; border-radius: 5px;">
          ${otp}
        </p>
        <p style="font-size: 16px;">This code will expire in 10 minutes.</p>
        <p style="font-size: 16px;">If you did not request this, please ignore this email.</p>
      </div>
    `
    };

    await transporter.sendMail(mailOptions);
  }

  public async getUserEmail(req: RequestWithUser): Promise<string> {
    const email = await this.users.findUnique({
      where: { id: req.user.id },
      select: { email: true }
    });
    if (!email) throw new HttpException(404, "User email not found");
    return email.email;
  }

  public async verifyEmailOtp(email: string, otp: string): Promise<Boolean> {
    const user = await this.users.findUnique({ where: { email } });
    if (!user) throw new HttpException(404, "User not found");

    if (user.email_OTP !== otp) {
      throw new HttpException(400, "Invalid OTP");
    }

    if (user.email_OTP_expires_at && user.email_OTP_expires_at < new Date()) {
      throw new HttpException(400, "OTP has expired");
    }

    // Clear OTP fields after successful verification
    await this.users.update({
      where: { email },
      data: {
        email_OTP: null,
        email_OTP_expires_at: null,
        isVerified: true,
      },
    });

    return true;
  }

  public async sendPasswordResetEmail(email: string): Promise<void> {
    const user = await this.users.findUnique({ where: { email } });
    if (!user) throw new HttpException(200, "Email will be sent if account exists");

    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.users.update({
      where: { email },
      data: {
        password_reset_token: resetPasswordToken,
        password_reset_token_expires_at: resetPasswordTokenExpiry,
      },
    });

    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetPasswordToken}`;
    const mailOptions = {
      from: SENDER_EMAIL,
      to: user.email,
      subject: 'Your Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
          <p>Please click the button below to reset your password:</p>
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Your Password
          </a>
          <p style="margin-top: 20px;">If you did not request this, please ignore this email. This link is valid for 10 minutes.</p>
        </div>
      `
    };
    await transporter.sendMail(mailOptions);
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.users.findFirst({
      where: {
        password_reset_token: token,
        password_reset_token_expires_at: { gt: new Date() },
      },
    });
    
    if (!user) throw new HttpException(400, "Invalid or expired password reset token");
    
    const hashedPassword = await hash(newPassword, 10);

    await this.users.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_token_expires_at: null,
      },
    });
  }
  

  // Keep old methods for backward compatibility
  public createToken(user: User): AccessTokenData {
    return this.createAccessToken(user);
  }

  public createCookie(tokenData: AccessTokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }
}
