import type { Meta, StoryObj } from "@codegrowers/storybook-jaspr-vite";

type Args = { label: string };
const meta: Meta<Args> = {
  title: "Examples/Counter",
  component: "counter",
  tags: ["autodocs"],
  args: { label: "Count" },
  argTypes: { label: { control: "text" } },
};
export default meta;

export const First: StoryObj<Args> = {};
export const Second: StoryObj<Args> = { args: { label: "Independent" } };
