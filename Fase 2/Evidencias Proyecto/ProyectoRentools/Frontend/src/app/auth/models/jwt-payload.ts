export interface JwtPayload {
  sub: number;
  email: string;
  rol: string;
  iat?: number;
  exp?: number;
}