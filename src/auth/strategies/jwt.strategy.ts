/**
 * This file contains the JWT strategy used by the PassportJS library to
 * authenticate users using a JSON Web Token (JWT).
 *
 * The strategy is used to validate the JWT sent in the Authorization header
 * of incoming requests. If the token is valid, the strategy returns the user
 * data associated with the token. If the token is invalid, the strategy throws
 * an error.
 *
 * @see https://github.com/mikenicholson/passport-jwt
 */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * The constructor sets up the strategy with the secret key used to sign
   * the JWTs.
   *
   * @param authService The authentication service used to validate the JWT.
   */
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'YOUR_SECRET_KEY',
    });
  }

  /**
   * This method is called by PassportJS when a request is received with a
   * valid JWT. The method returns the user data associated with the token.
   *
   * @param payload The payload of the JWT.
   */
  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
