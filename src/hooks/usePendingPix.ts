import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'flixhub:pendingPix';
const MAX_ATTEMPTS = 30;   // 30 tentativas
const INTERVAL_MS  = 8000; // a cada 8s = ~4 minutos no total

export interface PendingPix {
  paymentId: string;
  amount?: number;
  createdAt: number;
}

export const savePendingPix = (pix: PendingPix) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pix)); } catch {}
};

export const getPendingPix = (): PendingPix | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as PendingPix : null;
  } catch { return null; }
};

export const clearPendingPix = () => {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
};

/**
 * usePendingPix
 *
 * Ao carregar a página:
 * 1. Verifica se há PIX pendente no localStorage
 * 2. Se sim, consulta o status a cada 8s por até 4 minutos
 * 3. Se COMPLETED → ativa premium e mostra toast
 * 4. Se usuário fechar e reabrir o site → retoma verificação automaticamente
 */
export const usePendingPix = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const pending = getPendingPix();
    if (!pending?.paymentId) return;

    // Descarta PIX com mais de 24h
    if (Date.now() - pending.createdAt > 24 * 60 * 60 * 1000) {
      clearPendingPix();
      return;
    }

    console.log('[usePendingPix] PIX pendente encontrado:', pending.paymentId);

    let attempts = 0;
    let stopped  = false;

    const verificar = async () => {
      if (stopped) return;
      attempts++;

      try {
        const { data, error } = await supabase.functions.invoke('orionpay-check-status', {
          body: { paymentId: pending.paymentId },
        });

        console.log('[usePendingPix] tentativa', attempts, '→', data?.status, '| paid:', data?.paid);

        if (error) {
          console.error('[usePendingPix] erro da função:', error);
          return;
        }

        if (data?.paid) {
          stopped = true;
          clearPendingPix();
          toast({
            title: '🎉 Pagamento confirmado!',
            description: 'Sua assinatura premium foi ativada.',
          });
          // Dispara evento global para o useSubscription recarregar o status
          window.dispatchEvent(new CustomEvent('subscription:refresh'));
          return;
        }

        // Para de tentar após MAX_ATTEMPTS
        if (attempts >= MAX_ATTEMPTS) {
          stopped = true;
          console.log('[usePendingPix] máximo de tentativas atingido, desistindo');
        }
      } catch (e) {
        console.error('[usePendingPix] erro:', e);
      }
    };

    // Primeira verificação imediata
    verificar();

    // Polling com intervalo
    const interval = setInterval(() => {
      if (stopped) {
        clearInterval(interval);
        return;
      }
      verificar();
    }, INTERVAL_MS);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [user?.id]);
};
