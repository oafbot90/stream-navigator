import React, { useState } from 'react';
import { AlertTriangle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { reportService } from '@/services/reportService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ContentReportButtonProps {
  contentId: string;
  contentType: string;
  contentTitle: string;
}

const REPORT_OPTIONS = [
  { value: 'video_not_playing', label: 'Vídeo não reproduz' },
  { value: 'audio_issue', label: 'Problema com áudio' },
  { value: 'subtitle_issue', label: 'Legenda com problema' },
  { value: 'wrong_content', label: 'Conteúdo errado' },
  { value: 'buffering', label: 'Travando / Buffering' },
  { value: 'other', label: 'Outro problema' },
];

const ContentReportButton: React.FC<ContentReportButtonProps> = ({
  contentId,
  contentType,
  contentTitle,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!selectedType) {
      toast({ title: 'Selecione um problema', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Faça login para reportar', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      await reportService.submitReport({
        content_id: contentId,
        content_type: contentType,
        content_title: contentTitle,
        report_type: selectedType,
        message: message.trim() || undefined,
      });
      toast({ title: 'Relatório enviado!', description: 'Obrigado por nos ajudar a melhorar.' });
      setOpen(false);
      setSelectedType(null);
      setMessage('');
    } catch (err) {
      toast({ title: 'Erro ao enviar', description: 'Tente novamente mais tarde.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl border-border/50 hover:border-destructive/50 hover:text-destructive">
          <AlertTriangle size={16} />
          Reportar Problema
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Reportar Problema
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2">
          Conteúdo: <span className="font-medium text-foreground">{contentTitle}</span>
        </p>
        <div className="space-y-2">
          {REPORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedType(opt.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                selectedType === opt.value
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border/50 bg-card/50 text-muted-foreground hover:border-primary/30'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Descreva o problema (opcional)..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-2 rounded-xl resize-none"
          rows={3}
        />
        <Button onClick={handleSubmit} disabled={sending || !selectedType} className="w-full gap-2 mt-2">
          <Send size={16} />
          {sending ? 'Enviando...' : 'Enviar Relatório'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ContentReportButton;
