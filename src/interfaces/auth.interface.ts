import { Request } from 'express';
import { User } from '@interfaces/users.interface';

export interface DataStoredInToken {
  id: string;
}

export interface AccessTokenData {
  token: string;
  expiresIn: number;
}

export interface RefreshTokenData {
  token: string;
  expiresIn: number;
}

export interface TokenResponse {
  accessToken: AccessTokenData;
  refreshToken?: RefreshTokenData;
}

export interface SocketStoredInToken {
  id: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user: User;
}
