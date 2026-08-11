import { describe, expect, it } from "vitest";
import { APP_STORE_APPS, appStoreUrl } from "./app-store-apps";

describe("appStoreUrl", () => {
  it("builds the canonical App Store URL for a numeric Apple ID", () => {
    expect(appStoreUrl("6771228149")).toBe("https://apps.apple.com/app/id6771228149");
  });

  it.each([
    "",
    "TruePhase",
    "6771228149/path",
    "https://apps.apple.com/app/id6771228149",
    6771228149,
  ])("rejects invalid Apple ID %j", (appleId) => {
    expect(() => appStoreUrl(appleId as string)).toThrow("Apple ID must be numeric");
  });
});

describe("APP_STORE_APPS", () => {
  it("promotes only TruePhase at its numeric App Store URL", () => {
    expect(APP_STORE_APPS).toHaveLength(1);
    expect(APP_STORE_APPS[0]).toMatchObject({
      appleId: "6771228149",
      name: "TruePhase",
      tagline: "Wire colors and panel schedules",
      description: "Look up circuit phase and color, then build practical panel schedules.",
      priceLabel: "Free · Pro available",
      url: "https://apps.apple.com/app/id6771228149",
      icon: "/tool-icons/truephase.png",
    });
  });

  it("makes the companion configuration immutable at runtime", () => {
    expect(Object.isFrozen(APP_STORE_APPS)).toBe(true);
    expect(Object.isFrozen(APP_STORE_APPS[0])).toBe(true);
  });
});
