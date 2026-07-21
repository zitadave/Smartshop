import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/AppStore';
import { ChevronLeft, MessageCircle, Phone, Mail, HelpCircle, ChevronRight, Send } from 'lucide-react';
import { toast } from '@/components/Toast';

const FAQS = [
  { q: 'How do I place an order?', a: 'Browse products, add items to cart, then proceed to checkout. Fill in delivery details and confirm.' },
  { q: 'What payment methods are accepted?', a: 'We accept Telebirr, CBE Birr, and Cash on Delivery across Ethiopia.' },
  { q: 'How long does delivery take?', a: 'Delivery typically takes 2-5 business days within Addis Ababa and 5-10 days for other regions.' },
  { q: 'Can I return a product?', a: 'Yes! Returns are accepted within 7 days of delivery. Contact our support team to initiate.' },
  { q: 'How do I track my order?', a: 'Go to Orders → select your order → Live Tracking. You can also use the Tracking page.' },
  { q: 'What are loyalty points?', a: 'Earn points through purchases, daily streaks, and games. Convert them to cash in Game Center!' },
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const { addNotification } = useStore();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const sendMessage = () => {
    if (!message.trim()) return;
    addNotification('💬', 'Support message sent: ' + message);
    toast('✅ Message sent! We\'ll respond within 24 hours.', 'success');
    setMessage('');
  };

  return (
    <div className="px-3 pt-3 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-1 hover:bg-muted rounded-lg transition-colors"><ChevronLeft size={20} /></button>
        <h2 className="text-base font-bold">❓ Help & Support</h2>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { icon: '💬', label: 'Live Chat', desc: 'Online now', href: '#' },
          { icon: '📞', label: 'Call Us', desc: '+251-911-XXXXXX', href: 'tel:+251911XXXXXX' },
          { icon: '📧', label: 'Email', desc: 'support@smartshop.et', href: 'mailto:support@smartshop.et' },
          { icon: '📱', label: 'Telegram', desc: '@SmartShopET', href: '#' },
        ].map((c, i) => (
          <a key={i} href={c.href} className="bg-card rounded-xl border border-border p-3 hover:shadow-sm transition-all text-center"
            onClick={(e) => { if (c.href === '#') { e.preventDefault(); toast('📱 Connect on Telegram: @SmartShopET', 'info'); } }}>
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-xs font-semibold">{c.label}</div>
            <div className="text-[9px] text-muted-foreground">{c.desc}</div>
          </a>
        ))}
      </div>

      {/* FAQ */}
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
        <HelpCircle size={12} /> Frequently Asked Questions
      </h3>
      <div className="space-y-1">
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
            <button className="w-full flex items-center justify-between p-3 text-left text-xs font-medium"
              onClick={() => setExpanded(expanded === i ? null : i)}>
              <span>{faq.q}</span>
              <ChevronRight size={14} className={cn('transition-transform flex-shrink-0', expanded === i && 'rotate-90')} />
            </button>
            {expanded === i && (
              <div className="px-3 pb-3 text-[10px] text-muted-foreground animate-slideDown">{faq.a}</div>
            )}
          </div>
        ))}
      </div>

      {/* Send Message */}
      <div className="mt-4 bg-card rounded-xl border border-border p-3">
        <h3 className="text-xs font-semibold mb-2">Send us a message</h3>
        <textarea className="w-full p-2.5 border border-input rounded-lg text-xs bg-card resize-none h-20 mb-2"
          placeholder="How can we help?" value={message} onChange={e => setMessage(e.target.value)} />
        <button className="w-full py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
          onClick={sendMessage} disabled={!message.trim()}>
          <Send size={12} /> Send Message
        </button>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
