import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

export interface EditableVersion {
  fullSizeUrl: string;
  optimizedUrl: string;
  thumbnailUrl: string;
}

export interface EditableMetadata {
  takenAt?: string | Date;
}

export class EditImageDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsBoolean()
  favorite?: boolean;

  // Passthrough: persisted via Mongoose casting; URL fields are stripped in the service.
  @IsOptional()
  @IsArray()
  images?: EditableVersion[];

  @IsOptional()
  @IsObject()
  original?: EditableVersion;

  @IsOptional()
  @IsObject()
  metadata?: EditableMetadata;

  // Tolerated round-trip fields from the legacy front payload.
  @IsOptional()
  @IsString()
  _id?: string;

  @IsOptional()
  __v?: number;

  @IsOptional()
  @IsString()
  createdAt?: string;

  @IsOptional()
  @IsString()
  updatedAt?: string;
}
