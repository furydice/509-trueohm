import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OhmsWheelScreen } from "./OhmsWheelScreen";

describe("OhmsWheelScreen", () => {
  it("solves 120 V & 10 Ω to 1440 W (hero) and 12 A", () => {
    render(<OhmsWheelScreen />);
    expect(document.querySelector(".vd-result-number")?.textContent).toBe("1,440");
    expect(document.body.textContent).toContain("12");
  });

  it("expands the show-your-work panel", () => {
    render(<OhmsWheelScreen />);
    fireEvent.click(screen.getByText("How this was calculated"));
    expect(document.querySelector(".show-work-body")).toBeTruthy();
  });

  it("warns (never blocks) when only one value is entered", () => {
    render(<OhmsWheelScreen />);
    // Clear resistance so only voltage remains
    fireEvent.change(screen.getByLabelText("Resistance"), { target: { value: "" } });
    expect(document.querySelector(".warning-block")).toBeTruthy();
    expect(document.body.textContent).toContain("two");
  });
});
