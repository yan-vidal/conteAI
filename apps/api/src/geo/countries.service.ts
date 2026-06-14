import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import type { CreateCountryDto, UpdateCountryDto } from "./countries.dto.js";
import {
  type CountryEntity,
  type CountryEntityDocument,
  CountryModelName,
} from "./geo.schema.js";

@Injectable()
export class CountriesService {
  @InjectModel(CountryModelName)
  private readonly countryModel!: Model<CountryEntity>;

  list(): Promise<CountryEntityDocument[]> {
    return this.countryModel.find().sort({ name: 1 }).exec();
  }

  create(dto: CreateCountryDto): Promise<CountryEntityDocument> {
    return this.countryModel.create(dto);
  }

  async update(
    id: string,
    dto: UpdateCountryDto,
  ): Promise<CountryEntityDocument> {
    const updated = await this.countryModel
      .findByIdAndUpdate(id, dto, { returnDocument: "after" })
      .exec();

    if (updated === null) {
      throw new NotFoundException("Country not found");
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.countryModel.findByIdAndDelete(id).exec();

    if (deleted === null) {
      throw new NotFoundException("Country not found");
    }
  }
}
