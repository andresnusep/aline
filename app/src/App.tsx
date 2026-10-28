import { Create, Created, Join, Saved, Start } from './screens/Onboarding';
import { EventTab, LineupTab, SetTab } from './screens/Tabs';
import { WebEvent, WebHeader, WebStart } from './screens/Web';
import { useApp, type Tab } from './state';

const NAV: [Tab, string][] = [
  ['event', 'Event'],
  ['set', 'Set'],
  ['lineup', 'Lineup'],
];

function Onboarding() {
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
  return null;
}

function PhoneTabs() {
  const { state: S } = useApp();
  if (S.tab === 'set') return <SetTab />;
  if (S.tab === 'lineup') return <LineupTab />;
  return <EventTab />;
}

function PhoneApp() {
  const { state: S, set } = useApp();
  return (
    <div className="phone">
      {/* key resets scroll position when switching screens */}
      <main className="screen" key={`${S.flow}-${S.tab}`}>
        {S.flow ? <Onboarding /> : <PhoneTabs />}
      </main>
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
  );
}

function WebApp() {
  const { state: S } = useApp();
  return (
    <div className="web">
      <WebHeader />
      {S.flow === 'start' ? (
        <WebStart />
      ) : S.flow ? (
        <main className={`w-narrow${S.flow === 'created' || S.flow === 'saved' ? ' tall' : ''}`} key={S.flow}>
          <Onboarding />
        </main>
      ) : (
        <WebEvent />
      )}
    </div>
  );
}

export default function App() {
  const { toast, fileRef, onFile, web } = useApp();
  return (
    <>
      <input type="file" accept=".txt,text/plain" ref={fileRef} onChange={onFile} hidden />
      {web ? <WebApp /> : <PhoneApp />}
      {toast && (
        <div className={`toast${web ? ' web' : ''}`} role="status">
          {toast}
        </div>
      )}
    </>
  );
}
