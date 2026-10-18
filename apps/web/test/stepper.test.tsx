import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Stepper } from "@/components/ui/Stepper";

describe("Stepper", () => {
  it("keeps a 0.25 kg weight exact when stepping by 2.5 kg (D-007)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper label="Weight" value={20.25} step={2.5} suffix="kg" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Increase Weight" }));
    await user.click(screen.getByRole("button", { name: "Decrease Weight" }));

    expect(onChange).toHaveBeenNthCalledWith(1, 22.75);
    expect(onChange).toHaveBeenNthCalledWith(2, 17.75);
  });

  it("still rounds away floating-point noise", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper label="Weight" value={0.1} step={0.2} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Increase Weight" }));
    expect(onChange).toHaveBeenCalledWith(0.3);
  });
});
