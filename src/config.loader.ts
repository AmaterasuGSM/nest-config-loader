import { NestConfigTypes } from "./NestConfigTypes.js";

import { parse } from "dot-properties";
import * as dotenv from "dotenv";
import fs from "fs";
import yaml from "js-yaml";
import merge from "lodash.merge";
import { basename, extname, join, resolve } from "path";
import { tsImport } from "tsx/esm/api";
import { Get, Paths } from "type-fest";

interface Config extends NestConfigTypes {}
export const GlobalConfig: Config = {} as Config;

const configLoaders = {
  ".yaml": (path: string) => yaml.load(fs.readFileSync(path, "utf8")) || {},
  ".yml": (path: string) => yaml.load(fs.readFileSync(path, "utf8")) || {},
  ".properties": (path: string) =>
    parse(fs.readFileSync(path, "utf8"), true) || {},
  ".ts": async (path: string) => {
    try {
      const module = await tsImport(path, import.meta.url);
      if (!module) {
        console.warn(`Empty TS config at ${path}`);
        return {};
      }
      return module.default || module;
    } catch (error) {
      console.error(`Error loading TS config at ${path}:`, error);
      return {};
    }
  },
};

export function getConfig<P extends Paths<NestConfigTypes>>(
  path: P
): Get<NestConfigTypes, P>;
export function getConfig<P extends Paths<NestConfigTypes>>(
  path: P,
  defaultValue: Get<NestConfigTypes, P>
): Get<NestConfigTypes, P>;
export function getConfig<T = any>(path: string, defaultValue?: T): T;
export function getConfig(path: string, defaultValue?: unknown): unknown {
  const value = path.split(".").reduce<unknown>((currentObj, partKey) => {
    if (typeof currentObj !== "object" || currentObj === null) {
      return undefined;
    }
    return (currentObj as Record<string, unknown>)[partKey];
  }, GlobalConfig);
  return value !== undefined ? value : defaultValue;
}

const loadDirectory = async (dir: string, env: string): Promise<Config> => {
  const config: Config = {} as Config;
  const loadFiles = fs.readdirSync(dir).filter((file) => {
    const baseName = basename(file, extname(file));
    const ext = extname(file);
    return (
      ["default", env, "local", `local-${env}`].includes(baseName) &&
      Object.keys(configLoaders).includes(ext)
    );
  });

  for (const file of loadFiles) {
    const ext = extname(file);
    if (ext in configLoaders) {
      const loader = configLoaders[ext as keyof typeof configLoaders];
      const data = await Promise.resolve(loader(join(dir, file)));
      merge(config, data);
    } else {
      console.warn(
        `No loader found for extension ${ext}. Skipping file ${file}.`
      );
    }
  }
  return config;
};

export const loadConfig = async (): Promise<Config> => {
  try {
    const env = process.env.NODE_ENV || "";
    const dirs = (process.env.NODE_CONFIG_DIR || "")
      .split(/[;:]/)
      .map((dir) => resolve(dir.trim()))
      .filter(fs.existsSync);

    const configs = await Promise.all(
      dirs.map((dir) => loadDirectory(dir, env))
    );
    const mergedFileConfig = configs.reduce(
      (acc, config) => merge(acc, config),
      {} as Config
    );

    const envConfig = {
      ...process.env,
      ...(dotenv.config().parsed || {}),
    };
    const finalConfig = merge({}, mergedFileConfig, envConfig);

    Object.assign(GlobalConfig, finalConfig);
    return finalConfig;
  } catch (error) {
    console.error("Config loading failed:", error);
    throw error;
  }
};

await loadConfig();
