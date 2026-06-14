import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import type { CreateCityDto, UpdateCityDto } from "./cities.dto.js";
import {
  type CityEntity,
  type CityEntityDocument,
  CityModelName,
} from "./geo.schema.js";

@Injectable()
export class CitiesService {
  @InjectModel(CityModelName)
  private readonly cityModel!: Model<CityEntity>;

  list(): Promise<CityEntityDocument[]> {
    return this.cityModel.find().sort({ name: 1 }).exec();
  }

  create(dto: CreateCityDto): Promise<CityEntityDocument> {
    return this.cityModel.create(dto);
  }

  async update(id: string, dto: UpdateCityDto): Promise<CityEntityDocument> {
    const updated = await this.cityModel
      .findByIdAndUpdate(id, dto, { returnDocument: "after" })
      .exec();

    if (updated === null) {
      throw new NotFoundException("City not found");
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.cityModel.findByIdAndDelete(id).exec();

    if (deleted === null) {
      throw new NotFoundException("City not found");
    }
  }
}
