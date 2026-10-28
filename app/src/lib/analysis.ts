import { fmtBpm, fmtDur, groupTracks, stat, type Group, type Track } from './tracks';

export type DjId = string;

export interface Dj {
  name: string;
  time: string;
  tracks: Track[] | null;
  me?: boolean;
  /** A slot in a new event that no DJ has taken yet. */
  open?: boolean;
  file?: string;
}

export interface LineupState {
  order: DjId[];
  slots: string[];
  djs: Record<DjId, Dj>;
}

// Per-slot colours for the flow chart and the play-order dots.
export const SWATCH = ['#111111', '#ffffff', '#3b2b94', '#d9d1ff'];
const SWATCH_INK = ['#9d8cf2', '#111111', '#ffffff', '#111111'];
const swatch = (i: number) => SWATCH[i % SWATCH.length];
// The first slot's black disappears against the black chart card, so bars use a lighter purple.
const barColour = (i: number) => (swatch(i) === '#111111' ? '#5a4bb8' : swatch(i));
const segInk = (i: number) => {
  const ink = SWATCH_INK[i % SWATCH_INK.length];
  return ink === '#9d8cf2' ? '#fff' : ink;
};

/** Bar height for a BPM on a fixed 70–185 scale. */
export const bpmHeight = (b: number) => `${Math.max(4, Math.min(100, ((b - 70) / (185 - 70)) * 100))}%`;

export interface Bar {
  h: string;
  bg: string;
  tip: string;
}

export interface Repeat {
  title: string;
  artist: string;
  bpm: string;
  note: string;
  alts: { who: string; title: string }[];
  tags: { label: string; first: boolean }[];
}

export function lineupIndex(S: LineupState) {
  const loaded = S.order.filter((id) => S.djs[id].tracks);
  const items = loaded.flatMap((id) => S.djs[id].tracks!.map((t, i) => ({ id, i, t })));
  const groups = groupTracks(items);
  const byTrack = new Map<Track, { g: Group<DjId>; x: Group<DjId>['m'][number] }>();
  groups.forEach((g) => g.m.forEach((x) => byTrack.set(x.t, { g, x })));
  const repeats = groups.filter((g) => new Set(g.m.map((x) => x.id)).size > 1);
  return { loaded, groups, byTrack, repeats };
}

export type LineupIndex = ReturnType<typeof lineupIndex>;

export function lineupRows(S: LineupState) {
  return S.order.map((id, i) => {
    const d = S.djs[id];
    const st = d.tracks ? stat(d.tracks) : null;
    return {
      id,
      name: d.name,
      me: !!d.me,
      time: S.slots[i] || d.time,
      pos: i + 1,
      swatch: swatch(i),
      status: st
        ? `${st.n} tracks · ${Math.round(st.avg)} avg BPM · ${fmtDur(st.dur)}`
        : d.me
          ? 'Your set — not imported'
          : d.open
            ? 'Open · send the invite'
            : 'Invited · waiting for set',
      short: st ? `${Math.round(st.min)}–${Math.round(st.max)} BPM · ${st.n} tracks` : d.open ? 'Send the invite' : 'No set yet',
      needsImport: !!d.me && !d.tracks,
      pending: !d.me && !d.open && !d.tracks,
      open: !!d.open,
      first: i === 0,
      last: i === S.order.length - 1,
    };
  });
}

export function setView(S: LineupState, vId: DjId, idx: LineupIndex, sort: 'order' | 'bpm') {
  const vt = S.djs[vId].tracks || [];
  const vs = stat(vt);
  const bars: Bar[] = vt.map((t) => ({ h: bpmHeight(t.bpm), bg: '#9d8cf2', tip: `${fmtBpm(t.bpm)} · ${t.title}` }));
  const kc: Record<string, number> = {};
  vt.forEach((t) => {
    if (t.key) kc[t.key] = (kc[t.key] || 0) + 1;
  });
  const topKeys = Object.entries(kc)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key, n]) => ({ key, n }));
  const rows = vt.map((t, i) => ({ t, i }));
  if (sort === 'bpm') rows.sort((a, b) => a.t.bpm - b.t.bpm);
  const tracks = rows.map(({ t, i }) => {
    const e = idx.byTrack.get(t);
    let dup: string | null = null;
    if (e) {
      const others = e.g.m.filter((x) => x.id !== vId);
      const otherIds = [...new Set(others.map((x) => x.id))];
      if (otherIds.length) {
        const sameVersion = others.every((x) => x.info.ver === e.x.info.ver);
        dup = (sameVersion ? 'Also in ' : 'Other version in ') + otherIds.map((x) => S.djs[x].name).join(', ');
      } else if (e.g.m.length > 1) dup = 'Also in this set';
    }
    return { n: i + 1, title: t.title, artist: t.artist || '—', bpm: fmtBpm(t.bpm), key: t.key || '—', dup };
  });
  const withEnergy = vt.filter((t) => t.energy);
  const avgE = withEnergy.length ? withEnergy.reduce((a, t) => a + (t.energy || 0), 0) / withEnergy.length : 0;
  const stats = [
    { v: String(vs.n), l: 'Tracks' },
    { v: fmtDur(vs.dur), l: 'Total length' },
    { v: String(Math.round(vs.avg)), l: 'Average BPM' },
    { v: avgE ? avgE.toFixed(1) : '—', l: 'Average energy' },
  ];
  return {
    empty: !vt.length,
    stats,
    bars,
    topKeys,
    tracks,
    bpmRange: vt.length ? `${Math.round(vs.min)}–${Math.round(vs.max)} BPM` : '',
  };
}

export function flowView(S: LineupState, idx: LineupIndex, bpmDropWarn: number) {
  const pos: Record<DjId, number> = {};
  S.order.forEach((id, i) => (pos[id] = i));
  const bars: Bar[] = [];
  const segs: { flex: number; bg: string; ink: string; name: string; avg: number }[] = [];
  idx.loaded.forEach((id) => {
    const i = pos[id], d = S.djs[id];
    d.tracks!.forEach((t) => bars.push({ h: bpmHeight(t.bpm), bg: barColour(i), tip: `${d.name} · ${fmtBpm(t.bpm)} · ${t.title}` }));
    segs.push({ flex: d.tracks!.length, bg: barColour(i), ink: segInk(i), name: d.name, avg: Math.round(stat(d.tracks!).avg) });
  });
  const all = idx.loaded.flatMap((id) => S.djs[id].tracks!.map((t) => t.bpm)).filter(Boolean);
  const range = all.length ? `${Math.round(Math.min(...all))}–${Math.round(Math.max(...all))}` : '—';
  const drops: string[] = [];
  for (let i = 1; i < idx.loaded.length; i++) {
    const A = S.djs[idx.loaded[i - 1]], B = S.djs[idx.loaded[i]];
    const a = stat(A.tracks!).avg, b = stat(B.tracks!).avg;
    if (a - b > bpmDropWarn)
      drops.push(`Average BPM drops ${Math.round(a - b)} from ${A.name} (${Math.round(a)}) to ${B.name} (${Math.round(b)}).`);
  }
  const pending = S.order.filter((id) => !S.djs[id].tracks && !S.djs[id].open).map((id) => S.djs[id].name);
  const open = S.order.filter((id) => S.djs[id].open).length;
  const checkLines = [
    ...(drops.length ? drops : ['Average BPM rises from each DJ to the next.']),
    ...(pending.length ? [`Waiting on: ${pending.join(', ')}.`] : []),
    ...(open ? [`${open} open slot${open > 1 ? 's' : ''}.`] : []),
  ];
  return { bars, segs, range, hasDrop: drops.length > 0, checkLines };
}

function describe<Id>(g: Group<Id>, who: (x: Group<Id>['m'][number]) => string): Omit<Repeat, 'tags'> {
  const versions = new Set(g.m.map((x) => x.info.ver));
  const names = new Set(g.m.map((x) => x.t.title.toLowerCase()));
  const t0 = g.m[0].t;
  return {
    title: t0.title,
    artist: t0.artist,
    bpm: `${fmtBpm(t0.bpm)} BPM`,
    note:
      versions.size === 1
        ? names.size > 1
          ? 'Same track, saved under different names'
          : 'Same track'
        : 'Same song, different versions',
    alts: names.size > 1 ? g.m.map((x) => ({ who: who(x), title: x.t.title })) : [],
  };
}

export function repeatsView(S: LineupState, idx: LineupIndex, mode: 'lineup' | 'self'): Repeat[] {
  if (mode === 'lineup') {
    return idx.repeats.map((g) => {
      const by = S.order.filter((id) => g.m.some((x) => x.id === id));
      const posIn = (id: DjId) => g.m.find((x) => x.id === id)!.i + 1;
      return {
        ...describe(g, (x) => S.djs[x.id].name),
        tags: by.map((id, j) => ({ label: `${j === 0 ? 'First: ' : ''}${S.djs[id].name} #${posIn(id)}`, first: j === 0 })),
      };
    });
  }
  const mine = Object.values(S.djs).find((d) => d.me)?.tracks || [];
  const own = groupTracks(mine.map((t, i) => ({ id: null, i, t })));
  return own
    .filter((g) => g.m.length > 1)
    .map((g) => ({
      ...describe(g, (x) => `#${x.i + 1}`),
      tags: g.m.map((x) => ({ label: `Track #${x.i + 1}`, first: false })),
    }));
}
