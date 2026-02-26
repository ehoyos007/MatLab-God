'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChatContext } from '@/lib/ChatContext';

const MIN_WIDTH = 300;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 380;

export default function ChatSidebar() {
  const { messages, isOpen, isLoading, challengeContext, toggleOpen, sendMessage, clearHistory } = useChatContext();
  const [input, setInput] = useState('');
  const [followUpInputs, setFollowUpInputs] = useState<Record<number, string>>({});
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [exampleStates, setExampleStates] = useState<Record<number, 'loading' | 'done'>>({});
  const [exampleContent, setExampleContent] = useState<Record<number, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - e.clientX));
      setWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    // Consider "near bottom" if within 100px of the bottom
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    isNearBottomRef.current = true;
    setInput('');
    sendMessage(text);
  };

  const handleAskAboutChallenge = () => {
    if (!challengeContext) return;
    sendMessage(`Help me understand this challenge: "${challengeContext.title}". ${challengeContext.description}`);
  };

  const handleFollowUp = (index: number) => {
    const text = followUpInputs[index]?.trim();
    if (!text || isLoading) return;
    isNearBottomRef.current = true;
    setFollowUpInputs((prev) => ({ ...prev, [index]: '' }));
    sendMessage(text);
  };

  const handleExampleRequest = async (index: number) => {
    if (exampleStates[index] || isLoading) return;
    setExampleStates((prev) => ({ ...prev, [index]: 'loading' }));
    isNearBottomRef.current = true;

    // Build messages up to this point + ask for an example
    const contextMessages = messages.slice(0, index + 1).map(({ role, content }) => ({ role, content }));
    contextMessages.push({ role: 'user', content: 'Give me a short code example for what you just explained.' });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: contextMessages, challengeContext }),
      });
      if (!res.ok) throw new Error('Failed');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        const current = text;
        setExampleContent((prev) => ({ ...prev, [index]: current }));
      }

      setExampleStates((prev) => ({ ...prev, [index]: 'done' }));
    } catch {
      setExampleContent((prev) => ({ ...prev, [index]: 'Could not load example.' }));
      setExampleStates((prev) => ({ ...prev, [index]: 'done' }));
    }
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
        className="fixed top-0 right-0 z-40 h-full flex flex-col transition-transform duration-300"
        style={{
          width: `min(100vw, ${width}px)`,
          background: 'var(--color-panel)',
          borderLeft: '1px solid #1a1a2e',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Resize handle */}
        <div
          onMouseDown={startResize}
          className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize z-50 group"
        >
          <div className="w-full h-full bg-transparent group-hover:bg-[--color-cyan] transition-colors opacity-0 group-hover:opacity-40" />
        </div>
        {/* Header */}
        <div className="p-4 border-b border-[#1a1a2e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[--color-cyan] font-bold text-lg">MATLAB TUTOR</span>
            <span className="text-[--color-dim] text-xs">AI Assistant</span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-xs px-2 py-1 rounded border border-[--color-dim] text-[--color-dim] hover:border-[--color-pink] hover:text-[--color-pink] transition-colors"
              title="Clear chat history"
            >
              Clear
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-[--color-dim] text-sm text-center mt-8">
              Ask me anything about MATLAB!
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm chat-message ${msg.role === 'user' ? 'chat-user' : 'chat-assistant'}`}
                style={{
                  background: msg.role === 'user' ? 'rgba(0,255,245,0.15)' : 'rgba(57,255,20,0.1)',
                  color: msg.role === 'user' ? 'var(--color-cyan)' : 'var(--color-green)',
                  borderColor: msg.role === 'user' ? 'rgba(0,255,245,0.3)' : 'rgba(57,255,20,0.2)',
                  borderWidth: 1,
                }}
              >
                <ReactMarkdown
                  components={{
                    code: ({ className, children, ...props }) => {
                      const isBlock = className?.includes('language-');
                      if (isBlock) {
                        return (
                          <pre className="my-2 p-2 rounded bg-[#08080e] text-[--color-green] text-xs overflow-x-auto">
                            <code className={className} {...props}>{children}</code>
                          </pre>
                        );
                      }
                      return (
                        <code className="px-1 py-0.5 rounded bg-[#08080e] text-[--color-gold] text-xs" {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children }) => <>{children}</>,
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-[--color-text]">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:text-[--color-text]">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
              {/* Follow-up input + example button below assistant messages */}
              {msg.role === 'assistant' && msg.content && !isLoading && (
                <>
                  <div className="max-w-[85%] mt-1 flex gap-1">
                    <input
                      value={followUpInputs[i] || ''}
                      onChange={(e) => setFollowUpInputs((prev) => ({ ...prev, [i]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleFollowUp(i)}
                      placeholder="Follow up..."
                      className="flex-1 px-2 py-1 rounded text-xs bg-[#08080e] text-[--color-text] border border-[rgba(57,255,20,0.15)] focus:border-[--color-green] focus:outline-none placeholder:text-[--color-dim]"
                    />
                    <button
                      onClick={() => handleFollowUp(i)}
                      disabled={!followUpInputs[i]?.trim()}
                      className="px-2 py-1 rounded text-xs font-bold bg-[rgba(57,255,20,0.15)] text-[--color-green] disabled:opacity-30 hover:bg-[rgba(57,255,20,0.25)] transition-colors"
                    >
                      ASK
                    </button>
                  </div>
                  {!exampleStates[i] && (
                    <button
                      onClick={() => handleExampleRequest(i)}
                      className="max-w-[85%] mt-1 px-3 py-1.5 rounded-md text-xs font-bold border border-[--color-dim] text-[--color-dim] hover:border-[--color-gold] hover:text-[--color-gold] hover:shadow-[0_0_8px_rgba(255,213,0,0.15)] transition-all cursor-pointer"
                    >
                      Show me an example
                    </button>
                  )}
                  {exampleStates[i] === 'loading' && !exampleContent[i] && (
                    <div className="max-w-[85%] mt-1 px-3 py-1.5 text-xs text-[--color-dim]">
                      Loading example...
                    </div>
                  )}
                  {exampleContent[i] && (
                    <div
                      className="example-reveal max-w-[85%] mt-1 px-3 py-2 rounded-lg text-sm"
                      style={{
                        background: 'rgba(255,213,0,0.08)',
                        color: 'var(--color-gold)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,213,0,0.25)',
                      }}
                    >
                      <ReactMarkdown
                        components={{
                          code: ({ className, children, ...props }) => {
                            const isBlock = className?.includes('language-');
                            if (isBlock) {
                              return (
                                <pre className="my-2 p-2 rounded bg-[#08080e] text-[--color-green] text-xs overflow-x-auto">
                                  <code className={className} {...props}>{children}</code>
                                </pre>
                              );
                            }
                            return (
                              <code className="px-1 py-0.5 rounded bg-[#08080e] text-[--color-gold] text-xs" {...props}>
                                {children}
                              </code>
                            );
                          },
                          pre: ({ children }) => <>{children}</>,
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        }}
                      >
                        {exampleContent[i]}
                      </ReactMarkdown>
                    </div>
                  )}
                </>
              )}
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
