import { IsEmail, IsString } from 'class-validator';
<<<<<<< HEAD

export class LoginDto {
  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

=======
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'usuario@email.com', description: 'Email del usuario' })
  @IsEmail({}, { message: 'El email debe ser válido' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña del usuario' })
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
  @IsString()
  password: string;
}
