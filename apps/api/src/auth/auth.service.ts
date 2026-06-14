import type { AuthPayload, AuthResponse } from "@conteai/shared";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
// biome-ignore lint/style/useImportType: Nest uses constructor metadata for DI at runtime.
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import bcrypt from "bcrypt";
import type { Model } from "mongoose";
import type { AuthenticationDto } from "./authentication.dto.js";
import { type UserEntity, UserModelName } from "./user.schema.js";

@Injectable()
export class AuthService {
  @InjectModel(UserModelName)
  private readonly userModel!: Model<UserEntity>;

  constructor(private readonly jwtService: JwtService) {}

  async authenticate(credentials: AuthenticationDto): Promise<AuthResponse> {
    const user = await this.userModel
      .findOne({ name: credentials.name })
      .exec();

    if (!user) {
      throw new InternalServerErrorException("Authentication error");
    }

    const correctPassword = await bcrypt.compare(
      credentials.password,
      user.password,
    );

    if (!correctPassword) {
      throw new InternalServerErrorException("Authentication error");
    }

    const token = await this.jwtService.signAsync(
      {
        id: String(user._id),
        name: user.name,
      },
      {
        expiresIn: "1h",
      },
    );
    const payload = await this.jwtService.verifyAsync<AuthPayload>(token);

    return { payload, token };
  }
}
