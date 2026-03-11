"use client";

import { useEffect, useRef } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/lib/contexts/chat-context";

export function ChatInterface() {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit, status } = useChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full p-4 overflow-hidden">
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <div className="pr-4">
          {messages.length === 0 && (
            <div className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
              <h2 className="text-sm font-semibold text-neutral-800 mb-1.5">About UIGen</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Describe a UI component in plain English — Claude generates the React code, previews it live, and updates it as you iterate.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-neutral-500">
                <li className="flex items-start gap-2"><span className="text-neutral-400">•</span>Live preview updates as code streams in</li>
                <li className="flex items-start gap-2"><span className="text-neutral-400">•</span>Switch to Code to inspect or edit the files</li>
              </ul>
            </div>
          )}
          <MessageList messages={messages} isLoading={status === "streaming"} />
        </div>
      </ScrollArea>
      <div className="mt-4 flex-shrink-0">
        <MessageInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={status === "submitted" || status === "streaming"}
        />
      </div>
    </div>
  );
}
