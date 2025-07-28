import { test, expect, describe, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallDisplay } from "../ToolCallDisplay";

afterEach(() => {
  cleanup();
});

describe("ToolCallDisplay", () => {
  const baseToolInvocation = {
    toolCallId: "test-id",
    toolName: "str_replace_editor",
    args: {},
    state: "result" as const,
    result: "Success",
  };

  describe("str_replace_editor tool", () => {
    test("displays 'Creating file' for create command", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        args: {
          command: "create",
          path: "src/components/Button.tsx",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("Creating file: Button.tsx")).toBeDefined();
    });

    test("displays 'Editing file' for str_replace command", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        args: {
          command: "str_replace",
          path: "src/components/Card.tsx",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("Editing file: Card.tsx")).toBeDefined();
    });

    test("displays 'Viewing file' for view command", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        args: {
          command: "view",
          path: "src/lib/utils.ts",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("Viewing file: utils.ts")).toBeDefined();
    });

    test("displays 'Inserting into file' for insert command", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        args: {
          command: "insert",
          path: "src/hooks/useAuth.ts",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("Inserting into file: useAuth.ts")).toBeDefined();
    });

    test("displays generic message for unknown command", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        args: {
          command: "unknown",
          path: "src/test.js",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("Working with file: test.js")).toBeDefined();
    });

    test("handles paths without filename extension", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        args: {
          command: "create",
          path: "README",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("Creating file: README")).toBeDefined();
    });

    test("handles nested file paths", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        args: {
          command: "create",
          path: "src/components/ui/button/Button.tsx",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("Creating file: Button.tsx")).toBeDefined();
    });
  });

  describe("file_manager tool", () => {
    test("displays 'Creating file' for create action", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        toolName: "file_manager",
        args: {
          action: "create",
          path: "src/NewComponent.tsx",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("Creating file: NewComponent.tsx")).toBeDefined();
    });

    test("displays 'Exploring project files' for list action", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        toolName: "file_manager",
        args: {
          action: "list",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("Exploring project files")).toBeDefined();
    });

    test("displays 'Reading file' for read action", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        toolName: "file_manager",
        args: {
          action: "read",
          path: "package.json",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("Reading file: package.json")).toBeDefined();
    });

    test("displays generic message for unknown action", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        toolName: "file_manager",
        args: {
          action: "unknown",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("Managing project files")).toBeDefined();
    });
  });

  describe("unknown tools", () => {
    test("displays formatted tool name for unknown tools", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        toolName: "custom_api_tool",
        args: {},
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("custom api tool")).toBeDefined();
    });
  });

  describe("loading states", () => {
    test("shows loading spinner when tool is not complete", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        state: "call" as const,
        result: undefined,
        args: {
          command: "create",
          path: "src/Loading.tsx",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("Creating file: Loading.tsx")).toBeDefined();
      // Check for loading spinner by looking for the Loader2 component's class
      const spinner = document.querySelector(".animate-spin");
      expect(spinner).toBeDefined();
    });

    test("shows success indicator when tool is complete", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        state: "result" as const,
        result: "Success",
        args: {
          command: "create",
          path: "src/Success.tsx",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText("Creating file: Success.tsx")).toBeDefined();
      // Check for success indicator
      const successDot = document.querySelector(".bg-emerald-500");
      expect(successDot).toBeDefined();
    });
  });

  describe("edge cases", () => {
    test("handles missing path gracefully", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        args: {
          command: "create",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText(/Creating file:/)).toBeDefined();
    });

    test("handles empty path gracefully", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        args: {
          command: "create",
          path: "",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText(/Creating file:/)).toBeDefined();
    });

    test("handles path that is just a directory", () => {
      const toolInvocation = {
        ...baseToolInvocation,
        args: {
          command: "create",
          path: "src/",
        },
      };

      render(<ToolCallDisplay toolInvocation={toolInvocation} />);
      expect(screen.getByText(/Creating file:/)).toBeDefined();
    });
  });
});