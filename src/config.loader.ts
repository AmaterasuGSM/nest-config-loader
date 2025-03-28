import fs from "fs";
import yaml from "js-yaml";
import merge from "lodash.merge";
import { basename, extname, join, resolve } from "path";
import PropertiesReader from "properties-reader";
import { tsImport } from "tsx/esm/api";

interface Config {
  [key: string]: unknown;
}

export const GlobalConfig: Config = {};

const configLoaders = {
  ".yaml": (path: string) => yaml.load(fs.readFileSync(path, "utf8")) || {},
  ".yml": (path: string) => yaml.load(fs.readFileSync(path, "utf8")) || {},
  ".properties": (path: string) => PropertiesReader(path).getAllProperties(),
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

const loadDirectory = async (dir: string, env: string): Promise<Config> => {
  const config: Config = {};

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
    const merged = configs.reduce((acc, config) => merge(acc, config), {});
    Object.assign(GlobalConfig, merged);
    return merged;
  } catch (error) {
    console.error("Config loading failed:", error);
    throw error;
  }
};

export const getConfig = <T>(key: string, defaultValue?: T): T | undefined => {
  const value = key.split(".").reduce<unknown>((currentObj, partKey) => {
    if (typeof currentObj !== "object" || currentObj === null) {
      return undefined;
    }
    return (currentObj as Record<string, unknown>)[partKey];
  }, GlobalConfig);

  return value !== undefined ? (value as T) : defaultValue;
};

await loadConfig();
