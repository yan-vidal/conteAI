import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCityDto {
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

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  stateParentCode?: string;
}

export class UpdateCityDto {
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

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  stateParentCode?: string;
}
