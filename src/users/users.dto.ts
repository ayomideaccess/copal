export class UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}