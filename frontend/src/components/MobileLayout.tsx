import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  withTabBar?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function MobileLayout({ children, withTabBar, className = '', style }: Props) {
  return (
    <div className="min-h-screen flex justify-center bg-background" style={style}>
      <div className={`w-full max-w-[480px] px-5 ${withTabBar ? 'pb-[80px]' : 'pb-8'} pt-4 ${className}`}>
        {children}
      </div>
    </div>
  );
}
