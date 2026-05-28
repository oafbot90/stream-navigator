import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Loader2, CheckCircle2, BadgeCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { savePendingPix, clearPendingPix } from '@/hooks/usePendingPix';

interface Props {
  open: boolean;
  onClose: () => void;
  pixCode: string;
  amount: number;
  paymentId: string;
  expiresAt?: string;
  onPaid?: () => void;
}

const PixPaymentModal: React.FC<Props> = ({ open, onClose, pixCode, amount, paymentId, expiresAt, onPaid }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [paid, setPaid] = useState(false);
  const [checking, setChecking] = useState(false);

  // Salva o PIX como pendente assim que o modal abre — para retomar
  // verificação caso o usuário feche o app antes da confirmação.
  useEffect(() => {
    if (open && paymentId && !paid) {
      savePendingPix({ paymentId, amount, createdAt: Date.now() });
    }
  }, [open, paymentId, amount, paid]);

  const verifyPayment = async (manual = false) => {
    setChecking(true);
    try {
      const { data } = await supabase.functions.invoke('orionpay-check-status', {
        body: { paymentId },
      });
      if (data?.paid) {
        setPaid(true);
        clearPendingPix();
        toast({ title: '🎉 Pagamento aprovado!', description: 'Sua assinatura está ativa.' });
        onPaid?.();
        setTimeout(() => onClose(), 2500);
      } else if (manual) {
        toast({
          title: 'Pagamento ainda não identificado',
          description: 'Pode levar 1–2 minutos. Tente novamente em instantes.',
        });
      }
    } catch (e) {
      console.error(e);
      if (manual) toast({ title: 'Erro ao verificar', variant: 'destructive' });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!open || paid) return;
    const interval = setInterval(() => verifyPayment(false), 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, paid, paymentId]);

  const copy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast({ title: 'Código copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{paid ? 'Pagamento confirmado!' : 'Pague com PIX'}</DialogTitle>
          <DialogDescription>
            {paid ? 'Sua assinatura foi ativada com sucesso.' : `Total: R$ ${amount.toFixed(2)}`}
          </DialogDescription>
        </DialogHeader>

        {paid ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <CheckCircle2 className="h-20 w-20 text-green-500" />
            <p className="text-center text-muted-foreground">Aproveite seu plano!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={pixCode} size={220} />
            </div>

            <div className="w-full">
              <p className="text-xs text-muted-foreground mb-2">PIX Copia e Cola:</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={pixCode}
                  className="flex-1 px-3 py-2 text-xs bg-muted rounded-md border border-border truncate"
                />
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {checking ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Verificando pagamento...</>
              ) : (
                <>Aguardando pagamento — verificando automaticamente</>
              )}
            </div>

            <Button
              variant="default"
              className="w-full"
              onClick={() => verifyPayment(true)}
              disabled={checking}
            >
              <BadgeCheck className="h-4 w-4 mr-2" />
              {checking ? 'Verificando...' : 'Já paguei'}
            </Button>

            {expiresAt && (
              <p className="text-xs text-muted-foreground">
                Expira em: {new Date(expiresAt).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PixPaymentModal;
