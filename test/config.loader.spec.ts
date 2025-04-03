import { getConfig, GlobalConfig } from "../src/config.loader.js";

describe("config.loader", () => {
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
  });

  describe("getConfig", () => {
    it("should get a config value", () => {
      expect(getConfig("test.value")).toBe("test-value");
    });

    it("should get a nested config value", () => {
      expect(getConfig("test.nested.value")).toBe(123);
    });

    it("should return default value when key is not found", () => {
      expect(getConfig("nonexistent", "default")).toBe("default");
    });

    it("should return undefined when key is not found and no default is provided", () => {
      expect(getConfig("nonexistent")).toBeUndefined();
    });
  });
});
