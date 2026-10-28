/** The ring · pill · arch motif from the logo badge. */
export function Shapes({ size, ring = 2, color }: { size: number; ring?: number; color?: string }) {
  const half = size / 2;
  return (
    <div className="shapes" style={{ color }} aria-hidden>
      <div className="shape-ring" style={{ width: size, height: size, borderWidth: ring }} />
      <div className="shape-pill" style={{ height: size, borderRadius: half }} />
      <div className="shape-arch" style={{ width: size, height: half, marginTop: half, borderRadius: `${half}px ${half}px 0 0` }} />
    </div>
  );
}

export function Logos() {
  return (
    <div className="logos">
      <div className="badge">
        <div className="badge-word">aline</div>
        <div className="badge-tag">
          Same night,
          <br />
          no repeats
        </div>
        <Shapes size={52} ring={3} />
      </div>
      <div className="chip-logo">
        <div className="chip-logo-word">aline</div>
        <div className="chip-logo-tag">
          Lineup
          <br />
          set planner
        </div>
      </div>
    </div>
  );
}
