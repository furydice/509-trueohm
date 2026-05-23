import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AcPowerScreen } from "./AcPowerScreen";

describe("AcPowerScreen", () => {
  it("defaults to 3Ø 480 V / 100 A / PF 0.85 ≈ 70.7 kW", () => {
    render(<AcPowerScreen />);
    const hero = document.querySelector(".vd-result-number")?.textContent ?? "";
    expect(hero.startsWith("70.6")).toBe(true);
  });

  it("warns on a power factor outside 0–1", () => {
    render(<AcPowerScreen />);
    fireEvent.change(screen.getByLabelText("Power factor"), { target: { value: "1.2" } });
    expect(document.querySelector(".warning-block")).toBeTruthy();
    expect(document.body.textContent).toContain("Power factor");
  });

  it("switches phase between 1Ø and 3Ø", () => {
    render(<AcPowerScreen />);
    const group = screen.getByRole("group", { name: "Phase" });
    const onePhase = Array.from(group.querySelectorAll("button")).find(
      (b) => b.textContent === "1Ø",
    ) as HTMLButtonElement;
    fireEvent.click(onePhase);
    expect(onePhase.classList.contains("selected")).toBe(true);
  });
});
