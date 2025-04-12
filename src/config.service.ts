import { Injectable } from "@nestjs/common";

import { getConfig } from "./config.loader.js";
import { NestConfigTypes } from "./NestConfigTypes.js";

import { Get, Paths } from "type-fest";

type ConfigPath = Paths<NestConfigTypes>;

@Injectable()
export class ConfigService {
  get<P extends ConfigPath>(path: P): Get<NestConfigTypes, P>;
  get<P extends ConfigPath>(
    path: P,
    defaultValue: Get<NestConfigTypes, P>
  ): Get<NestConfigTypes, P>;
  get<T = any>(path: string, defaultValue?: T): T;
  get(path: string, defaultValue?: unknown): unknown {
    return getConfig(path, defaultValue);
  }
}
