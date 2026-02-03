'use client';

import { useState, useRef, useEffect } from 'react';
import { useChatContext } from '@/lib/ChatContext';

function formatMessage(content: string) {
  // Split on code blocks and render them differently
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const code = part.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
      return (
        <pre key={i} className="my-2 p-2 rounded bg-[#08080e] text-[--color-green] text-xs overflow-x-auto">
          <code>{code}</code>
        </pre>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatSidebar() {
  const { messages, isOpen, isLoading, challengeContext, toggleOpen, sendMessage } = useChatContext();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
  };

  const handleAskAboutChallenge = () => {
    if (!challengeContext) return;
    sendMessage(`Help me understand this challenge: "${challengeContext.title}". ${challengeContext.description}`);
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110"
        style={{
          background: 'var(--color-cyan)',
          color: 'var(--color-bg)',
          boxShadow: '0 0 20px rgba(0,255,245,0.4)',
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Sidebar */}
      <div
        className="fixed top-0 right-0 z-40 h-full w-full sm:w-[380px] flex flex-col transition-transform duration-300"
        style={{
          background: 'var(--color-panel)',
          borderLeft: '1px solid #1a1a2e',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1a1a2e] flex items-center gap-2">
          <span className="text-[--color-cyan] font-bold text-lg">MATLAB TUTOR</span>
          <span className="text-[--color-dim] text-xs">AI Assistant</span>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-[--color-dim] text-sm text-center mt-8">
              Ask me anything about MATLAB!
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap"
                style={{
                  background: msg.role === 'user' ? 'rgba(0,255,245,0.15)' : 'rgba(57,255,20,0.1)',
                  color: msg.role === 'user' ? 'var(--color-cyan)' : 'var(--color-green)',
                  borderColor: msg.role === 'user' ? 'rgba(0,255,245,0.3)' : 'rgba(57,255,20,0.2)',
                  borderWidth: 1,
                }}
              >
                {formatMessage(msg.content)}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-lg text-sm text-[--color-dim]">
                Thinking...
              </div>
            </div>
          )}
        </div>

        {/* Quick action */}
        {challengeContext && (
          <div className="px-4 pb-2">
            <button
              onClick={handleAskAboutChallenge}
              disabled={isLoading}
              className="w-full text-xs px-3 py-3 rounded-lg border border-[--color-gold] text-[--color-gold] hover:bg-[rgba(255,213,0,0.1)] transition-colors disabled:opacity-40"
            >
              Ask about this challenge
            </button>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-[#1a1a2e] flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about MATLAB..."
            className="flex-1 px-3 py-3 rounded-lg text-sm bg-[--color-code-bg] text-[--color-text] border border-[#1a1a2e] focus:border-[--color-cyan] focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 rounded-lg font-bold text-sm bg-[--color-cyan] text-[--color-bg] disabled:opacity-40 hover:shadow-[0_0_10px_var(--color-cyan)] transition-all"
          >
            SEND
          </button>
        </div>
      </div>
    </>
  );
}
