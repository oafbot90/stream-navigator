import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';

const AD_LINK = 'https://onclickperformance.com/jump/next.php?r=11009458';

const AD_SELECTORS = [
  '#aclib',
  '#dontfoid',
  '[id^="acsb"]',
  '[class*="ac-"]',
  'iframe[src*="acscdn"]',
  'iframe[src*="onclickperformance"]',
  'script[src*="acscdn"]',
  'script[src*="adcash"]',
  '[id*="popMagic"]',
  '[class*="pop-"]',
];

const BLOCKED_AD_URL_PARTS = [
  'onclickperformance.com',
  'acscdn.com',
  'adcash.com',
  'popads.net',
  'propellerads.com',
  'adsterra.com',
  'doubleclick.net',
  'googlesyndication.com',
];

function cleanupAdElements() {
  try {
    document.querySelectorAll(AD_SELECTORS.join(',')).forEach((el) => el.remove());
    // Remove qualquer iframe externo de domínio de ads conhecido
    document.querySelectorAll('iframe').forEach((iframe) => {
      const src = (iframe as HTMLIFrameElement).src || '';
      if (BLOCKED_AD_URL_PARTS.some((p) => src.includes(p))) iframe.remove();
    });
    // Remove overlays full-screen suspeitos (z-index altíssimo sem ID nosso)
    document.querySelectorAll('body > div, body > a').forEach((el) => {
      const node = el as HTMLElement;
      if (node.id?.startsWith('root') || node.id?.startsWith('lov')) return;
      const z = parseInt(getComputedStyle(node).zIndex || '0', 10);
      const pos = getComputedStyle(node).position;
      if (z > 9999 && (pos === 'fixed' || pos === 'absolute')) {
        // se contém link externo de ad, remove
        const link = node.tagName === 'A' ? (node as HTMLAnchorElement).href : node.querySelector('a')?.href || '';
        if (BLOCKED_AD_URL_PARTS.some((p) => link.includes(p))) node.remove();
      }
    });
  } catch {
    /* noop */
  }
}

// Stub aclib so any leftover/late call does nothing for premium users
function stubAclib() {
  try {
    const noop = () => {};
    // Mantemos apenas o pop-under (runPop). Os demais formatos viram no-op.
    const methods = ['runInterstitial', 'runAutoTag', 'runBanner'] as const;
    const existingAclib = (window as Window & { aclib?: Record<string, unknown> }).aclib;

    if (existingAclib && (typeof existingAclib === 'object' || typeof existingAclib === 'function')) {
      methods.forEach((method) => {
        try {
          Object.defineProperty(existingAclib, method, {
            configurable: true,
            writable: true,
            value: noop,
          });
        } catch {
          try {
            (existingAclib as Record<string, unknown>)[method] = noop;
          } catch {
            /* noop */
          }
        }
      });
      return;
    }

    const descriptor = Object.getOwnPropertyDescriptor(window, 'aclib');
    const stub = Object.fromEntries(methods.map((method) => [method, noop]));

    if (!descriptor || descriptor.writable) {
      (window as Window & { aclib?: Record<string, unknown> }).aclib = stub;
      return;
    }

    if (descriptor.configurable) {
      Object.defineProperty(window, 'aclib', {
        configurable: true,
        writable: true,
        value: stub,
      });
    }
  } catch {
    /* noop */
  }
}

let premiumObserver: MutationObserver | null = null;
let originalWindowOpen: typeof window.open | null = null;
let originalCreateElement: typeof document.createElement | null = null;
let originalAppendChild: typeof Node.prototype.appendChild | null = null;
let originalAddEventListener: typeof EventTarget.prototype.addEventListener | null = null;
let cleanupInterval: number | null = null;

function isBlockedSrc(src: string | null | undefined): boolean {
  if (!src) return false;
  return BLOCKED_AD_URL_PARTS.some((part) => src.includes(part));
}

function blockPremiumAdRedirects() {
  if (originalWindowOpen) return;
  originalWindowOpen = window.open.bind(window) as typeof window.open;
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    const urlText = typeof url === 'string' ? url : url?.toString() || '';
    if (urlText && isBlockedSrc(urlText)) {
      return null;
    }
    return originalWindowOpen?.(url as string | URL | undefined, target, features) ?? null;
  }) as typeof window.open;
}

function patchCreateElement() {
  if (originalCreateElement) return;
  originalCreateElement = document.createElement.bind(document);
  document.createElement = function (tagName: string, options?: ElementCreationOptions) {
    const el = originalCreateElement!(tagName, options) as HTMLElement;
    const tag = tagName.toLowerCase();
    if (tag === 'script' || tag === 'iframe') {
      // intercepta src setter para bloquear urls de ad
      try {
        const proto = tag === 'script' ? HTMLScriptElement.prototype : HTMLIFrameElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'src');
        if (desc?.set) {
          Object.defineProperty(el, 'src', {
            configurable: true,
            get() { return desc.get?.call(this); },
            set(v: string) {
              if (isBlockedSrc(v)) return;
              desc.set!.call(this, v);
            },
          });
        }
      } catch { /* noop */ }
    }
    return el as HTMLElement;
  } as typeof document.createElement;
}

function patchAppendChild() {
  if (originalAppendChild) return;
  originalAppendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function <T extends Node>(node: T): T {
    try {
      const el = node as unknown as HTMLElement;
      const tag = el.tagName?.toLowerCase();
      if (tag === 'script' || tag === 'iframe') {
        const src = (el as HTMLScriptElement | HTMLIFrameElement).src;
        if (isBlockedSrc(src)) return node;
      }
    } catch { /* noop */ }
    return originalAppendChild!.call(this, node) as T;
  };
}

function patchAddEventListener() {
  if (originalAddEventListener) return;
  originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ) {
    // bloqueia handlers globais de click usados por popunders
    if ((type === 'click' || type === 'mousedown' || type === 'touchstart') && (this === document || this === window || this === document.body)) {
      const fn = (listener as Function)?.toString?.() || '';
      if (BLOCKED_AD_URL_PARTS.some((p) => fn.includes(p)) || /pop(under|up)|adcash|aclib/i.test(fn)) {
        return;
      }
    }
    return originalAddEventListener!.call(this, type, listener, options);
  };
}

function restoreWindowOpen() {
  if (originalWindowOpen) {
    window.open = originalWindowOpen;
    originalWindowOpen = null;
  }
  if (originalCreateElement) {
    document.createElement = originalCreateElement;
    originalCreateElement = null;
  }
  if (originalAppendChild) {
    Node.prototype.appendChild = originalAppendChild;
    originalAppendChild = null;
  }
  if (originalAddEventListener) {
    EventTarget.prototype.addEventListener = originalAddEventListener;
    originalAddEventListener = null;
  }
}

function startPremiumGuard() {
  cleanupAdElements();
  stubAclib();
  blockPremiumAdRedirects();
  patchCreateElement();
  patchAppendChild();
  patchAddEventListener();
  if (!premiumObserver) {
    premiumObserver = new MutationObserver(() => cleanupAdElements());
    premiumObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
  if (cleanupInterval == null) {
    cleanupInterval = window.setInterval(cleanupAdElements, 3000);
  }
}

function stopPremiumGuard() {
  if (premiumObserver) {
    premiumObserver.disconnect();
    premiumObserver = null;
  }
  if (cleanupInterval != null) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  restoreWindowOpen();
}

// Pop-under script loader
export const usePopUnderAd = () => {
  const { isSubscribed, loading, adsAllowed } = useSubscription();
  const location = useLocation();
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (loading) {
      cleanupAdElements();
      blockPremiumAdRedirects();
      return;
    }

    // Premium users: NEVER load ads. Install persistent guard.
    if (isSubscribed || !adsAllowed) {
      scriptLoaded.current = false;
      startPremiumGuard();
      return;
    }

    // Free users: stop guard if previously active and load ads once
    stopPremiumGuard();

    if (!scriptLoaded.current) {
      const existingScript = document.getElementById('aclib');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'aclib';
        script.type = 'text/javascript';
        script.src = '//acscdn.com/script/aclib.js';
        script.onload = () => {
          try {
            const aclib = (window as any).aclib;
            // Apenas pop-under. Interstitial removido por solicitação.
            aclib?.runPop({ zoneId: '11297222' });
          } catch (e) {
            console.log('Ad script loaded');
          }
        };
        document.head.appendChild(script);
        scriptLoaded.current = true;
      }
    }
  }, [isSubscribed, loading, adsAllowed, location.pathname]);
};

// Hook for onclick ad redirect
export const useAdClick = () => {
  const { isSubscribed, adsAllowed } = useSubscription();

  const triggerAd = useCallback(
    (callback?: () => void) => {
      // Only show ad redirect when the backend confirmed the user is free
      if (adsAllowed) {
        window.open(AD_LINK, '_blank');
      }
      if (callback) {
        setTimeout(callback, 100);
      }
    },
    [adsAllowed],
  );

  return { triggerAd, isPremium: isSubscribed };
};

export default useAdClick;
