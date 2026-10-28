import { Shapes } from '../components/Shapes';
import { INVITE_LINK, ME_LINK } from '../lib/demo';
import { useApp } from '../state';

const BackButton = () => {
  const { set } = useApp();
  return (
    <button className="btn-back" onClick={() => set({ flow: 'start' })} aria-label="Back">
      ←
    </button>
  );
};

export function Start() {
  const { set } = useApp();
  return (
    <div className="start">
      <div className="col g14" style={{ paddingTop: 24 }}>
        <div className="start-word">aline</div>
        <div className="start-tag">
          Same night,
          <br />
          no repeats
        </div>
        <div className="body">Share your rekordbox set with the rest of the lineup. No accounts. Just links.</div>
      </div>
      <Shapes size={64} color="#111" />
      <div className="col g8">
        <button className="btn-primary" onClick={() => set({ flow: 'create' })}>
          Create an event
        </button>
        <button className="btn-outline invert" onClick={() => set({ flow: 'join' })}>
          I have an invite link
        </button>
      </div>
    </div>
  );
}

export function Create() {
  const { state: S, set, flash } = useApp();
  const ready = S.human && S.evName.trim();
  const create = () => {
    if (!S.human) return flash('Tick the human check first');
    if (!S.evName.trim()) return;
    set({ flow: 'created' });
  };
  return (
    <>
      <BackButton />
      <div className="h1">New event</div>
      <div className="field-pair">
        <label className="col g6">
          <span className="label">Event name</span>
          <input className="field" value={S.evName} onChange={(e) => set({ evName: e.target.value })} />
        </label>
        <label className="col g6">
          <span className="label">Date</span>
          <input className="field" value={S.evDate} onChange={(e) => set({ evDate: e.target.value })} />
        </label>
      </div>
      <div className="col g8">
        <div className="label">Slots</div>
        {S.slots.map((t, i) => (
          <div className="slot-row" key={i}>
            <input
              className="slot-time"
              value={t}
              aria-label={`Slot ${i + 1} start time`}
              onChange={(e) => {
                const v = e.target.value;
                set((s) => ({ slots: s.slots.map((x, j) => (j === i ? v : x)) }));
              }}
            />
            <div className="slot-open">Slot {i + 1} · open</div>
            <button
              className="slot-remove"
              aria-label={`Remove slot ${i + 1}`}
              onClick={() => set((s) => (s.slots.length > 1 ? { slots: s.slots.filter((_, j) => j !== i) } : null))}
            >
              ×
            </button>
          </div>
        ))}
        <button className="btn-pill add" onClick={() => set((s) => ({ slots: [...s.slots, ''] }))}>
          + Add slot
        </button>
      </div>
      {/* Stand-in for Cloudflare Turnstile. */}
      <button className="human" onClick={() => set((s) => ({ human: !s.human }))} aria-pressed={S.human}>
        <div className={`human-dot${S.human ? ' on' : ''}`} />
        <div className="human-label">I’m human</div>
        <div className="human-note">Cloudflare Turnstile</div>
      </button>
      <button className={`btn-primary${ready ? '' : ' dim'}`} onClick={create}>
        Create event
      </button>
    </>
  );
}

export function Created() {
  const { state: S, set, share, web } = useApp();
  return (
    <>
      <div className="dot72" />
      <div className="col g6">
        <div className="h1">{S.evName} is live</div>
        <div className="sub">
          {S.evDate} · {S.slots.length} slots
        </div>
      </div>
      <div className="body">Send the invite to your DJs. Anyone with it can pick an open slot and add their set.</div>
      <div className="btn-stack">
        <button className="btn-primary" onClick={() => share(`Join ${S.evName} on aline`, INVITE_LINK, 'Invite link copied')}>
          Share invite
        </button>
        <button className="btn-outline" onClick={() => set({ flow: null, tab: 'event' })}>
          Open event
        </button>
      </div>
      <div className="small">You’re the organiser on this {web ? 'browser' : 'phone'}.</div>
    </>
  );
}

export function Join() {
  const { state: S, set, flash, pickFile, loadSample } = useApp();
  const me = S.djs.me;
  const ready = S.joinPicked && S.djName.trim() && me.tracks;
  const join = () => {
    if (!ready) return flash(!S.joinPicked ? 'Pick a slot' : !S.djName.trim() ? 'Add your DJ name' : 'Add your rekordbox set');
    set((s) => ({ flow: 'saved', djs: { ...s.djs, me: { ...s.djs.me, name: s.djName.trim().toUpperCase() } } }));
  };
  return (
    <>
      <BackButton />
      <div className="col g8">
        <div className="tag-invite">You’re invited</div>
        <div className="h1-xl">{S.evName}</div>
        <div className="sub">{S.evDate} · pick your slot</div>
      </div>
      <div className="join-slots">
        {S.order.map((id, i) => {
          const d = S.djs[id];
          const taken = !!d.tracks && !d.me;
          const sel = !!d.me && S.joinPicked;
          const pick = () => {
            if (taken) return;
            set((s) => {
              const o = [...s.order];
              const a = o.indexOf('me');
              [o[a], o[i]] = [o[i], o[a]];
              return { order: o, joinPicked: true };
            });
          };
          return (
            <button key={id} className={`join-slot${sel ? ' sel' : ''}${taken ? ' taken' : ''}`} onClick={pick} disabled={taken}>
              <div className="time-ring">{S.slots[i] || d.time}</div>
              <div className="join-slot-label">{taken ? d.name : sel ? S.djName.trim() || 'You' : 'Open slot'}</div>
              <div className="join-slot-note">{taken ? 'Taken' : sel ? 'Your slot' : ''}</div>
            </button>
          );
        })}
      </div>
      <label className="col g6">
        <span className="label">Your DJ name</span>
        <input className="field" value={S.djName} placeholder="e.g. DJ LUNA" onChange={(e) => set({ djName: e.target.value })} />
      </label>
      <div className="col g8">
        <div className="label">Your set</div>
        {me.tracks ? (
          <div className="file-loaded">
            <div className="file-loaded-name">
              {me.file} · <span>{me.tracks.length} tracks</span>
            </div>
            <button className="btn-purple" onClick={pickFile}>
              Replace
            </button>
          </div>
        ) : (
          <>
            <button className="file-add" onClick={pickFile}>
              + Add rekordbox .txt
            </button>
            <button className="btn-link" onClick={loadSample}>
              or use “Latin Club.txt”
            </button>
          </>
        )}
      </div>
      <button className={`btn-primary${ready ? '' : ' dim'}`} onClick={join}>
        Join lineup
      </button>
    </>
  );
}

export function Saved() {
  const { state: S, set, share, web } = useApp();
  return (
    <>
      <div className="shapes saved-shapes">
        <div className="dot72" />
        <div className="ring72" />
      </div>
      <div className="col g8 saved-text">
        <div className="h1">You’re in, {S.djs.me.name.trim() || 'DJ'}</div>
        <div className="body" style={{ maxWidth: 'none' }}>
          This {web ? 'browser' : 'phone'} remembers you. Come back any time to update your set.
        </div>
      </div>
      <div className="col g8 saved-actions">
        <button className="btn-primary" onClick={() => set({ flow: null, tab: 'event' })}>
          Go to {S.evName}
        </button>
        <button className="btn-link" onClick={() => share('My aline link', ME_LINK, 'Personal link copied')}>
          Using another {web ? 'device' : 'phone'}? Send yourself a link
        </button>
      </div>
    </>
  );
}
