export interface JasprRuntime {
  protocolVersion: 1;
  mount(
    instanceId: string,
    component: string,
    hostId: string,
    args: Record<string, unknown>,
    globals: Record<string, unknown>,
    emit: (type: string, payload: unknown) => void,
  ): Promise<unknown>;
  update(
    instanceId: string,
    args: Record<string, unknown>,
    globals: Record<string, unknown>,
  ): Promise<unknown>;
  unmount(instanceId: string): void;
}

declare global {
  interface Window {
    __jasprStorybook?: JasprRuntime;
  }
}

export function checkRuntime(value: unknown): JasprRuntime {
  if (
    typeof value !== "object" ||
    value === null ||
    !("protocolVersion" in value) ||
    value.protocolVersion !== 1 ||
    !("mount" in value) ||
    typeof value.mount !== "function" ||
    !("update" in value) ||
    typeof value.update !== "function" ||
    !("unmount" in value) ||
    typeof value.unmount !== "function"
  ) {
    throw new Error(
      "Incompatible Jaspr Storybook runtime. Use matching Dart and npm package versions.",
    );
  }
  return value as JasprRuntime;
}

/** Normalize optional values and reject callbacks, cycles and opaque objects. */
export function checkRecord(
  value: unknown,
  label: string,
): Record<string, unknown> {
  const ancestors = new Set<object>();
  const visit = (item: unknown, path: string): unknown => {
    if (item === null || typeof item === "string" || typeof item === "boolean")
      return item;
    if (typeof item === "number" && Number.isFinite(item)) return item;
    if (typeof item !== "object" || item === null) {
      throw new Error(
        `${path} must contain JSON-compatible values. Send callbacks through story.action().`,
      );
    }
    if (ancestors.has(item))
      throw new Error(`${path} contains a circular reference.`);
    if (
      !Array.isArray(item) &&
      Object.getPrototypeOf(item) !== Object.prototype &&
      Object.getPrototypeOf(item) !== null
    ) {
      throw new Error(`${path} must contain plain objects and arrays.`);
    }
    ancestors.add(item);
    const result = Array.isArray(item)
      ? Array.from(item, (child, index) =>
          child === undefined ? null : visit(child, `${path}.${index}`),
        )
      : Object.fromEntries(
          Object.entries(item)
            .filter(([, child]) => child !== undefined)
            .map(([key, child]) => [key, visit(child, `${path}.${key}`)]),
        );
    ancestors.delete(item);
    return result;
  };
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return visit(value, label) as Record<string, unknown>;
}
