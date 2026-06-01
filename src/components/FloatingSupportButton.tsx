import React, { useState } from 'react';
import { MessageCircle, X, Mail, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const WHATSAPP_URL = 'https://chat.whatsapp.com/JVE5yDqD2nu5JfrjJgKeEt?s=cl&p=i&ilr=4';
const TELEGRAM_URL = 'https://t.me/fliixxhub';

const FloatingSupportButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[60] flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-transform hover:scale-105"
            aria-label="Falar no WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#229ED9] hover:bg-[#1a87b8] text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-transform hover:scale-105"
            aria-label="Falar no Telegram"
          >
            <Send className="h-4 w-4" />
            Telegram
          </a>
          <Link
            to="/contact"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 bg-card hover:bg-muted text-foreground text-sm font-medium px-4 py-2.5 rounded-full shadow-lg border border-border transition-transform hover:scale-105"
            aria-label="Enviar email"
          >
            <Mail className="h-4 w-4" />
            Contato
          </Link>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all',
          'bg-gradient-to-br from-primary to-primary/70 hover:scale-110 active:scale-95',
          open && 'rotate-90'
        )}
        aria-label={open ? 'Fechar suporte' : 'Abrir suporte'}
      >
        {open ? (
          <X className="h-6 w-6 text-primary-foreground" />
        ) : (
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        )}
      </button>
    </div>
  );
};

export default FloatingSupportButton;
