export class RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export class VerifyDto {
  email: string;
  otp: string;
}

export class LoginDto {
  email: string;
  password: string;
}

export class ForgotDto {
  email: string;
}

export class ResetDto {
  email: string;
  password: string;
}

export class ResendDto {
  email: string;
}

// {
//     "firstName": "John",
//     "lastName": "Doe",
//     "email": "ayomideaakinniyi13@gmail.com",
//     "password": "12345678"
// }