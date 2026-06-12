import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";

export const UserModelName = "User";

@Schema({ collection: "users", timestamps: true })
export class UserEntity {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  password!: string;
}

export type UserEntityDocument = HydratedDocument<UserEntity>;
export const UserSchema = SchemaFactory.createForClass(UserEntity);
