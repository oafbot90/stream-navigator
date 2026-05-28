import React, { useState, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Loader2, CheckCircle, AlertCircle, Tv, Film, Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

// ─── Unified parsed types ───
interface ParsedMovie {
  title: string;
  year?: number | null;
  tmdb_id?: number | null;
  links: { url: string; quality?: string }[];
  source: string;
}

interface ParsedEpisode {
  titulo: string;
  temporada: number;
  episodio: number;
  url?: string;
  has_dub?: boolean;
  has_leg?: boolean;
  still_path?: string | null;
  air_date?: string | null;
  streams: { url: string; tipo?: string }[];
}

interface ParsedSeries {
  nome: string;
  tmdb_id?: number | null;
  episodios: ParsedEpisode[];
}

type ContentType = 'movies' | 'series' | 'channels';

// ─── Channel detection ───
function isChannelJson(raw: any): boolean {
  if (raw?.tipo === 'tv_ao_vivo') return true;
  if (raw?.por_categoria && typeof raw.por_categoria === 'object') {
    const firstCat = Object.values(raw.por_categoria)[0];
    if (Array.isArray(firstCat) && (firstCat as any[])[0]?.stream_url) return true;
  }
  if (raw?.todos && Array.isArray(raw.todos) && raw.todos[0]?.stream_url) return true;
  if (raw?.channels && Array.isArray(raw.channels) && raw.channels[0]?.stream_url) return true;
  return false;
}

// ─── Smart parser: detects ANY format and normalises ───

function extractTmdbIdFromUrl(url?: string): number | null {
  if (!url) return null;
  // Patterns like /filme/name-12345.html or name-12345-suffix
  const match = url.match(/[/-](\d{4,})(?:[.-]|$)/);
  if (match) return parseInt(match[1]);
  return null;
}

// Detecta título de episódio tipo "Nome 10x1 - ...", "Nome S01E05 ...", "Nome 1x05"
const EPISODE_TITLE_RE = /\b(?:S\d{1,2}\s*E\d{1,3}|\d{1,2}\s*[xX]\s*\d{1,3})\b/;

function looksLikeEpisodeEntry(item: any): boolean {
  if (!item || typeof item !== 'object') return false;
  const t = item.titulo || item.title || item.nome || '';
  if (typeof t !== 'string') return false;
  return EPISODE_TITLE_RE.test(t);
}

function parseAllMovies(raw: any): ParsedMovie[] {
  // Se o JSON inteiro é um array de episódios flat (noveflix-style), não trate como filmes
  if (Array.isArray(raw) && raw.length > 0 && raw.every(looksLikeEpisodeEntry) && typeof raw[0]?.stream === 'string') {
    return [];
  }
  const movies: ParsedMovie[] = [];

  // Collect candidate arrays from various formats
  const candidateArrays: { items: any[]; sourceHint: string }[] = [];

  // New format: { mode: "movies", items: [{ id, title, type: "movie", links: [{ direct_url }] }] }
  if (raw?.mode === 'movies' && Array.isArray(raw.items)) {
    candidateArrays.push({ items: raw.items, sourceHint: 'external' });
  }

  // MegaEmbed format: { todos: [...], tipo: "filmes_..." }
  if (raw?.todos && Array.isArray(raw.todos) && !raw?.totalSeries) {
    candidateArrays.push({ items: raw.todos, sourceHint: 'megaembed' });
  }
  // MegaEmbed por_categoria: { por_categoria: { "Acao": [...], ... } }
  if (raw?.por_categoria && typeof raw.por_categoria === 'object' && !raw?.totalSeries) {
    for (const cat of Object.values(raw.por_categoria)) {
      if (Array.isArray(cat)) candidateArrays.push({ items: cat as any[], sourceHint: 'megaembed' });
    }
  }
  // VLG / Cineveo: { filmes: [...] }
  if (raw?.filmes && Array.isArray(raw.filmes)) {
    candidateArrays.push({ items: raw.filmes, sourceHint: 'vlg' });
  }
  // Olympus format: { itens: [{ id, titulo, poster, ano, streams }] } — skip if it's a series export
  if (raw?.itens && Array.isArray(raw.itens) && raw?.tipo !== 'series') {
    candidateArrays.push({ items: raw.itens, sourceHint: 'olympus' });
  }
  // Vodx format: { categorias: [{ categoria, filmes: [{ id, nome, logo, stream }] }] }
  if (raw?.categorias && Array.isArray(raw.categorias)) {
    for (const cat of raw.categorias) {
      if (cat?.filmes && Array.isArray(cat.filmes)) {
        candidateArrays.push({ items: cat.filmes, sourceHint: 'vodx' });
      }
    }
  }
  // Bare array
  if (Array.isArray(raw)) {
    candidateArrays.push({ items: raw, sourceHint: 'array' });
  }

  const seenIds = new Set<string>();

  for (const { items, sourceHint } of candidateArrays) {
    for (const item of items) {
      // Skip series items
      if (item.episodios && Array.isArray(item.episodios) && item.episodios.length > 0) continue;
      if (item.type === 'tv' || item.is_series === true) continue;
      if (Array.isArray(item.seasons) && item.seasons.length > 0) continue;
      if (item.seasons && typeof item.seasons === 'object' && Object.keys(item.seasons).length > 0) continue;
      // Skip 24h channel items
      if (item.grupo === 'DESENHOS 24H' || item.nome?.includes('[24h]') || item.grupo?.includes('24H')) continue;
      // Skip entries whose title clearly identifies an episode (SxE / NxN)
      if (looksLikeEpisodeEntry(item)) continue;

      const title = item.nome || item.titulo || item.title || item['{titulo}'] || '';
      if (!title) continue;

      const links: { url: string; quality?: string }[] = [];

      // External format links: [{ direct_url, proxy_url, audio }]
      if (Array.isArray(item.links) && item.links.length > 0 && (item.links[0]?.direct_url || item.links[0]?.proxy_url)) {
        for (const l of item.links) {
          const u = l.direct_url || l.proxy_url;
          if (u && typeof u === 'string' && u.startsWith('http')) {
            links.push({ url: u, quality: l.audio || 'HD' });
          }
        }
      }

      // MegaEmbed/Olympus streams: [{url, type, label}]
      if (links.length === 0 && Array.isArray(item.streams)) {
        for (const s of item.streams) {
          const u = s.url || s.file || s.link;
          if (u && typeof u === 'string' && u.startsWith('http')) {
            links.push({ url: u, quality: s.label || s.resolucao || s.quality || s.audio || 'HD' });
          }
        }
      }

      // Vodx single stream object: { stream: { url, type } }
      if (links.length === 0 && item.stream && typeof item.stream === 'object' && !Array.isArray(item.stream)) {
        const u = item.stream.url;
        if (u && typeof u === 'string' && u.startsWith('http')) {
          links.push({ url: u, quality: 'HD' });
        }
      }

      // Cineveo single stream string: { stream: "https://..." }
      if (links.length === 0 && typeof item.stream === 'string' && item.stream.startsWith('http')) {
        links.push({ url: item.stream, quality: 'HD' });
      }

      // Visioncine {links}
      if (Array.isArray(item['{links}'])) {
        for (const l of item['{links}']) {
          if (l.url && !l.url.includes('TMDB') && l.url.startsWith('http')) {
            links.push({ url: l.url, quality: l.quality || 'HD' });
          }
        }
      }
      if (!links.length && item['{link}'] && typeof item['{link}'] === 'string' && item['{link}'].startsWith('http')) {
        links.push({ url: item['{link}'], quality: 'HD' });
      }

      // Generic link/url/embed_url field
      if (!links.length && item.url && typeof item.url === 'string' && item.url.startsWith('http')) {
        links.push({ url: item.url, quality: 'HD' });
      }
      if (!links.length && item.link && typeof item.link === 'string' && item.link.startsWith('http')) {
        links.push({ url: item.link, quality: 'HD' });
      }
      if (!links.length && item.embed_url && typeof item.embed_url === 'string' && item.embed_url.startsWith('http')) {
        links.push({ url: item.embed_url, quality: 'HD' });
      }

      if (links.length === 0) continue;

      const rawTmdb = item.tmdb_id ?? (item.id && !isNaN(Number(item.id)) ? item.id : null);
      const tmdb_id = rawTmdb && !isNaN(Number(rawTmdb)) ? Number(rawTmdb) : extractTmdbIdFromUrl(item.url);
      const year = item.ano || item.year || item['{ano}'] || null;
      // Extract year from title like "Filme (2025) [Dual]"
      const titleYearMatch = !year && title.match(/\((\d{4})\)/);
      const parsedYear = year ? parseInt(String(year)) : (titleYearMatch ? parseInt(titleYearMatch[1]) : null);
      // Clean title: remove (year), [Dual], [Leg], etc
      const cleanTitle = title.replace(/\s*\(\d{4}\)\s*/g, ' ').replace(/\s*\[.*?\]\s*/g, ' ').replace(/\s+/g, ' ').trim();
      const source = sourceHint === 'external' ? 'external' : (sourceHint === 'megaembed' ? 'megaembed' : (raw?.seedUrl?.includes('cineveo') ? 'cineveo' : (item.source || raw?.source || item.grupo ? 'iptv' : 'vlg')));

      // Dedup by tmdb_id or title
      const dedupKey = tmdb_id ? `tmdb-${tmdb_id}` : `title-${title.toLowerCase()}`;
      if (seenIds.has(dedupKey)) continue;
      seenIds.add(dedupKey);

      movies.push({ title: cleanTitle || title, year: parsedYear, tmdb_id, links, source });
    }
  }

  // Visioncine top-level array format: [{"{titulo}": ...}]
  if (movies.length === 0 && Array.isArray(raw) && raw.length > 0 && raw[0]?.['{titulo}']) {
    for (const item of raw) {
      const title = item['{titulo}'] || '';
      if (!title) continue;
      const links: { url: string; quality?: string }[] = [];
      if (Array.isArray(item['{links}'])) {
        for (const l of item['{links}']) {
          if (l.url && !l.url.includes('TMDB') && l.url.startsWith('http')) {
            links.push({ url: l.url, quality: l.quality || 'HD' });
          }
        }
      }
      if (!links.length && item['{link}'] && item['{link}'].startsWith('http')) {
        links.push({ url: item['{link}'], quality: 'HD' });
      }
      if (links.length === 0) continue;
      movies.push({ title, year: item['{ano}'] ? parseInt(String(item['{ano}'])) : null, tmdb_id: null, links, source: 'visioncine' });
    }
  }

  return movies;
}

function parseTemporadasFormat(raw: any): ParsedSeries | null {
  // Format: { temporadas: { "1": [{episodio, nome, url, logo, grupo}, ...], "2": [...] } }
  if (!raw?.temporadas || typeof raw.temporadas !== 'object') return null;

  const episodios: ParsedEpisode[] = [];
  let seriesName = '';

  for (const [seasonKey, episodes] of Object.entries(raw.temporadas)) {
    const seasonNum = parseInt(seasonKey);
    if (isNaN(seasonNum) || !Array.isArray(episodes)) continue;

    // Deduplicate episodes by season+episode (keep first URL per episode, collect all as streams)
    const epMap = new Map<number, { ep: any; streams: { url: string; tipo?: string }[] }>();

    for (const ep of episodes as any[]) {
      const epNum = ep.episodio || ep.episode || 1;
      const url = ep.url || ep.link || '';
      if (!url || typeof url !== 'string' || !url.startsWith('http')) continue;

      if (!epMap.has(epNum)) {
        epMap.set(epNum, { ep, streams: [] });
      }
      epMap.get(epNum)!.streams.push({ url, tipo: ep.grupo || 'direct' });

      // Extract series name from episode name (e.g. "(Des)encanto S01 E01" → "(Des)encanto")
      if (!seriesName && ep.nome) {
        const nameMatch = ep.nome.match(/^(.+?)\s*S\d+/i);
        if (nameMatch) seriesName = nameMatch[1].trim();
        else seriesName = ep.nome.replace(/\s*[SE]\d+.*$/i, '').trim();
      }
    }

    for (const [epNum, { ep, streams }] of epMap) {
      episodios.push({
        titulo: ep.nome || `T${seasonNum}E${epNum}`,
        temporada: seasonNum,
        episodio: epNum,
        url: streams[0]?.url,
        has_dub: false,
        has_leg: false,
        streams,
      });
    }
  }

  if (episodios.length === 0) return null;

  return {
    nome: seriesName || 'Série Desconhecida',
    tmdb_id: raw.tmdb_id || null,
    episodios,
  };
}

function parseSeasonsFormat(raw: any): ParsedSeries | null {
  // Format: { id: "tmdb_id", title, type: "tv", seasons: { "1": { name, episodes: [{ season, episode, links: [{ direct_url }] }] } } }
  if (!raw?.seasons || typeof raw.seasons !== 'object' || raw.type !== 'tv') return null;

  const episodios: ParsedEpisode[] = [];

  for (const [seasonKey, seasonData] of Object.entries(raw.seasons)) {
    const seasonNum = parseInt(seasonKey);
    if (isNaN(seasonNum)) continue;
    const episodes = (seasonData as any)?.episodes;
    if (!Array.isArray(episodes)) continue;

    for (const ep of episodes) {
      const streams: { url: string; tipo?: string }[] = [];
      if (Array.isArray(ep.links)) {
        for (const l of ep.links) {
          const u = l.direct_url || l.proxy_url;
          if (u && typeof u === 'string' && u.startsWith('http')) {
            streams.push({ url: u, tipo: l.audio || 'direct' });
          }
        }
      }
      if (streams.length > 0) {
        episodios.push({
          titulo: `T${ep.season || seasonNum}E${ep.episode || 1}`,
          temporada: ep.season || seasonNum,
          episodio: ep.episode || 1,
          url: streams[0]?.url,
          has_dub: ep.links?.some((l: any) => l.audio === 'Dublado') || false,
          has_leg: ep.links?.some((l: any) => l.audio === 'Legendado') || false,
          streams,
        });
      }
    }
  }

  if (episodios.length === 0) return null;

  return {
    nome: raw.title || 'Série Desconhecida',
    tmdb_id: raw.id && !isNaN(Number(raw.id)) ? Number(raw.id) : null,
    episodios,
  };
}

function parseItensSeriesFormat(raw: any): ParsedSeries[] {
  // Format: { tipo: "series", itens: [{ id, title, seasons: [{ season, episodes: [{ season, episode, title, streams: [{ url }] }] }] }] }
  if (raw?.tipo !== 'series' || !Array.isArray(raw?.itens)) return [];

  const results: ParsedSeries[] = [];

  for (const item of raw.itens) {
    if (!item.seasons || !Array.isArray(item.seasons)) continue;
    const nome = item.title || item.nome || '';
    if (!nome) continue;

    const episodios: ParsedEpisode[] = [];

    for (const season of item.seasons) {
      const seasonNum = season.season || season.temporada || 1;
      if (!Array.isArray(season.episodes)) continue;

      for (const ep of season.episodes) {
        const streams: { url: string; tipo?: string }[] = [];
        if (Array.isArray(ep.streams)) {
          for (const s of ep.streams) {
            const u = s.url || s.direct_url || s.proxy_direct;
            if (u && typeof u === 'string' && u.startsWith('http')) {
              streams.push({ url: u, tipo: s.audio || s.type || 'direct' });
            }
          }
        }
        if (streams.length > 0) {
          episodios.push({
            titulo: ep.title || `T${seasonNum}E${ep.episode || 1}`,
            temporada: seasonNum,
            episodio: ep.episode || ep.episodio || 1,
            url: streams[0]?.url,
            has_dub: ep.streams?.some((s: any) => s.audio === 'Dublado') || false,
            has_leg: ep.streams?.some((s: any) => s.audio === 'Legendado') || false,
            streams,
          });
        }
      }
    }

    if (episodios.length === 0) continue;

    const tmdb_id = item.id && !isNaN(Number(item.id)) ? Number(item.id) : (item.tmdb_id || null);
    results.push({ nome, tmdb_id, episodios });
  }

  return results;
}

function parseSingleSeriesFormat(raw: any): ParsedSeries | null {
  // Format: { id, title, is_series: true, seasons: [{ season, episodes: [{ season, episode, title, streams }] }] }
  if (!raw?.is_series || !raw?.title || !Array.isArray(raw?.seasons)) return null;

  const episodios: ParsedEpisode[] = [];

  for (const season of raw.seasons) {
    const seasonNum = season.season || season.temporada || 1;
    if (!Array.isArray(season.episodes)) continue;

    for (const ep of season.episodes) {
      const streams: { url: string; tipo?: string }[] = [];
      if (Array.isArray(ep.streams)) {
        for (const s of ep.streams) {
          const u = s.url || s.direct_url || s.proxy_direct;
          if (u && typeof u === 'string' && u.startsWith('http')) {
            streams.push({ url: u, tipo: s.audio || s.type || 'direct' });
          }
        }
      }
      if (streams.length > 0) {
        episodios.push({
          titulo: ep.title || `T${ep.season || seasonNum}E${ep.episode || 1}`,
          temporada: ep.season || seasonNum,
          episodio: ep.episode || ep.episodio || 1,
          url: streams[0]?.url,
          has_dub: ep.streams?.some((s: any) => s.audio === 'Dublado') || false,
          has_leg: ep.streams?.some((s: any) => s.audio === 'Legendado') || false,
          streams,
        });
      }
    }
  }

  if (episodios.length === 0) return null;

  const tmdb_id = raw.id && !isNaN(Number(raw.id)) ? Number(raw.id) : (raw.tmdb_id || null);
  const totalSeasons = raw.total_seasons || null;

  return {
    nome: raw.title,
    tmdb_id,
    episodios,
    // Pass total_seasons hint for auto-split in edge function
    ...(totalSeasons && totalSeasons > 1 ? { total_seasons_hint: totalSeasons } : {}),
  } as any;
}

function parseCineveoSeriesFormat(raw: any): ParsedSeries | null {
  // Format: { tmdb_id, title, type: "tv", seasons: [{ season, episodes: [{ episode, name, stream, still, air_date }] }] }
  const looksLikeSeries = (raw?.type === 'tv' || raw?.is_series === true) && Array.isArray(raw?.seasons) && (raw?.title || raw?.name || raw?.nome);
  if (!looksLikeSeries) return null;

  const episodios: ParsedEpisode[] = [];
  for (const season of raw.seasons) {
    const seasonNum = season.season || season.temporada || season.season_number || 1;
    if (!Array.isArray(season.episodes)) continue;
    for (const ep of season.episodes) {
      const streams: { url: string; tipo?: string }[] = [];
      // Single string stream
      if (typeof ep.stream === 'string' && ep.stream.startsWith('http')) {
        streams.push({ url: ep.stream, tipo: 'direct' });
      }
      // Or array of streams
      if (Array.isArray(ep.streams)) {
        for (const s of ep.streams) {
          const u = typeof s === 'string' ? s : (s.url || s.direct_url);
          if (u && typeof u === 'string' && u.startsWith('http')) streams.push({ url: u, tipo: s.audio || s.type || 'direct' });
        }
      }
      // Or links array (external format)
      if (Array.isArray(ep.links)) {
        for (const l of ep.links) {
          const u = l.direct_url || l.proxy_url || l.url;
          if (u && typeof u === 'string' && u.startsWith('http')) streams.push({ url: u, tipo: l.audio || 'direct' });
        }
      }
      if (streams.length === 0) continue;
      episodios.push({
        titulo: ep.name || ep.title || ep.titulo || `T${seasonNum}E${ep.episode || 1}`,
        temporada: seasonNum,
        episodio: ep.episode || ep.episodio || ep.episode_number || 1,
        url: streams[0].url,
        has_dub: false,
        has_leg: false,
        still_path: ep.still || ep.still_path || null,
        air_date: ep.air_date || null,
        streams,
      });
    }
  }
  if (episodios.length === 0) return null;
  const rawTmdb = raw.tmdb_id ?? raw.id;
  const tmdb_id = rawTmdb && !isNaN(Number(rawTmdb)) ? Number(rawTmdb) : null;
  return { nome: raw.title || raw.name || raw.nome, tmdb_id, episodios };
}

// Walks any nested structure and extracts every series-shaped object (type:"tv" + seasons[])
function collectSeriesItems(raw: any, out: any[] = [], depth = 0): any[] {
  if (!raw || depth > 4) return out;
  if (Array.isArray(raw)) {
    for (const v of raw) collectSeriesItems(v, out, depth + 1);
    return out;
  }
  if (typeof raw !== 'object') return out;
  const isSeries = (raw.type === 'tv' || raw.is_series === true) && Array.isArray(raw.seasons) && raw.seasons.length > 0;
  if (isSeries) {
    out.push(raw);
    return out; // don't descend further inside a series object
  }
  // Recurse into common container keys
  for (const key of ['items', 'todos', 'itens', 'series', 'filmes', 'data', 'results']) {
    if (raw[key]) collectSeriesItems(raw[key], out, depth + 1);
  }
  if (raw.por_categoria && typeof raw.por_categoria === 'object') {
    for (const v of Object.values(raw.por_categoria)) collectSeriesItems(v, out, depth + 1);
  }
  if (raw.categorias && Array.isArray(raw.categorias)) {
    for (const c of raw.categorias) collectSeriesItems(c, out, depth + 1);
  }
  return out;
}

function parseFlatTituloStreamFormat(raw: any): ParsedSeries[] {
  // Format: [{ titulo: "Series Name SxE - Episode Title | source", stream: "url", capturado: ... }, ...]
  // Used for noveflix-style episode captures where each entry is one episode with a single stream URL.
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const sample = raw[0];
  if (!sample || typeof sample !== 'object') return [];
  if (typeof sample.stream !== 'string') return [];
  if (typeof sample.titulo !== 'string') return [];
  if (sample.episodios || sample.seasons) return [];

  // "Name 10x22 - Episode Title | source"  OR  "Name S10E22 - Episode Title"
  const reA = /^(.+?)\s+(\d+)\s*[xX]\s*(\d+)\s*[-–—:]\s*(.+?)(?:\s*\|.*)?$/;
  const reB = /^(.+?)\s+S(\d+)\s*E(\d+)\s*[-–—:]?\s*(.*?)(?:\s*\|.*)?$/i;

  const groups = new Map<string, { nome: string; episodios: ParsedEpisode[]; seen: Set<string> }>();

  for (const item of raw) {
    if (!item?.titulo || !item?.stream) continue;
    const url = String(item.stream).trim();
    if (!url.startsWith('http')) continue;
    const title = String(item.titulo).trim();
    const m = title.match(reA) || title.match(reB);
    if (!m) continue;
    const seriesName = m[1].trim();
    const season = parseInt(m[2]);
    const episode = parseInt(m[3]);
    const epTitle = (m[4] || '').trim() || `T${season}E${episode}`;
    if (!seriesName || isNaN(season) || isNaN(episode)) continue;

    const key = seriesName.toLowerCase();
    if (!groups.has(key)) groups.set(key, { nome: seriesName, episodios: [], seen: new Set() });
    const g = groups.get(key)!;
    const dedup = `${season}x${episode}|${url}`;
    if (g.seen.has(dedup)) continue;
    g.seen.add(dedup);
    g.episodios.push({
      titulo: epTitle,
      temporada: season,
      episodio: episode,
      url,
      has_dub: false,
      has_leg: false,
      streams: [{ url, tipo: 'direct' }],
    });
  }

  const out: ParsedSeries[] = [];
  for (const { nome, episodios } of groups.values()) {
    if (episodios.length > 0) out.push({ nome, tmdb_id: null, episodios });
  }
  return out;
}

function parseAllSeries(raw: any): ParsedSeries[] {
  const results: ParsedSeries[] = [];
  const seenTmdb = new Set<number>();
  const seenName = new Set<string>();

  // ── Flat array of { titulo, stream } entries (noveflix-style episode captures) ──
  const flatResults = parseFlatTituloStreamFormat(raw);
  if (flatResults.length > 0) return flatResults;

  // ── Generic scan: pick up every series-shaped item (type:"tv" + seasons[]) at any depth ──
  const seriesItems = collectSeriesItems(raw);
  for (const item of seriesItems) {
    const parsed = parseCineveoSeriesFormat(item);
    if (!parsed) continue;
    const dedupKey = parsed.tmdb_id ? `t:${parsed.tmdb_id}` : `n:${parsed.nome.toLowerCase()}`;
    if (parsed.tmdb_id && seenTmdb.has(parsed.tmdb_id)) continue;
    if (!parsed.tmdb_id && seenName.has(dedupKey)) continue;
    if (parsed.tmdb_id) seenTmdb.add(parsed.tmdb_id); else seenName.add(dedupKey);
    results.push(parsed);
  }
  if (results.length > 0) return results;

  // ── Cineveo single-series export (type:"tv" + seasons array) ──
  const cineveoResult = parseCineveoSeriesFormat(raw);
  if (cineveoResult) {
    results.push(cineveoResult);
    return results;
  }

  // ── Check for single series format (is_series: true with seasons array) ──
  const singleResult = parseSingleSeriesFormat(raw);
  if (singleResult) {
    results.push(singleResult);
    return results;
  }

  // ── Check for itens series format (exported series with seasons array) ──
  const itensResults = parseItensSeriesFormat(raw);
  if (itensResults.length > 0) return itensResults;

  // ── Check for seasons format (gray.json style) ──
  const seasonsResult = parseSeasonsFormat(raw);
  if (seasonsResult) {
    results.push(seasonsResult);
    return results;
  }

  // ── Array of seasons-format objects (JSONL with multiple series) ──
  if (Array.isArray(raw) && raw.length > 0 && raw[0]?.seasons && raw[0]?.type === 'tv') {
    for (const item of raw) {
      const parsed = parseSeasonsFormat(item);
      if (parsed) results.push(parsed);
    }
    if (results.length > 0) return results;
  }

  // ── Check for temporadas format ──
  const temporadasResult = parseTemporadasFormat(raw);
  if (temporadasResult) {
    results.push(temporadasResult);
    return results;
  }

  // Collect candidate arrays
  let seriesArr: any[] | null = null;

  // MegaEmbed series format: { todos: [...], totalSeries: N }
  if (raw?.todos && Array.isArray(raw.todos) && raw?.totalSeries) {
    seriesArr = raw.todos;
  }
  // MegaEmbed por_categoria for series
  if (!seriesArr && raw?.por_categoria && typeof raw.por_categoria === 'object' && raw?.totalSeries) {
    const all: any[] = [];
    const seen = new Set<number>();
    for (const cat of Object.values(raw.por_categoria)) {
      if (Array.isArray(cat)) {
        for (const item of cat) {
          if (item.tmdb_id && !seen.has(item.tmdb_id)) {
            seen.add(item.tmdb_id);
            all.push(item);
          }
        }
      }
    }
    if (all.length > 0) seriesArr = all;
  }
  // { series: [...] }
  if (!seriesArr && raw?.series && Array.isArray(raw.series)) {
    seriesArr = raw.series;
  }
  // Bare array with episodios
  if (!seriesArr && Array.isArray(raw) && raw.length > 0 && raw[0]?.episodios) {
    seriesArr = raw;
  }
  // filmes array with episodios (mixed files)
  if (!seriesArr && raw?.filmes && Array.isArray(raw.filmes)) {
    const withEps = raw.filmes.filter((i: any) => i.episodios && Array.isArray(i.episodios) && i.episodios.length > 0);
    if (withEps.length > 0) seriesArr = withEps;
  }

  if (!seriesArr || !Array.isArray(seriesArr)) return results;

  for (const item of seriesArr) {
    const nome = item.nome || item.titulo || item.title || '';
    if (!nome) continue;

    const episodios: ParsedEpisode[] = [];
    if (Array.isArray(item.episodios)) {
      for (const ep of item.episodios) {
        const streams: { url: string; tipo?: string }[] = [];
        if (Array.isArray(ep.streams)) {
          for (const s of ep.streams) {
            const u = s.url || s.file || s.link;
            if (u && typeof u === 'string' && u.startsWith('http')) {
              streams.push({ url: u, tipo: s.tipo || s.type || s.label });
            }
          }
        }
        // If no streams but has embed_url, use that
        if (streams.length === 0 && ep.embed_url && typeof ep.embed_url === 'string' && ep.embed_url.startsWith('http')) {
          streams.push({ url: ep.embed_url, tipo: 'embed' });
        }
        if (streams.length > 0) {
          episodios.push({
            titulo: ep.titulo || ep.ep_titulo || ep.title || `T${ep.temporada || ep.season || 1}E${ep.episodio || ep.episode || 1}`,
            temporada: ep.temporada || ep.season || 1,
            episodio: ep.episodio || ep.episode || 1,
            url: ep.url || ep.embed_url,
            has_dub: ep.has_dub || ep.dub || false,
            has_leg: ep.has_leg || ep.leg || false,
            streams,
          });
        }
      }
    }

    if (episodios.length === 0) continue;

    const tmdb_id = item.tmdb_id || null;
    results.push({ nome, tmdb_id, episodios });
  }

  return results;
}

// ─── Component ───

const ImportMovies: React.FC = () => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ imported: 0, skipped: 0, errors: 0, total: 0, episodes: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [percentDone, setPercentDone] = useState(0);
  const [skippedList, setSkippedList] = useState<{ title: string; reason: string }[]>([]);
  const [errorList, setErrorList] = useState<{ title: string; reason: string }[]>([]);
  const [urlsAddedList, setUrlsAddedList] = useState<{ title: string; count: number }[]>([]);
  const [noNewUrlsList, setNoNewUrlsList] = useState<{ title: string; reason: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-200), msg]);

  const runImport = useCallback(async (json: any) => {
    const movies = parseAllMovies(json);
    const series = parseAllSeries(json);

    if (movies.length === 0 && series.length === 0) {
      toast({ title: 'Erro', description: 'Nenhum conteúdo reconhecido no arquivo. Verifique o formato JSON.', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    abortRef.current = false;
    setProgress({ imported: 0, skipped: 0, errors: 0, total: 0, episodes: 0 });
    setPercentDone(0);
    setSkippedList([]);
    setErrorList([]);
    setUrlsAddedList([]);
    setNoNewUrlsList([]);

    const totalItems = movies.length + series.length;
    let totalImported = 0, totalSkipped = 0, totalErrors = 0, totalEpisodes = 0;
    let processed = 0;

    // Check if this is a channels JSON
    if (isChannelJson(json)) {
      addLog('📡 Detectado JSON de canais ao vivo! Importando canais...');
      try {
        const { data, error } = await supabase.functions.invoke('import-channels', {
          body: json,
        });
        if (error) throw error;
        addLog(`✅ ${data.inserted} canais importados, ${data.categories} categorias, ${data.skipped} pulados, ${data.errors} erros`);
        toast({ title: 'Canais importados!', description: `${data.inserted} canais ao vivo importados com sucesso!` });
      } catch (err: any) {
        addLog(`❌ Erro ao importar canais: ${err.message}`);
        toast({ title: 'Erro', description: err.message, variant: 'destructive' });
      }
      setIsImporting(false);
      return;
    }

    addLog(`📊 Detectados: ${movies.length} filmes/animes, ${series.length} séries`);

    try {
      // ── Import movies in batches of 50 ──
      if (movies.length > 0) {
        const BATCH_SIZE = 50;
        // Detect MegaEmbed format: items have streams array
        const hasMegaEmbedStreams = movies.some(m => m.links.length > 0 && m.tmdb_id);
        addLog(`🎬 Importando ${movies.length} filmes/animes...`);

        for (let i = 0; i < movies.length && !abortRef.current; i += BATCH_SIZE) {
          const batch = movies.slice(i, i + BATCH_SIZE);
          addLog(`🔄 Filmes: lote ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} itens)`);

          try {
            // Import metadata via import-movies
            const { data, error } = await supabase.functions.invoke('import-movies', {
              body: { batch },
            });
            if (error) throw error;

            totalImported += data.imported || 0;
            totalSkipped += data.skipped || 0;
            totalErrors += data.errors || 0;
            const metadataInfo = data.metadata_updated ? `, ${data.metadata_updated} sinopses/infos TMDB atualizadas` : '';
            addLog(`✅ +${data.imported} importados, ${data.skipped} já existiam${data.urls_added ? `, ${data.urls_added} URLs novas` : ''}${metadataInfo}, ${data.errors} erros`);
            if (data.errors > 0) {
              const reasons = Array.isArray(data.errorReasons) ? data.errorReasons : [];
              if (reasons.length === 0) {
                addLog(`   ⚠️ ${data.errors} erro(s) sem motivo retornado pelo servidor`);
              } else {
                const shown = reasons.slice(0, 5);
                for (const r of shown) {
                  const msg = typeof r === 'string' ? r : `${r.title}: ${r.reason}`;
                  addLog(`   ⚠️ ${msg}`);
                }
                if (reasons.length > 5) addLog(`   … e mais ${reasons.length - 5} motivo(s) no painel "Erros"`);
              }
            }
            if (Array.isArray(data.skippedDetails) && data.skippedDetails.length > 0) {
              setSkippedList(prev => [...prev, ...data.skippedDetails]);
            }
            if (Array.isArray(data.errorReasons) && data.errorReasons.length > 0) {
              // Backend now returns objects {title, reason}; tolerate legacy strings too
              const normalized = data.errorReasons.map((r: any) =>
                typeof r === 'string' ? { title: r.split(':')[0] || r, reason: r } : r
              );
              setErrorList(prev => [...prev, ...normalized]);
            }
            if (Array.isArray(data.urlsAddedDetails) && data.urlsAddedDetails.length > 0) {
              setUrlsAddedList(prev => [...prev, ...data.urlsAddedDetails]);
            }
            if (Array.isArray(data.noNewUrlsDetails) && data.noNewUrlsDetails.length > 0) {
              setNoNewUrlsList(prev => [...prev, ...data.noNewUrlsDetails]);
            }
          } catch (err: any) {
            addLog(`❌ Erro no lote: ${err.message}`);
            totalErrors += batch.length;
          }

          // Also import streams if MegaEmbed format detected
          if (hasMegaEmbedStreams) {
            try {
              const streamItems = batch
                .filter(m => m.tmdb_id && m.links.length > 0)
                .map(m => ({ tmdb_id: m.tmdb_id, streams: m.links.map(l => ({ url: l.url })) }));
              if (streamItems.length > 0) {
                const { data: sData } = await supabase.functions.invoke('import-streams', {
                  body: { type: 'movies', items: streamItems },
                });
                if (sData) addLog(`🔗 Streams: +${sData.inserted} inseridos, ${sData.skipped} pulados`);
              }
            } catch (err: any) {
              addLog(`⚠️ Streams erro: ${err.message}`);
            }
          }

          processed += batch.length;
          const pct = Math.min(100, Math.round((processed / totalItems) * 100));
          setPercentDone(pct);
          setProgress({ imported: totalImported, skipped: totalSkipped, errors: totalErrors, total: totalItems, episodes: totalEpisodes });

          if (i + BATCH_SIZE < movies.length) await new Promise(r => setTimeout(r, 300));
        }
      }

      // ── Import series — adaptive batching to avoid timeouts ──
      if (series.length > 0 && !abortRef.current) {
        addLog(`📺 Importando ${series.length} séries...`);

        const MAX_EPS_PER_BATCH = 100;

        // Split large series into chunks, BUT keep series intact if all episodes
        // are in the same season (needs auto-split by TMDB, can't be split across batches)
        const expandedSeries: ParsedSeries[] = [];
        for (const s of series) {
          const uniqueSeasons = new Set(s.episodios.map(e => e.temporada));
          const needsAutoSplit = uniqueSeasons.size === 1 && s.episodios.length > MAX_EPS_PER_BATCH;
          
          if (needsAutoSplit) {
            // Send entire series in one batch — auto-split needs all episodes together
            expandedSeries.push(s);
          } else if (s.episodios.length <= MAX_EPS_PER_BATCH) {
            expandedSeries.push(s);
          } else {
            // Multiple seasons already defined — safe to split into chunks
            for (let j = 0; j < s.episodios.length; j += MAX_EPS_PER_BATCH) {
              expandedSeries.push({
                nome: s.nome,
                tmdb_id: s.tmdb_id,
                episodios: s.episodios.slice(j, j + MAX_EPS_PER_BATCH),
              });
            }
          }
        }

        // Group into batches where total episodes ≤ MAX_EPS_PER_BATCH
        const seriesBatches: ParsedSeries[][] = [];
        let currentBatch: ParsedSeries[] = [];
        let currentEps = 0;

        for (const s of expandedSeries) {
          // If this single series exceeds the limit (needs auto-split), send it alone
          if (s.episodios.length > MAX_EPS_PER_BATCH) {
            if (currentBatch.length > 0) {
              seriesBatches.push(currentBatch);
              currentBatch = [];
              currentEps = 0;
            }
            seriesBatches.push([s]);
            continue;
          }
          if (currentEps + s.episodios.length > MAX_EPS_PER_BATCH && currentBatch.length > 0) {
            seriesBatches.push(currentBatch);
            currentBatch = [];
            currentEps = 0;
          }
          currentBatch.push(s);
          currentEps += s.episodios.length;
        }
        if (currentBatch.length > 0) seriesBatches.push(currentBatch);

        for (let bIdx = 0; bIdx < seriesBatches.length && !abortRef.current; bIdx++) {
          const batch = seriesBatches[bIdx];
          const totalEps = batch.reduce((sum, s) => sum + s.episodios.length, 0);
          addLog(`🔄 Séries: lote ${bIdx + 1}/${seriesBatches.length} (${batch.length} séries, ${totalEps} episódios)`);

          try {
            const { data, error } = await supabase.functions.invoke('import-series', {
              body: { batch },
            });
            if (error) throw error;

            totalImported += data.imported || 0;
            totalSkipped += data.skipped || 0;
            totalErrors += data.errors || 0;
            totalEpisodes += data.episodes_imported || 0;
            const urlsInfo = data.urls_added ? `, ${data.urls_added} URLs novas` : '';
            const metadataInfo = data.metadata_updated ? `, ${data.metadata_updated} sinopses/infos TMDB atualizadas` : '';
            const errInfo = data.errors ? `, ${data.errors} erros` : '';
            addLog(`✅ +${data.imported} séries, ${data.episodes_imported || 0} episódios, ${data.skipped} existentes${urlsInfo}${metadataInfo}${errInfo}`);
            if (data.errors > 0) {
              const reasons = Array.isArray(data.errorReasons) ? data.errorReasons : [];
              if (reasons.length === 0) {
                addLog(`   ⚠️ ${data.errors} erro(s) sem motivo retornado pelo servidor`);
              } else {
                const shown = reasons.slice(0, 5);
                for (const r of shown) {
                  const msg = typeof r === 'string' ? r : `${r.title}: ${r.reason}`;
                  addLog(`   ⚠️ ${msg}`);
                }
                if (reasons.length > 5) addLog(`   … e mais ${reasons.length - 5} motivo(s) no painel "Erros"`);
              }
            }
            if (Array.isArray(data.skippedDetails) && data.skippedDetails.length > 0) {
              setSkippedList(prev => [...prev, ...data.skippedDetails]);
            }
            if (Array.isArray(data.errorReasons) && data.errorReasons.length > 0) {
              const normalized = data.errorReasons.map((r: any) =>
                typeof r === 'string' ? { title: r.split(':')[0] || r, reason: r } : r
              );
              setErrorList(prev => [...prev, ...normalized]);
            }
            if (Array.isArray(data.urlsAddedDetails) && data.urlsAddedDetails.length > 0) {
              setUrlsAddedList(prev => [...prev, ...data.urlsAddedDetails]);
            }
            if (Array.isArray(data.noNewUrlsDetails) && data.noNewUrlsDetails.length > 0) {
              setNoNewUrlsList(prev => [...prev, ...data.noNewUrlsDetails]);
            }
          } catch (err: any) {
            addLog(`❌ Erro no lote: ${err.message}`);
            totalErrors += batch.length;
          }

          processed += batch.length;
          const pct = Math.min(100, Math.round((processed / totalItems) * 100));
          setPercentDone(pct);
          setProgress({ imported: totalImported, skipped: totalSkipped, errors: totalErrors, total: totalItems, episodes: totalEpisodes });

          if (bIdx + 1 < seriesBatches.length) await new Promise(r => setTimeout(r, 500));
        }
      }

      if (abortRef.current) {
        addLog(`⏹️ Importação cancelada pelo usuário.`);
      } else {
        const epInfo = totalEpisodes > 0 ? `, ${totalEpisodes} episódios` : '';
        addLog(`🎉 Concluído! ${totalImported} importados${epInfo}, ${totalSkipped} já existiam, ${totalErrors} erros.`);
      }
      toast({ title: 'Importação finalizada', description: `${totalImported} itens importados!` });
    } catch (err: any) {
      addLog(`❌ Erro fatal: ${err.message}`);
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  }, [toast]);

  const handleAutoImport = async () => {
    try {
      setIsImporting(true);
      setLogs([]);
      addLog('📂 Carregando arquivo do servidor...');

      const res = await fetch('/vlg-filmes.json');
      if (!res.ok) throw new Error('Arquivo não encontrado no servidor');
      const json = await res.json();

      addLog(`📦 ${json.totalFilmes || json.totalSeries || 'N/A'} itens no arquivo`);
      await runImport(json);
    } catch (err: any) {
      addLog(`❌ ${err.message}`);
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
      setIsImporting(false);
    }
  };

  const handleBulkSync = async () => {
    try {
      setIsImporting(true);
      setLogs([]);
      setProgress({ imported: 0, skipped: 0, errors: 0, total: 0, episodes: 0 });
      setPercentDone(0);

      addLog('📂 Carregando catálogo completo...');
      const res = await fetch('/vlg-filmes.json');
      if (!res.ok) throw new Error('Arquivo vlg-filmes.json não encontrado');
      const json = await res.json();
      const filmes = json.filmes || [];
      addLog(`📦 ${filmes.length} filmes no arquivo. Enviando em lotes de 25...`);

      const BATCH = 25;
      let totalImported = 0, totalSkipped = 0, totalErrors = 0, totalStreams = 0;

      for (let i = 0; i < filmes.length && !abortRef.current; i += BATCH) {
        const batch = filmes.slice(i, i + BATCH).map((f: any) => ({
          nome: f.nome,
          streams: f.streams || [],
        }));

        addLog(`🔄 Lote ${Math.floor(i / BATCH) + 1}/${Math.ceil(filmes.length / BATCH)} (${i + 1}-${Math.min(i + BATCH, filmes.length)})`);

        try {
          const { data, error } = await supabase.functions.invoke('bulk-import', {
            body: { filmes: batch },
          });
          if (error) throw error;

          totalImported += data.imported || 0;
          totalSkipped += data.skipped || 0;
          totalErrors += data.errors || 0;
          totalStreams += data.streamsInserted || 0;

          if (data.imported > 0 || data.streamsInserted > 0) {
            addLog(`✅ +${data.imported} novos, +${data.streamsInserted} streams, ${data.skipped} existentes`);
          }
        } catch (err: any) {
          addLog(`❌ Erro: ${err.message}`);
          totalErrors += batch.length;
        }

        const pct = Math.min(100, Math.round(((i + BATCH) / filmes.length) * 100));
        setPercentDone(pct);
        setProgress({ imported: totalImported, skipped: totalSkipped, errors: totalErrors, total: filmes.length, episodes: totalStreams });

        // Small delay between batches
        if (i + BATCH < filmes.length) await new Promise(r => setTimeout(r, 200));
      }

      addLog(`🎉 Concluído! ${totalImported} novos filmes, ${totalStreams} streams, ${totalSkipped} já existiam, ${totalErrors} erros.`);
      toast({ title: 'Sincronização completa', description: `${totalImported} novos + ${totalStreams} streams` });
    } catch (err: any) {
      addLog(`❌ ${err.message}`);
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLogs([]);
    const fileList = Array.from(files);
    addLog(`📂 ${fileList.length} arquivo(s) selecionado(s)`);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (abortRef.current) break;

      try {
        addLog(`\n📂 [${i + 1}/${fileList.length}] Lendo: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
        const text = await file.text();
        
        // Try standard JSON first, fallback to NDJSON (one JSON object per line)
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          // NDJSON format: each line is a separate JSON object
          const lines = text.split('\n').filter(l => l.trim());
          const parsed = lines.map(l => JSON.parse(l));
          if (parsed.length > 0) {
            json = parsed;
            addLog(`📦 Formato NDJSON detectado: ${parsed.length} itens`);
          } else {
            throw new Error('Formato JSON inválido');
          }
        }

        if (json.temporadas) addLog(`📦 Formato temporadas detectado (${Object.keys(json.temporadas).length} temporadas)`);
        else if (json.totalSeries) addLog(`📦 ${json.totalSeries} séries, ${json.totalEpisodios || '?'} episódios`);
        else if (json.totalFilmes) addLog(`📦 ${json.totalFilmes} filmes/animes`);
        else if (Array.isArray(json)) addLog(`📦 ${json.length} itens no array`);

        await runImport(json);
      } catch (err: any) {
        addLog(`❌ Erro em ${file.name}: ${err.message}`);
        toast({ title: 'Erro', description: `${file.name}: ${err.message}`, variant: 'destructive' });
      }
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold text-foreground mb-6">Importar Conteúdo</h1>
        <p className="text-muted-foreground mb-8">
          Importe filmes, séries ou animes a partir de qualquer arquivo JSON. O sistema detecta automaticamente
          o formato (VLG, Cineveo, Visioncine, etc.) e busca metadados no TMDB.
        </p>

        <div className="bg-card border border-border rounded-lg p-8 mb-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleBulkSync}
              disabled={isImporting}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isImporting ? 'Sincronizando...' : '🔄 Sincronizar Catálogo (Sem Duplicatas)'}
            </Button>

            <Button
              onClick={handleAutoImport}
              disabled={isImporting}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
              {isImporting ? 'Importando...' : 'Importar VLG (Automático)'}
            </Button>

            {isImporting && (
              <Button variant="destructive" onClick={() => { abortRef.current = true; }}>
                Cancelar
              </Button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".json,.jsonl,.tmp.jsonl"
              multiple
              onChange={handleFileImport}
              disabled={isImporting}
              className="hidden"
              id="json-upload"
            />
            <label htmlFor="json-upload">
              <Button asChild disabled={isImporting} variant="outline" className="gap-2 cursor-pointer">
                <span>
                  <Upload className="h-4 w-4" />
                  Upload JSON (Múltiplos Arquivos)
                </span>
              </Button>
            </label>
          </div>

          <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Film className="h-3 w-3" /> Filmes & Animes: VLG, Cineveo, Visioncine, MegaEmbed</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1"><Tv className="h-3 w-3" /> Séries: Cineveo, MegaEmbed, arrays com episódios</span>
            <span className="text-border">|</span>
            <span className="flex items-center gap-1"><Radio className="h-3 w-3" /> Canais ao Vivo: SaimoTV, formato com stream_url</span>
            <span className="text-border">|</span>
            <span>Detecção automática de formato + importação de streams</span>
          </div>

          {progress.total > 0 && (
            <>
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progresso</span>
                  <span>{percentDone}% — {progress.imported + progress.skipped + progress.errors} / {progress.total}</span>
                </div>
                <Progress value={percentDone} className="h-3" />
              </div>

              <div className={`grid ${progress.episodes > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-4`}>
                <div className="bg-green-900/30 border border-green-500/30 rounded p-3 text-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-green-400">{progress.imported}</div>
                  <div className="text-xs text-muted-foreground">Importados</div>
                </div>
                {progress.episodes > 0 && (
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded p-3 text-center">
                    <Tv className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                    <div className="text-2xl font-bold text-blue-400">{progress.episodes}</div>
                    <div className="text-xs text-muted-foreground">Episódios</div>
                  </div>
                )}
                <div className="bg-yellow-900/30 border border-yellow-500/30 rounded p-3 text-center">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-yellow-400">{progress.skipped}</div>
                  <div className="text-xs text-muted-foreground">Já existiam</div>
                </div>
                <div className="bg-red-900/30 border border-red-500/30 rounded p-3 text-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-red-400">{progress.errors}</div>
                  <div className="text-xs text-muted-foreground">Erros</div>
                </div>
              </div>
            </>
          )}
        </div>

        {(skippedList.length > 0 || errorList.length > 0 || urlsAddedList.length > 0 || noNewUrlsList.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* PULADOS — já existiam */}
            {skippedList.length > 0 && (
              <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-lg overflow-hidden">
                <div className="bg-yellow-500/10 px-4 py-2 border-b border-yellow-500/30 flex items-center justify-between">
                  <h3 className="font-semibold text-yellow-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Pulados — já existiam
                  </h3>
                  <span className="text-xs text-yellow-400/80">{skippedList.length}</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-yellow-500/10">
                  {skippedList.map((item, i) => (
                    <div key={i} className="px-4 py-2 text-xs">
                      <div className="text-yellow-100 font-medium truncate">{item.title}</div>
                      <div className="text-yellow-400/70 text-[11px]">{item.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ERROS — falhas reais com motivo */}
            {errorList.length > 0 && (
              <div className="bg-red-950/20 border border-red-500/30 rounded-lg overflow-hidden md:col-span-2">
                <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/30 flex items-center justify-between">
                  <h3 className="font-semibold text-red-300 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Erros novos — não importados
                  </h3>
                  <span className="text-xs text-red-400/80">{errorList.length}</span>
                </div>

                {/* Resumo agrupado por motivo */}
                {(() => {
                  const groups = new Map<string, number>();
                  for (const it of errorList) {
                    const key = (it.reason || 'Sem motivo')
                      .replace(/"[^"]+"/g, '"…"')
                      .replace(/\b[0-9a-f]{8}-[0-9a-f-]+\b/gi, '<id>')
                      .slice(0, 160);
                    groups.set(key, (groups.get(key) || 0) + 1);
                  }
                  const sorted = [...groups.entries()].sort((a, b) => b[1] - a[1]);
                  return (
                    <div className="px-4 py-2 border-b border-red-500/20 bg-red-500/5">
                      <div className="text-[11px] uppercase tracking-wide text-red-300/80 mb-1">
                        Resumo por motivo ({sorted.length})
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {sorted.map(([reason, count], i) => (
                          <div key={i} className="flex items-start justify-between gap-2 text-xs">
                            <span className="text-red-100/90 break-words flex-1">{reason}</span>
                            <span className="text-red-300 font-bold whitespace-nowrap">×{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div className="max-h-64 overflow-y-auto divide-y divide-red-500/10">
                  {errorList.slice(0, 200).map((item, i) => (
                    <div key={i} className="px-4 py-2 text-xs">
                      <div className="text-red-100 font-medium truncate">{item.title}</div>
                      <div className="text-red-400/70 text-[11px] break-words">{item.reason}</div>
                    </div>
                  ))}
                  {errorList.length > 200 && (
                    <div className="px-4 py-2 text-[11px] text-red-300/70">
                      … e mais {errorList.length - 200} erros
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* URLs adicionadas a filmes existentes */}
            {urlsAddedList.length > 0 && (
              <div className="bg-blue-950/20 border border-blue-500/30 rounded-lg overflow-hidden">
                <div className="bg-blue-500/10 px-4 py-2 border-b border-blue-500/30 flex items-center justify-between">
                  <h3 className="font-semibold text-blue-300 text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> URLs adicionadas (já existia)
                  </h3>
                  <span className="text-xs text-blue-400/80">{urlsAddedList.length}</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-blue-500/10">
                  {urlsAddedList.map((item, i) => (
                    <div key={i} className="px-4 py-2 text-xs flex justify-between gap-2">
                      <div className="text-blue-100 font-medium truncate">{item.title}</div>
                      <div className="text-blue-400 font-bold">+{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* URLs já existentes — nada adicionado */}
            {noNewUrlsList.length > 0 && (
              <div className="bg-muted/20 border border-border rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-muted-foreground text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> URLs já cadastradas
                  </h3>
                  <span className="text-xs text-muted-foreground">{noNewUrlsList.length}</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-border">
                  {noNewUrlsList.map((item, i) => (
                    <div key={i} className="px-4 py-2 text-xs">
                      <div className="text-foreground/80 font-medium truncate">{item.title}</div>
                      <div className="text-muted-foreground text-[11px]">{item.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {logs.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 max-h-80 overflow-y-auto font-mono text-xs">
            {logs.map((log, i) => (
              <div key={i} className="text-muted-foreground py-0.5">{log}</div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ImportMovies;
