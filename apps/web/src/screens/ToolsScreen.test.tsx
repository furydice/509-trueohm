import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ToolsScreen } from "./ToolsScreen";

describe("ToolsScreen", () => {
  it("states the free, offline, and no-account promise exactly", () => {
    render(<ToolsScreen onBack={() => {}} />);
    expect(
      screen.getByText("TrueOhm is free, works offline, and requires no account."),
    ).toBeTruthy();
  });

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

  it("renders the only companion as a safe accessible App Store link", () => {
    render(<ToolsScreen onBack={() => {}} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    const link = screen.getByRole("link", {
      name: /^TruePhase.*Wire colors and panel schedules.*View on App Store$/,
    });
    expect(link.getAttribute("aria-label")).toBe(
      "TruePhase — Wire colors and panel schedules — View on App Store",
    );
    expect(link.textContent).toContain("TruePhase");
    expect(link.textContent).toContain("Free · Pro available");
    expect(link.getAttribute("href")).toBe("https://apps.apple.com/app/id6771228149");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
  });
});
