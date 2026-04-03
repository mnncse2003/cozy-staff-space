import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  detectIntent, handleIntent, saveChatMessage, loadChatHistory,
  getSmartSuggestions, ChatbotMessage, ChatAction 
} from '@/lib/chatbotService';
import { Bot, X, Send, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ChatbotWidget() {
  const { user, userRole, organizationId } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && user && !historyLoaded) {
      loadChatHistory(user.uid).then(history => {
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([{
            role: 'assistant',
            content: `👋 Hi! I'm your HR Assistant. How can I help you today?\n\nType **help** to see what I can do.`,
          }]);
        }
        setHistoryLoaded(true);
      });
    }
  }, [isOpen, user, historyLoaded]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Prevent body scroll when chatbot is open on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMobile, isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !userRole) return;

    const userMessage: ChatbotMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    saveChatMessage(user.uid, organizationId, userMessage);

    const { intent } = detectIntent(userMessage.content);
    await new Promise(r => setTimeout(r, 400 + Math.random() * 400));
    const response = await handleIntent(intent, user.uid, userRole, organizationId);

    setMessages(prev => [...prev, response]);
    setIsTyping(false);

    saveChatMessage(user.uid, organizationId, response);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => sendMessage(), 100);
  };

  const handleActionClick = (action: ChatAction) => {
    if (action.route) {
      navigate(action.route);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `👋 Chat cleared! How can I help you?`,
    }]);
  };

  if (!user || !userRole) return null;

  const suggestions = getSmartSuggestions(userRole);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-105"
          aria-label="Open HR Assistant"
        >
          <Bot className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={cn(
          "fixed z-50 bg-card border border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300",
          isMobile
            ? "inset-0 rounded-none"
            : "bottom-6 right-6 w-[360px] sm:w-[400px] h-[550px] rounded-2xl"
        )}>
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">HR Assistant</p>
                <p className="text-xs opacity-80">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/20 h-8 text-xs px-2"
                onClick={clearChat}
              >
                Clear
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                )}>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    })}
                  </div>
                  
                  {msg.action && (
                    <button
                      onClick={() => handleActionClick(msg.action!)}
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors w-full justify-center"
                    >
                      <ArrowRight className="h-3 w-3" />
                      {msg.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Smart Suggestions */}
          {messages.length <= 1 && (
            <div className="px-3 sm:px-4 pb-2 flex flex-wrap gap-1.5">
              {suggestions.slice(0, isMobile ? 4 : 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(s)}
                  className="text-xs bg-muted hover:bg-accent text-foreground px-2.5 py-1.5 rounded-full transition-colors flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className={cn(
            "border-t border-border px-3 py-2.5 flex items-center gap-2 flex-shrink-0",
            isMobile && "pb-[env(safe-area-inset-bottom,8px)]"
          )}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              disabled={isTyping}
            />
            <Button
              size="icon"
              className="h-8 w-8 rounded-full flex-shrink-0"
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
