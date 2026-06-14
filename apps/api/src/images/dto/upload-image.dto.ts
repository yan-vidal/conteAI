import { Transform } from "class-transformer";
import { IsArray, IsOptional, IsString } from "class-validator";

const toStringArray = ({ value }: { value: unknown }): string[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }

  return [String(value)];
};

export class UploadImageDto {
  @IsOptional()
  @IsString()
  description?: string;

  @Transform(toStringArray)
  @IsArray()
  @IsString({ each: true })
  versionNames!: string[];
}
