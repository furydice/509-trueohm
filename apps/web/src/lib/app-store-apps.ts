export interface AppStoreApp {
  readonly appleId: string;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly priceLabel: string;
  readonly url: string;
  readonly icon: string;
}

export function appStoreUrl(appleId: string): string {
  if (typeof appleId !== "string" || appleId.length === 0 || !/^\d+$/.test(appleId)) {
    throw new Error("Apple ID must be numeric");
  }

  return "https://apps.apple.com/app/id" + appleId;
}

export const APP_STORE_APPS: readonly AppStoreApp[] = Object.freeze([
  Object.freeze({
    appleId: "6771228149",
    name: "TruePhase",
    tagline: "Wire colors and panel schedules",
    description: "Look up circuit phase and color, then build practical panel schedules.",
    priceLabel: "Free · Pro available",
    url: appStoreUrl("6771228149"),
    icon: "/tool-icons/truephase.png",
  }),
]);
