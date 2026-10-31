import type { Meta, StoryObj } from "@codegrowers/storybook-jaspr-vite";
import { expect } from "storybook/test";

type Args = { label: string; disabled: boolean };
const meta: Meta<Args> = {
  title: "Examples/Button",
  component: "button",
  tags: ["autodocs"],
  args: { label: "Save", disabled: false },
  argTypes: { label: { control: "text" }, disabled: { control: "boolean" } },
};
export default meta;

export const Default: StoryObj<Args> = {
  play: async ({ canvas, args }) => {
    await expect(canvas.getByRole("button")).toHaveTextContent(args.label);
    await expect(canvas.getByRole("button")).toBeEnabled();
  },
};
export const Disabled: StoryObj<Args> = { args: { disabled: true } };
