import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useAuth } from '@/lib/AuthContext';

export default function Auth() {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (isLogin) {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err.message);
      } else {
        navigate('/dashboard');
      }
    } else {
      const { error: err } = await signUp(email, password);
      if (err) {
        setError(err.message);
      } else {
        setSuccess("Compte créé ! Vérifie tes emails pour confirmer ton inscription.");
      }
    }
    setLoading(false);
  };

  return (
    <MobileLayout className="flex flex-col min-h-screen justify-center px-2">
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl font-bold mb-2">Babbl</h1>
        <p className="text-sm text-muted-foreground">
          {isLogin ? "Content de te revoir !" : "Crée ton compte gratuit"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.com"
            required
            className="w-full rounded-xl border border-border/50 bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full rounded-xl border border-border/50 bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {error && (
          <p className="text-xs text-destructive text-center bg-destructive/10 rounded-lg p-2">{error}</p>
        )}

        {success && (
          <p className="text-xs text-success text-center bg-success/10 rounded-lg p-2">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLogin ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>

      <button
        onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(null); }}
        className="mt-6 text-sm text-muted-foreground text-center w-full"
      >
        {isLogin ? (
          <>Pas encore de compte ? <span className="text-primary font-semibold underline">Inscription</span></>
        ) : (
          <>Déjà un compte ? <span className="text-primary font-semibold underline">Connexion</span></>
        )}
      </button>
    </MobileLayout>
  );
}
