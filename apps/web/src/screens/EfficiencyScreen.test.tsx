import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EfficiencyScreen } from "./EfficiencyScreen";

describe("EfficiencyScreen", () => {
  it("computes 1800 W / 2000 W = 90%", () => {
    render(<EfficiencyScreen />);
    expect(document.querySelector(".vd-result-number")?.textContent).toBe("90");
  });

  it("expands the show-your-work panel", () => {
    render(<EfficiencyScreen />);
    fireEvent.click(screen.getByText("How this was calculated"));
    expect(document.querySelector(".show-work-body")).toBeTruthy();
  });

  it("warns when efficiency exceeds 100%", () => {
    render(<EfficiencyScreen />);
    // Set output > input (impossible, should warn)
    fireEvent.change(screen.getByLabelText("Output power"), { target: { value: "2500" } });
    expect(document.querySelector(".warning-block")).toBeTruthy();
  });
});
