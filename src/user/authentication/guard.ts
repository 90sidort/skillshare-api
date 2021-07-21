import { AuthGuard } from '@nestjs/passport';

export class AuthGuardJwt extends AuthGuard('jwt') {}
export class AuthGuardLocal extends AuthGuard('local') {}
