import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function BackButton({ to }: { to?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => to ? navigate(to) : navigate(-1)}
      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors py-2"
    >
      <ChevronLeft className="w-5 h-5" />
      <span className="text-sm font-medium">Back</span>
    </button>
  );
}
