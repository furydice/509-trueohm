import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EnergyCostScreen } from "./EnergyCostScreen";

describe("EnergyCostScreen", () => {
  it("computes 5 kW × 8 h × $0.12 = $4.80 cost, 40 kWh", () => {
    render(<EnergyCostScreen />);
    // Hero shows cost with $ prefix
    expect(document.querySelector(".vd-result-number")?.textContent).toBe("$4.80");
    expect(document.body.textContent).toContain("40");
  });

  it("expands the show-your-work panel", () => {
    render(<EnergyCostScreen />);
    fireEvent.click(screen.getByText("How this was calculated"));
    expect(document.querySelector(".show-work-body")).toBeTruthy();
  });

  it("shows $0.00 cost when power is 0", () => {
    render(<EnergyCostScreen />);
    fireEvent.change(screen.getByLabelText("Power"), { target: { value: "0" } });
    expect(document.querySelector(".vd-result-number")?.textContent).toBe("$0.00");
  });
});
