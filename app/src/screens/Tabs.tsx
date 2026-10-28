import { useMemo } from 'react';
import { flowView, lineupIndex, lineupRows, repeatsView, setView, type Bar } from '../lib/analysis';
import { INVITE_LINK } from '../lib/demo';
import { config, useApp } from '../state';

function Bars({ bars, height }: { bars: Bar[]; height: number }) {
  return (
    <div className="bars" style={{ height }}>
      {bars.map((b, i) => (
        <div key={i} className="bar" title={b.tip} style={{ height: b.h, background: b.bg }} />
      ))}
    </div>
  );
}

function Segmented<K extends string>({ opts, value, onPick, large }: { opts: [K, string][]; value: K; onPick: (k: K) => void; large?: boolean }) {
  return (
    <div className={`seg${large ? ' lg' : ''}`} role="group">
      {opts.map(([k, label]) => (
        <button key={k} className={value === k ? 'on' : ''} aria-pressed={value === k} onClick={() => onPick(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function useIndex() {
  const { state: S } = useApp();
  return useMemo(() => lineupIndex(S), [S.order, S.djs]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function EventTab() {
  const { state: S, set, flash, share, pickFile, loadSample } = useApp();
  const idx = useIndex();
  const rows = lineupRows(S);
  const flow = flowView(S, idx, config.bpmDropWarn);
  const me = S.djs.me;
  return (
    <>
      <div className="topbar">
        <button className="wordmark-btn" onClick={() => set({ flow: 'start' })}>
          aline
        </button>
        <button className="btn-pill" onClick={() => share(`Join ${S.evName} on aline`, INVITE_LINK, 'Invite link copied — send it to the lineup')}>
          Invite DJs
        </button>
      </div>
      <div className="col g6">
        <div className="h1-xl">{S.evName}</div>
        <div className="sub">
          {S.evDate} · {S.slots.length} DJs
        </div>
      </div>
      <div className="col g12">
        <div className="h2">Lineup</div>
        {rows.map((d) => (
          <div key={d.id} className={`dj-card${d.me ? ' me' : ''}`}>
            <div className="time-ring">{d.time}</div>
            <div className="grow col" style={{ gap: 3 }}>
              <div className="dj-card-name">{d.name}</div>
              <div className="dj-card-status">{d.status}</div>
            </div>
            {d.needsImport && (
              <button className="btn-purple" onClick={pickFile}>
                Import
              </button>
            )}
            {d.pending && (
              <button className="btn-pill sm" onClick={() => flash(`Reminder sent to ${d.name}`)}>
                Remind
              </button>
            )}
          </div>
        ))}
      </div>
      {me.tracks ? (
        <>
          <div className="summary-grid">
            <button className="summary dark" onClick={() => set({ tab: 'set', view: 'me' })}>
              <div className="summary-num">{idx.repeats.length}</div>
              <div className="summary-label">Songs repeated across the lineup</div>
            </button>
            <button className="summary" onClick={() => set({ tab: 'lineup' })}>
              <div className="summary-num">{flow.range}</div>
              <div className="summary-label">BPM range of the whole night</div>
            </button>
          </div>
          <div className="file-row">
            <div>{me.file}</div>
            <button className="btn-link" onClick={pickFile}>
              Replace file
            </button>
          </div>
        </>
      ) : (
        <div className="import-card">
          <div className="import-card-title">Add your set from rekordbox</div>
          <div className="import-card-body">
            In rekordbox, right-click your playlist › Export a playlist to a file › Export to a file for KUVO (*.txt).
          </div>
          <div className="import-card-actions">
            <button className="btn-import" onClick={pickFile}>
              Choose .txt file
            </button>
            <button className="btn-import-ghost" onClick={loadSample}>
              Use “Latin Club.txt”
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function SetTab() {
  const { state: S, set, loadSample } = useApp();
  const idx = useIndex();
  const vId = S.djs[S.view] ? S.view : 'me';
  const v = setView(S, vId, idx, S.sort);
  const viewing = S.djs[vId];
  return (
    <>
      <div className="h1">Set analysis</div>
      <div className="chips">
        {S.order.map((id) => (
          <button key={id} className={`chip${vId === id ? ' on' : ''}`} aria-pressed={vId === id} onClick={() => set({ view: id })}>
            {S.djs[id].name}
          </button>
        ))}
      </div>
      {v.empty && vId === 'me' && (
        <div className="empty-card">
          <div className="empty-card-title">No set imported yet</div>
          <button className="btn-dark" onClick={loadSample}>
            Use “Latin Club.txt”
          </button>
        </div>
      )}
      {v.empty && vId !== 'me' && (
        <div className="empty-card">
          <div className="empty-card-title">{viewing.name} hasn’t added a set yet</div>
        </div>
      )}
      {!v.empty && (
        <>
          <div className="stat-grid">
            {v.stats.map((s) => (
              <div key={s.l} className="stat">
                <div className="stat-v">{s.v}</div>
                <div className="stat-l">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="chart">
            <div className="chart-head">
              <b>BPM through the set</b>
              <span>{v.bpmRange}</span>
            </div>
            <Bars bars={v.bars} height={120} />
            <div className="chart-foot">
              <div>First track</div>
              <div>Last track</div>
            </div>
          </div>
          <div className="col g8">
            <div className="h3">Most used keys</div>
            <div className="keys">
              {v.topKeys.map((k) => (
                <div key={k.key} className="key-chip">
                  <b>{k.key}</b>
                  <span>{k.n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="col g10">
            <div className="row-head">
              <div className="h2">Tracks</div>
              <Segmented opts={[['order', 'Set order'], ['bpm', 'BPM']]} value={S.sort} onPick={(sort) => set({ sort })} />
            </div>
            <div className="col">
              {v.tracks.map((t) => (
                <div key={t.n} className="track">
                  <div className="track-n">{t.n}</div>
                  <div className="grow col" style={{ gap: 2 }}>
                    <div className="track-title">{t.title}</div>
                    <div className="track-artist">{t.artist}</div>
                    {t.dup && <div className="track-dup">{t.dup}</div>}
                  </div>
                  <div className="track-bpm">{t.bpm}</div>
                  <div className="track-key">{t.key}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function LineupTab() {
  const { state: S, set, move } = useApp();
  const idx = useIndex();
  const rows = lineupRows(S);
  const flow = flowView(S, idx, config.bpmDropWarn);
  const repeats = useMemo(() => repeatsView(S, idx, S.rep), [S, idx]);
  return (
    <>
      <div className="h1">Lineup overview</div>
      <div className="col g8">
        <div className="h3">Play order</div>
        {rows.map((d) => (
          <div key={d.id} className="order-row">
            <div className="order-dot" style={{ background: d.swatch }} />
            <div className="grow col" style={{ gap: 1 }}>
              <div className="order-name">
                {d.pos}. {d.name}
              </div>
              <div className="order-short">{d.short}</div>
            </div>
            <button className="btn-circle" disabled={d.first} onClick={() => move(d.id, -1)} aria-label={`Move ${d.name} earlier`}>
              ↑
            </button>
            <button className="btn-circle" disabled={d.last} onClick={() => move(d.id, 1)} aria-label={`Move ${d.name} later`}>
              ↓
            </button>
          </div>
        ))}
      </div>
      <div className="chart">
        <div className="chart-head">
          <b>BPM flow of the night</b>
          <span>{flow.range}</span>
        </div>
        <Bars bars={flow.bars} height={130} />
        <div className="segs">
          {flow.segs.map((g) => (
            <div key={g.name} className="seg-bar" style={{ flex: g.flex, background: g.bg, color: g.ink }}>
              {g.name} · {g.avg}
            </div>
          ))}
        </div>
      </div>
      <div className={`check${flow.hasDrop ? ' warn' : ''}`}>
        <div className="h3">{flow.hasDrop ? 'Order check: BPM drop' : 'Order check: looks good'}</div>
        {flow.checkLines.map((l) => (
          <div key={l} className="check-line">
            {l}
          </div>
        ))}
      </div>
      <div className="col g10">
        <div className="row-head">
          <div className="h2">Repeated songs</div>
          <div className="count-pill">{repeats.length}</div>
        </div>
        <Segmented large opts={[['lineup', 'Across lineup'], ['self', 'Within my set']]} value={S.rep} onPick={(rep) => set({ rep })} />
        {!repeats.length && <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>No repeats found.</div>}
        {repeats.map((r, i) => (
          <div key={i} className="repeat">
            <div className="repeat-head">
              <div className="col" style={{ minWidth: 0, gap: 2 }}>
                <div className="repeat-title">{r.title}</div>
                <div className="repeat-artist">{r.artist}</div>
              </div>
              <div className="repeat-bpm">{r.bpm}</div>
            </div>
            <div className="repeat-note">{r.note}</div>
            {r.alts.map((a, j) => (
              <div key={j} className="repeat-alt">
                <b>{a.who}</b> · {a.title}
              </div>
            ))}
            <div className="tags">
              {r.tags.map((g) => (
                <div key={g.label} className={`tag${g.first ? ' first' : ''}`}>
                  {g.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
