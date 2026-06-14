import { IsString, MinLength } from "class-validator";

export class AuthenticationDto {
  @IsString()
  name!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
