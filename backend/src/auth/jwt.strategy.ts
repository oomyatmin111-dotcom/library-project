import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';

export const JWT_SECRET = 'SECRET_COMIC_SUPER_KEY_123!#';
export const REFRESH_SECRET = 'REFRESH_SECRET_COMIC_KEY_456!#';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({ where: { userId: payload.sub } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User no longer active or valid');
    }
    return {
      userId: user.userId,
      email: user.email,
      roleId: user.roleId,
      membershipNo: user.membershipNo,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
