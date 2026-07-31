export interface AccessTokenPayload {
  sub: string;
  username: string;
  tokenUse: 'access';
  iat: number;
  exp: number;
  iss: 'dice-game-api';
  aud: 'dice-game-web';
}

export interface AuthenticatedUser {
  id: string;
  username: string;
}
