import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { RequestWithUser } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { AuthService } from '@services/auth.service';
import { CompleteUserProfileDto, CreateUserDto, LoginUserDto, ResetPasswordDto } from '@/dtos/users.dto';

export class AuthController {
  public auth = Container.get(AuthService);

  public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: CreateUserDto = req.body;
      const { createdUserData, cookies } = await this.auth.signup(userData);

      res.setHeader('Set-Cookie', cookies);

      await this.auth.sendEmailOtp(userData.email);

      res.status(201).json({ data: createdUserData, message: 'Signed Up Successfully' });
    } catch (error) {
      next(error);
    }
  };

  public logIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: LoginUserDto = req.body;
      const { cookies, findUser } = await this.auth.login(userData);
      console.log(cookies);

      res.setHeader('Set-Cookie', cookies);
      res.status(200).json({ data: findUser, message: 'Logged In Successfully' });
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const logOutUserData: User = await this.auth.logout(userData);

      res.setHeader('Set-Cookie', ['Authorization=; Max-age=0', 'RefreshToken=; Max-age=0']);
      res.status(200).json({ message: 'Logged Out Successfully' });
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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
    } catch (error) {
      next(error);
    }
  };

  public completeProfile = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const profileData: CompleteUserProfileDto = req.body;
      const updatedUserData: User = await this.auth.completeProfile(userData, profileData);

      res.status(200).json({ data: updatedUserData, message: 'Profile Completed Successfully' });
    } catch (error) {
      next(error);
    }
  };

  public verifyOTP = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = await this.auth.getUserEmail(req)
      const { otp } = req.body;
      if (!otp) {
        throw new Error('OTP is required');
      }
      const isSuccessful = await this.auth.verifyEmailOtp(email, otp);
      res.status(200).json({ data: isSuccessful, message: 'OTP Verified Successfully' });
    } catch (error) {
      next(error);
    }
  };

  public forgetPassword = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = req.body.email;
      if(!email){
        throw new Error('Email is required');
      }
      await this.auth.sendPasswordResetEmail(email);
      res.status(200).json({ message: 'Password Reset Email Sent Successfully' });
    } catch (error) {
      next(error);
    }
  };

  public resetPassword = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword }: ResetPasswordDto = req.body;

      await this.auth.resetPassword(token, newPassword);
      res.status(200).json({ message: 'Password Reset Successfully' });
    } catch (error) {
      next(error);
    }
  };

  public resendOTP = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const email = await this.auth.getUserEmail(req)
      await this.auth.sendEmailOtp(email);
      res.status(200).json({ message: 'OTP Resent Successfully' });
    } catch (error) {
      next(error);
    }
  }
}

