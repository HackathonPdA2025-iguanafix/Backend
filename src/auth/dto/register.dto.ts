import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  nome!: string;

  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  senha!: string;

  @IsNotEmpty({ message: 'CPF é obrigatório' })
  @IsString()
  cpf!: string;
}
