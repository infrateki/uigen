"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
  state: "partial-call" | "call" | "result";
  result?: any;
}

interface ToolCallDisplayProps {
  toolInvocation: ToolInvocation;
}

function getToolDisplayMessage(toolName: string, args: Record<string, any>): string {
  switch (toolName) {
    case "str_replace_editor":
      const command = args.command;
      const path = args.path;
      const filename = path ? path.split('/').pop() || path : '';
      
      switch (command) {
        case "create":
          return `Creating file: ${filename}`;
        case "str_replace":
          return `Editing file: ${filename}`;
        case "view":
          return `Viewing file: ${filename}`;
        case "insert":
          return `Inserting into file: ${filename}`;
        default:
          return `Working with file: ${filename}`;
      }
    
    case "file_manager":
      const action = args.action;
      const filePath = args.path;
      const fileName = filePath ? filePath.split('/').pop() || filePath : '';
      
      switch (action) {
        case "create":
          return `Creating file: ${fileName}`;
        case "list":
          return "Exploring project files";
        case "read":
          return `Reading file: ${fileName}`;
        case "write":
          return `Writing file: ${fileName}`;
        case "delete":
          return `Deleting file: ${fileName}`;
        default:
          return "Managing project files";
      }
    
    default:
      return toolName.replace(/_/g, ' ');
  }
}

export function ToolCallDisplay({ toolInvocation }: ToolCallDisplayProps) {
  const displayMessage = getToolDisplayMessage(toolInvocation.toolName, toolInvocation.args);
  const isComplete = toolInvocation.state === "result" && toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-neutral-700">{displayMessage}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{displayMessage}</span>
        </>
      )}
    </div>
  );
}