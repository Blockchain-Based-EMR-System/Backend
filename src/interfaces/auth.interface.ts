import { Request } from 'express';
import { User } from '@interfaces/users.interface';
import { Role } from '@prisma/client';


export interface DataStoredInToken {
  id: string;
  role:Role;
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
