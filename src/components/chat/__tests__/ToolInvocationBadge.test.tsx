import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getLabel } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// --- getLabel unit tests ---

test("getLabel: str_replace_editor create shows filename", () => {
  expect(getLabel("str_replace_editor", { command: "create", path: "/src/App.jsx" })).toBe("Creating App.jsx");
});

test("getLabel: str_replace_editor create with no path", () => {
  expect(getLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("getLabel: str_replace_editor str_replace shows filename", () => {
  expect(getLabel("str_replace_editor", { command: "str_replace", path: "/src/components/Button.tsx" })).toBe("Editing Button.tsx");
});

test("getLabel: str_replace_editor insert shows filename", () => {
  expect(getLabel("str_replace_editor", { command: "insert", path: "/src/index.ts" })).toBe("Editing index.ts");
});

test("getLabel: str_replace_editor view shows filename", () => {
  expect(getLabel("str_replace_editor", { command: "view", path: "/src/App.jsx" })).toBe("Viewing App.jsx");
});

test("getLabel: str_replace_editor undo_edit shows filename", () => {
  expect(getLabel("str_replace_editor", { command: "undo_edit", path: "/src/App.jsx" })).toBe("Undoing edit on App.jsx");
});

test("getLabel: str_replace_editor undo_edit with no path", () => {
  expect(getLabel("str_replace_editor", { command: "undo_edit" })).toBe("Undoing edit");
});

test("getLabel: file_manager rename shows filename", () => {
  expect(getLabel("file_manager", { command: "rename", path: "/src/Old.jsx" })).toBe("Renaming Old.jsx");
});

test("getLabel: file_manager delete shows filename", () => {
  expect(getLabel("file_manager", { command: "delete", path: "/src/Unused.tsx" })).toBe("Deleting Unused.tsx");
});

test("getLabel: file_manager delete with no path", () => {
  expect(getLabel("file_manager", { command: "delete" })).toBe("Deleting file");
});

test("getLabel: unknown tool falls back to tool name", () => {
  expect(getLabel("some_other_tool", {})).toBe("some_other_tool");
});

test("getLabel: partial-call with empty args falls back gracefully", () => {
  expect(getLabel("str_replace_editor", {})).toBe("str_replace_editor");
});

// --- ToolInvocationBadge render tests ---

test("shows label and done indicator when state is result", () => {
  const invocation: ToolInvocation = {
    state: "result",
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/App.jsx" },
    result: "ok",
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={invocation} />);

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is call", () => {
  const invocation: ToolInvocation = {
    state: "call",
    toolCallId: "2",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/src/Card.tsx" },
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={invocation} />);

  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows spinner when state is partial-call", () => {
  const invocation: ToolInvocation = {
    state: "partial-call",
    toolCallId: "3",
    toolName: "str_replace_editor",
    args: {},
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={invocation} />);

  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("shows friendly label for file_manager delete", () => {
  const invocation: ToolInvocation = {
    state: "result",
    toolCallId: "4",
    toolName: "file_manager",
    args: { command: "delete", path: "/src/OldComponent.tsx" },
    result: { success: true },
  };

  render(<ToolInvocationBadge toolInvocation={invocation} />);

  expect(screen.getByText("Deleting OldComponent.tsx")).toBeDefined();
});

test("shows friendly label for file_manager rename", () => {
  const invocation: ToolInvocation = {
    state: "call",
    toolCallId: "5",
    toolName: "file_manager",
    args: { command: "rename", path: "/src/Foo.tsx", new_path: "/src/Bar.tsx" },
  };

  render(<ToolInvocationBadge toolInvocation={invocation} />);

  expect(screen.getByText("Renaming Foo.tsx")).toBeDefined();
});
