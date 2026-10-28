import { useMemo } from 'react';
import { Shapes } from '../components/Shapes';
import { flowView, lineupRows, repeatsView, setView } from '../lib/analysis';
import { INVITE_LINK } from '../lib/demo';
import { config, useApp } from '../state';
import { Bars, Segmented, useIndex } from './Tabs';

export function WebHeader() {
  const { state: S, set, share } = useApp();
  return (
    <header className="w-header">
      <button className="w-wordmark" onClick={() => set({ flow: 'start' })}>
        aline
      </button>
      {!S.flow && (
        <div className="w-header-actions">
          <div className="w-event-pill">
            {S.evName} · {S.evDate}
          </div>
          <button className="btn-pill" onClick={() => share(`Join ${S.evName} on aline`, INVITE_LINK, 'Invite link copied — send it to the lineup')}>
            Invite DJs
          </button>
        </div>
      )}
    </header>
  );
}

export function WebStart() {
  const { set } = useApp();
  return (
    <div className="w-start">
      <div className="w-start-badge">
        <div className="w-start-word">aline</div>
        <div className="w-start-tag">
          Same night,
          <br />
          no repeats
        </div>
        <Shapes size={76} ring={3} />
      </div>
      <div className="w-start-copy">
        <div className="w-start-title">Plan the night with the whole lineup.</div>
        <div className="w-start-body">
          Share your rekordbox set with the other DJs. See repeated songs and how the BPM moves from the first set to the last. No
          accounts. Just links.
        </div>
        <div className="w-start-actions">
          <button className="btn-primary" onClick={() => set({ flow: 'create' })}>
            Create an event
          </button>
          <button className="btn-outline invert" onClick={() => set({ flow: 'join' })}>
            I have an invite link
          </button>
        </div>
      </div>
    </div>
  );
}

export function WebEvent() {
  const { state: S, set, flash, move, pickFile, loadSample } = useApp();
  const idx = useIndex();
  const rows = lineupRows(S);
  const flow = flowView(S, idx, config.bpmDropWarn);
  const vId = S.djs[S.view] ? S.view : 'me';
  const v = setView(S, vId, idx, S.sort);
  const repeats = useMemo(() => repeatsView(S, idx, S.rep), [S, idx]);

  return (
    <div className="w-app">
      <div className="w-hero">
        <div className="col g8">
          <div className="w-title">{S.evName}</div>
          <div className="sub">
            {S.evDate} · {S.slots.length} DJs
          </div>
        </div>
        <div className="w-kpis">
          <div className="w-kpi dark">
            <span>{idx.repeats.length}</span>repeated songs
          </div>
          <div className="w-kpi">
            <span>{flow.range}</span>BPM range
          </div>
        </div>
      </div>

      {!S.djs.me.tracks && (
        <div className="w-import">
          <div className="col g6" style={{ flex: '1 1 360px' }}>
            <div className="w-import-title">Add your set from rekordbox</div>
            <div className="import-card-body">Right-click your playlist › Export a playlist to a file › Export to a file for KUVO (*.txt).</div>
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

      <div className="w-row stretch">
        <section className="w-card w-order">
          <div className="h2">Play order</div>
          {rows.map((d) => (
            <div key={d.id} className={`w-dj${d.me ? ' me' : ''}`}>
              <div className="time-ring">{d.time}</div>
              <div className="w-dj-dot" style={{ background: d.swatch }} />
              <div className="grow col" style={{ gap: 2 }}>
                <div className="order-name">{d.name}</div>
                <div className="w-dj-short">{d.short}</div>
              </div>
              {d.needsImport && (
                <button className="btn-purple sm" onClick={pickFile}>
                  Import
                </button>
              )}
              {d.pending && (
                <button className="btn-pill sm" onClick={() => flash(`Reminder sent to ${d.name}`)}>
                  Remind
                </button>
              )}
              <button className="w-arrow" disabled={d.first} onClick={() => move(d.id, -1)} aria-label={`Move ${d.name} earlier`}>
                ↑
              </button>
              <button className="w-arrow" disabled={d.last} onClick={() => move(d.id, 1)} aria-label={`Move ${d.name} later`}>
                ↓
              </button>
            </div>
          ))}
          <div className={`check w-check${flow.hasDrop ? ' warn' : ''}`}>
            <div className="h3">{flow.hasDrop ? 'Order check: BPM drop' : 'Order check: looks good'}</div>
            {flow.checkLines.map((l) => (
              <div key={l} className="check-line">
                {l}
              </div>
            ))}
          </div>
        </section>
        <section className="chart w-flow">
          <div className="chart-head">
            <b>BPM flow of the night</b>
            <span>{flow.range} BPM</span>
          </div>
          <Bars bars={flow.bars} />
          <div className="segs">
            {flow.segs.map((g) => (
              <div key={g.name} className="seg-bar" style={{ flex: g.flex, background: g.bg, color: g.ink }}>
                {g.name} · {g.avg}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="w-row">
        <section className="w-card w-set">
          <div className="w-card-head">
            <div className="h2">Set analysis</div>
            <div className="w-chips">
              {S.order.map((id) => (
                <button key={id} className={`chip${vId === id ? ' on' : ''}`} aria-pressed={vId === id} onClick={() => set({ view: id })}>
                  {S.djs[id].name}
                </button>
              ))}
            </div>
          </div>
          {v.empty ? (
            <div className="w-empty">No set imported yet for this DJ.</div>
          ) : (
            <>
              <div className="w-stats">
                {v.stats.map((s) => (
                  <div key={s.l} className="stat">
                    <div className="stat-v">{s.v}</div>
                    <div className="stat-l">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="w-set-charts">
                <div className="chart w-set-chart">
                  <div className="chart-head">
                    <b>BPM through the set</b>
                    <span>{v.bpmRange}</span>
                  </div>
                  <Bars bars={v.bars} height={130} />
                </div>
                <div className="col g10" style={{ flex: '1 1 200px' }}>
                  <div className="h3" style={{ fontSize: 14 }}>
                    Most used keys
                  </div>
                  <div className="keys">
                    {v.topKeys.map((k) => (
                      <div key={k.key} className="key-chip">
                        <b>{k.key}</b>
                        <span>{k.n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="row-head">
                <div className="h3" style={{ fontSize: 17 }}>
                  Tracks
                </div>
                <Segmented opts={[['order', 'Set order'], ['bpm', 'BPM']]} value={S.sort} onPick={(sort) => set({ sort })} />
              </div>
              <div className="w-table" role="table">
                <div className="w-tr w-th" role="row">
                  <div>#</div>
                  <div>Title</div>
                  <div>Artist</div>
                  <div>BPM</div>
                  <div>Key</div>
                </div>
                {v.tracks.map((t) => (
                  <div key={t.n} className="w-tr" role="row">
                    <div className="w-td-n">{t.n}</div>
                    <div className="w-td-title">
                      <div className="ellipsis">{t.title}</div>
                      {t.dup && <div className="w-dup">{t.dup}</div>}
                    </div>
                    <div className="w-td-artist ellipsis">{t.artist}</div>
                    <div style={{ fontWeight: 700 }}>{t.bpm}</div>
                    <div className="track-key">{t.key}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="w-card w-repeats">
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
        </section>
      </div>
    </div>
  );
}
