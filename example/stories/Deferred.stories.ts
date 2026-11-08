import type { Meta, StoryObj } from "@codegrowers/storybook-jaspr-vite";
import { expect } from "storybook/test";

type Args = { name: string };
const meta: Meta<Args> = {
  title: "Examples/Deferred",
  component: "deferred",
  tags: ["autodocs"],
  args: { name: "Storybook" },
  argTypes: { name: { control: "text" } },
};
export default meta;

export const Default: StoryObj<Args> = {
  play: async ({ canvas, args }) => {
    await expect(
      await canvas.findByText(`Loaded on demand for ${args.name}`),
    ).toBeVisible();
  },
};
