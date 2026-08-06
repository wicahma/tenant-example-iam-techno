import { APIBaseResponse } from "@/types/api.types";

export interface IOAuthAuthorizeParams {
  client_id: string;
  response_type: "code";
  redirect_uri: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: "S256" | "plain";
  nonce?: string;
  prompt?: "login" | "consent" | "none";
}

export interface IOAuthAuthorizeResponse {
  sessionId: string;
  clientName: string;
  clientId: string;
  scope: string;
  redirectUri: string;
  state: string;
  authenticationEndpoint: string;
}

export interface IOAuthTokenRequest {
  grant_type: "authorization_code" | "refresh_token";
  code?: string;
  code_verifier?: string;
  refresh_token?: string;
  client_id: string;
  redirect_uri?: string;
  scope?: string;
}

export interface IOAuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  idToken?: string;
  scope?: string;
}

export interface IOAuthUserInfoResponse {
  sub: string;
  name: string | null;
  email: string | null;
  emailVerified: boolean | null;
  phoneNumber: string | null;
  phoneNumberVerified: boolean | null;
  preferredUsername: string | null;
  application: {
    appName: string;
    appIdentifier: string;
  } | null;
  directMenuInfo: unknown[] | null;
}

export interface IOIDCDiscoveryResponse {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint: string;
  jwksUri: string;
  responseTypesSupported: string[];
  grantTypesSupported: string[];
  subjectTypesSupported: string[];
  idTokenSigningAlgValuesSupported: string[];
  scopesSupported: string[];
  tokenEndpointAuthMethodsSupported: string[];
  codeChallengeMethodsSupported: string[];
  claimsSupported: string[];
}

export interface IOAuthRevokeRequest {
  token: string;
  token_type_hint?: "access_token" | "refresh_token";
}

export interface IOAuthAuthorizeResult {
  status: number;
  location?: string;
  data: APIBaseResponse<IOAuthAuthorizeResponse>;
}
