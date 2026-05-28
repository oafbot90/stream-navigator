import Hls from 'hls.js';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export interface StreamSource {
  url: string;
  label?: string;
  quality?: string;
}

export interface SkipSegment {
  type: 'intro' | 'recap' | 'credits' | 'preview';
  start_ms: number;
  end_ms: number;
}

interface VideoPlayerProps {
  src: string | StreamSource[];
  title?: string;
  poster?: string;
  onProgress?: (percent: number) => void;
  onEnded?: () => void;
  onError?: () => void;
  initialProgress?: number;
  autoFullscreen?: boolean;
  fillContainer?: boolean;
  skipSegments?: SkipSegment[];
}

/* ─── Proxies (fallback chain — mesmo do app RN) ─────────────────────────── */
const NETLIFY_PROXY = 'https://stately-cheesecake-9bf8db.netlify.app/.netlify/functions/proxy?url=';
const CF_PROXY      = 'https://proxyflixhub.reigado1788.workers.dev/?url=';
const VPS_PROXY     = 'http://153.75.247.54:3000/proxy?url=';

const REDIRECT_DOMAINS = [
  'hubby.cx', 'descontracao.xyz', 'playerflixapi.com', 'roxanoplay', 'hostmov',
];

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('//')) return 'https:' + url;
  return url;
}
function isHLS(url: string): boolean {
  const u = normalizeUrl(url).split('?')[0].split('#')[0].toLowerCase();
  return (
    u.endsWith('.m3u8') || u.includes('.m3u8') ||
    u.endsWith('.txt')  || u.includes('/m3u8/') || u.includes('master.txt')
  );
}
function isDirectVideo(url: string): boolean {
  return /\.(mp4|mkv|webm|mov|avi|m4s)(\?|$)/i.test(url.split('#')[0]);
}
function isEmbedUrl(url: string): boolean {
  if (!url || isHLS(url) || isDirectVideo(url)) return false;
  return /iframe|\/embed\/|youtube\.com|youtu\.be|drive\.google|roxanoplay|hostmov|playerflixapi|embedder\.net/i.test(url);
}
function needsRedirect(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return REDIRECT_DOMAINS.some(d => host.includes(d));
  } catch { return false; }
}
function isAlreadyProxied(url: string): boolean {
  return url.includes('workers.dev') || url.includes('netlify.app') || url.includes('153.75.247');
}
/** Constrói a lista ordenada de URLs alternativas pra um stream. */
function buildVariants(raw: string): string[] {
  const n = normalizeUrl(raw);
  if (!n || n.startsWith('blob:') || n.startsWith('data:')) return [n];
  if (isEmbedUrl(n)) return [n];
  const enc = encodeURIComponent(n);
  const cf  = CF_PROXY + enc;
  const nf  = NETLIFY_PROXY + enc;
  const vps = VPS_PROXY + enc;
  let isHttp = false;
  try { isHttp = new URL(n).protocol === 'http:'; } catch {}
  if (isHttp)         return [cf, vps, nf, n];
  if (isHLS(n))       return [cf, vps, nf, n];
  if (needsRedirect(n)) return [nf, cf, vps, n];
  return [n, cf, vps, nf];
}
/** Proxy aplicado a cada segmento HLS (ts/aac/mp4/m4s/key/sub-manifest). */
function proxySegUrl(url: string): string {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return url;
  if (isAlreadyProxied(url)) return url;
  try {
    const p = new URL(url);
    const path = p.pathname.toLowerCase();
    if (
      p.protocol === 'http:' ||
      path.endsWith('.m3u8') || path.includes('.m3u8') ||
      path.endsWith('.txt')  || path.includes('/m3u8/') ||
      path.endsWith('.ts')   || path.endsWith('.aac')  ||
      path.endsWith('.mp4')  || path.endsWith('.m4s')  ||
      path.endsWith('.key')  || path.includes('/seg')  ||
      path.includes('master')
    ) return CF_PROXY + encodeURIComponent(url);
  } catch {
    return CF_PROXY + encodeURIComponent(url);
  }
  return url;
}

function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
    : `${m}:${String(sec).padStart(2,'0')}`;
}

/* ── Fullscreen ──────────────────────────────────────────────────────────── */
function requestFs(el: HTMLElement) {
  const e = el as any;
  if (e.requestFullscreen)       return e.requestFullscreen();
  if (e.webkitRequestFullscreen) return e.webkitRequestFullscreen();
  if (e.webkitEnterFullscreen)   return e.webkitEnterFullscreen();
}
function exitFs() {
  const d = document as any;
  if (d.exitFullscreen)       return d.exitFullscreen();
  if (d.webkitExitFullscreen) return d.webkitExitFullscreen();
}
function isInFs(): boolean {
  const d = document as any;
  return !!(d.fullscreenElement || d.webkitFullscreenElement);
}

function isMobilePlaybackDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const mobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return coarsePointer || mobileUA;
}

/* ── Estilos (espelham 1:1 o HTML do player RN) ──────────────────────────── */
const STYLES = `
.vp-wrap{position:relative;width:100%;aspect-ratio:16/9;background:#000;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',Inter,sans-serif;-webkit-user-select:none;user-select:none}
.vp-wrap.vp-fill{aspect-ratio:unset!important;height:100%!important}
.vp-wrap video{width:100%;height:100%;object-fit:contain;background:#000;display:block}

.vp-gt{position:absolute;top:0;left:0;right:0;height:120px;background:linear-gradient(to bottom,rgba(0,0,0,.88),transparent);pointer-events:none;opacity:0;transition:opacity .25s}
.vp-gb{position:absolute;bottom:0;left:0;right:0;height:140px;background:linear-gradient(to top,rgba(0,0,0,.92),transparent);pointer-events:none;opacity:0;transition:opacity .25s}
.vp-wrap.show .vp-gt,.vp-wrap.show .vp-gb{opacity:1}

.vp-ui{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;opacity:0;transition:opacity .25s;pointer-events:none;z-index:3}
.vp-wrap.show .vp-ui{opacity:1;pointer-events:auto}

.vp-top{padding:14px 14px 0;display:flex;align-items:center;gap:10px}
.vp-top-title{flex:1;color:#fff;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 4px rgba(0,0,0,.9)}
.vp-tbtn{width:36px;height:36px;border-radius:18px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);flex-shrink:0;padding:0;color:#fff}
.vp-tbtn svg{width:18px;height:18px;fill:currentColor}
.vp-tbtn:active{background:rgba(255,255,255,.22)}

.vp-center{flex:1;display:flex;align-items:center;justify-content:center;gap:28px}
.vp-cbtn{width:54px;height:54px;border-radius:27px;background:rgba(0,0,0,.5);border:1.5px solid rgba(255,255,255,.22);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;gap:2px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:transform .1s;color:#fff;padding:0}
.vp-cbtn:active{transform:scale(.88)}
.vp-cbtn svg{width:21px;height:21px;fill:currentColor}
.vp-cbtn span{font-size:8px;font-weight:700;color:rgba(255,255,255,.8);letter-spacing:.4px}

.vp-play{width:68px;height:68px;border-radius:34px;background:rgba(59,130,246,.92);border:2px solid rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 24px rgba(59,130,246,.55);transition:transform .1s;color:#fff;padding:0}
.vp-play:active{transform:scale(.91)}
.vp-play svg{width:27px;height:27px;fill:currentColor}

.vp-bottom{padding:0 14px 14px}
.vp-timerow{display:flex;justify-content:space-between;margin-bottom:8px}
.vp-time{color:rgba(255,255,255,.88);font-size:11px;font-weight:600;letter-spacing:.3px;font-variant-numeric:tabular-nums}

.vp-progwrap{width:100%;height:22px;display:flex;align-items:center;cursor:pointer;touch-action:none}
.vp-progtrack{width:100%;height:3px;background:rgba(255,255,255,.18);border-radius:3px;position:relative}
.vp-progbuf{position:absolute;left:0;top:0;height:100%;background:rgba(255,255,255,.22);border-radius:3px;transition:width .4s}
.vp-introm{position:absolute;top:0;height:100%;background:rgba(251,191,36,.55);border-radius:3px;pointer-events:none}
.vp-progfill{position:absolute;left:0;top:0;height:100%;background:#3B82F6;border-radius:3px}
.vp-progthumb{position:absolute;top:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 8px rgba(0,0,0,.7);pointer-events:none}

.vp-skipbtn{position:absolute;bottom:56px;right:12px;background:rgba(12,12,12,.88);border:1px solid rgba(255,255,255,.13);padding:7px 12px 7px 9px;border-radius:6px;cursor:pointer;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;gap:5px;z-index:10;box-shadow:0 2px 14px rgba(0,0,0,.5);animation:vp-up .2s ease;color:#fff}
@keyframes vp-up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.vp-skipbtn:active{opacity:.8}
.vp-skipbtn svg{width:12px;height:12px;fill:#FBB724;flex-shrink:0}
.vp-skipbtn .lbl{color:rgba(255,255,255,.92);font-size:11px;font-weight:700;letter-spacing:.2px}
.vp-skipbtn .tm{color:rgba(255,255,255,.45);font-size:10px;font-weight:500}

.vp-loader{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(0,0,0,.6);z-index:4}
.vp-spin{width:44px;height:44px;border:3px solid rgba(255,255,255,.08);border-top-color:#3B82F6;border-radius:50%;animation:vp-rot .75s linear infinite}
@keyframes vp-rot{to{transform:rotate(360deg)}}
.vp-loadtxt{color:rgba(255,255,255,.5);font-size:12px;font-weight:500}

.vp-err{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(0,0,0,.9);z-index:5}
.vp-err p{color:#fff;font-size:14px;font-weight:700;margin:0}
.vp-err small{color:#555;font-size:12px}
.vp-err button{margin-top:6px;padding:8px 18px;border-radius:8px;background:#3B82F6;color:#fff;border:none;font-weight:700;font-size:12px;cursor:pointer}

.vp-flash{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(59,130,246,.88);color:#fff;padding:7px 16px;border-radius:20px;font-size:13px;font-weight:700;opacity:0;transition:opacity .15s;pointer-events:none;z-index:6;white-space:nowrap}
.vp-flash.show{opacity:1}

/* Status bar abaixo do player */
.vp-bar{display:flex;align-items:center;background:#111;padding:0 14px;height:44px;border-top:1px solid #1a1a1a;color:#fff;font-family:-apple-system,Inter,sans-serif}
.vp-bar-left{flex:1;display:flex;align-items:center;gap:8px;min-width:0}
.vp-bar-right{display:flex;gap:4px}
.vp-dot{width:7px;height:7px;border-radius:4px;flex-shrink:0}
.vp-bar-label{color:#fff;font-size:12px;font-weight:700;white-space:nowrap}
.vp-source-count{color:#555;font-size:11px}
.vp-badge{padding:2px 5px;border-radius:4px;font-size:9px;font-weight:900;flex-shrink:0}
.vp-badge.hls{background:rgba(59,130,246,.2);color:#3B82F6}
.vp-badge.intro{background:rgba(251,191,36,.2);color:#FBB724}
.vp-badge.qual{background:rgba(16,185,129,.2);color:#10B981}
.vp-bar-btn{width:34px;height:34px;display:flex;align-items:center;justify-content:center;background:none;border:none;color:#888;cursor:pointer;border-radius:6px}
.vp-bar-btn:hover{color:#fff;background:rgba(255,255,255,.06)}
.vp-bar-btn svg{width:18px;height:18px;fill:currentColor}

/* Dropdowns */
.vp-drop{position:absolute;top:56px;right:14px;background:#111;border-radius:14px;border:1px solid #222;overflow:hidden;min-width:200px;z-index:20;box-shadow:0 12px 40px rgba(0,0,0,.6)}
.vp-drop-hd{color:#555;font-size:11px;font-weight:700;letter-spacing:1px;padding:10px 14px;border-bottom:1px solid #1a1a1a}
.vp-drop-item{display:flex;align-items:center;gap:10px;padding:13px 14px;border-bottom:1px solid #1a1a1a;cursor:pointer;background:none;border-left:none;border-right:none;border-top:none;width:100%;text-align:left;color:#555;font-size:13px;font-family:inherit}
.vp-drop-item:last-child{border-bottom:none}
.vp-drop-item.active{background:rgba(59,130,246,.08);color:#fff;font-weight:700}
.vp-drop-item:hover{background:rgba(255,255,255,.04)}
.vp-drop-item .ico{width:14px;height:14px;flex-shrink:0;border-radius:50%;border:2px solid #555}
.vp-drop-item.active .ico{border-color:#3B82F6;background:#3B82F6;box-shadow:inset 0 0 0 2px #111}

.vp-wrap:fullscreen{width:100vw;height:100vh;aspect-ratio:unset!important}
.vp-wrap:-webkit-full-screen{width:100vw;height:100vh;aspect-ratio:unset!important}
.vp-wrap:fullscreen .vp-skipbtn,.vp-wrap:-webkit-full-screen .vp-skipbtn{bottom:72px;right:16px}

@media (max-width:480px){
  .vp-gt{height:90px}
  .vp-gb{height:110px}
  .vp-center{gap:18px}
  .vp-cbtn{width:46px;height:46px;border-radius:23px}
  .vp-cbtn svg{width:18px;height:18px}
  .vp-play{width:58px;height:58px;border-radius:29px}
  .vp-play svg{width:23px;height:23px}
  .vp-top{padding:10px 10px 0;gap:8px}
  .vp-top-title{font-size:12px}
  .vp-tbtn{width:32px;height:32px;border-radius:16px}
  .vp-tbtn svg{width:16px;height:16px}
  .vp-bottom{padding:0 10px 10px}
  .vp-drop{right:8px;min-width:180px}
  .vp-bar{padding:0 10px;height:40px}
}
`;
function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('vp-styles-v2')) return;
  const s = document.createElement('style');
  s.id = 'vp-styles-v2';
  s.textContent = STYLES;
  document.head.appendChild(s);
}

/* ── Ícones ───────────────────────────────────────────────────────────────── */
const IPlay  = () => <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>;
const IPause = () => <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6zm8-14v14h4V5z"/></svg>;
const IBack  = () => <svg viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z"/></svg>;
const IFwd   = () => <svg viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>;
const IFull  = () => <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>;
const IExit  = () => <svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>;
const IGear  = () => <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>;
const IMusic = () => <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>;
const ILayers= () => <svg viewBox="0 0 24 24"><path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/></svg>;
const IReload= () => <svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>;
const IRefresh= () => <svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>;
const ISkip  = () => <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>;
const IWarn  = () => <svg viewBox="0 0 24 24" style={{width:44,height:44,fill:'#EF4444'}}><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>;

interface HlsLevel { index: number; height: number; label: string; }
interface HlsAudio { index: number; name: string; lang: string; }
type VideoWithAudioTracks = HTMLVideoElement & {
  audioTracks?: { length: number; [index: number]: { enabled: boolean } };
};

/* Mapa de códigos de idioma → nome amigável (bandeira + label) */
const LANG_MAP: Record<string, string> = {
  pt: '🇧🇷 Português', 'pt-br': '🇧🇷 Português (BR)', 'pt-pt': '🇵🇹 Português (PT)', por: '🇧🇷 Português',
  en: '🇺🇸 Inglês', 'en-us': '🇺🇸 Inglês (US)', 'en-gb': '🇬🇧 Inglês (UK)', eng: '🇺🇸 Inglês',
  es: '🇪🇸 Espanhol', 'es-es': '🇪🇸 Espanhol (ES)', 'es-la': '🇲🇽 Espanhol (LA)', 'es-mx': '🇲🇽 Espanhol (MX)', spa: '🇪🇸 Espanhol',
  fr: '🇫🇷 Francês', fre: '🇫🇷 Francês', fra: '🇫🇷 Francês',
  de: '🇩🇪 Alemão', ger: '🇩🇪 Alemão', deu: '🇩🇪 Alemão',
  it: '🇮🇹 Italiano', ita: '🇮🇹 Italiano',
  ja: '🇯🇵 Japonês', jpn: '🇯🇵 Japonês',
  ko: '🇰🇷 Coreano', kor: '🇰🇷 Coreano',
  zh: '🇨🇳 Chinês', chi: '🇨🇳 Chinês', zho: '🇨🇳 Chinês',
  ru: '🇷🇺 Russo', rus: '🇷🇺 Russo',
  ar: '🇸🇦 Árabe', ara: '🇸🇦 Árabe',
  hi: '🇮🇳 Hindi', hin: '🇮🇳 Hindi',
  tr: '🇹🇷 Turco', tur: '🇹🇷 Turco',
  nl: '🇳🇱 Holandês', dut: '🇳🇱 Holandês', nld: '🇳🇱 Holandês',
  pl: '🇵🇱 Polonês', pol: '🇵🇱 Polonês',
  sv: '🇸🇪 Sueco', swe: '🇸🇪 Sueco',
  da: '🇩🇰 Dinamarquês', dan: '🇩🇰 Dinamarquês',
  no: '🇳🇴 Norueguês', nor: '🇳🇴 Norueguês',
  fi: '🇫🇮 Finlandês', fin: '🇫🇮 Finlandês',
};
/* Detecta idioma a partir de uma string livre (name do track) */
function detectFromName(name: string): string {
  const n = (name || '').toLowerCase();
  if (/portug|brasil|brazil|\bpor\b|\bpt\b|\bptbr\b/.test(n)) return 'pt';
  if (/ingl|english|\beng\b|\ben\b/.test(n)) return 'en';
  if (/espan|spanish|castell|\bspa\b|\bes\b/.test(n)) return 'es';
  if (/franc|french|\bfre\b|\bfra\b|\bfr\b/.test(n)) return 'fr';
  if (/alem|german|deutsch|\bger\b|\bdeu\b|\bde\b/.test(n)) return 'de';
  if (/ital|\bita\b|\bit\b/.test(n)) return 'it';
  if (/japon|japan|\bjpn\b|\bja\b/.test(n)) return 'ja';
  if (/cores|kor|\bko\b/.test(n)) return 'ko';
  if (/chin|mandar|\bzho\b|\bzh\b/.test(n)) return 'zh';
  return '';
}
function prettyLang(lang: string, fallback: string): string {
  const k = (lang || '').toLowerCase().trim();
  if (k && LANG_MAP[k]) return LANG_MAP[k];
  const base = k.split('-')[0];
  if (base && LANG_MAP[base]) return LANG_MAP[base];
  // Tenta extrair idioma do nome (ex: "Portuguese (por)")
  const detected = detectFromName(fallback);
  if (detected && LANG_MAP[detected]) return LANG_MAP[detected];
  return fallback || (lang ? lang.toUpperCase() : 'Áudio');
}
/* Retorna o código base normalizado (pt, en, es...) a partir de lang+name */
function normalizeLangCode(lang: string, name: string): string {
  const k = (lang || '').toLowerCase().trim();
  const base = k.split('-')[0];
  if (base === 'por' || base === 'pt') return 'pt';
  if (base === 'eng' || base === 'en') return 'en';
  if (base === 'spa' || base === 'es') return 'es';
  if (base && LANG_MAP[base]) return base.length === 3 ? (detectFromName(LANG_MAP[base]) || base) : base;
  return detectFromName(name);
}

/* ── Componente principal ────────────────────────────────────────────────── */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src, title, poster, onProgress, onEnded, onError, initialProgress = 0,
  autoFullscreen = false, fillContainer = false, skipSegments,
}) => {
  const sources: StreamSource[] = useMemo(() =>
    Array.isArray(src) ? src : [{ url: src, label: 'HD' }], [src]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  const current = sources[currentIdx];
  const activeUrl = normalizeUrl(current?.url || '');

  // Reset ao trocar de fonte ou retry externo
  useEffect(() => { setCurrentIdx(0); }, [src]);

  const goNextSource = useCallback(() => {
    const next = currentIdx + 1;
    if (next < sources.length) setCurrentIdx(next);
    else onError?.();
  }, [currentIdx, sources.length, onError]);

  if (!activeUrl) {
    return (
      <div className="vp-wrap" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ color:'#666' }}>Nenhum stream disponível</p>
      </div>
    );
  }

  // Embed → iframe puro
  if (isEmbedUrl(activeUrl)) {
    let iframeSrc = activeUrl;
    if (activeUrl.includes('<iframe')) {
      const m = activeUrl.match(/src=["']([^"']+)["']/);
      if (m) iframeSrc = m[1];
    }
    return (
      <div style={{ position:'relative', width:'100%', aspectRatio:'16/9', background:'#000', overflow:'hidden' }}>
        <iframe
          src={iframeSrc}
          style={{ width:'100%', height:'100%', border:'none' }}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title={title || 'Player'}
        />
      </div>
    );
  }

  return (
    <PlayerCore
      key={`${activeUrl}-${retryKey}`}
      url={activeUrl}
      rawUrl={current.url}
      title={title || current.label || ''}
      poster={poster}
      onProgress={onProgress}
      onEnded={onEnded}
      initialProgress={initialProgress}
      autoFullscreen={autoFullscreen}
      fillContainer={fillContainer}
      skipSegments={skipSegments}
      sources={sources}
      currentIdx={currentIdx}
      onSourceChange={(i) => setCurrentIdx(i)}
      onPlayFailed={goNextSource}
      onRetry={() => setRetryKey(k => k + 1)}
    />
  );
};

interface CoreProps {
  url: string;
  rawUrl: string;
  title: string;
  poster?: string;
  onProgress?: (p: number) => void;
  onEnded?: () => void;
  initialProgress: number;
  autoFullscreen: boolean;
  fillContainer: boolean;
  skipSegments?: SkipSegment[];
  sources: StreamSource[];
  currentIdx: number;
  onSourceChange: (i: number) => void;
  onPlayFailed: () => void;
  onRetry: () => void;
}

const PlayerCore: React.FC<CoreProps> = ({
  url, rawUrl, title, poster, onProgress, onEnded, initialProgress,
  autoFullscreen, fillContainer, skipSegments,
  sources, currentIdx, onSourceChange, onPlayFailed, onRetry,
}) => {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef   = useRef<Hls | null>(null);
  const hideTRef = useRef<ReturnType<typeof setTimeout>>();
  const lastProgRef = useRef(0);
  const initSeekRef = useRef(false);
  const autoFsRef   = useRef(false);
  const flashTRef   = useRef<ReturnType<typeof setTimeout>>();
  const audioSwitchTRef = useRef<ReturnType<typeof setTimeout>>();
  const failedRef   = useRef(false);

  const [showUI, setShowUI]   = useState(true);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur]     = useState(0);
  const [dur, setDur]     = useState(0);
  const [bufPct, setBufPct] = useState(0);
  const [fs, setFs]       = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadTxt, setLoadTxt] = useState('Carregando...');
  const [err, setErr]     = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // Quality / audio
  const [levels, setLevels] = useState<HlsLevel[]>([]);
  const [audios, setAudios] = useState<HlsAudio[]>([]);
  const [activeLevel, setActiveLevel] = useState<number>(-1); // -1 auto
  const [activeAudio, setActiveAudio] = useState<number>(0);

  // Menus
  const [openMenu, setOpenMenu] = useState<null | 'settings' | 'audio' | 'sources'>(null);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  const recoverMobileAudioSwitch = useCallback((trackIndex: number) => {
    const hls = hlsRef.current;
    const v = videoRef.current;
    if (!hls || !v) return;

    const currentTime = v.currentTime;
    const wasPlaying = !v.paused;

    try {
      // troca faixa
      (hls as Hls & { audioTrack: number }).audioTrack = trackIndex;

      // pequeno seek força recarregar audio pipeline
      setTimeout(() => {
        try {
          v.currentTime = currentTime + 0.01;
          if (wasPlaying) {
            v.play().catch(() => {});
          }
        } catch { /* noop */ }
      }, 120);
    } catch { /* noop */ }
  }, []);

  // Stable refs pra callbacks externas
  const onProgressRef = useRef(onProgress);
  const onEndedRef    = useRef(onEnded);
  const onPlayFailedRef = useRef(onPlayFailed);
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { onPlayFailedRef.current = onPlayFailed; }, [onPlayFailed]);

  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    return () => {
      if (audioSwitchTRef.current) clearTimeout(audioSwitchTRef.current);
    };
  }, []);

  // Intro derivada de skipSegments
  const intro = useMemo(() => {
    if (!skipSegments?.length) return null as null | { start: number; end: number };
    const i = skipSegments.find(s => s.type === 'intro');
    if (!i) return null;
    return { start: i.start_ms / 1000, end: i.end_ms / 1000 };
  }, [skipSegments]);

  /* ── Setup do vídeo (HLS ou direto) com fallback chain ─────────────────── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    failedRef.current = false;
    setErr(null);
    setLoading(true);
    setLoadTxt('Carregando...');
    setLevels([]); setAudios([]); setActiveLevel(-1); setActiveAudio(0);
    hlsRef.current?.destroy();
    hlsRef.current = null;
    initSeekRef.current = false;
    lastProgRef.current = 0;

    const variants = buildVariants(url);
    let cancelled = false;

    const showError = () => {
      if (cancelled || failedRef.current) return;
      failedRef.current = true;
      setLoading(false);
      setErr('Stream indisponível');
      onPlayFailedRef.current();
    };

    if (isHLS(url)) {
      if (Hls.isSupported()) {
        const tryHls = (idx: number) => {
          if (cancelled) return;
          if (idx >= variants.length) { showError(); return; }
          setLoadTxt(idx > 0 ? `Tentando alternativa ${idx + 1}...` : 'Carregando...');
          const u = variants[idx];
          hlsRef.current?.destroy();
          const hls = new Hls({
            enableWorker: true,
            maxBufferLength: 30,
            startLevel: -1,
            xhrSetup: (xhr, segUrl) => {
              if (isAlreadyProxied(segUrl)) return;
              const proxied = proxySegUrl(segUrl);
              if (proxied !== segUrl) {
                xhr.open('GET', proxied, true);
              }
            },
          });
          hlsRef.current = hls;
          hls.loadSource(u);
          hls.attachMedia(v);
          hls.on(Hls.Events.MANIFEST_PARSED, (_e, data: any) => {
            v.play().catch(() => {});
            const lvls = (data.levels || []).map((l: any, i: number) => ({
              index: i,
              height: l.height || 0,
              label: l.height ? `${l.height}p` : (l.bitrate ? `${Math.round(l.bitrate / 1000)}k` : `Q${i + 1}`),
            })) as HlsLevel[];
            setLevels(lvls);
          });
          const ptPreferredRef = { picked: false };
          const readAudioTracks = () => {
            const list = (hls.audioTracks || []) as any[];
            const auds = list.map((t: any, i: number) => {
              const lang = t.lang || t.language || '';
              const baseName = t.name || `Faixa ${i + 1}`;
              return {
                index: i,
                name: prettyLang(lang, baseName),
                lang,
              };
            }) as HlsAudio[];
            setAudios(auds);
            const act = (hls as any).audioTrack;
            if (typeof act === 'number' && act >= 0) setActiveAudio(act);

            // Auto-seleciona Português na primeira leitura, se disponível
            if (!ptPreferredRef.picked && list.length > 1) {
              const ptIdx = list.findIndex((t: any) => {
                const code = normalizeLangCode(t.lang || t.language || '', t.name || '');
                return code === 'pt';
              });
              if (ptIdx >= 0 && ptIdx !== act) {
                ptPreferredRef.picked = true;
                try { (hls as any).audioTrack = ptIdx; } catch { /* noop */ }
                setActiveAudio(ptIdx);
              } else {
                ptPreferredRef.picked = true;
              }
            }
          };
          hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, readAudioTracks);
          hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_e, d: any) => {
            if (typeof d?.id === 'number') setActiveAudio(d.id);
          });
          hls.on(Hls.Events.ERROR, (_e, d) => {
            if (d.fatal) {
              hls.destroy();
              tryHls(idx + 1);
            }
          });
        };
        tryHls(0);
      } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari nativo
        const tryNative = (idx: number) => {
          if (cancelled) return;
          if (idx >= variants.length) { showError(); return; }
          setLoadTxt(idx > 0 ? `Tentando alternativa ${idx + 1}...` : 'Carregando...');
          v.src = variants[idx];
          v.load();
          v.play().catch(() => {});
          const handleErr = () => { v.removeEventListener('error', handleErr); tryNative(idx + 1); };
          v.addEventListener('error', handleErr);
        };
        tryNative(0);
      } else {
        showError();
      }
    } else {
      // Vídeo direto
      let directIdx = 0;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const loadDirect = (idx: number) => {
        if (cancelled) return;
        if (idx >= variants.length) { showError(); return; }
        directIdx = idx;
        setLoadTxt(idx > 0 ? `Tentando alternativa ${idx + 1}...` : 'Carregando...');
        v.src = variants[idx];
        v.load();
        v.play().catch(() => {});
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (v.readyState < 3 && !v.played.length) loadDirect(idx + 1);
        }, 12000);
      };
      const onErr = () => { if (timer) clearTimeout(timer); loadDirect(directIdx + 1); };
      v.addEventListener('error', onErr);
      loadDirect(0);
      return () => {
        cancelled = true;
        if (timer) clearTimeout(timer);
        v.removeEventListener('error', onErr);
        hlsRef.current?.destroy(); hlsRef.current = null;
      };
    }

    return () => { cancelled = true; hlsRef.current?.destroy(); hlsRef.current = null; };
  }, [url]);

  /* ── Listeners do <video> ──────────────────────────────────────────────── */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onPlaying = () => {
      setLoading(false);
      if (!initSeekRef.current && initialProgress > 0 && v.duration > 0) {
        v.currentTime = (initialProgress / 100) * v.duration;
        initSeekRef.current = true;
      }
      if (autoFullscreen && !autoFsRef.current) {
        autoFsRef.current = true;
        const wrap = wrapRef.current;
        setTimeout(() => {
          try {
            const vAny = v as any;
            if (vAny.webkitEnterFullscreen && !document.fullscreenEnabled) {
              vAny.webkitEnterFullscreen();
            } else if (wrap) {
              requestFs(wrap);
            }
          } catch {}
        }, 300);
      }
    };
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onTime = () => {
      setCur(v.currentTime);
      if (onProgressRef.current && v.duration > 0) {
        const pct = (v.currentTime / v.duration) * 100;
        if (Math.abs(pct - lastProgRef.current) >= 2) {
          lastProgRef.current = pct;
          onProgressRef.current(pct);
        }
      }
    };
    const onDur = () => {
      setDur(v.duration || 0);
      // Faixas de áudio nativas (Safari / playback direto)
      const nat = (v as any).audioTracks;
      if (nat && nat.length > 1 && !hlsRef.current) {
        const auds: HlsAudio[] = [];
        let activeIdx = 0;
        for (let i = 0; i < nat.length; i++) {
          const t = nat[i];
          const lang = t.language || '';
          const baseName = t.label || `Faixa ${i + 1}`;
          auds.push({ index: i, name: prettyLang(lang, baseName), lang });
          if (t.enabled) activeIdx = i;
        }
        setAudios(auds);
        setActiveAudio(activeIdx);
      }
    };
    const onProg = () => {
      if (v.buffered.length && v.duration) {
        setBufPct((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
      }
    };
    const onEnd = () => onEndedRef.current?.();
    const onFsChg = () => setFs(isInFs());
    const onIosBegin = () => setFs(true);
    const onIosEnd   = () => setFs(false);

    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('playing', onPlaying);
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('canplay', onCanPlay);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('durationchange', onDur);
    v.addEventListener('loadedmetadata', onDur);
    v.addEventListener('progress', onProg);
    v.addEventListener('ended', onEnd);
    v.addEventListener('webkitbeginfullscreen', onIosBegin);
    v.addEventListener('webkitendfullscreen', onIosEnd);
    document.addEventListener('fullscreenchange', onFsChg);
    document.addEventListener('webkitfullscreenchange', onFsChg);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('waiting', onWaiting);
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('durationchange', onDur);
      v.removeEventListener('loadedmetadata', onDur);
      v.removeEventListener('progress', onProg);
      v.removeEventListener('ended', onEnd);
      v.removeEventListener('webkitbeginfullscreen', onIosBegin);
      v.removeEventListener('webkitendfullscreen', onIosEnd);
      document.removeEventListener('fullscreenchange', onFsChg);
      document.removeEventListener('webkitfullscreenchange', onFsChg);
    };
  }, [initialProgress, autoFullscreen]);

  /* ── UI ────────────────────────────────────────────────────────────────── */
  const scheduleHide = useCallback(() => {
    if (hideTRef.current) clearTimeout(hideTRef.current);
    const v = videoRef.current;
    if (v && !v.paused) {
      hideTRef.current = setTimeout(() => setShowUI(false), 3200);
    }
  }, []);
  const reveal = useCallback(() => { setShowUI(true); scheduleHide(); }, [scheduleHide]);

  useEffect(() => { reveal(); }, [reveal]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) v.play().catch(() => {}); else v.pause();
    reveal();
  }, [reveal]);

  const skip = useCallback((sec: number) => {
    const v = videoRef.current; if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
    setFlash(sec > 0 ? '+10s »' : '« 10s');
    if (flashTRef.current) clearTimeout(flashTRef.current);
    flashTRef.current = setTimeout(() => setFlash(null), 800);
    reveal();
  }, [reveal]);

  const toggleFs = useCallback(() => {
    const wrap = wrapRef.current; const v = videoRef.current;
    if (isInFs()) { exitFs(); return; }
    const vAny = v as any;
    if (vAny?.webkitEnterFullscreen) { try { vAny.webkitEnterFullscreen(); return; } catch {} }
    if (wrap) requestFs(wrap);
  }, []);

  const seekFromClient = useCallback((clientX: number) => {
    const v = videoRef.current; if (!v) return;
    const track = wrapRef.current?.querySelector('.vp-progtrack') as HTMLElement | null;
    if (!track) return;
    const r = track.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    if (v.duration) v.currentTime = pct * v.duration;
  }, []);

  // Skip intro state
  const inIntro = intro && cur >= intro.start && cur < intro.end;
  const introLeft = intro ? Math.ceil(intro.end - cur) : 0;
  const handleSkipIntro = () => {
    const v = videoRef.current; if (!v || !intro) return;
    v.currentTime = intro.end;
    setFlash('Abertura pulada ✓');
    if (flashTRef.current) clearTimeout(flashTRef.current);
    flashTRef.current = setTimeout(() => setFlash(null), 800);
  };

  // Quality / audio
  const setLevel = (i: number) => {
    setActiveLevel(i);
    setOpenMenu(null);
    if (hlsRef.current) hlsRef.current.currentLevel = i;
  };
  const setAudio = (i: number) => {
    setActiveAudio(i);
    setOpenMenu(null);

    const v = videoRef.current as VideoWithAudioTracks | null;
    if (!v) return;

    // HLS.js
    if (hlsRef.current) {
      // mobile
      if (isMobilePlaybackDevice()) {
        recoverMobileAudioSwitch(i);
        return;
      }

      // desktop
      try {
        (hlsRef.current as Hls & { audioTrack: number }).audioTrack = i;
      } catch { /* noop */ }
      return;
    }

    // Safari native audioTracks
    const nativeTracks = v.audioTracks;
    if (nativeTracks) {
      for (let j = 0; j < nativeTracks.length; j++) {
        nativeTracks[j].enabled = j === i;
      }
    }
  };

  const onWrapClick = (e: React.MouseEvent) => {
    const tgt = e.target as HTMLElement;
    if (tgt.closest('.vp-tbtn,.vp-cbtn,.vp-play,.vp-progwrap,.vp-skipbtn,.vp-drop')) return;
    if (showUI) { if (hideTRef.current) clearTimeout(hideTRef.current); setShowUI(false); }
    else reveal();
  };

  const pct = dur > 0 ? (cur / dur) * 100 : 0;
  const introLeftPct = intro && dur ? (intro.start / dur) * 100 : 0;
  const introWidthPct = intro && dur ? ((intro.end - intro.start) / dur) * 100 : 0;

  return (
    <div style={fillContainer ? { width:'100%', height:'100%', display:'flex', flexDirection:'column' } : undefined}>
      <div
        ref={wrapRef}
        className={`vp-wrap${fillContainer ? ' vp-fill' : ''}${showUI ? ' show' : ''}`}
        onClick={onWrapClick}
        onMouseMove={reveal}
        onTouchStart={reveal}
      >
        <video
          ref={videoRef}
          poster={poster}
          playsInline
          // @ts-ignore
          webkit-playsinline="true"
          // @ts-ignore
          x5-playsinline="true"
        />

        <div className="vp-gt" />
        <div className="vp-gb" />

        {/* Skip intro */}
        {inIntro && !err && (
          <button className="vp-skipbtn" onClick={(e) => { e.stopPropagation(); handleSkipIntro(); }}>
            <ISkip />
            <span className="lbl">Pular abertura</span>
            {introLeft > 0 && <span className="tm">({introLeft}s)</span>}
          </button>
        )}

        {/* Flash */}
        {flash && <div className={`vp-flash show`}>{flash}</div>}

        {/* Loader */}
        {loading && !err && (
          <div className="vp-loader">
            <div className="vp-spin" />
            <div className="vp-loadtxt">{loadTxt}</div>
          </div>
        )}

        {/* Erro */}
        {err && (
          <div className="vp-err">
            <IWarn />
            <p>{err}</p>
            <button onClick={(e) => { e.stopPropagation(); onRetry(); }}>Tentar novamente</button>
          </div>
        )}

        {/* UI overlay */}
        <div className="vp-ui">
          <div className="vp-top">
            <div className="vp-top-title">{title}</div>
            {audios.length > 1 && (
              <button className="vp-tbtn" onClick={(e) => { e.stopPropagation(); setOpenMenu(m => m === 'audio' ? null : 'audio'); }} title="Áudio">
                <IMusic />
              </button>
            )}
            <button className="vp-tbtn" onClick={(e) => { e.stopPropagation(); setOpenMenu(m => m === 'settings' ? null : 'settings'); }} title="Configurações">
              <IGear />
            </button>
            {sources.length > 1 && (
              <button className="vp-tbtn" onClick={(e) => { e.stopPropagation(); setOpenMenu(m => m === 'sources' ? null : 'sources'); }} title="Fontes">
                <ILayers />
              </button>
            )}
            <button className="vp-tbtn" onClick={(e) => { e.stopPropagation(); toggleFs(); }} title="Tela cheia">
              {fs ? <IExit /> : <IFull />}
            </button>
          </div>

          <div className="vp-center">
            <button className="vp-cbtn" onClick={(e) => { e.stopPropagation(); skip(-10); }}>
              <IBack /><span>-10s</span>
            </button>
            <button className="vp-play" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
              {playing ? <IPause /> : <IPlay />}
            </button>
            <button className="vp-cbtn" onClick={(e) => { e.stopPropagation(); skip(10); }}>
              <IFwd /><span>+10s</span>
            </button>
          </div>

          <div className="vp-bottom">
            <div className="vp-timerow">
              <span className="vp-time">{fmtTime(cur)}</span>
              <span className="vp-time">{fmtTime(dur)}</span>
            </div>
            <div
              className="vp-progwrap"
              onClick={(e) => { e.stopPropagation(); seekFromClient(e.clientX); }}
              onTouchStart={(e) => { seekFromClient(e.touches[0].clientX); }}
              onTouchMove={(e) => { e.preventDefault(); seekFromClient(e.touches[0].clientX); }}
            >
              <div className="vp-progtrack">
                <div className="vp-progbuf"  style={{ width: `${bufPct}%` }} />
                {intro && dur > 0 && (
                  <div className="vp-introm" style={{ left: `${introLeftPct}%`, width: `${introWidthPct}%` }} />
                )}
                <div className="vp-progfill" style={{ width: `${pct}%` }} />
                <div className="vp-progthumb" style={{ left: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Dropdowns */}
        {openMenu === 'settings' && (
          <div className="vp-drop" onClick={(e) => e.stopPropagation()}>
            <div className="vp-drop-hd">VELOCIDADE</div>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
              <button
                key={r}
                className={`vp-drop-item${playbackRate === r ? ' active' : ''}`}
                onClick={() => {
                  setPlaybackRate(r);
                  if (videoRef.current) videoRef.current.playbackRate = r;
                  setOpenMenu(null);
                }}
              >
                <span className="ico" /> {r === 1 ? 'Normal (1x)' : `${r}x`}
              </button>
            ))}
            {levels.length > 1 && (
              <>
                <div className="vp-drop-hd">QUALIDADE</div>
                <button className={`vp-drop-item${activeLevel === -1 ? ' active' : ''}`} onClick={() => setLevel(-1)}>
                  <span className="ico" /> Auto
                </button>
                {levels.map((l) => (
                  <button key={l.index} className={`vp-drop-item${activeLevel === l.index ? ' active' : ''}`} onClick={() => setLevel(l.index)}>
                    <span className="ico" /> {l.label}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
        {openMenu === 'audio' && audios.length > 1 && (
          <div className="vp-drop" onClick={(e) => e.stopPropagation()}>
            <div className="vp-drop-hd">ÁUDIO</div>
            {audios.map((a) => (
              <button key={a.index} className={`vp-drop-item${activeAudio === a.index ? ' active' : ''}`} onClick={() => setAudio(a.index)}>
                <span className="ico" /> {a.name}{a.lang ? ` (${a.lang})` : ''}
              </button>
            ))}
          </div>
        )}
        {openMenu === 'sources' && sources.length > 1 && (
          <div className="vp-drop" onClick={(e) => e.stopPropagation()}>
            <div className="vp-drop-hd">FONTES DISPONÍVEIS</div>
            {sources.map((s, i) => (
              <button key={i} className={`vp-drop-item${currentIdx === i ? ' active' : ''}`}
                onClick={() => { onSourceChange(i); setOpenMenu(null); }}>
                <span className="ico" /> {s.label || s.quality || `Fonte ${i + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status bar abaixo do player (mesma identidade do RN) */}
      <div className="vp-bar">
        <div className="vp-bar-left">
          <div className="vp-dot" style={{ background: isHLS(rawUrl) ? '#3B82F6' : '#10B981' }} />
          <span className="vp-bar-label">{sources[currentIdx]?.label || 'Stream'}</span>
          {isHLS(rawUrl) && <span className="vp-badge hls">HLS</span>}
          {intro && <span className="vp-badge intro">INTRO</span>}
          {levels.length > 1 && (
            <span className="vp-badge qual">
              {activeLevel === -1 ? 'AUTO' : (levels[activeLevel]?.label || 'AUTO')}
            </span>
          )}
          {sources.length > 1 && <span className="vp-source-count">{currentIdx + 1}/{sources.length}</span>}
        </div>
        <div className="vp-bar-right">
          {sources.length > 1 && (
            <button className="vp-bar-btn" onClick={() => onSourceChange((currentIdx + 1) % sources.length)} title="Próxima fonte">
              <IRefresh />
            </button>
          )}
          <button className="vp-bar-btn" onClick={() => onRetry()} title="Recarregar">
            <IReload />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
