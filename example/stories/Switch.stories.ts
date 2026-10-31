import type { Meta, StoryObj } from "@codegrowers/storybook-jaspr-vite";

type Args = { checked: boolean };
const meta: Meta<Args> = {
  title: "Examples/Switch",
  component: "switch",
  tags: ["autodocs"],
  args: { checked: false },
  argTypes: { checked: { control: "boolean" } },
};
export default meta;

export const Default: StoryObj<Args> = {};
