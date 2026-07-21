import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { searchProducts, generateResponse, parseQuery } from '@/lib/ai';
import { X, MessageCircle, Send, Sparkles, ShoppingBag, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  products?: number[];
}

const WELCOME_MESSAGE: Message = {
  id: 0,
  role: 'assistant',
  text: `👋 Hi! I'm your AI shopping assistant. I can help you find products!\n\nTry asking me things like:\n• "wireless headphones under 2000"\n• "best coffee gifts"\n• "red dress size M"\n• "recommend something for my mom"`,
};

const QUICK_SUGGESTIONS = [
  '📱 Cheap headphones',
  '🎁 Birthday gift ideas',
  '☕ Best Ethiopian coffee',
  '👗 Traditional dress',
  '💄 Beauty products under 1000',
  '🏠 Home appliances',
];

export default function AIChat() {
  const navigate = useNavigate();
  const { products } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  let msgId = useRef(1);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: msgId.current++, role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(r => setTimeout(r, 600 + Math.random() * 600));

    const results = searchProducts(products, text);
    const response = generateResponse(text, results, products);
    const assistantMsg: Message = {
      id: msgId.current++,
      role: 'assistant',
      text: response,
      products: results.slice(0, 4).map(p => p.id),
    };
    setMessages(prev => [...prev, assistantMsg]);
    setIsTyping(false);
  }, [products]);

  const handleSuggestion = useCallback((suggestion: string) => {
    handleSend(suggestion);
  }, [handleSend]);

  const openProduct = useCallback((id: number) => {
    setIsOpen(false);
    navigate(`/product/${id}`);
  }, [navigate]);

  return (
    <>
      {/* FAB Button */}
      <button
        className={cn(
          'fixed bottom-20 right-4 w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center z-50 transition-all duration-300 hover:scale-110 active:scale-90',
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100',
          'bg-gradient-to-br from-primary to-blue-600 text-white'
        )}
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
      >
        <MessageCircle size={22} />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-2xl animate-ping bg-primary/30" />
      </button>

      {/* Chat Panel */}
      <div className={cn(
        'fixed inset-0 z-[100] flex flex-col bg-background transition-all duration-300',
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
      )}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-primary to-blue-600 text-white px-4 pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <Sparkles size={18} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">AI Shopping Assistant</h3>
              <p className="text-[10px] text-white/60">Ask me anything about products</p>
            </div>
            <button className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-card border border-border/60 rounded-bl-md shadow-sm'
              )}>
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Product cards */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {msg.products.map(pid => {
                      const p = products.find(x => x.id === pid);
                      if (!p) return null;
                      return (
                        <div key={pid} className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors" onClick={() => openProduct(pid)}>
                          <img src={p.image} alt={p.nameEn} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold line-clamp-1">{p.nameEn}</div>
                            <div className="text-[11px] font-bold text-primary">Br {p.price.toLocaleString()}</div>
                          </div>
                          <ShoppingBag size={14} className="text-muted-foreground" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border border-border/60 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}

          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {QUICK_SUGGESTIONS.map((s, i) => (
                <button key={i} className="px-3 py-1.5 rounded-xl bg-muted/60 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border/40"
                  onClick={() => handleSuggestion(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="sticky bottom-0 bg-background border-t border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask me anything..."
              className="flex-1 p-3 rounded-2xl border border-border/60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(input); }}
            />
            <button
              className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all disabled:opacity-50 shadow-lg"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
            >
              {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
