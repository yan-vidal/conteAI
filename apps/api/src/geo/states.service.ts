import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import {
  type StateEntity,
  type StateEntityDocument,
  StateModelName,
} from "./geo.schema.js";
import type { CreateStateDto, UpdateStateDto } from "./states.dto.js";

@Injectable()
export class StatesService {
  @InjectModel(StateModelName)
  private readonly stateModel!: Model<StateEntity>;

  list(): Promise<StateEntityDocument[]> {
    return this.stateModel.find().sort({ name: 1 }).exec();
  }

  create(dto: CreateStateDto): Promise<StateEntityDocument> {
    return this.stateModel.create(dto);
  }

  async update(id: string, dto: UpdateStateDto): Promise<StateEntityDocument> {
    const updated = await this.stateModel
      .findByIdAndUpdate(id, dto, { returnDocument: "after" })
      .exec();

    if (updated === null) {
      throw new NotFoundException("State not found");
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.stateModel.findByIdAndDelete(id).exec();

    if (deleted === null) {
      throw new NotFoundException("State not found");
    }
  }
}
