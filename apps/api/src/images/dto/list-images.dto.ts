import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

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

export class ListImagesDto {
  @IsOptional()
  @Transform(toStringArray)
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Transform(toStringArray)
  @IsString({ each: true })
  country?: string[];

  @IsOptional()
  @Transform(toStringArray)
  @IsString({ each: true })
  state?: string[];

  @IsOptional()
  @Transform(toStringArray)
  @IsString({ each: true })
  city?: string[];

  @IsOptional()
  @Transform(toStringArray)
  @IsString({ each: true })
  camera?: string[];

  @IsOptional()
  @Transform(toStringArray)
  @IsString({ each: true })
  lens?: string[];

  @IsOptional()
  @Transform(toStringArray)
  @IsString({ each: true })
  iso?: string[];

  @IsOptional()
  @Transform(toStringArray)
  @IsString({ each: true })
  shutterSpeed?: string[];

  @IsOptional()
  @Transform(toStringArray)
  @IsString({ each: true })
  flash?: string[];

  @IsOptional()
  @Transform(toStringArray)
  @IsString({ each: true })
  whiteBalance?: string[];

  @IsOptional()
  @Transform(toStringArray)
  @IsString({ each: true })
  aperture?: string[];

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsIn(["asc", "desc"])
  order?: "asc" | "desc";

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  takenAtFrom?: string;

  @IsOptional()
  @IsString()
  takenAtTo?: string;

  @IsOptional()
  @IsString()
  createdAtFrom?: string;

  @IsOptional()
  @IsString()
  createdAtTo?: string;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  favorite?: boolean;
}
