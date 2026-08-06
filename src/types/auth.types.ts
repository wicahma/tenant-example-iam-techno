export interface ILoginRequest {
  identifier: string;
  password: string;
}

export interface ILoginResponse {
  email: string;
  fullName: string;
  phoneNumber: string;
  npk: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  passwordExpiresAt?: string | null;
}

export interface IPreTokenResponse {
  npk: string;
  preToken: string;
  expiresIn: number;
  message: string;
}

export interface IPreTokenClaimsRequest {
  preToken: string;
}

export interface ITokens {
  accessToken: string | null;
  refreshToken: string | null;
  fullName: string;
  email?: string;
  npk?: string;
}

export interface IRefreshTokenRequest {
  refreshToken: string;
  workId?: number | null;
}

export interface IRefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface IValidateTokenRequest {
  token: string;
  tokenType: "access_token" | "refresh_token";
}

export interface IValidateTokenResponse {
  isValid: boolean;
  tokenType: string;
  message: string | null;
}

export interface ILogoutResponse {
  message: string;
}

export interface IApplicationInfo {
  appName: string;
  appIdentifier: string;
}

export interface IUserDetail {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  npk: string;
  application: IApplicationInfo | null;
  directMenuInfo: unknown[] | null;
}

export interface IUserProfile {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string;
  npk: string;
  application: IApplicationInfo | null;
}

export interface IUpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
}

export interface IUpdateProfileResponse {
  user: {
    id: number;
    npk: string;
    fullName: string;
    phoneNumber: string;
  };
}
