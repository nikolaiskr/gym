import { useEffect, useState } from 'react';
import { initTelegram, useTgTheme, tgUserName, haptic } from '@/lib/telegram';
import { WorkoutTab } from '@/sections/WorkoutTab';
import { MusclesTab } from '@/sections/MusclesTab';
import { ExercisesTab } from '@/sections/ExercisesTab';
import { HistoryTab } from '@/sections/HistoryTab';

type TabId = 'workout' | 'muscles' | 'exercises' | 'history';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'workout', label: 'Тренировка', icon: '🏋️' },
  { id: 'muscles', label: 'Мышцы', icon: '💪' },
  { id: 'exercises', label: 'Упражнения', icon: '📋' },
  { id: 'history', label: 'История', icon: '📜' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('workout');
  useTgTheme();

  useEffect(() => {
    initTelegram();
  }, []);

  const name = tgUserName();

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto" style={{ background: 'var(--tg-bg)' }}>
      {/* шапка */}
      <header className="px-4 pt-4 pb-1 flex items-center justify-between">
        <div className="font-extrabold text-lg tracking-tight">
          LiftShift <span style={{ color: 'var(--tg-link)' }}>Mini</span>
        </div>
        {name && <div className="text-sm hint">Привет, {name}</div>}
      </header>

      {/* контент вкладки */}
      <main className="flex-1 overflow-y-auto pb-24">
        {tab === 'workout' && <WorkoutTab />}
        {tab === 'muscles' && <MusclesTab />}
        {tab === 'exercises' && <ExercisesTab />}
        {tab === 'history' && <HistoryTab />}
      </main>

      {/* нижняя навигация */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{
          background: 'var(--tg-secondary-bg)',
          borderTop: '1px solid color-mix(in srgb, var(--tg-hint) 20%, transparent)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="max-w-md mx-auto grid grid-cols-4">
          {TABS.map((t) => {
            const activeTab = tab === t.id;
            return (
              <button
                key={t.id}
                className="flex flex-col items-center py-2 gap-0.5 transition-colors"
                style={{ color: activeTab ? 'var(--tg-link)' : 'var(--tg-hint)' }}
                onClick={() => {
                  haptic.selection();
                  setTab(t.id);
                }}
              >
                <span className="text-xl leading-none">{t.icon}</span>
                <span className="text-[11px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
