import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Dj, DjId } from './lib/analysis';
import { PERRO, SOL } from './lib/demo';
import { decode, parsePlaylist, type Track } from './lib/tracks';

export type Flow = 'start' | 'create' | 'created' | 'join' | 'saved' | null;
export type Tab = 'event' | 'set' | 'lineup';

export interface AppState {
  flow: Flow;
  evName: string;
  evDate: string;
  human: boolean;
  djName: string;
  joinPicked: boolean;
  slots: string[];
  tab: Tab;
  view: DjId;
  sort: 'order' | 'bpm';
  rep: 'lineup' | 'self';
  order: DjId[];
  djs: Record<DjId, Dj>;
}

/** Prototype settings, overridable from the URL: ?screen=app&loaded=1&drop=5 */
const params = new URLSearchParams(window.location.search);
const SCREENS = ['start', 'create', 'created', 'join', 'saved', 'app'];
export const config = {
  startScreen: SCREENS.includes(params.get('screen') || '') ? params.get('screen')! : 'start',
  startLoaded: params.get('loaded') === '1',
  bpmDropWarn: Number(params.get('drop') ?? 5) || 0,
};

const SAMPLE_URL = `${import.meta.env.BASE_URL}samples/${encodeURIComponent('Latin Club.txt')}`;

const initial: AppState = {
  flow: config.startScreen === 'app' ? null : (config.startScreen as Flow),
  evName: 'Latin Club',
  evDate: 'Sat 14 Nov',
  human: false,
  djName: '',
  joinPicked: false,
  slots: ['22:00', '23:30', '01:30', '03:00'],
  tab: 'event',
  view: 'me',
  sort: 'order',
  rep: 'lineup',
  order: ['sol', 'me', 'perro', 'kaira'],
  djs: {
    sol: { name: 'SOL MONTES', time: '22:00', tracks: SOL },
    me: { name: 'YOU', time: '23:30', tracks: null, me: true },
    perro: { name: 'PERRO SALVAJE', time: '01:30', tracks: PERRO },
    kaira: { name: 'KAIRA', time: '03:00', tracks: null },
  },
};

function useAppState() {
  const [state, setFull] = useState<AppState>(initial);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number>();
  const fileRef = useRef<HTMLInputElement>(null);

  const set = useCallback(
    (patch: Partial<AppState> | ((s: AppState) => Partial<AppState> | null)) =>
      setFull((s) => {
        const p = typeof patch === 'function' ? patch(s) : patch;
        return p ? { ...s, ...p } : s;
      }),
    [],
  );

  const flash = useCallback((t: string) => {
    window.clearTimeout(timer.current);
    setToast(t);
    timer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const setMine = useCallback(
    (tracks: Track[], file: string) => {
      if (!tracks.length) {
        flash('Could not read that file. Export a .txt playlist from rekordbox.');
        return;
      }
      set((s) => ({ djs: { ...s.djs, me: { ...s.djs.me, tracks, file } }, view: 'me', tab: s.flow ? s.tab : 'set' }));
      const cleaned = tracks.filter((t) => t.raw !== t.title).length;
      flash(`${tracks.length} tracks imported${cleaned ? ` · ${cleaned} titles cleaned` : ''}`);
    },
    [set, flash],
  );

  const loadSample = useCallback(async () => {
    try {
      const r = await fetch(SAMPLE_URL);
      if (!r.ok) throw new Error(String(r.status));
      setMine(parsePlaylist(decode(await r.arrayBuffer())), 'Latin Club.txt');
    } catch {
      flash('Sample file not found');
    }
  }, [setMine, flash]);

  const onFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      f.arrayBuffer().then((buf) => setMine(parsePlaylist(decode(buf)), f.name));
      e.target.value = '';
    },
    [setMine],
  );

  const pickFile = useCallback(() => fileRef.current?.click(), []);

  const move = useCallback(
    (id: DjId, dir: -1 | 1) =>
      set((s) => {
        const o = [...s.order];
        const i = o.indexOf(id), j = i + dir;
        if (j < 0 || j >= o.length) return null;
        [o[i], o[j]] = [o[j], o[i]];
        return { order: o };
      }),
    [set],
  );

  const share = useCallback(
    (title: string, link: string, copied: string) => {
      const url = `https://${link}`;
      if (navigator.share) navigator.share({ title, url }).catch(() => {});
      else {
        navigator.clipboard?.writeText(url).catch(() => {});
        flash(copied);
      }
    },
    [flash],
  );

  useEffect(() => {
    if (config.startLoaded) loadSample();
  }, [loadSample]);

  const web = useDesktop();

  return { state, set, toast, flash, fileRef, onFile, pickFile, loadSample, move, share, web };
}

/** Wide screens get the web layout; phones and narrow windows get the phone layout. */
const DESKTOP = '(min-width: 900px)';
function useDesktop() {
  const [match, setMatch] = useState(() => window.matchMedia(DESKTOP).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP);
    const on = () => setMatch(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return match;
}

type Ctx = ReturnType<typeof useAppState>;
const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  return <AppContext.Provider value={useAppState()}>{children}</AppContext.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppContext);
  if (!c) throw new Error('useApp outside AppProvider');
  return c;
}
