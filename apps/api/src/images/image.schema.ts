import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";

export const ImageModelName = "Image";

@Schema()
export class ColorPaletteEntity {
  @Prop({ default: 0, required: true })
  red!: number;

  @Prop({ default: 0, required: true })
  green!: number;

  @Prop({ default: 0, required: true })
  blue!: number;

  @Prop({ default: 0, required: true })
  score!: number;

  @Prop({ required: true })
  pixelFraction!: number;
}

export const ColorPaletteSchema =
  SchemaFactory.createForClass(ColorPaletteEntity);

@Schema()
export class ImageVersionEntity {
  @Prop({ required: true })
  lazyThumbnailBase64!: string;

  @Prop({ required: true })
  thumbnailUrl!: string;

  @Prop({ required: true })
  optimizedUrl!: string;

  @Prop({ required: true })
  fullSizeUrl!: string;

  @Prop()
  versionName?: string;

  @Prop({ default: [], type: [ColorPaletteSchema] })
  colorPalette!: ColorPaletteEntity[];
}

export const ImageVersionSchema =
  SchemaFactory.createForClass(ImageVersionEntity);

@Schema({ _id: false })
export class ImageMetadataEntity {
  @Prop()
  camera?: string;

  @Prop()
  lens?: string;

  @Prop()
  iso?: string;

  @Prop()
  shutterSpeed?: string;

  @Prop()
  flash?: string;

  @Prop({ required: true })
  whiteBalance!: string;

  @Prop()
  aperture?: string;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop()
  cameraTrueDirection?: number;

  @Prop()
  takenAt?: Date;

  @Prop({ required: true })
  fullSizeWidth!: number;

  @Prop({ required: true })
  fullSizeHeight!: number;

  @Prop({ required: true })
  optimizedWidth!: number;

  @Prop({ required: true })
  optimizedHeight!: number;

  @Prop({ required: true })
  thumbnailWidth!: number;

  @Prop({ required: true })
  thumbnailHeight!: number;
}

export const ImageMetadataSchema =
  SchemaFactory.createForClass(ImageMetadataEntity);

@Schema({ collection: "images", timestamps: true })
export class ImageEntity {
  @Prop()
  description?: string;

  @Prop({ default: [], type: [String] })
  tags!: string[];

  @Prop()
  country?: string;

  @Prop()
  state?: string;

  @Prop()
  city?: string;

  @Prop({ default: [], type: [ImageVersionSchema] })
  images!: ImageVersionEntity[];

  @Prop({ required: true, type: ImageVersionSchema })
  original!: ImageVersionEntity;

  @Prop({ required: true, type: ImageMetadataSchema })
  metadata!: ImageMetadataEntity;
}

export type ImageEntityDocument = HydratedDocument<ImageEntity>;
export const ImageSchema = SchemaFactory.createForClass(ImageEntity);
