import { Role } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { Service } from 'typedi';
import { SECRET_KEY, REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRY, ACCESS_TOKEN_EXPIRY, FRONTEND_URL, SENDER_EMAIL } from '@config';
import { CompleteUserProfileDto, CreateUserDto, LoginUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, AccessTokenData, RefreshTokenData, TokenResponse, RequestWithUser } from '@interfaces/auth.interface';
import { UserLoginData, User } from '@interfaces/users.interface';
import { transporter } from '@/utils/nodeMailerService';
import { ErrorMessages, createBilingualError } from '@/utils/errorMessages';
import crypto from 'crypto';
import prisma from '@/config/prisma';

@Service()
export class AuthService {
  public users = prisma.user;
  public patients = prisma.patient;
  public refreshTokens = prisma.refreshToken;

  public async signup(userData: CreateUserDto): Promise<{ createdUserData: User; cookies: string[] }> {
    const findUserSameEmail: User = await this.users.findUnique({ where: { email: userData.email } });
    if (findUserSameEmail) {
      const error = createBilingualError(409, ErrorMessages.EMAIL_EXISTS);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    const emailHandle = userData.email.split('@')[0];
    const findUserSameUsername: User = await this.users.findUnique({ where: { username: emailHandle } });
    if (findUserSameUsername) {
      const error = createBilingualError(409, ErrorMessages.USERNAME_EXISTS);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    const hashedPassword = await hash(userData.password, 10);
    const username = emailHandle;
    const { password, ...userDataWithoutPassword } = userData;
    const createdUserData: User = await this.users.create({
      data: {
        ...userDataWithoutPassword, username, password_hash: hashedPassword,
        role: Role.PATIENT,
        gender: "MALE", date_of_birth: new Date("2000-01-01")
      }
    });

    await this.patients.create({
      data: {
        id: createdUserData.id,
        bc_address: '',
        consent: false,
      }
    });

    const tokenResponse = await this.createTokens(createdUserData, true);
    const cookies = this.createCookies(tokenResponse);

    return { createdUserData, cookies };
  }

  public async login(userData: LoginUserDto): Promise<{ cookies: string[]; findUser: UserLoginData }> {
    const findUser: User = await this.users.findFirst({
      where: {
        OR: [
          { email: userData.emailOrUsername },
          { username: userData.emailOrUsername }
        ]
      }
    });
    if (!findUser) {
      const error = createBilingualError(404, ErrorMessages.USER_NOT_FOUND_CREDENTIALS);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    const isPasswordMatching: boolean = await compare(userData.password, findUser.password_hash);
    if (!isPasswordMatching) {
      const error = createBilingualError(404, ErrorMessages.PASSWORD_NOT_MATCHING);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    const { name, gender, date_of_birth, email, isVerified, username, phone, role, hasCompletedProfile, doctor } = findUser;
    const patientLoginData: UserLoginData = {
      name,
      email,
      username,
      phone,
      gender,
      date_of_birth,
      role,
      isVerified,
      hasCompletedProfile,
      doctor: doctor ? {
        specialization: doctor.specialization,
        account_status: doctor.account_status
      } : undefined
    };

    const tokenResponse = await this.createTokens(findUser, userData.rememberMe);
    const cookies = this.createCookies(tokenResponse);

    return { cookies, findUser: patientLoginData };
  }

  public async logout(userData: User): Promise<User> {
    const findUser: User = await this.users.findFirst({ where: { email: userData.email, password_hash: userData.password_hash } });
    if (!findUser) {
      const error = createBilingualError(404, ErrorMessages.USER_NOT_EXIST);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    // Revoke all refresh tokens for this user
    await this.refreshTokens.updateMany({
      where: { user_id: findUser.id, is_revoked: false },
      data: { is_revoked: true, revoked_at: new Date() },
    });

    return findUser;
  }

  public async completeProfile(userData: User, profileData: CompleteUserProfileDto): Promise<User> {
    const findUser: User = await this.users.findUnique({ where: { id: userData.id } });
    if (!findUser) {
      const error = createBilingualError(404, ErrorMessages.USER_NOT_EXIST);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    const updatedUserData: User = await this.users.update({
      where: { id: userData.id },
      data: {
        gender: profileData.gender,
        date_of_birth: new Date(profileData.date_of_birth),
        hasCompletedProfile: true,
      },
    });

    return updatedUserData;
  }


  public async createTokens(user: Partial<User>, rememberMe: boolean = false): Promise<TokenResponse> {
    const accessToken = this.createAccessToken(user);

    if (rememberMe) {
      const refreshToken = await this.createRefreshToken(user);
      return { accessToken, refreshToken };
    }

    return { accessToken };
  }

  public createAccessToken(user: Partial<User>): AccessTokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = this.parseTimeToSeconds(ACCESS_TOKEN_EXPIRY);

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public async createRefreshToken(user: Partial<User>): Promise<RefreshTokenData> {
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
    cookies.push(`Authorization=${tokenResponse.accessToken.token}; HttpOnly; Max-Age=${tokenResponse.accessToken.expiresIn}; Path=/; SameSite=Lax`);

    // Refresh token cookie (if exists)
    if (tokenResponse.refreshToken) {
      cookies.push(`RefreshToken=${tokenResponse.refreshToken.token}; HttpOnly; Max-Age=${tokenResponse.refreshToken.expiresIn}; Path=/; SameSite=Lax`);
    }
    return cookies;
  }

  public async refreshAccessToken(refreshToken: string): Promise<{ cookies: string[]; user: User; accessToken: AccessTokenData }> {
    if (!refreshToken) {
      const error = createBilingualError(401, ErrorMessages.REFRESH_TOKEN_NOT_PROVIDED);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    // Verify the refresh token
    const secretKey: string = REFRESH_TOKEN_SECRET;
    let decoded: DataStoredInToken;
    
    try {
      decoded = verify(refreshToken, secretKey) as DataStoredInToken;
    } catch (error) {
      const err = createBilingualError(401, ErrorMessages.INVALID_REFRESH_TOKEN);
      throw new HttpException(err.status, err.message, err.messageAr);
    }

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

    if (!storedToken) {
      const error = createBilingualError(401, ErrorMessages.INVALID_REFRESH_TOKEN);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    // Get user
    const user = await this.users.findUnique({ 
      where: { id: decoded.id },
      include: { doctor: true } // Include doctor relation if needed
    });
    
    if (!user) {
      const error = createBilingualError(401, ErrorMessages.USER_NOT_EXIST);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    // Revoke the old refresh token (token rotation for security)
    await this.refreshTokens.update({
      where: { id: storedToken.id },
      data: { 
        is_revoked: true, 
        revoked_at: new Date() 
      }
    });

    // Create new access token
    const accessToken = this.createAccessToken(user);
    
    // Create new refresh token (token rotation)
    const newRefreshToken = await this.createRefreshToken(user);
    
    // Create cookies with both tokens
    const cookies = this.createCookies({ 
      accessToken,
      refreshToken: newRefreshToken
    });

    return { cookies, user, accessToken };
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
    if (!email) {
      const error = createBilingualError(404, ErrorMessages.USER_EMAIL_NOT_FOUND);
      throw new HttpException(error.status, error.message, error.messageAr);
    }
    return email.email;
  }

  public async verifyEmailOtp(email: string, otp: string): Promise<Boolean> {
    const user = await this.users.findUnique({ where: { email } });
    if (!user) {
      const error = createBilingualError(404, ErrorMessages.USER_NOT_EXIST);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    if (user.email_OTP !== otp) {
      const error = createBilingualError(400, ErrorMessages.INVALID_OTP);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    if (user.email_OTP_expires_at && user.email_OTP_expires_at < new Date()) {
      const error = createBilingualError(400, ErrorMessages.OTP_EXPIRED);
      throw new HttpException(error.status, error.message, error.messageAr);
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
    if (!user) {
      const error = createBilingualError(200, ErrorMessages.EMAIL_SENT_IF_EXISTS);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

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

    if (!user) {
      const error = createBilingualError(400, ErrorMessages.INVALID_PASSWORD_RESET_TOKEN);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

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
