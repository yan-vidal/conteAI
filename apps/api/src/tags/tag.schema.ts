import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";

export const TagModelName = "Tag";

@Schema({ collection: "tags", timestamps: true })
export class TagEntity {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, unique: true })
  code!: string;
}

export type TagEntityDocument = HydratedDocument<TagEntity>;
export const TagSchema = SchemaFactory.createForClass(TagEntity);
