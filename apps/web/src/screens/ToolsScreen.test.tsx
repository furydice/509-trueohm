import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolsScreen } from "./ToolsScreen";

describe("ToolsScreen", () => {
  it("shows only TruePhase and does not call paid siblings free", () => {
    render(<ToolsScreen onBack={() => {}} />);
    expect(screen.getByText(/More.*Tools/)).toBeTruthy();
    expect(screen.getByText("TruePhase")).toBeTruthy();
    expect(screen.getByText("Free · Pro available")).toBeTruthy();
    expect(screen.queryByText(/TrueBox|TrueBend|TrueDrop|TrueFill|TrueRate/i)).toBeNull();
    expect(screen.queryByText(/Free electrical tools/i)).toBeNull();
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
    expect(links).toHaveLength(1);
    for (const item of links) {
      const anchor = item.closest("a");
      if (anchor) {
        expect(anchor.getAttribute("target")).toBe("_blank");
        expect(anchor.getAttribute("rel")).toBe("noreferrer");
        expect(anchor.getAttribute("href")).toBe("https://apps.apple.com/app/id6771228149");
      }
    }
  });
});
