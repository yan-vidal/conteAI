import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";

export const CountryModelName = "Country";
export const StateModelName = "State";
export const CityModelName = "City";

@Schema({ collection: "countries", timestamps: true })
export class CountryEntity {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, unique: true })
  code!: string;
}

@Schema({ collection: "states", timestamps: true })
export class StateEntity {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, unique: true })
  code!: string;

  @Prop()
  countryParentCode?: string;
}

@Schema({ collection: "cities", timestamps: true })
export class CityEntity {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true, unique: true })
  code!: string;

  @Prop()
  countryParentCode?: string;

  @Prop()
  stateParentCode?: string;
}

export type CountryEntityDocument = HydratedDocument<CountryEntity>;
export type StateEntityDocument = HydratedDocument<StateEntity>;
export type CityEntityDocument = HydratedDocument<CityEntity>;

export const CountrySchema = SchemaFactory.createForClass(CountryEntity);
export const StateSchema = SchemaFactory.createForClass(StateEntity);
export const CitySchema = SchemaFactory.createForClass(CityEntity);
