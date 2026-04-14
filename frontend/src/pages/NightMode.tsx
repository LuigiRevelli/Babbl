import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Radio, Wifi, WifiOff, Volume2, Baby, ArrowLeft } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { getUserData, saveUserData } from '@/lib/userData';
import { t } from '@/lib/i18n';

const EVENTS = [
  { time: 3000, type: 'listening' as const },
  { time: 8000, type: 'detected' as const },
  { time: 12000, type: 'comforting' as const },
  { time: 16000, type: 'calm' as const },
];

export default function NightMode() {
  const navigate = useNavigate();
  const [data, setData] = useState(getUserData());
  const [nightOn, setNightOn] = useState(data.nightMode);
  const [connected, setConnected] = useState(data.babyphoneConnected);
  const [status, setStatus] = useState<'idle' | 'listening' | 'detected' | 'comforting' | 'calm'>('idle');
  const [connecting, setConnecting] = useState(false);

  // Simulate babyphone events when connected
  useEffect(() => {
    if (!connected) {
      setStatus('idle');
      return;
    }
    setStatus('listening');
    const timers = EVENTS.map(e =>
      setTimeout(() => setStatus(e.type), e.time)
    );
    const loop = setTimeout(() => setStatus('listening'), 20000);
    return () => { timers.forEach(clearTimeout); clearTimeout(loop); };
  }, [connected]);

  const toggleNight = () => {
    const next = !nightOn;
    setNightOn(next);
    const updated = { ...data, nightMode: next };
    saveUserData(updated);
    setData(updated);
  };

  const toggleBabyphone = () => {
    if (!connected) {
      setConnecting(true);
      setTimeout(() => {
        setConnecting(false);
        setConnected(true);
        const updated = { ...data, babyphoneConnected: true };
        saveUserData(updated);
        setData(updated);
      }, 2000);
    } else {
      setConnected(false);
      const updated = { ...data, babyphoneConnected: false };
      saveUserData(updated);
      setData(updated);
    }
  };

  const statusLabel: Record<string, { text: string; color: string }> = {
    idle: { text: t('statusDisconnected'), color: 'text-muted-foreground' },
    listening: { text: t('statusListening'), color: 'text-success' },
    detected: { text: t('statusCryDetected'), color: 'text-destructive' },
    comforting: { text: t('statusComfortSent'), color: 'text-primary' },
    calm: { text: t('statusBabySoothed'), color: 'text-success' },
  };

  const current = statusLabel[status];

  return (
    <MobileLayout
      className="flex flex-col min-h-screen"
      style={nightOn ? { background: 'hsl(230 25% 10%)', color: 'hsl(230 20% 90%)' } : undefined}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 rounded-full bg-card/80 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>
        <h1 className="font-serif text-xl font-bold">{t('nightModeTitle')}</h1>
      </div>

      {/* Night toggle */}
      <div
        className="rounded-2xl p-6 mb-5 flex items-center justify-between animate-fade-in"
        style={{
          background: nightOn
            ? 'linear-gradient(135deg, hsl(230 35% 18%), hsl(260 30% 22%))'
            : 'linear-gradient(135deg, hsl(49 100% 95%), hsl(40 50% 92%))',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: nightOn ? 'hsl(45 90% 65% / 0.2)' : 'hsl(0 100% 74% / 0.15)' }}
          >
            {nightOn
              ? <Moon className="w-6 h-6 text-yellow-300" strokeWidth={1.5} />
              : <Sun className="w-6 h-6 text-primary" strokeWidth={1.5} />
            }
          </div>
          <div>
            <p className="font-semibold text-sm">{nightOn ? t('nightModeEnabled') : t('nightModeDisabled')}</p>
            <p className="text-xs opacity-60">{t('dimmedAtmosphere')}</p>
          </div>
        </div>
        <button
          onClick={toggleNight}
          className={`w-[52px] h-[30px] rounded-full relative transition-colors duration-300 shrink-0 ${nightOn ? 'bg-primary' : 'bg-muted'}`}
        >
          <span
            className={`absolute top-[3px] left-[3px] w-6 h-6 rounded-full bg-white shadow transition-transform duration-300 ${nightOn ? 'translate-x-[22px]' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {/* Babyphone */}
      <div
        className="rounded-2xl p-6 mb-5 animate-fade-in"
        style={{
          animationDelay: '0.1s', animationFillMode: 'backwards',
          background: nightOn
            ? 'hsl(230 25% 15%)'
            : 'hsl(0 0% 100%)',
          border: `1px solid ${nightOn ? 'hsl(230 20% 25%)' : 'hsl(30 26% 87%)'}`,
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
              <Radio className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold text-sm">{t('babyMonitorLabel')}</p>
              <p className={`text-xs ${current.color}`}>{current.text}</p>
            </div>
          </div>
          {connected
            ? <Wifi className="w-5 h-5 text-success" strokeWidth={1.5} />
            : <WifiOff className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          }
        </div>

        {/* Status visualization */}
        {connected && (
          <div className="mb-5 flex justify-center">
            <div className="relative w-24 h-24">
              {/* Pulse rings */}
              {status === 'listening' && (
                <>
                  <span className="absolute inset-0 rounded-full border-2 border-success/30 animate-ping" />
                  <span className="absolute inset-2 rounded-full border-2 border-success/20 animate-ping" style={{ animationDelay: '0.5s' }} />
                </>
              )}
              {status === 'detected' && (
                <span className="absolute inset-0 rounded-full border-2 border-destructive/40 animate-ping" />
              )}
              {status === 'comforting' && (
                <>
                  <span className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                  <span className="absolute inset-3 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDelay: '0.3s' }} />
                </>
              )}
              <div className={`absolute inset-4 rounded-full flex items-center justify-center ${
                status === 'detected' ? 'bg-destructive/15' :
                status === 'comforting' ? 'bg-primary/15' :
                status === 'calm' ? 'bg-success/15' :
                'bg-success/10'
              }`}>
                {status === 'comforting'
                  ? <Volume2 className="w-8 h-8 text-primary" strokeWidth={1.5} />
                  : <Baby className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
                }
              </div>
            </div>
          </div>
        )}

        <button
          onClick={toggleBabyphone}
          disabled={connecting}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-[0.98] ${
            connected
              ? 'bg-destructive/10 text-destructive'
              : 'bg-primary text-primary-foreground'
          } ${connecting ? 'opacity-60' : ''}`}
        >
          {connecting
            ? t('connecting')
            : connected
              ? t('disconnectMonitor')
              : t('connectMonitor')
          }
        </button>
      </div>

      {/* Info card */}
      <div
        className="rounded-2xl p-5 animate-fade-in"
        style={{
          animationDelay: '0.2s', animationFillMode: 'backwards',
          background: nightOn ? 'hsl(230 25% 13%)' : 'hsl(40 50% 92% / 0.5)',
          border: `1px solid ${nightOn ? 'hsl(230 20% 22%)' : 'hsl(30 26% 87%)'}`,
        }}
      >
        <p className="text-xs opacity-60 leading-relaxed">
          {t('monitorTip')}
        </p>
      </div>
    </MobileLayout>
  );
}
