import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";

const toStringArray = ({ value }: { value: unknown }): string[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }

  return [String(value)];
};

const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === "true" || value === true) {
    return true;
  }
  if (value === "false" || value === false) {
    return false;
  }
  return value;
};

export class UploadImageDto {
  @IsOptional()
  @IsString()
  description?: string;

  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  versionNames!: string[];

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  favorite?: boolean;
}
