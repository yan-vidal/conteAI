import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateStateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  countryParentCode?: string;
}

export class UpdateStateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  countryParentCode?: string;
}
