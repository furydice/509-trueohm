import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolsScreen } from "./ToolsScreen";

describe("ToolsScreen", () => {
  it("renders the heading and all 8 app cards", () => {
    render(<ToolsScreen onBack={() => {}} />);
    expect(screen.getByText(/More.*Tools/)).toBeTruthy();
    const list = screen.getByRole("list");
    expect(list.querySelectorAll('[role="listitem"]').length).toBe(8);
  });

  it("shows each sibling app name", () => {
    render(<ToolsScreen onBack={() => {}} />);
    for (const name of [
      "TrueBend",
      "TrueDrop",
      "TrueFill",
      "TruePhase",
      "TrueFault",
      "TrueMotor",
      "TrueBox",
      "TrueRate",
    ]) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });

  it("calls onBack when the back button is clicked", () => {
    const onBack = vi.fn();
    render(<ToolsScreen onBack={onBack} />);
    fireEvent.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("renders external links with target=_blank", () => {
    render(<ToolsScreen onBack={() => {}} />);
    const links = screen.getAllByRole("listitem");
    for (const item of links) {
      const anchor = item.closest("a");
      if (anchor) {
        expect(anchor.getAttribute("target")).toBe("_blank");
      }
    }
  });
});
