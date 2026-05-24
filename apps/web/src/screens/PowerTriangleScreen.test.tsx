import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PowerTriangleScreen } from "./PowerTriangleScreen";

describe("PowerTriangleScreen", () => {
  it("solves 80 kW & 100 kVA → hero 100 kVA, PF 0.8, Q 60 kVAR", () => {
    render(<PowerTriangleScreen />);
    // Hero should be apparent power (100 kVA)
    expect(document.querySelector(".vd-result-number")?.textContent).toBe("100");
    expect(document.body.textContent).toContain("0.8");
    expect(document.body.textContent).toContain("60");
  });

  it("expands the show-your-work panel", () => {
    render(<PowerTriangleScreen />);
    fireEvent.click(screen.getByText("How this was calculated"));
    expect(document.querySelector(".show-work-body")).toBeTruthy();
  });

  it("warns when fewer than two values are entered", () => {
    render(<PowerTriangleScreen />);
    // Clear kVA so only kW remains
    fireEvent.change(screen.getByLabelText("Apparent power"), { target: { value: "" } });
    expect(document.querySelector(".warning-block")).toBeTruthy();
  });
});
