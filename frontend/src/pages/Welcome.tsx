import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import BabyIllustration from '@/components/BabyIllustration';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <MobileLayout className="flex flex-col items-center justify-center min-h-screen text-center">
      <BabyIllustration size={180} />

      <h1 className="font-serif text-[44px] font-extrabold text-foreground mt-6 leading-tight">
        Babbl
      </h1>

      <p className="text-lg text-foreground mt-3 leading-relaxed max-w-[340px]">
        Understand what your baby needs through a gentle and caring cry analysis.
      </p>

      <p className="text-sm text-muted-foreground mt-3">
        Used by thousands of parents. No medical data is collected.
      </p>

      <button
        onClick={() => navigate('/dashboard')}
        className="w-full h-14 bg-primary text-primary-foreground rounded-pill font-semibold text-lg mt-8 hover:bg-primary-strong transition-colors shadow-md"
      >
        Start
      </button>

      <p className="text-xs text-muted-foreground mt-3">
        Free · 30 seconds · No sign-up
      </p>
    </MobileLayout>
  );
}
