import { fileURLToPath } from "node:url";
import type { PresetProperty } from "storybook/internal/types";

export const previewAnnotations: PresetProperty<"previewAnnotations"> = (
  entries = [],
) => [...entries, fileURLToPath(import.meta.resolve("./preview.js"))];
