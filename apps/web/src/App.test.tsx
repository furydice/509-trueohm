import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { App } from "./App";

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
});
