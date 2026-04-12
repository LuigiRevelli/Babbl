export default function BabyIllustration({ size = 200 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="100" cy="100" r="55" stroke="#FF7878" strokeWidth="2.5" fill="none" />
      {/* Closed eyes - left */}
      <path d="M75 92 Q80 88 85 92" stroke="#FF7878" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Closed eyes - right */}
      <path d="M115 92 Q120 88 125 92" stroke="#FF7878" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Tears left */}
      <path d="M78 96 Q76 102 78 108" stroke="#FF7878" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Tears right */}
      <path d="M122 96 Q124 102 122 108" stroke="#FF7878" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Open mouth crying */}
      <ellipse cx="100" cy="118" rx="12" ry="8" stroke="#FF7878" strokeWidth="2" fill="none" />
      {/* Sound waves left */}
      <path d="M35 85 Q28 100 35 115" stroke="#FF7878" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M25 78 Q15 100 25 122" stroke="#FF7878" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35" />
      {/* Sound waves right */}
      <path d="M165 85 Q172 100 165 115" stroke="#FF7878" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M175 78 Q185 100 175 122" stroke="#FF7878" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35" />
      {/* Little hair strands */}
      <path d="M80 48 Q85 38 90 46" stroke="#FF7878" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M95 44 Q100 34 105 44" stroke="#FF7878" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M110 48 Q115 38 120 46" stroke="#FF7878" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
