import { SetMetadata } from '@nestjs/common';
import { GroupRole } from '@prisma/client';

export const Roles = (...roles: GroupRole[]) =>
  SetMetadata('roles', roles);