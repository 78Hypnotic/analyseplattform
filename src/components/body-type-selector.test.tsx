import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BodyTypeSelector } from "./body-type-selector";

describe("BodyTypeSelector", () => {
  it("offers every body type with its technical term", () => {
    render(<BodyTypeSelector sex="female" value="" onChange={() => {}} />);

    expect(screen.getByText("Schlank")).toBeTruthy();
    expect(screen.getByText("ektomorph")).toBeTruthy();
    expect(screen.getByText("Athletisch")).toBeTruthy();
    expect(screen.getByText("mesomorph")).toBeTruthy();
    expect(screen.getByText("Kräftig")).toBeTruthy();
    expect(screen.getByText("endomorph")).toBeTruthy();
  });

  it("reports the selected body type", () => {
    const onChange = vi.fn();
    render(<BodyTypeSelector sex="male" value="" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /mesomorph/ }));

    expect(onChange).toHaveBeenCalledWith("mesomorph");
  });

  it("marks the active body type as pressed", () => {
    render(<BodyTypeSelector sex="male" value="endomorph" onChange={() => {}} />);

    expect(screen.getByRole("button", { name: /endomorph/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /ektomorph/ }).getAttribute("aria-pressed")).toBe("false");
  });
});
