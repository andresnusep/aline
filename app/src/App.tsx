import { Logos } from './components/Shapes';
import { Create, Created, Join, Saved, Start } from './screens/Onboarding';
import { EventTab, LineupTab, SetTab } from './screens/Tabs';
import { config, useApp, type Tab } from './state';

const NAV: [Tab, string][] = [
  ['event', 'Event'],
  ['set', 'Set'],
  ['lineup', 'Lineup'],
];

function Screen() {
  const { state: S } = useApp();
  switch (S.flow) {
    case 'start':
      return <Start />;
    case 'create':
      return <Create />;
    case 'created':
      return <Created />;
    case 'join':
      return <Join />;
    case 'saved':
      return <Saved />;
  }
  if (S.tab === 'set') return <SetTab />;
  if (S.tab === 'lineup') return <LineupTab />;
  return <EventTab />;
}

export default function App() {
  const { state: S, set, toast, fileRef, onFile } = useApp();
  return (
    <div className="stage">
      {config.showLogo && <Logos />}
      <div className="phone">
        <div className="notch" />
        <input type="file" accept=".txt,text/plain" ref={fileRef} onChange={onFile} hidden />
        {/* key resets scroll position when switching screens */}
        <main className="screen" key={`${S.flow}-${S.tab}`}>
          <Screen />
        </main>
        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
        {!S.flow && (
          <nav className="nav">
            {NAV.map(([k, label]) => (
              <button key={k} className={S.tab === k ? 'on' : ''} aria-current={S.tab === k ? 'page' : undefined} onClick={() => set({ tab: k })}>
                {label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
