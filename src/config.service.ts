import { Injectable } from "@nestjs/common";
import { getConfig } from "./config.loader.js";

@Injectable()
export class ConfigService {
  get<T>(key: string, defaultValue?: T): T {
    return getConfig<T>(key, defaultValue)!;
  }
}
