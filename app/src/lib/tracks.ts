export interface Track {
  raw: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  time: string;
  sec: number;
  genre?: string;
  energy: number | null;
}

export interface SongInfo {
  base: string;
  ver: string;
  arts: string[];
}

export function toSec(t: string): number {
  const p = (t || '').split(':').map(Number);
  if (p.length === 2) return p[0] * 60 + p[1];
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  return 0;
}

const stripAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
export const norm = (s: string) => stripAccents((s || '').toLowerCase()).replace(/[^a-z0-9]/g, '');

// Words that describe a version rather than the song, ignored when matching.
const GENERIC = /\b(original|extended|club|radio|clean|dirty|explicit|intro|outro|mix|version|vip|hype|mixed|edit)\b/g;

/** Strip record-pool tags, hashtags, domains and leading/trailing BPM numbers. */
export function cleanTitle(s: string): string {
  let t = s || '';
  t = t
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/#\S+(\s+vip\b)?/gi, ' ')
    .replace(/\S+\.(com|net|org|io)\S*/gi, ' ');
  t = t.replace(/^\s*\d{2,3}\s*-\s*/, '').replace(/\s+\d{2,3}\s*$/, '');
  t = t
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s\-–]+$/, '')
    .trim();
  return t || (s || '').trim();
}

const artistTokens = (a: string) =>
  (a || '')
    .split(/[/,&]|\sx\s|\bfeat\.?|\bft\.?|\bvs\.?/i)
    .map(norm)
    .filter((x) => x.length >= 3);

export function songInfo(t: Pick<Track, 'title' | 'artist'>): SongInfo {
  let s = cleanTitle(t.title).replace(/\brmx\b/gi, 'remix');
  const arts = artistTokens(t.artist);
  const ver: string[] = [];
  s = s.replace(/[([]([^)\]]*)[)\]]/g, (_m, x: string) => {
    ver.push(x);
    return ' ';
  });
  s = s.replace(/\s(feat\.?|ft\.?)\s.*$/i, '');
  const parts = s.split(/\s[-–]\s/);
  if (parts.length > 1) {
    const A = norm(parts[0]);
    const B = parts.slice(1).join(' ');
    if (arts.some((x) => A.includes(x) || x.includes(A))) {
      // "Artist - Title"
      s = B;
      arts.push(A);
    } else if (arts.some((x) => norm(B).includes(x)) || /remix|mix|edit|rework/i.test(B)) {
      // "Title - Remixer Remix"
      ver.push(B);
      s = parts[0];
    } else if (A.length <= 20 && parts.length === 2) {
      s = B;
      arts.push(A);
    }
  }
  const lower = (x: string) => stripAccents(x.toLowerCase());
  const base = norm(lower(s).replace(GENERIC, ' '));
  const v = norm(ver.map((x) => lower(x).replace(/\brmx\b/g, 'remix').replace(GENERIC, ' ')).join(' '));
  return { base: base || norm(s), ver: v, arts };
}

function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Same song: equal base title (or a small typo in long titles); short titles also need an artist overlap. */
export function sameSong(x: SongInfo, y: SongInfo): boolean {
  if (x.base.length < 3 || y.base.length < 3) return false;
  const close = x.base === y.base || (x.base.length >= 8 && lev(x.base, y.base) <= 2);
  if (!close) return false;
  const art = x.arts.some((a) => y.arts.some((b) => a.includes(b) || b.includes(a)));
  return art || x.base.length >= 8;
}

export interface GroupItem<Id> {
  id: Id;
  i: number;
  t: Track;
  info?: SongInfo;
}
export interface Group<Id> {
  m: (GroupItem<Id> & { info: SongInfo })[];
}

export function groupTracks<Id>(items: GroupItem<Id>[]): Group<Id>[] {
  const gs: Group<Id>[] = [];
  for (const it of items) {
    const withInfo = { ...it, info: songInfo(it.t) };
    const g = gs.find((g) => sameSong(g.m[0].info, withInfo.info));
    if (g) g.m.push(withInfo);
    else gs.push({ m: [withInfo] });
  }
  return gs;
}

/** rekordbox exports are usually UTF-16LE with a BOM. */
export function decode(buf: ArrayBuffer): string {
  const b = new Uint8Array(buf);
  let enc = 'utf-8';
  if (b[0] === 0xff && b[1] === 0xfe) enc = 'utf-16le';
  else if (b[0] === 0xfe && b[1] === 0xff) enc = 'utf-16be';
  else if (b.length > 3 && b[1] === 0 && b[3] === 0) enc = 'utf-16le';
  return new TextDecoder(enc).decode(buf).replace(/^﻿/, '');
}

/** Parse a rekordbox "Export to a file for KUVO" tab-separated playlist. */
export function parsePlaylist(text: string): Track[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const head = lines[0].split('\t').map((s) => s.trim().toLowerCase());
  const ix = (n: string) => head.indexOf(n);
  const iT = ix('track title'), iB = ix('bpm'), iK = ix('key'), iA = ix('artist'), iTm = ix('time'), iG = ix('genre');
  if (iT < 0) return [];
  return lines
    .slice(1)
    .map((l) => {
      const c = l.split('\t');
      let t = (c[iT] || '').trim();
      let energy: number | null = null;
      // Mixed In Key appends " - 6" as an energy rating.
      const m = t.match(/^(.*)\s-\s(\d{1,2})$/);
      if (m) {
        t = m[1].trim();
        energy = +m[2];
      }
      const time = (c[iTm] || '').trim();
      return {
        raw: t,
        title: cleanTitle(t),
        artist: (c[iA] || '').trim(),
        bpm: parseFloat(c[iB]) || 0,
        key: (c[iK] || '').trim(),
        time,
        sec: toSec(time),
        genre: (c[iG] || '').trim(),
        energy,
      };
    })
    .filter((r) => r.title);
}

export type TrackTuple = [title: string, artist: string, bpm: number, key: string, time: string, energy: number];

export const mk = (a: TrackTuple[]): Track[] =>
  a.map(([title, artist, bpm, key, time, energy]) => ({
    raw: title,
    title: cleanTitle(title),
    artist,
    bpm,
    key,
    time,
    energy,
    sec: toSec(time),
  }));

export interface SetStats {
  n: number;
  dur: number;
  avg: number;
  min: number;
  max: number;
}

export function stat(tr: Track[]): SetStats {
  const b = tr.map((t) => t.bpm).filter(Boolean);
  const sum = b.reduce((a, x) => a + x, 0);
  return {
    n: tr.length,
    dur: tr.reduce((a, t) => a + t.sec, 0),
    avg: b.length ? sum / b.length : 0,
    min: b.length ? Math.min(...b) : 0,
    max: b.length ? Math.max(...b) : 0,
  };
}

export const fmtDur = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};
export const fmtBpm = (b: number) => (Math.round(b * 10) / 10).toString().replace(/\.0$/, '');
