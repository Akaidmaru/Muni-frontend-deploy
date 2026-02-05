import {
  IsString,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
<<<<<<< HEAD
import { ApiProperty } from '@nestjs/swagger';
=======
<<<<<<< HEAD
=======
import { ApiProperty } from '@nestjs/swagger';
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home

@ValidatorConstraint({ name: 'MatchPasswords', async: false })
export class MatchPasswordsConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const object = args.object as ChangePasswordDto;
    return confirmPassword === object.newPassword;
  }

  defaultMessage() {
    return 'Las contraseñas no coinciden';
  }
}

export class ChangePasswordDto {
<<<<<<< HEAD
=======
<<<<<<< HEAD
  @IsString()
  currentPassword: string;

=======
>>>>>>> origin/home
  @ApiProperty({ example: 'oldPassword123', description: 'Contraseña actual del usuario' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'newPassword456', description: 'Nueva contraseña del usuario' })
<<<<<<< HEAD
=======
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  @IsString()
  @MinLength(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres',
  })
  newPassword: string;

<<<<<<< HEAD
  @ApiProperty({ example: 'newPassword456', description: 'Confirmación de la nueva contraseña' })
=======
<<<<<<< HEAD
=======
  @ApiProperty({ example: 'newPassword456', description: 'Confirmación de la nueva contraseña' })
>>>>>>> c0cd806041ac4512d8c8764c65d7ca9ec3a15f9a
>>>>>>> origin/home
  @IsString()
  @Validate(MatchPasswordsConstraint)
  confirmPassword: string;
}
