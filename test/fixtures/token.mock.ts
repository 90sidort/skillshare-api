import { INestApplication } from '@nestjs/common';

import { Role } from '../../src/user/authorization/role.enum';
import { UserService } from '../../src/user/user.service';
import { User } from '../../src/user/user.entity';

export default (
  user: Partial<User> = {
    id: 101,
    username: 'admin',
    roles: [Role.Admin],
  },
  application: INestApplication,
): string => {
  return application.get(UserService).getTokenForUser(user as User);
};
