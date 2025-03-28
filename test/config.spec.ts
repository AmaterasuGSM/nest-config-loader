import { ConfigService } from "../src/config.service.js";
import { GlobalConfig } from "../src/config.loader.js";

describe("ConfigService", () => {
  let configService: ConfigService;

  beforeEach(() => {
    Object.keys(GlobalConfig).forEach((key) => {
      delete (GlobalConfig as any)[key];
    });

    Object.assign(GlobalConfig, {
      test: {
        value: "test-value",
        nested: {
          value: 123,
        },
      },
    });

    configService = new ConfigService();
  });

  it("should get a config value", () => {
    expect(configService.get("test.value")).toBe("test-value");
  });

  it("should get a nested config value", () => {
    expect(configService.get("test.nested.value")).toBe(123);
  });

  it("should return default value when key is not found", () => {
    expect(configService.get("nonexistent", "default")).toBe("default");
  });

  it("should throw error when key is not found and no default is provided", () => {
    expect(() => configService.get("nonexistent")).toThrow();
  });
});
