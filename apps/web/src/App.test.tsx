import { Capacitor } from "@capacitor/core";
import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("App shell", () => {
  it("renders the five-mode switcher", () => {
    render(<App />);
    expect(screen.getByRole("group", { name: "Calculator mode" })).toBeTruthy();
    for (const label of ["Ohm's Law", "AC Power", "Power Triangle", "Energy Cost", "Efficiency"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("defaults to the Ohm's Law calculator (hero label 'Power')", () => {
    render(<App />);
    expect(document.querySelector(".vd-result-label")?.textContent).toBe("Power");
  });

  it("switching to AC Power changes the hero label to 'Real Power'", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "AC Power" }));
    expect(document.querySelector(".vd-result-label")?.textContent).toBe("Real Power");
  });

  it("switching to Energy Cost changes the hero label to 'Cost'", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Energy Cost" }));
    expect(document.querySelector(".vd-result-label")?.textContent).toBe("Cost");
  });

  it("shows the qualified-professional disclaimer", () => {
    render(<App />);
    expect(document.body.textContent).toContain("aid for qualified professionals");
  });

  it("shows the complete mock device chrome in a wide browser preview", () => {
    vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(false);

    const { container } = render(<App />);

    expect(container.querySelector(".trueohm-shell")?.getAttribute("data-device-chrome")).toBe(
      "mock",
    );
    expect(container.querySelector(".status-bar")?.textContent).toMatch(/^\d{1,2}:\d{2}$/);
    expect(container.querySelector(".dynamic-island")).toBeTruthy();
    expect(container.querySelector(".status-glyphs")).toBeTruthy();
    expect(container.querySelector(".home-indicator")).toBeTruthy();
  });

  it("hides every piece of mock device chrome on Capacitor native platforms", () => {
    vi.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);

    const { container } = render(<App />);

    expect(container.querySelector(".trueohm-shell")?.getAttribute("data-device-chrome")).toBe(
      "native",
    );
    for (const selector of [
      ".status-bar",
      ".dynamic-island",
      ".status-glyphs",
      ".home-indicator",
    ]) {
      expect(container.querySelector(selector)).toBeNull();
    }
  });
});
