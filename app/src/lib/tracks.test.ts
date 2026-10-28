import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cleanTitle, decode, parsePlaylist, sameSong, songInfo } from './tracks';
import { lineupIndex, repeatsView, type LineupState } from './analysis';
import { PERRO, SOL } from './demo';

const same = (a: [string, string], b: [string, string]) =>
  sameSong(songInfo({ title: a[0], artist: a[1] }), songInfo({ title: b[0], artist: b[1] }));

describe('cleanTitle', () => {
  it('strips tags, hashtags, domains and BPM numbers', () => {
    expect(cleanTitle('Latin Ecstasy Club [145] [6A]')).toBe('Latin Ecstasy Club');
    expect(cleanTitle('Tiroteo #Open Vip')).toBe('Tiroteo');
    expect(cleanTitle('Gata - prodjpool.com')).toBe('Gata');
    expect(cleanTitle('130 - Perreo')).toBe('Perreo');
    expect(cleanTitle('Perreo 144')).toBe('Perreo');
  });
});

describe('sameSong', () => {
  it('matches across labels, artist prefixes and typos', () => {
    expect(same(['Nick Leon - Apretao (Kelman Duran Rmx) [Clean]', 'Nick Leon'], ['Apretao (Kelman Duran remix)', 'Nick León'])).toBe(true);
    expect(same(['Latin Ecstasy Club', 'Peterblue'], ['Latin Ectasy Club', 'Peterblue'])).toBe(true);
    expect(same(['Bachetron (Original Mix)', 'Nick León'], ['Bachetron', 'Nick Leon'])).toBe(true);
  });
  it('does not match short titles from different artists', () => {
    expect(same(['Intro', 'DJ A'], ['Intro', 'DJ B'])).toBe(false);
  });
});

describe('sample rekordbox file', () => {
  const buf = readFileSync(new URL('../../public/samples/Latin Club.txt', import.meta.url));
  const tracks = parsePlaylist(decode(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));

  it('parses the UTF-16 export with energy ratings', () => {
    expect(tracks.length).toBe(102);
    expect(tracks[0]).toMatchObject({ title: 'BbY WOW', bpm: 120, key: '10A', energy: 6 });
  });

  it('finds repeats across the demo lineup', () => {
    const S: LineupState = {
      order: ['sol', 'me', 'perro'],
      slots: ['22:00', '23:30', '01:30'],
      djs: {
        sol: { name: 'SOL MONTES', time: '22:00', tracks: SOL },
        me: { name: 'YOU', time: '23:30', tracks, me: true },
        perro: { name: 'PERRO SALVAJE', time: '01:30', tracks: PERRO },
      },
    };
    const reps = repeatsView(S, lineupIndex(S), 'lineup');
    expect(reps.length).toBeGreaterThan(0);
    expect(reps.every((r) => r.tags[0].first)).toBe(true);
  });
});
