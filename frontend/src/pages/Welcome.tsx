import { useNavigate } from 'react-router-dom';
import MobileLayout from '@/components/MobileLayout';
import BabyIllustration from '@/components/BabyIllustration';
import { t } from '@/lib/i18n';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <MobileLayout className="flex flex-col items-center justify-center min-h-screen text-center">
      <BabyIllustration size={180} />

      <h1 className="font-serif text-[44px] font-extrabold text-foreground mt-6 leading-tight">
        {t('welcomeTitle')}
      </h1>

      <p className="text-lg text-foreground mt-3 leading-relaxed max-w-[340px]">
        {t('welcomeSubtitle')}
      </p>

      <p className="text-sm text-muted-foreground mt-3">
        {t('welcomeTrust')}
      </p>

      <button
        onClick={() => navigate('/dashboard')}
        className="w-full h-14 bg-primary text-primary-foreground rounded-pill font-semibold text-lg mt-8 hover:bg-primary-strong transition-colors shadow-md"
      >
        {t('welcomeStart')}
      </button>

      <p className="text-xs text-muted-foreground mt-3">
        {t('welcomeFooter')}
      </p>
    </MobileLayout>
  );
}
