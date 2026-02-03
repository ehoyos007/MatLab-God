'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChallengeContext {
  title: string;
  description: string;
  type: string;
  code: string;
  module: number;
}

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  challengeContext: ChallengeContext | null;
  isLoading: boolean;
  toggleOpen: () => void;
  setChallengeContext: (ctx: ChallengeContext | null) => void;
  sendMessage: (content: string) => Promise<void>;
}

const ChatCtx = createContext<ChatState | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [challengeContext, setChallengeContext] = useState<ChallengeContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleOpen = useCallback(() => setIsOpen((v) => !v), []);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const allMessages = [...messages, userMsg].map(({ role, content }) => ({ role, content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: allMessages,
          challengeContext,
        }),
      });

      if (!res.ok) throw new Error('Chat request failed');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        const text = assistantText;
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: text },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Check that your API key is set.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, challengeContext]);

  return (
    <ChatCtx.Provider value={{ messages, isOpen, challengeContext, isLoading, toggleOpen, setChallengeContext, sendMessage }}>
      {children}
    </ChatCtx.Provider>
  );
}
