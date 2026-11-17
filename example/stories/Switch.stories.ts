import type { Meta, StoryObj } from "@codegrowers/storybook-jaspr-vite";
import { expect, userEvent, waitFor } from "storybook/test";

type Args = { checked: boolean };
const meta: Meta<Args> = {
  title: "Examples/Switch",
  component: "switch",
  tags: ["autodocs"],
  args: { checked: false },
  argTypes: { checked: { control: "boolean" } },
};
export default meta;

export const Default: StoryObj<Args> = {
  play: async ({ canvas }) => {
    const control = canvas.getByRole("switch");
    await userEvent.click(control);
    await waitFor(() =>
      expect(control).toHaveAttribute("aria-checked", "true"),
    );
    await userEvent.click(control);
    await waitFor(() =>
      expect(control).toHaveAttribute("aria-checked", "false"),
    );
  },
};
