import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithUser } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { AuthService } from '@services/auth.service';
import { CompleteUserProfileDto, CreateUserDto, LoginUserDto, ResetPasswordDto } from '@/dtos/users.dto';
import { catchAsync } from '@/utils/catchAsync';
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { HttpException } from '@/exceptions/HttpException';

export class AuthController {
  public auth = Container.get(AuthService);

  public signUp = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userData: CreateUserDto = req.body;
    const { createdUserData, cookies } = await this.auth.signup(userData);

    res.setHeader('Set-Cookie', cookies);

    await this.auth.sendEmailOtp(userData.email);

    res.status(201).json({ data: createdUserData, message: 'Signed Up Successfully' });
  });

  public logIn = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userData: LoginUserDto = req.body;
    const { cookies, findUser } = await this.auth.login(userData);

    res.setHeader('Set-Cookie', cookies);
    res.status(200).json({ data: findUser, message: 'Logged In Successfully' });
  });

  public logOut = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    const userData: User = req.user;
    const logOutUserData: User = await this.auth.logout(userData);

    res.setHeader('Set-Cookie', [
      'Authorization=; HttpOnly; Max-Age=0; Path=/; SameSite=Lax',
      'RefreshToken=; HttpOnly; Max-Age=0; Path=/; SameSite=Lax'
    ]);

    res.status(200).json({ message: 'Logged Out Successfully' });
  });

  public refresh = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const refreshToken = req.cookies?.RefreshToken;
    const { cookies, user, accessToken } = await this.auth.refreshAccessToken(refreshToken);

    res.setHeader('Set-Cookie', cookies);
    res.status(200).json({
      data: {
        user,
        accessToken: {
          expiresIn: accessToken.expiresIn,
          expiresAt: new Date(Date.now() + accessToken.expiresIn * 1000)
        }
      },
      message: 'Token Refreshed Successfully'
    });
  });

  public completeProfile = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    const userData: User = req.user;
    const profileData: CompleteUserProfileDto = req.body;
    const updatedUserData: User = await this.auth.completeProfile(userData, profileData);

    res.status(200).json({ data: updatedUserData, message: 'Profile Completed Successfully' });
  });

  public verifyOTP = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    const email = await this.auth.getUserEmail(req)
    const { otp } = req.body;
    if (!otp) {
      const error = createBilingualError(400, ErrorMessages.OTP_REQUIRED);
      throw new HttpException(error.status, error.message, error.messageAr);
    }
    const isSuccessful = await this.auth.verifyEmailOtp(email, otp);
    res.status(200).json({ data: isSuccessful, message: 'OTP Verified Successfully' });
  });

  public forgetPassword = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    const email = req.body.email;
    if (!email) {
      const error = createBilingualError(400, ErrorMessages.EMAIL_REQUIRED);
      throw new HttpException(error.status, error.message, error.messageAr);
    }
    await this.auth.sendPasswordResetEmail(email);
    res.status(200).json({ message: 'Password Reset Email Sent Successfully' });
  });

  public resetPassword = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    const { token, newPassword }: ResetPasswordDto = req.body;

    await this.auth.resetPassword(token, newPassword);
    res.status(200).json({ message: 'Password Reset Successfully' });
  });

  public resendOTP = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    const email = await this.auth.getUserEmail(req)
    await this.auth.sendEmailOtp(email);
    res.status(200).json({ message: 'OTP Resent Successfully' });
  });
}

