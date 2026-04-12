import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/dashboard', label: 'Home', icon: '🏠' },
  { path: '/history', label: 'History', icon: '📖' },
  { path: '/badges', label: 'Badges', icon: '🏆' },
];

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="w-full max-w-[480px] bg-card border-t border-border shadow-[0_-2px_12px_rgba(42,32,24,0.06)] flex h-[60px]"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
