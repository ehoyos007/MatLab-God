'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';

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
  clearHistory: () => void;
}

const ChatCtx = createContext<ChatState | null>(null);

const STORAGE_KEY = 'matlabgod_chat_history';

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
  const isStreamingRef = useRef(false);

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save to localStorage when messages change (but not during streaming)
  useEffect(() => {
    if (!isStreamingRef.current && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const toggleOpen = useCallback(() => setIsOpen((v) => !v), []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    isStreamingRef.current = true;

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

      // Stream complete - save final messages
      isStreamingRef.current = false;
      setMessages((prev) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
        return prev;
      });
    } catch {
      isStreamingRef.current = false;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Check that your API key is set.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, challengeContext]);

  return (
    <ChatCtx.Provider value={{ messages, isOpen, challengeContext, isLoading, toggleOpen, setChallengeContext, sendMessage, clearHistory }}>
      {children}
    </ChatCtx.Provider>
  );
}
