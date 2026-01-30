import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithUser } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { AuthService } from '@services/auth.service';
import { CompleteUserProfileDto, CreateUserDto, LoginUserDto, ResetPasswordDto } from '@/dtos/users.dto';
import { catchAsync } from '@/utils/catchAsync';
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { HttpException } from '@/exceptions/HttpException';
import { createMultiLangMessage, SuccessResponseMessages } from '@/utils/responseMessages';

export class AuthController {
  public auth = Container.get(AuthService);

  public signUp = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userData: CreateUserDto = req.body;
    const { createdUserData, cookies } = await this.auth.signup(userData);

    res.setHeader('Set-Cookie', cookies);

    await this.auth.sendEmailOtp(userData.email);
    const responseMessage = createMultiLangMessage(SuccessResponseMessages.SIGNED_UP_SUCCESSFULLY);
    res.status(201).json({
      data: createdUserData,
      messageEn: responseMessage.messageEn,
      messageAr: responseMessage.messageAr
    });
  });

  public logIn = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userData: LoginUserDto = req.body;
    const { cookies, findUser } = await this.auth.login(userData);

    res.setHeader('Set-Cookie', cookies);
    const responseMessage = createMultiLangMessage(SuccessResponseMessages.LOGGED_IN_SUCCESSFULLY);
    res.status(200).json({
      data: findUser,
      messageEn: responseMessage.messageEn,
      messageAr: responseMessage.messageAr
    });
  });

  public logOut = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    const userData: User = req.user;
    const logOutUserData: User = await this.auth.logout(userData);

    res.setHeader('Set-Cookie', [
      'Authorization=; HttpOnly; Max-Age=0; Path=/; SameSite=Lax',
      'RefreshToken=; HttpOnly; Max-Age=0; Path=/; SameSite=Lax'
    ]);
    const responseMessage = createMultiLangMessage(SuccessResponseMessages.LOGGED_OUT_SUCCESSFULLY);
    res.status(200).json({
      messageEn: responseMessage.messageEn,
      messageAr: responseMessage.messageAr
    });
  });

  public refresh = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const refreshToken = req.cookies?.RefreshToken;
    const { cookies, user, accessToken } = await this.auth.refreshAccessToken(refreshToken);

    cookies.forEach((cookie: string) => {
      res.append('Set-Cookie', cookie);
    });
    const responseMessage = createMultiLangMessage(SuccessResponseMessages.TOKEN_REFRESHED_SUCCESSFULLY);
    res.status(200).json({
      data: {
        user,
        accessToken: {
          expiresIn: accessToken.expiresIn,
          expiresAt: new Date(Date.now() + accessToken.expiresIn * 1000)
        }
      },
      messageEn: responseMessage.messageEn,
      messageAr: responseMessage.messageAr
    });
  });

  public completeProfile = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    const userData: User = req.user;
    const profileData: CompleteUserProfileDto = req.body;
    const updatedUserData: User = await this.auth.completeProfile(userData, profileData);

    const responseMessage = createMultiLangMessage(SuccessResponseMessages.PROFILE_COMPLETED_SUCCESSFULLY);
    res.status(200).json({
      data: updatedUserData,
      messageEn: responseMessage.messageEn,
      messageAr: responseMessage.messageAr
    });
  });

  public verifyOTP = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    const email = await this.auth.getUserEmail(req)
    const { otp } = req.body;
    if (!otp) {
      const error = createBilingualError(400, ErrorMessages.OTP_REQUIRED);
      throw new HttpException(error.status, error.message, error.messageAr);
    }
    const isSuccessful = await this.auth.verifyEmailOtp(email, otp);
    const responseMessage = createMultiLangMessage(SuccessResponseMessages.OTP_VERIFIED_SUCCESSFULLY);
    res.status(200).json({
      data: isSuccessful,
      messageEn: responseMessage.messageEn,
      messageAr: responseMessage.messageAr
    });
  });

  public forgetPassword = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    const email = req.body.email;
    if (!email) {
      const error = createBilingualError(400, ErrorMessages.EMAIL_REQUIRED);
      throw new HttpException(error.status, error.message, error.messageAr);
    }
    await this.auth.sendPasswordResetEmail(email);
    const responseMessage = createMultiLangMessage(SuccessResponseMessages.PASSWORD_RESET_EMAIL_SENT_SUCCESSFULLY);
    res.status(200).json({
      messageEn: responseMessage.messageEn,
      messageAr: responseMessage.messageAr
    });
  });

  public resetPassword = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    const { token, newPassword }: ResetPasswordDto = req.body;

    await this.auth.resetPassword(token, newPassword);
    const responseMessage = createMultiLangMessage(SuccessResponseMessages.PASSWORD_RESET_SUCCESSFULLY);
    res.status(200).json({
      messageEn: responseMessage.messageEn,
      messageAr: responseMessage.messageAr
    });
  });

  public resendOTP = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    const email = await this.auth.getUserEmail(req)
    await this.auth.sendEmailOtp(email);
    const responseMessage = createMultiLangMessage(SuccessResponseMessages.OTP_RESENT_SUCCESSFULLY);
    res.status(200).json({
      messageEn: responseMessage.messageEn,
      messageAr: responseMessage.messageAr
    });
  });
}

